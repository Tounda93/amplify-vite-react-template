import {
  Home,
  Newspaper,
  Users,
  Calendar,
  Car,
  MessageSquare,
  LucideIcon
} from "lucide-react";
import { useIsMobile } from '../hooks/useIsMobile';
import { useEffect, useState } from 'react';

/**
 * =====================================================
 * HEADER COMPONENT
 * =====================================================
 *
 * Pill-shaped sticky header with glass effect.
 * On mobile: only shows main navigation (Home, Events, News, Rooms)
 * Chat and Garage are in the footer on mobile.
 *
 * =====================================================
 */

// Define types for the component props
interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

// Define the type for category items
interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
}

export default function Header({
  activeSection,
  onSectionChange
}: HeaderProps) {
  const isMobile = useIsMobile();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 0 : window.innerWidth
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mobileIconSize = isMobile
    ? Math.max(14, Math.min(18, viewportWidth ? viewportWidth / 24 : 16))
    : 20;

  // ============================================
  // CATEGORY DATA
  // ============================================
  const categories: Category[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "news", label: "News", icon: Newspaper },
    { id: "community", label: "Rooms", icon: Users },
  ];

  // Glass effect styling
  const headerBackground = 'rgba(255, 255, 255, 0.15)';
  const headerBorderColor = '1px solid rgba(255, 255, 255, 0.3)';
  const headerShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
  const textColor = '#000000';
  const navInactiveColor = 'rgba(0, 0, 0, 0.5)';

  const mobileCategoryOrder = ["home", "events", "news", "community"];
  const mobileCategories = mobileCategoryOrder
    .map(id => categories.find(category => category.id === id))
    .filter((category): category is Category => Boolean(category));

  if (isMobile) {
    // Mobile header: only main navigation, no Chat/Garage (they're in footer)
    // Top margin reduced by 60%: 1rem -> 0.4rem
    // Side margins reduced by 80%: 1rem -> 0.2rem
    return (
      <header style={{
        position: "sticky",
        top: "0.4rem",
        marginLeft: "0.2rem",
        marginRight: "0.2rem",
        padding: "3px 12px 6px 12px",
        zIndex: 1500,
        background: headerBackground,
        border: headerBorderColor,
        borderRadius: "999px",
        boxShadow: headerShadow,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
      }}>
        <nav style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          gap: "4px",
          width: "100%"
        }}>
          {mobileCategories.map((category) => {
            const IconComponent = category.icon;
            const isActive = activeSection === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onSectionChange(category.id)}
                style={{
                  flex: "1 1 0",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                  padding: "6px 4px 10px 4px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  color: isActive ? textColor : navInactiveColor,
                  backgroundColor: "transparent",
                  transition: "color 0.2s",
                  position: "relative"
                }}
              >
                <IconComponent
                  size={mobileIconSize}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                <span style={{
                  fontSize: "9px",
                  fontWeight: 400
                }}>
                  {category.label}
                </span>
                <div style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "30%",
                  height: "1.5px",
                  borderRadius: "999px",
                  backgroundColor: textColor,
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 0.2s"
                }} />
              </button>
            );
          })}
        </nav>
      </header>
    );
  }

  return (
    <header style={{
      position: "sticky",
      top: "2rem",
      marginLeft: "2rem",
      marginRight: "2rem",
      backgroundColor: headerBackground,
      boxShadow: headerShadow,
      zIndex: 1000,
      border: headerBorderColor,
      borderRadius: "999px",
      color: textColor,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 2rem",
        justifyContent: "space-between"
      }}>
        {/* Empty left spacer for balance */}
        <div style={{ flex: "0 0 auto", width: "140px" }} />

        {/* Center: Main Navigation */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flex: "1",
          justifyContent: "center"
        }}>
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isActive = activeSection === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onSectionChange(category.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  padding: "6px 10px 10px 10px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.2s",
                  backgroundColor: "transparent",
                  color: isActive ? textColor : navInactiveColor,
                  position: "relative"
                }}
              >
                <IconComponent
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span style={{
                  fontSize: "10px",
                  fontWeight: 400
                }}>
                  {category.label}
                </span>
                <div style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "40%",
                  height: "1.5px",
                  borderRadius: "999px",
                  backgroundColor: textColor,
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 0.2s"
                }} />
              </button>
            );
          })}
        </nav>

        {/* Right: Chat and Garage */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {/* Chat button */}
          <button
            onClick={() => onSectionChange("chat")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              padding: "6px 10px 10px 10px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              transition: "color 0.2s",
              backgroundColor: "transparent",
              color: activeSection === "chat" ? textColor : navInactiveColor,
              position: "relative"
            }}
          >
            <MessageSquare size={20} strokeWidth={activeSection === "chat" ? 2 : 1.5} />
            <span style={{ fontSize: "10px", fontWeight: 400 }}>Chat</span>
            <div style={{
              position: "absolute",
              bottom: "4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "40%",
              height: "1.5px",
              borderRadius: "999px",
              backgroundColor: textColor,
              opacity: activeSection === "chat" ? 1 : 0,
              transition: "opacity 0.2s"
            }} />
          </button>

          {/* My Garage button */}
          <button
            onClick={() => onSectionChange("garage")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              padding: "6px 10px 10px 10px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              transition: "color 0.2s",
              backgroundColor: "transparent",
              color: activeSection === "garage" ? textColor : navInactiveColor,
              position: "relative"
            }}
          >
            <Car size={20} strokeWidth={activeSection === "garage" ? 2 : 1.5} />
            <span style={{ fontSize: "10px", fontWeight: 400 }}>Garage</span>
            <div style={{
              position: "absolute",
              bottom: "4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "40%",
              height: "1.5px",
              borderRadius: "999px",
              backgroundColor: textColor,
              opacity: activeSection === "garage" ? 1 : 0,
              transition: "opacity 0.2s"
            }} />
          </button>
        </div>
      </div>
    </header>
  );
}

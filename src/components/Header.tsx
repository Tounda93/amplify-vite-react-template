import {
  Home,
  Newspaper,
  Users,
  Calendar,
  Gavel,
  LucideIcon
} from "lucide-react";
import { useIsMobile } from '../hooks/useIsMobile';
import { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import { SearchResultGroups, SearchResultItem } from '../types/search';

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
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchResults: SearchResultGroups;
  searchLoading: boolean;
  onSearchResultSelect: (result: SearchResultItem, options?: { clearInput?: boolean }) => void;
}

// Define the type for category items
interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
}

export default function Header({
  activeSection,
  onSectionChange,
  searchTerm,
  onSearchChange,
  searchResults,
  searchLoading,
  onSearchResultSelect
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
    ? Math.max(17, Math.min(22, viewportWidth ? viewportWidth / 20 : 19))
    : 24;

  // ============================================
  // CATEGORY DATA
  // ============================================
  const categories: Category[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "rooms", label: "Rooms", icon: Users },
    { id: "news", label: "News", icon: Newspaper },
    { id: "auctions", label: "Auctions", icon: Gavel },
  ];

  // Glass effect styling
  const headerBackground = 'rgba(255, 255, 255, 0.15)';
  const headerBorderColor = '5px solid rgba(255, 255, 255, 0.3)';
  const headerShadow = '0px 0px 0px rgba(0, 0, 0, 0.9)';
  const textColor = '#010101';
  const navInactiveColor = 'rgba(0, 0, 0, 0.5)';

  const mobileCategoryOrder = ["home", "events", "rooms", "news", "auctions"];
  const mobileCategories = mobileCategoryOrder
    .map(id => categories.find(category => category.id === id))
    .filter((category): category is Category => Boolean(category));

  if (isMobile) {
    // Mobile header: only main navigation, no Chat/Garage (they're in footer)
    // Top margin reduced by 60%: 1rem -> 0.4rem
    // Side margins reduced by 80%: 1rem -> 0.2rem
    return (
      <header style={{
        position: "relative",
        marginTop: "1rem",
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
                  padding: "8px 4px",
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
      top: "0",
      marginTop: "0",
      marginLeft: "0",
      marginRight: "0",
      width: "100%",
      backgroundColor: "#fff",
      boxShadow: headerShadow,
      zIndex: 1000,
      border: "none",
      borderRadius: "0",
      color: textColor,
    }}>
      <div style={{
        width: "100%",
        padding: "8px clamp(1rem, 4vw, 5rem)",
        margin: "0 auto",
        maxWidth: "2000px"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 960px) minmax(0, 320px)",
          gap: "2rem",
          alignItems: "center"
        }}>
          {/* Left: Logo + Search */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: 0,
            width: "100%",
            justifyContent: "flex-start",
            gridColumn: " / 2"
          }}>
            <div
              style={{
                fontSize: "26px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: "#0b0b0b"
              }}
              aria-label="Collectible"
            >
              C
            </div>
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              searchResults={searchResults}
              searchLoading={searchLoading}
              onSearchResultSelect={onSearchResultSelect}
              isMobile={false}
              style={{ width: "280px" }}
              appearance="light"
            />
          </div>

          {/* Center: Main Navigation */}
          <nav style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            width: "100%",
            gridColumn: "2 / 3"
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
                    padding: "8px 12px",
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
                    size={24}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
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
          <div aria-hidden="true" style={{ gridColumn: "3 / 4" }} />
        </div>
      </div>
    </header>
  );
}

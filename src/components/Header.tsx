import {
  Home,
  Newspaper,
  Users,
  Calendar,
  Gavel,
  Car,
  MessageSquare,
  LogOut,
  BookOpen,
  LucideIcon
} from "lucide-react";
import { SearchResultGroups, SearchResultItem } from '../types/search';
import { useIsMobile } from '../hooks/useIsMobile';
import { useEffect, useState } from 'react';
import SearchBar from './SearchBar';

/**
 * =====================================================
 * HEADER COMPONENT
 * =====================================================
 *
 * This header matches your Figma design and integrates
 * with your existing Car Encyclopedia app.
 *
 * PROPS:
 * - user: The authenticated user object from Amplify
 * - signOut: Function to sign out the user
 * - activeSection: Which section is currently active
 * - onSectionChange: Function to call when a category is clicked
 * - searchTerm: Current search text
 * - onSearchChange: Function to update search text
 *
 * =====================================================
 */

interface AmplifyUser {
  signInDetails?: {
    loginId?: string;
  };
  username?: string;
}

// Define types for the component props
interface HeaderProps {
  user: AmplifyUser | undefined;
  signOut: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchResults: SearchResultGroups;
  searchLoading: boolean;
  onSearchResultSelect: (result: SearchResultItem) => void;
  showHeroCarousel?: boolean; // Show hero carousel only on home page
}

// Define the type for category items
interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
}

export default function Header({
  user,
  signOut,
  activeSection,
  onSectionChange,
  searchTerm,
  onSearchChange,
  searchResults,
  searchLoading,
  onSearchResultSelect,
  showHeroCarousel = false
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
    ? Math.max(14, Math.min(20, viewportWidth ? viewportWidth / 22 : 18))
    : 22;

  // ============================================
  // CATEGORY DATA
  // These match your existing sections in the app
  // ============================================
  const categories: Category[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "events", label: "Events", icon: Calendar },
    { id: "news", label: "News", icon: Newspaper },
    { id: "auctions", label: "Auctions", icon: Gavel },
    { id: "community", label: "Community", icon: Users },
    { id: "wikicars", label: "WikiCars", icon: BookOpen },
  ];

  const headerIsTransparent = !!showHeroCarousel;
  const showGlassEffect = headerIsTransparent || isMobile;
  const headerBackground = headerIsTransparent ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.85)';
  const headerBorderColor = '1px solid rgba(255,255,255,0.2)';
  const headerShadow = headerIsTransparent ? '0 25px 55px rgba(15, 23, 42, 0.45)' : '0 20px 45px rgba(15,23,42,0.55)';
  const navInactiveColor = 'rgba(255,255,255,0.65)';

  const computeProfileInitials = () => {
    const loginId = user?.signInDetails?.loginId || user?.username || '';
    if (!loginId) {
      return 'UU';
    }
    const cleaned = loginId.replace(/@.*/, '');
    const segments = cleaned.split(/[\s._-]+/).filter(Boolean);
    if (segments.length >= 2) {
      return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase();
    }
    if (segments.length === 1) {
      const segment = segments[0];
      return (segment.slice(0, 2)).toUpperCase();
    }
    return loginId.slice(0, 2).toUpperCase();
  };
  const profileInitials = computeProfileInitials();

  const mobileCategoryOrder = ["events", "news", "auctions", "community", "wikicars"];
  const mobileCategories = mobileCategoryOrder
    .map(id => categories.find(category => category.id === id))
    .filter((category): category is Category => Boolean(category));

  if (isMobile) {
    return (
      <header style={{
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "4px 16px 8px 16px",
        zIndex: 1500,
        background: "rgba(15,23,42,0.65)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 25px 55px rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <nav style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "6px",
            flexWrap: "nowrap",
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
                  gap: "4px",
                  padding: "8px 4px 14px 4px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: "pointer",
                  color: "#f9fafb",
                  backgroundColor: "transparent",
                    boxShadow: "none",
                    transition: "color 0.2s",
                    position: "relative"
                  }}
                >
                  <IconComponent
                    size={mobileIconSize}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 400
                  }}>
                    {category.label}
                  </span>
                  <div style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "35%",
                    height: "1.5px",
                    borderRadius: "999px",
                    backgroundColor: "#ffffff",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.2s"
                  }} />
                </button>
              );
            })}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header style={{
      width: "100%",
      backgroundColor: headerBackground,
      boxShadow: headerShadow,
      position: headerIsTransparent ? "absolute" : "sticky",
      top: 0,
      left: 0,
      zIndex: 1000,
      borderBottom: headerBorderColor,
      color: "#ffffff",
      backdropFilter: showGlassEffect ? "blur(18px)" : undefined,
      WebkitBackdropFilter: showGlassEffect ? "blur(18px)" : undefined
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 5rem",
        gap: "24px",
        justifyContent: "space-between",
        flexWrap: "nowrap"
      }}>
        <div style={{ flex: "0 0 auto" }}>
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            searchResults={searchResults}
            searchLoading={searchLoading}
            onSearchResultSelect={onSearchResultSelect}
            isMobile={false}
          />
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <nav style={{
            display: "flex",
            alignItems: "center",
            gap: "12px"
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
                  gap: "4px",
                  padding: "8px 12px 14px 12px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.2s",
                  backgroundColor: "transparent",
                  color: isActive ? "#ffffff" : navInactiveColor,
                  position: "relative"
                }}
              >
                <IconComponent
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span style={{
                  fontSize: "11px",
                  fontWeight: 400
                }}>
                  {category.label}
                </span>
                <div style={{
                  position: "absolute",
                  bottom: "6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "45%",
                  height: "1.5px",
                  borderRadius: "999px",
                  backgroundColor: "#ffffff",
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 0.2s"
                }} />
              </button>
            );
          })}
          </nav>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flex: "0 0 auto",
          color: "#ffffff"
        }}>
          {/* My Garage button */}
          <button
            onClick={() => onSectionChange("garage")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              color: "#ffffff",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <Car size={22} strokeWidth={1.5} />
            <span style={{ fontSize: "11px" }}>My Garage</span>
          </button>

          {/* Chat button */}
          <button
            onClick={() => onSectionChange("chat")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              color: "#ffffff",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <MessageSquare size={22} strokeWidth={1.5} />
            <span style={{ fontSize: "11px" }}>Chat</span>
          </button>

          {/* Profile button - shows user email initial */}
          <button
            onClick={() => onSectionChange("profile")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #111827, #1f2937)",
              border: "2px solid rgba(255,255,255,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              fontWeight: "bold"
            }}>
              {profileInitials}
            </div>
            <span style={{ fontSize: "11px", color: "#f9fafb" }}>Profile</span>
          </button>

          {/* Sign Out button */}
          <button
            onClick={signOut}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              color: "#f87171",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px"
            }}
            title="Sign Out"
          >
            <LogOut size={22} strokeWidth={1.5} />
            <span style={{ fontSize: "11px" }}>Sign Out</span>
          </button>
        </div>
      </div>

    </header>
  );
}

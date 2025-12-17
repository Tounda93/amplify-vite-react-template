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
        padding: "12px 16px 18px 16px",
        zIndex: 1500,
        background: "rgba(15,23,42,0.55)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 25px 55px rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px"
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
      backgroundColor: headerIsTransparent ? "rgba(15,23,42,0.25)" : "#ffffff",
      boxShadow: headerIsTransparent ? "0 15px 35px rgba(15, 23, 42, 0.2)" : "0 2px 4px rgba(0, 0, 0, 0.1)",
      position: headerIsTransparent ? "absolute" : "sticky",
      top: 0,
      left: headerIsTransparent ? 0 : undefined,
      zIndex: headerIsTransparent ? 20 : 1000,
      borderBottom: headerIsTransparent ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e5e7eb",
      backdropFilter: showGlassEffect ? "blur(18px)" : undefined,
      WebkitBackdropFilter: showGlassEffect ? "blur(18px)" : undefined
    }}>

      {/* ============================================
          SINGLE ROW: Search Bar + Categories + User Actions
          ============================================ */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        padding: "12px 5rem"
      }}>

        {/* Search Bar - Positioned to the left */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onSearchResultSelect={onSearchResultSelect}
          isMobile={false}
        />

        {/* Category Navigation - Centered */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)"
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
                  color: isActive ? "#111827" : "#6b7280",
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
                  backgroundColor: "#111827",
                  opacity: isActive ? 1 : 0,
                  transition: "opacity 0.2s"
                }} />
              </button>
            );
          })}
        </nav>

        {/* User Actions - Positioned to the right */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "20px"
        }}>

          {/* My Garage button */}
          <button
            onClick={() => onSectionChange("garage")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              color: "#4b5563",
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
              color: "#4b5563",
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
              background: "linear-gradient(135deg, #000000ff, #313131ff)",
              border: "2px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              fontWeight: "bold"
            }}>
              {/* Show first letter of user email */}
              {user?.signInDetails?.loginId?.charAt(0).toUpperCase() || "U"}
            </div>
            <span style={{ fontSize: "11px", color: "#4b5563" }}>Profile</span>
          </button>

          {/* Sign Out button */}
          <button
            onClick={signOut}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              color: "#ef4444",
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

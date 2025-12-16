import {
  Search,
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

  const searchSections: Array<{ key: keyof SearchResultGroups; label: string; accent: string }> = [
    { key: 'wikicars', label: 'WikiCars', accent: '#1d4ed8' },
    { key: 'news', label: 'News', accent: '#dc2626' },
    { key: 'events', label: 'Events', accent: '#059669' },
    { key: 'auctions', label: 'Auctions', accent: '#b45309' },
    { key: 'community', label: 'Community', accent: '#7c3aed' },
  ];

  const showSearchDropdown = searchTerm.trim().length >= 2;
  const headerIsTransparent = !!showHeroCarousel;
  const showGlassEffect = headerIsTransparent || isMobile;

  const mobileCategoryOrder = ["events", "news", "auctions", "community", "wikicars"];
  const mobileCategories = mobileCategoryOrder
    .map(id => categories.find(category => category.id === id))
    .filter((category): category is Category => Boolean(category));

  const searchBar = (
    <div style={{
      width: isMobile ? "100%" : "300px",
      position: "relative"
    }}>
      <div style={{ position: "relative" }}>
        <Search
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: isMobile ? "#d1d5db" : "#9ca3af"
          }}
          size={18}
        />
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            paddingLeft: "44px",
            paddingRight: "16px",
            paddingTop: "10px",
            paddingBottom: "10px",
            border: isMobile ? "1px solid rgba(255,255,255,0.25)" : "1px solid #e5e7eb",
            backgroundColor: isMobile ? "rgba(15,23,42,0.4)" : "#ffffff",
            borderRadius: "9999px",
            color: isMobile ? "#f9fafb" : "#374151",
            fontSize: "14px",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: isMobile ? "0 15px 35px rgba(15, 23, 42, 0.35)" : undefined,
            backdropFilter: isMobile ? "blur(8px)" : undefined,
            WebkitBackdropFilter: isMobile ? "blur(8px)" : undefined
          }}
        />
      </div>

      {showSearchDropdown && (
        <div style={{
          position: "absolute",
          top: isMobile ? "56px" : "48px",
          left: 0,
          width: "100%",
          backgroundColor: isMobile ? "rgba(15,23,42,0.95)" : "#ffffff",
          border: isMobile ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
          borderRadius: "16px",
          boxShadow: isMobile ? "0 25px 55px rgba(15, 23, 42, 0.55)" : "0 20px 40px rgba(0, 0, 0, 0.12)",
          maxHeight: "420px",
          overflowY: "auto",
          zIndex: 2000,
          backdropFilter: isMobile ? "blur(16px)" : undefined,
          WebkitBackdropFilter: isMobile ? "blur(16px)" : undefined
        }}>
          {searchLoading && (
            <div style={{
              padding: "12px 16px",
              fontSize: "13px",
              color: isMobile ? "#f3f4f6" : "#6b7280",
              borderBottom: isMobile ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f3f4f6"
            }}>
              Searching across encyclopedia, news, events, and more...
            </div>
          )}

          {searchSections.map((section, index) => {
            const resultsForSection = searchResults[section.key] || [];
            const isLast = index === searchSections.length - 1;
            return (
              <div
                key={section.key}
                style={{
                  borderBottom: isLast ? "none" : (isMobile ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f3f4f6"),
                  paddingBottom: "4px"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px 6px 16px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: isMobile ? "#e5e7eb" : "#6b7280",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase"
                }}>
                  <span style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: section.accent
                  }} />
                  {section.label}
                </div>

                {resultsForSection.length === 0 && !searchLoading && (
                  <div style={{
                    padding: "6px 16px 14px 36px",
                    fontSize: "13px",
                    color: isMobile ? "#cbd5f5" : "#9ca3af"
                  }}>
                    No matches yet
                  </div>
                )}

                {resultsForSection.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => onSearchResultSelect(result)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 16px 12px 36px",
                      background: "none",
                      border: "none",
                      borderRadius: 0,
                      cursor: "pointer",
                      transition: "background 0.2s",
                      color: isMobile ? "#f9fafb" : undefined
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = isMobile ? "rgba(255,255,255,0.05)" : "#f9fafb"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 600, color: isMobile ? "#ffffff" : "#111827" }}>
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div style={{ fontSize: "12px", color: isMobile ? "#cbd5f5" : "#6b7280", marginTop: "2px" }}>
                        {result.subtitle}
                      </div>
                    )}
                    {result.description && (
                      <div style={{ fontSize: "12px", color: isMobile ? "#d1d5db" : "#4b5563", marginTop: "4px" }}>
                        {result.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

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
          {searchBar}

          <nav style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            flexWrap: "wrap"
          }}>
            {mobileCategories.map((category) => {
              const IconComponent = category.icon;
              const isActive = activeSection === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => onSectionChange(category.id)}
                  style={{
                    flex: "1 1 calc(20% - 8px)",
                    minWidth: "72px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "8px 4px",
                    borderRadius: "16px",
                    border: "none",
                    cursor: "pointer",
                    color: "#f9fafb",
                    backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "transparent",
                    boxShadow: isActive ? "0 15px 35px rgba(15,23,42,0.55)" : undefined,
                    transition: "background 0.2s, transform 0.2s",
                    backdropFilter: isActive ? "blur(6px)" : undefined,
                    WebkitBackdropFilter: isActive ? "blur(6px)" : undefined
                  }}
                >
                  <IconComponent
                    size={20}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>
                    {category.label}
                  </span>
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
        {searchBar}

        {/* Category Navigation - Centered */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
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
                  padding: "8px 24px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: isActive ? "#f3f4f6" : "transparent",
                  color: isActive ? "#111827" : "#6b7280"
                }}
              >
                <IconComponent
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span style={{
                  fontSize: "12px",
                  fontWeight: isActive ? 500 : 400
                }}>
                  {category.label}
                </span>
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

import { useEffect, useState } from 'react';
import { Bell, Car, MessageSquare, Search } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import SearchBar from './SearchBar';
import { useAppUI } from '../context/AppUIContext';
import type { SearchResultItem } from '../types/search';

export default function Footer() {
  const {
    activeSection,
    setActiveSection,
    searchTerm,
    setSearchTerm,
    searchResults,
    searchLoading,
    onSearchResultSelect,
  } = useAppUI();
  const currentYear = new Date().getFullYear();
  const isMobile = useIsMobile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  useEffect(() => {
    if (!isMobile) {
      setIsSearchOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    setIsSearchOpen(false);
  }, [activeSection]);

  const handleSearchResultSelect = (result: SearchResultItem, options?: { clearInput?: boolean }) => {
    onSearchResultSelect(result, options);
    setIsSearchOpen(false);
  };

  const mobileIconSize = isMobile
    ? Math.max(14, Math.min(18, viewportWidth ? viewportWidth / 24 : 16))
    : 20;

  // Glass effect styling - matching header
  const footerBackground = 'rgba(255, 255, 255, 0.15)';
  const footerBorderColor = '1px solid rgba(255, 255, 255, 0.3)';
  const footerShadow = '0 -4px 30px rgba(0, 0, 0, 0.1)';
  const textColor = '#000000';
  const navInactiveColor = 'rgba(0, 0, 0, 0.5)';

  if (isMobile) {
    // Order: Search, Chat, My Garage
    const navItems = [
      { id: 'search', label: 'Search', icon: Search, isSearch: true },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'garage', label: 'My Garage', icon: Car },
    ];

    return (
      <footer style={{
        position: 'fixed',
        bottom: '0.4rem',
        left: '0.2rem',
        right: '0.2rem',
        padding: '3px 12px 6px 12px',
        background: footerBackground,
        border: footerBorderColor,
        borderRadius: '999px',
        boxShadow: footerShadow,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 1400,
        overflow: 'visible'
      }}>
        {isSearchOpen && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 0.5rem)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90vw',
            maxWidth: '520px',
            zIndex: 1500
          }}>
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchResults={searchResults}
              searchLoading={searchLoading}
              onSearchResultSelect={handleSearchResultSelect}
              isMobile
              style={{ width: '100%' }}
              dropdownDirection="up"
              onDismiss={() => setIsSearchOpen(false)}
            />
          </div>
        )}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '4px',
          width: '100%'
        }}>
          {navItems.map(({ id, label, icon: IconComponent, isSearch }) => {
            const isActive = isSearch ? isSearchOpen : activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (isSearch) {
                    setIsSearchOpen((prev) => !prev);
                  } else {
                    setIsSearchOpen(false);
                    setActiveSection(id);
                  }
                }}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '6px 4px 10px 4px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: isActive ? textColor : navInactiveColor,
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  position: 'relative'
                }}
              >
                <IconComponent
                  size={mobileIconSize}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                <span style={{
                  fontSize: '9px',
                  fontWeight: 400
                }}>
                  {label}
                </span>
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '30%',
                  height: '1.5px',
                  borderRadius: '999px',
                  backgroundColor: textColor,
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.2s'
                }} />
              </button>
            );
          })}
        </nav>
      </footer>
    );
  }

  return (
    <footer style={{
      marginTop: '4rem',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 2rem',
      }}>
        {activeSection !== 'home' && !['events', 'news', 'rooms'].includes(activeSection) && (
          <>
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}>
                <Car size={32} color="#3498db" />
                <h3 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                }}>
                  Collectible
                </h3>
              </div>
              <p style={{
                color: '#6b7280',
                fontSize: '15px',
                marginBottom: '8px',
              }}>
                Your Ultimate Classic Car Encyclopedia
              </p>
              <p style={{
                color: '#9ca3af',
                fontSize: '13px',
                fontStyle: 'italic',
              }}>
                More content coming soon...
              </p>
            </div>

            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '2rem 0',
            }} />
          </>
        )}

        {/* Bottom Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          {/* Copyright */}
          <div style={{
            color: '#9ca3af',
            fontSize: '13px',
          }}>
            © {currentYear} Collectible. All rights reserved.
          </div>

          {/* Links Placeholder */}
          <div style={{
            display: 'flex',
            gap: '24px',
            color: '#6b7280',
            fontSize: '13px',
          }}>
            <a
              href="#"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#3498db'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              About
            </a>
            <a
              href="#"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#3498db'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              Contact
            </a>
            <a
              href="#"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#3498db'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              Privacy
            </a>
            <a
              href="#"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#3498db'}
              onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

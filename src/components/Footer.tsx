import { useEffect, useState } from 'react';
import { Car, MessageSquare, Search, User } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import SearchBar from './SearchBar';
import { SearchResultGroups, SearchResultItem } from '../types/search';

interface FooterProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchResults: SearchResultGroups;
  searchLoading: boolean;
  onSearchResultSelect: (result: SearchResultItem, options?: { clearInput?: boolean }) => void;
}

export default function Footer({
  activeSection = 'home',
  onSectionChange,
  searchTerm,
  onSearchChange,
  searchResults,
  searchLoading,
  onSearchResultSelect
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const isMobile = useIsMobile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  if (isMobile) {
    const navItems = [
      { id: 'search', label: 'Search', icon: Search, isSearch: true },
      { id: 'garage', label: 'My Garage', icon: Car },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
      <footer style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        padding: '4px 14px',
        background: 'rgba(15,23,42,0.55)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '999px',
        boxShadow: '0 -25px 55px rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 1400,
        overflow: 'visible'
      }}>
        {isSearchOpen && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 0.5rem)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80vw',
            maxWidth: '520px',
            zIndex: 1500
          }}>
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
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
          justifyContent: 'space-between',
          gap: '6px'
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
                    onSectionChange?.(id);
                  }
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '2px 4px 10px 4px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#f9fafb',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  position: 'relative'
                }}
              >
                <IconComponent size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <span style={{ fontSize: '11px', fontWeight: 400 }}>
                  {label}
                </span>
                <div style={{
                  position: 'absolute',
                  bottom: '3px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40%',
                  height: '2px',
                  borderRadius: '999px',
                  backgroundColor: '#ffffff',
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
        {activeSection !== 'home' && (
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

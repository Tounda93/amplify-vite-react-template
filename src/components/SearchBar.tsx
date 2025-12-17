import { CSSProperties } from 'react';
import { Search, X } from 'lucide-react';
import { SearchResultGroups, SearchResultItem } from '../types/search';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchResults: SearchResultGroups;
  searchLoading: boolean;
  onSearchResultSelect: (result: SearchResultItem, options?: { clearInput?: boolean }) => void;
  isMobile: boolean;
  style?: CSSProperties;
  dropdownDirection?: 'up' | 'down';
  onDismiss?: () => void;
}

const searchSections: Array<{ key: keyof SearchResultGroups; label: string; accent: string }> = [
  { key: 'wikicars', label: 'WikiCars', accent: '#1d4ed8' },
  { key: 'news', label: 'News', accent: '#dc2626' },
  { key: 'events', label: 'Events', accent: '#059669' },
  { key: 'auctions', label: 'Auctions', accent: '#b45309' },
  { key: 'community', label: 'Community', accent: '#7c3aed' },
];

export default function SearchBar({
  searchTerm,
  onSearchChange,
  searchResults,
  searchLoading,
  onSearchResultSelect,
  isMobile,
  style,
  dropdownDirection = 'down',
  onDismiss
}: SearchBarProps) {
  const showSearchDropdown = searchTerm.trim().length >= 2;

  const containerStyle: CSSProperties = {
    width: isMobile ? '100%' : '300px',
    position: 'relative',
    ...style
  };

  return (
    <div style={containerStyle}>
      <div style={{ position: 'relative' }}>
        <Search
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: isMobile ? '#d1d5db' : '#ffffff'
          }}
          size={18}
        />
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '44px',
            paddingRight: onDismiss ? '44px' : '16px',
            paddingTop: '10px',
            paddingBottom: '10px',
            border: isMobile ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.35)',
            backgroundColor: isMobile ? 'rgba(15,23,42,0.1)' : 'rgba(15,23,42,0.8)',
            borderRadius: '9999px',
            color: isMobile ? '#f9fafb' : '#ffffff',
            fontSize: isMobile ? '16px' : '14px',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: isMobile ? '0 15px 35px rgba(15, 23, 42, 0.35)' : '0 15px 35px rgba(15,23,42,0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          className="collectible-search-input"
        />
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close search"
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showSearchDropdown && (
        <div style={{
          position: 'absolute',
          top: dropdownDirection === 'down' ? (isMobile ? '56px' : '48px') : undefined,
          bottom: dropdownDirection === 'up' ? (isMobile ? 'calc(100% + 12px)' : '48px') : undefined,
          left: 0,
          width: '100%',
          backgroundColor: isMobile ? 'rgba(15,23,42,0.95)' : '#ffffff',
          border: isMobile ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb',
          borderRadius: '16px',
          boxShadow: isMobile ? '0 25px 55px rgba(15, 23, 42, 0.55)' : '0 20px 40px rgba(0, 0, 0, 0.12)',
          maxHeight: '420px',
          overflowY: 'auto',
          zIndex: 2000,
          backdropFilter: isMobile ? 'blur(16px)' : undefined,
          WebkitBackdropFilter: isMobile ? 'blur(16px)' : undefined
        }}>
          {searchLoading && (
            <div style={{
              padding: '12px 16px',
              fontSize: '13px',
              color: isMobile ? '#f3f4f6' : '#6b7280',
              borderBottom: isMobile ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f3f4f6'
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
                  borderBottom: isLast ? 'none' : (isMobile ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f3f4f6'),
                  paddingBottom: '4px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px 6px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isMobile ? '#e5e7eb' : '#6b7280',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: section.accent
                  }} />
                  {section.label}
                </div>

                {resultsForSection.length === 0 && !searchLoading && (
                  <div style={{
                    padding: '6px 16px 14px 36px',
                    fontSize: '13px',
                    color: isMobile ? '#cbd5f5' : '#9ca3af'
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
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 16px 12px 36px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      color: isMobile ? '#f9fafb' : undefined
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = isMobile ? 'rgba(255,255,255,0.05)' : '#f9fafb'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 600, color: isMobile ? '#ffffff' : '#111827' }}>
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div style={{ fontSize: '12px', color: isMobile ? '#cbd5f5' : '#6b7280', marginTop: '2px' }}>
                        {result.subtitle}
                      </div>
                    )}
                    {result.description && (
                      <div style={{ fontSize: '12px', color: isMobile ? '#d1d5db' : '#4b5563', marginTop: '4px' }}>
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
}

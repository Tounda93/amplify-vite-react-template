import { Car, Home, MessageSquare, User } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

interface FooterProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export default function Footer({ activeSection = 'home', onSectionChange }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const isMobile = useIsMobile();

  if (isMobile) {
    const navItems = [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'garage', label: 'My Garage', icon: Car },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'profile', label: 'Profile', icon: User },
    ];

    return (
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        padding: '8px 12px',
        background: 'rgba(15,23,42,0.55)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 -25px 55px rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 1400
      }}>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '6px'
        }}>
          {navItems.map(({ id, label, icon: IconComponent }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSectionChange?.(id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px 4px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : 'transparent',
                  color: '#f9fafb',
                  boxShadow: isActive ? '0 10px 30px rgba(15,23,42,0.65)' : undefined,
                  backdropFilter: isActive ? 'blur(6px)' : undefined,
                  WebkitBackdropFilter: isActive ? 'blur(6px)' : undefined,
                  cursor: onSectionChange ? 'pointer' : 'default',
                  transition: 'background 0.2s'
                }}
              >
                <IconComponent size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <span style={{ fontSize: '11px', fontWeight: 500 }}>
                  {label}
                </span>
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
        {/* Coming Soon Message */}
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

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: '#e5e7eb',
          margin: '2rem 0',
        }} />

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

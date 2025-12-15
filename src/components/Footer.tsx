import { Car } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

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

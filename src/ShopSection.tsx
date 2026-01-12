import { useIsMobile } from './hooks/useIsMobile';

export function ShopSection() {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      <div style={{ padding: `2rem ${horizontalPadding}` }}>
        {/* Title Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#000',
            margin: 0
          }}>
            Shop
          </h2>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: '#000'
          }} />
        </div>

        {/* Coming Soon Message */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#333',
            marginBottom: '1rem'
          }}>
            Coming Soon
          </h3>
          <p style={{
            fontSize: '1rem',
            color: '#666',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            The Collectible Shop is currently under development.
            Check back soon for exclusive automotive merchandise and collectibles.
          </p>
        </div>
      </div>
    </div>
  );
}

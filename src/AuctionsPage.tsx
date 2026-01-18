import { AuctionsSection } from './AuctionsSection';

export function AuctionsPage() {
  return (
    <div style={{ width: '100%', backgroundColor: '#F2F3F5', padding: '2rem 5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#000',
          margin: 0
        }}>
          Auctions
        </h2>
      </div>
      <AuctionsSection />
    </div>
  );
}

import { useState } from 'react';
import { useIsMobile } from './hooks/useIsMobile';
import CreateRoomPopup from './components/CreateRoomPopup';

export function CommunitySection() {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  return (
    <div style={{ width: '100%', backgroundColor: '#F2F3F5', minHeight: '100vh', padding: `2rem ${horizontalPadding}` }}>
      {/* Rooms Title Section */}
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
          Rooms
        </h2>
        <div style={{
          flex: 1,
          height: '1px',
          backgroundColor: '#000'
        }} />
        <button
          onClick={() => setShowCreatePopup(true)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            border: '1px solid #000',
            backgroundColor: 'transparent',
            color: '#000',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#000';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#000';
          }}
        >
          Create your Room
        </button>
      </div>

      {/* Create Room Popup */}
      <CreateRoomPopup
        isOpen={showCreatePopup}
        onClose={() => setShowCreatePopup(false)}
        onRoomCreated={() => {
          // TODO: Refresh rooms list when Room model is added
          console.log('Room created');
        }}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from './hooks/useIsMobile';
import CreateRoomPopup from './components/CreateRoomPopup';
import RoomsCard from './components/Card/RoomsCard';
import { RoomRecord, getRoomShareUrl, loadRooms } from './utils/roomsStorage';

export function CommunitySection() {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setRooms(loadRooms());
  }, []);

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
        onRoomCreated={(room) => {
          setRooms((prev) => [room, ...prev]);
          const roomUrl = getRoomShareUrl(room.id);
          navigate(`/rooms/${room.id}`, { state: { showShare: true, roomUrl } });
        }}
      />

      {/* Rooms List */}
      <div style={{ marginTop: '2rem' }}>
        {rooms.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '2rem',
            textAlign: 'center',
            color: '#6b7280',
          }}>
            No rooms yet. Create your first room to get started.
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            maxWidth: '720px',
          }}>
            {rooms.map((room) => (
              <div key={room.id} onClick={() => navigate(`/rooms/${room.id}`)} style={{ cursor: 'pointer' }}>
                <RoomsCard
                  title={room.name}
                  description={room.description || 'No description yet.'}
                  memberCount={0}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

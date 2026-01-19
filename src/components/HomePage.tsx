import { useState, useEffect } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { loadRooms, RoomRecord } from '../utils/roomsStorage';
import { FALLBACKS } from '../utils/fallbacks';
import { openExternalUrl } from '../utils/url';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { NewsCard } from './Card';
import ForSaleCard from './Card/ForSaleCard';
import EventCard from './Card/EventCard';
import EventDetailPopup from './EventDetailPopup';
import CarDetailPopup from './CarDetailPopup';
import RoomsCard from './Card/RoomsCard';
import './HomePage.css';

type Car = Schema['Car']['type'];
type CarWithImageUrl = Car & { imageUrl?: string; makeName?: string; modelName?: string };
type Event = Schema['Event']['type'];

export default function HomePage() {
  const { feedItems, loading, sellerPhone, reload } = useHomeFeed();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [messageCar, setMessageCar] = useState<CarWithImageUrl | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [selectedCarDetails, setSelectedCarDetails] = useState<CarWithImageUrl | null>(null);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return 'Date TBA';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatLocation = (event: Event) => {
    const parts = [event.venue, event.city, event.region, event.country].filter(Boolean);
    return parts.join(', ') || 'Location TBA';
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="layout-container">
          <div className="home-page__loading">
            <p>Loading feed...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page" style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Social Media Style Feed */}
      <div className="home-page__content">
        <div className="home-feed">
          {/* Feed Cards - Stacked vertically */}
          {feedItems.length > 0 ? (
            feedItems.map((item, index) => {
              if (item.type === 'event') {
                const event = item.data;
                return (
                  <div key={`event-${event.id}-${index}`} className="home-page__card-stack">
                    <EventCard
                      imageUrl={event.imageUrl || FALLBACKS.event}
                      imageAlt={event.title || 'Event cover'}
                      imageHeight={400}
                      dateLabel={formatDate(event.startDate)}
                      title={event.title || 'Untitled Event'}
                      locationLabel={formatLocation(event)}
                      participantCount={event.participantCount ?? 0}
                      showMenu={false}
                      onClick={() => setSelectedEvent(event)}
                    />
                  </div>
                );
              }

              if (item.type === 'news') {
                const newsItem = item.data;
                return (
                  <div key={`news-${index}`} className="home-page__card-stack">
                    <NewsCard
                      imageUrl={newsItem.thumbnail || FALLBACKS.news}
                      category="NEWS"
                      hideCategory
                      authorName={newsItem.source}
                      description={newsItem.title}
                      onClick={() => openExternalUrl(newsItem.link)}
                      variant="wide"
                    />
                  </div>
                );
              }

              if (item.type === 'car') {
                const car = item.data;
                const detailParts = [
                  car.mileage ? `${car.mileage.toLocaleString('en-US')} ${car.mileageUnit || 'km'}` : null,
                  car.transmission ? car.transmission.replace('_', ' ') : null,
                  car.color || null,
                ].filter(Boolean) as string[];
                const priceLabel = car.price ? `€${car.price.toLocaleString('en-US')}` : 'Price on request';
                return (
                  <div key={`car-${car.id}-${index}`} className="home-page__card-stack">
                    <ForSaleCard
                      imageUrl={car.imageUrl || FALLBACKS.car}
                      title={`${car.year || ''} ${car.makeName || ''} ${car.modelName || ''}`.trim()}
                      priceLabel={priceLabel}
                      detailLine={detailParts.join(' • ')}
                      onClick={() => setSelectedCarDetails(car)}
                      onMessage={() => setMessageCar(car)}
                      phoneNumber={sellerPhone || undefined}
                    />
                  </div>
                );
              }

              return null;
            })
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              No content available yet. Check back soon!
            </p>
          )}

          {/* Rooms Section - Create your room CTA */}
          <div style={{
            width: '100%',
            marginTop: '1rem',
            padding: '2rem',
            borderRadius: '5px',
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            border: '1px dashed rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#000',
              margin: '0 0 0.5rem 0',
            }}>
              Create Your Room
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: '0 0 1rem 0',
            }}>
              Start a community discussion about your favorite cars
            </p>
            <button
              onClick={() => console.log('Create room clicked')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: '1px solid #000',
                backgroundColor: 'transparent',
                color: '#000',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
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
              Create your room
            </button>
          </div>
        </div>
      </div>

      <EventDetailPopup
        event={selectedEvent}
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
      <CarDetailPopup
        car={selectedCarDetails}
        makeName={selectedCarDetails?.makeName || ''}
        modelName={selectedCarDetails?.modelName || ''}
        isOpen={selectedCarDetails !== null}
        onClose={() => setSelectedCarDetails(null)}
        onCarUpdated={reload}
        onCarDeleted={() => {
          setSelectedCarDetails(null);
          reload();
        }}
      />

      {messageCar && (
        <div className="home-page__message-overlay" onClick={() => setMessageCar(null)}>
          <div className="home-page__message-modal" onClick={(event) => event.stopPropagation()}>
            <div className="home-page__message-header">
              <h3>Message Seller</h3>
              <button type="button" onClick={() => setMessageCar(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <p className="home-page__message-subtitle">
              {`${messageCar.year || ''} ${messageCar.makeName || ''} ${messageCar.modelName || ''}`.trim()}
            </p>
            <textarea
              rows={4}
              placeholder="Write your message..."
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
            />
            <div className="home-page__message-actions">
              <button type="button" className="home-page__message-btn" onClick={() => setMessageCar(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="home-page__message-btn home-page__message-btn--primary"
                onClick={() => {
                  setMessageDraft('');
                  setMessageCar(null);
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HomeRoomsSidebar() {
  const [rooms, setRooms] = useState<RoomRecord[]>([]);

  useEffect(() => {
    const refreshRooms = () => setRooms(loadRooms());
    refreshRooms();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', refreshRooms);
      window.addEventListener('storage', refreshRooms);
      return () => {
        window.removeEventListener('focus', refreshRooms);
        window.removeEventListener('storage', refreshRooms);
      };
    }
    return undefined;
  }, []);

  return (
    <aside className="home-page__sidebar">
      <h3 className="home-page__sidebar-title">Suggested Rooms</h3>
      <div className="home-page__sidebar-list">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <div key={room.id} className="home-page__card-stack">
              <RoomsCard
                title={room.name}
                description={room.description || 'No description yet.'}
                memberCount={room.memberCount ?? 0}
              />
            </div>
          ))
        ) : (
          <p className="home-page__sidebar-empty">No rooms yet.</p>
        )}
      </div>
    </aside>
  );
}

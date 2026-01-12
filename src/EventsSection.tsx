import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Card } from './components/Card';
import { useIsMobile } from './hooks/useIsMobile';
import CreateEventPopup from './components/CreateEventPopup';
import './EventsSection.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

export function EventsSection() {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';

  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  useEffect(() => {
    loadEvents();

    const subscription = client.models.Event.observeQuery().subscribe({
      next: ({ items }) => {
        console.log('Events subscription received:', items.length, 'items');
        const published = items.filter(e => e.isPublished !== false);
        setEvents(published);
        filterUpcomingEvents(published);
        setLoading(false);
      },
      error: (err) => {
        console.error('Events subscription error:', err);
        setLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, errors } = await client.models.Event.list({ limit: 500 });
      if (errors) {
        console.error('Error loading events:', errors);
      }
      console.log('Loaded events:', data?.length || 0, 'items');
      const published = (data || []).filter(e => e.isPublished !== false);
      console.log('Published events:', published.length);
      setEvents(published);
      filterUpcomingEvents(published);
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const filterUpcomingEvents = (allEvents: Event[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = allEvents
      .filter(e => {
        const eventDate = new Date(e.startDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    setUpcomingEvents(upcoming);
  };

  const handleCardClick = (event: Event) => {
    console.log('Event clicked:', event);
  };

  if (loading) {
    return (
      <div className="events-section" style={{ padding: horizontalPadding }}>
        <div className="events-section__loading">
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-section" style={{ width: '100%', overflowX: 'hidden' }}>
      <div
        className="events-section__content"
        style={{ padding: `2rem ${horizontalPadding}` }}
      >
        {/* Title Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000', margin: 0 }}>Upcoming events</h2>
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
            Create your event
          </button>
        </div>

        {/* Events Grid */}
        {upcomingEvents.length > 0 ? (
          <div className="events-section__grid">
            {upcomingEvents.map((event) => (
              <Card
                key={event.id}
                imageUrl={event.coverImage || FALLBACK_IMAGE}
                title1="EVENT"
                title2={event.title}
                separatorText={event.city && event.country ? `${event.city}, ${event.country}` : undefined}
                requirement={event.price || undefined}
                onClick={() => handleCardClick(event)}
              />
            ))}
          </div>
        ) : (
          <div className="events-section__empty">
            <div className="events-section__empty-icon">No events found</div>
            <h3>No Upcoming Events</h3>
            <p>
              {events.length === 0
                ? 'No automotive events have been added yet.'
                : 'Check back soon for upcoming events.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Event Popup */}
      <CreateEventPopup
        isOpen={showCreatePopup}
        onClose={() => setShowCreatePopup(false)}
        onEventCreated={loadEvents}
      />
    </div>
  );
}

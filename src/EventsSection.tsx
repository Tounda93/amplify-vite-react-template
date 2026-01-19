import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import EventCard from './components/Card/EventCard';
import { useIsMobile } from './hooks/useIsMobile';
import { getImageUrl } from './utils/storageHelpers';
import EventDetailPopup from './components/EventDetailPopup';
import { FALLBACKS } from './utils/fallbacks';
import './EventsSection.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };

interface EventsSectionProps {
  onSaveEvent: (event: Event) => void;
}

export function EventsSection({ onSaveEvent }: EventsSectionProps) {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';
  const carouselRef = useRef<HTMLDivElement>(null);

  const [allEvents, setAllEvents] = useState<EventWithImageUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();

    const subscription = client.models.Event.observeQuery().subscribe({
      next: ({ items }) => {
        console.log('Events subscription received:', items.length, 'items');
        const published = items.filter(e => e.isPublished !== false);
        processEvents(published);
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
      processEvents(published);
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const processEvents = async (events: Event[]) => {
    // Sort by startDate (soonest first)
    const sorted = [...events].sort((a, b) => {
      const aVisibility = a.visibility === 'members' ? 1 : 0;
      const bVisibility = b.visibility === 'members' ? 1 : 0;
      if (aVisibility !== bVisibility) {
        return aVisibility - bVisibility;
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    const eventsWithUrls = await Promise.all(
      sorted.map(async (event) => {
        if (event.coverImage) {
          const imageUrl = await getImageUrl(event.coverImage);
          return { ...event, imageUrl: imageUrl || FALLBACKS.event };
        }
        return { ...event, imageUrl: FALLBACKS.event };
      })
    );

    setAllEvents(eventsWithUrls);
  };

  const handleCardClick = (event: Event) => {
    setSelectedEvent(event);
  };

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    const handleClick = () => {
      setOpenMenuId(null);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [openMenuId]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return 'Date TBA';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatLocation = (event: Event) => {
    const parts = [event.city, event.region, event.country].filter(Boolean);
    if (event.venue) {
      return `${event.venue}${parts.length > 0 ? `, ${parts.join(', ')}` : ''}`;
    }
    return parts.join(', ') || 'Location TBA';
  };

  const handleShareEvent = async (event: Event) => {
    const shareUrl = event.website || event.ticketUrl || window.location.href;
    const shareText = `${event.title} • ${formatDate(event.startDate)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall through to clipboard fallback.
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        window.alert('Event link copied to clipboard.');
        return;
      } catch {
        // Fall through to prompt fallback.
      }
    }

    window.prompt('Copy this event link:', shareUrl);
  };

  const handleReportEvent = () => {
    window.alert('Thanks for the report. Our team will review this event.');
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
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000', margin: 0 }}>All Events</h2>
        </div>

        {/* Events Carousel */}
        {allEvents.length > 0 ? (
          <div className="events-carousel-container">
            {/* Carousel */}
            <div
              ref={carouselRef}
              className="events-carousel"
            >
              {allEvents.map((event) => (
                <div key={event.id} className="events-carousel__item">
                  <EventCard
                    imageUrl={event.imageUrl || FALLBACKS.event}
                    imageAlt={event.title || 'Event cover'}
                    dateLabel={formatDate(event.startDate)}
                    title={event.title}
                    locationLabel={formatLocation(event)}
                    participantCount={event.participantCount ?? 0}
                    isMenuOpen={openMenuId === event.id}
                    onMenuToggle={() => {
                      setOpenMenuId((prev) => (prev === event.id ? null : event.id));
                    }}
                    onShare={() => {
                      setOpenMenuId(null);
                      handleShareEvent(event);
                    }}
                    onSave={() => {
                      setOpenMenuId(null);
                      onSaveEvent(event);
                    }}
                    onReport={() => {
                      setOpenMenuId(null);
                      handleReportEvent();
                    }}
                    onClick={() => handleCardClick(event)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="events-section__empty">
            <div className="events-section__empty-icon">No events found</div>
            <h3>No Events Available</h3>
            <p>No automotive events have been added yet.</p>
          </div>
        )}

        {/* Members Only Events Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '3rem',
          marginBottom: '1rem'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000', margin: 0 }}>Members only events</h2>
        </div>
      </div>

      {/* Event Detail Popup */}
      <EventDetailPopup
        event={selectedEvent}
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

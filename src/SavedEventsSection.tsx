import { useEffect, useState } from 'react';
import type { Schema } from '../amplify/data/resource';
import EventCard from './components/Card/EventCard';
import { useIsMobile } from './hooks/useIsMobile';
import { getImageUrl } from './utils/storageHelpers';
import { FALLBACKS } from './utils/fallbacks';
import './EventsSection.css';

type Event = Schema['Event']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };

interface SavedEventsSectionProps {
  savedEvents: Event[];
  onSaveEvent: (event: Event) => void;
}

export function SavedEventsSection({ savedEvents, onSaveEvent }: SavedEventsSectionProps) {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [eventsWithImages, setEventsWithImages] = useState<EventWithImageUrl[]>(savedEvents);

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

  useEffect(() => {
    const loadImages = async () => {
      setEventsWithImages(savedEvents);
      const updated = await Promise.all(
        savedEvents.map(async (event) => {
          if ((event as EventWithImageUrl).imageUrl) {
            return event as EventWithImageUrl;
          }
          if (event.coverImage) {
            const imageUrl = await getImageUrl(event.coverImage);
            return { ...event, imageUrl: imageUrl || FALLBACKS.event };
          }
          return { ...event, imageUrl: FALLBACKS.event };
        })
      );
      setEventsWithImages(updated);
    };

    loadImages();
  }, [savedEvents]);

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

  if (savedEvents.length === 0) {
    return (
      <div className="events-section" style={{ padding: `2rem ${horizontalPadding}` }}>
        <div className="events-section__empty">
          <div className="events-section__empty-icon">No saved events</div>
          <h3>No Saved Events</h3>
          <p>Save events from the Events section to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-section" style={{ padding: `2rem ${horizontalPadding}` }}>
      <div className="events-section__content">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000', margin: 0 }}>
            Saved Events
          </h2>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: '#000'
          }} />
        </div>

        <div className="events-carousel" style={{ flexWrap: 'wrap', overflowX: 'visible' }}>
          {eventsWithImages.map((event) => (
            <div key={event.id} className="events-carousel__item">
              <EventCard
                imageUrl={event.imageUrl || event.coverImage || FALLBACKS.event}
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
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

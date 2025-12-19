import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import './NewsCarousel.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';
const FRAME_TEXT = 'Collectible Collectible Collectible Collectible Collectible Collectible Collectible';

export default function EventsCarousel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [allowHoverEffects, setAllowHoverEffects] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateHoverCapability = (event?: MediaQueryListEvent) => {
      setAllowHoverEffects(event ? event.matches : mediaQuery.matches);
    };

    updateHoverCapability();
    mediaQuery.addEventListener('change', updateHoverCapability);

    return () => mediaQuery.removeEventListener('change', updateHoverCapability);
  }, []);

  const loadEvents = async () => {
    try {
      const { data } = await client.models.Event.list({ limit: 20 });

      // Filter upcoming events and sort by start date
      const upcoming = (data || [])
        .filter(event => {
          if (!event.startDate) return false;
          const eventDate = new Date(event.startDate);
          return eventDate >= new Date();
        })
        .sort((a, b) => {
          const dateA = new Date(a.startDate!);
          const dateB = new Date(b.startDate!);
          return dateA.getTime() - dateB.getTime();
        });

      setEvents(upcoming.slice(0, 12)); // Show max 12 events
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 350;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEventTypeEmoji = (type?: Event['eventType']) => {
    const emojiMap = {
      'car_show': '🚗',
      'race': '🏎️',
      'auction': '🔨',
      'meet': '🤝',
      'rally': '🏁',
      'festival': '🎉',
      'exhibition': '🏛️',
      'track_day': '🛞',
      'other': '📅',
    };
    return emojiMap[type || 'other'] || '📅';
  };

  if (loading) {
    return (
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '700' }}>
          Upcoming Events
        </h2>
        <p style={{ color: '#666' }}>Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '700' }}>
          Upcoming Events
        </h2>
        <p style={{ color: '#666' }}>No upcoming events yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '3rem', position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
          Upcoming Events
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => scroll('left')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={20} color="#666" />
          </button>
          <button
            onClick={() => scroll('right')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={20} color="#666" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '0 5rem 10px 5rem',
          marginLeft: '-5rem',
          marginRight: '-5rem'
        }}
      >
        {events.map((event, index) => {
          const shouldShowFrame = allowHoverEffects ? hoveredCardIndex === index : false;
          return (
          <div
            key={event.id}
            className={`news-card${shouldShowFrame ? ' news-card--active' : ''}`}
            style={{
              minWidth: '320px',
              marginTop: '20px',
              marginBottom: '12px',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              position: 'relative',
              overflow: 'visible',
              backgroundColor: 'transparent',
              boxShadow: shouldShowFrame ? '0 0 0 8px red' : 'none',
            }}
            onMouseEnter={() => {
              if (allowHoverEffects) {
                setHoveredCardIndex(index);
              }
            }}
            onMouseLeave={() => {
              if (allowHoverEffects) {
                setHoveredCardIndex(null);
              }
            }}
            onClick={() => {
              if (event.website) {
                window.open(event.website, '_blank');
              }
            }}
          >
            {shouldShowFrame && (
              <div className="news-card-frame-text" aria-hidden="true">
                <div className="frame-strip frame-strip-top">
                  <span>{FRAME_TEXT}</span>
                  <span>{FRAME_TEXT}</span>
                </div>
                <div className="frame-strip frame-strip-right">
                  <span>{FRAME_TEXT}</span>
                  <span>{FRAME_TEXT}</span>
                </div>
                <div className="frame-strip frame-strip-bottom">
                  <span>{FRAME_TEXT}</span>
                  <span>{FRAME_TEXT}</span>
                </div>
                <div className="frame-strip frame-strip-left">
                  <span>{FRAME_TEXT}</span>
                  <span>{FRAME_TEXT}</span>
                </div>
              </div>
            )}

            <div className="news-card__content">
              {/* Event Image */}
              <div style={{
                width: '100%',
                height: '310px',
                backgroundColor: '#f3f4f6',
                backgroundImage: `url(${event.coverImage || FALLBACK_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}>
                {/* Event Type Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  padding: '4px 12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}>
                  {getEventTypeEmoji(event.eventType)} {event.eventType?.replace('_', ' ').toUpperCase()}
                </div>

                {/* Featured Badge */}
                {event.isFeatured && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 12px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}>
                    FEATURED
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div style={{ padding: '13px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'white',
                  marginBottom: '10px',
                  fontWeight: '400',
                }}>
                  <Calendar size={14} color="white" />
                  <span>{formatDate(event.startDate!)}</span>
                  {event.endDate && event.endDate !== event.startDate && (
                    <span>- {formatDate(event.endDate)}</span>
                  )}
                </div>

                <h3 style={{
                  margin: '0 0 10px 0',
                  fontSize: '23px',
                  fontWeight: '200',
                  color: 'white',
                  lineHeight: '1.2',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {event.title}
                </h3>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '12px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '300',
                }}>
                  <MapPin size={14} color="white" />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {event.city}, {event.country}
                  </span>
                </div>

                {event.price && (
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '12px',
                  }}>
                    {event.price}
                  </div>
                )}

                {event.website && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}>
                    Learn More <ArrowRight size={14} color="white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

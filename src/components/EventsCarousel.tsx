import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

export default function EventsCarousel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEvents();
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
          paddingBottom: '10px',
        }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            style={{
              minWidth: '320px',
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => {
              if (event.website) {
                window.open(event.website, '_blank');
              }
            }}
          >
            {/* Event Image */}
            <div style={{
              width: '100%',
              height: '180px',
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
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
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
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                }}>
                  FEATURED
                </div>
              )}
            </div>

            {/* Event Details */}
            <div style={{ padding: '16px' }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '700',
                color: '#111827',
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
                marginBottom: '8px',
                color: '#6b7280',
                fontSize: '13px',
              }}>
                <Calendar size={14} />
                <span>{formatDate(event.startDate!)}</span>
                {event.endDate && event.endDate !== event.startDate && (
                  <span>- {formatDate(event.endDate)}</span>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px',
                color: '#6b7280',
                fontSize: '13px',
              }}>
                <MapPin size={14} />
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
                  color: '#3498db',
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
                  color: '#3498db',
                  fontSize: '13px',
                  fontWeight: '600',
                }}>
                  Learn More <ArrowRight size={14} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

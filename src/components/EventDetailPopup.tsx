import { X, MapPin, Calendar, Globe, Ticket, DollarSign } from 'lucide-react';
import type { Schema } from '../../amplify/data/resource';

type Event = Schema['Event']['type'];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

interface EventDetailPopupProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailPopup({ event, isOpen, onClose }: EventDetailPopupProps) {
  if (!isOpen || !event) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDateRange = () => {
    if (!event.startDate) return 'Date TBD';
    const start = formatDate(event.startDate);
    if (event.endDate && event.endDate !== event.startDate) {
      const end = formatDate(event.endDate);
      return `${start} - ${end}`;
    }
    return start;
  };

  const getLocation = () => {
    const parts = [event.venue, event.city, event.country].filter(Boolean);
    return parts.join(', ') || 'Location TBD';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with Image */}
        <div style={{ position: 'relative' }}>
          <img
            src={event.coverImage || FALLBACK_IMAGE}
            alt={event.title}
            style={{
              width: '100%',
              height: '250px',
              objectFit: 'cover',
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <X size={20} />
          </button>

          {/* Event Type Badge */}
          {event.eventType && (
            <div
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                padding: '0.375rem 0.75rem',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#fff',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
              }}
            >
              {event.eventType.replace('_', ' ')}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', padding: '1.5rem' }}>
          {/* Title */}
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 600, color: '#000' }}>
            {event.title}
          </h2>

          {/* Info Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
            {/* Date */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Calendar size={20} style={{ color: '#666', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 500, color: '#333' }}>{getDateRange()}</div>
              </div>
            </div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <MapPin size={20} style={{ color: '#666', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 500, color: '#333' }}>{getLocation()}</div>
              </div>
            </div>

            {/* Price */}
            {event.price && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <DollarSign size={20} style={{ color: '#666', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 500, color: '#333' }}>{event.price}</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#333' }}>
                About this event
              </h3>
              <p style={{ margin: 0, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {event.description}
              </p>
            </div>
          )}

          {/* Restrictions */}
          {event.restrictions && event.restrictions.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#333' }}>
                Restrictions
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {event.restrictions.filter(Boolean).map((restriction, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: '#f3f4f6',
                      borderRadius: '999px',
                      fontSize: '0.875rem',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {restriction}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {event.website && (
              <a
                href={event.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: '#000',
                  color: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                <Globe size={16} />
                Visit Website
              </a>
            )}
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: '#fff',
                  color: '#000',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #000',
                }}
              >
                <Ticket size={16} />
                Get Tickets
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

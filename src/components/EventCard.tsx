import { MoreHorizontal } from 'lucide-react';
import './EventCard.css';

interface EventCardProps {
  imageUrl: string;
  imageAlt?: string;
  imageHeight?: number;
  dateLabel: string;
  title: string;
  locationLabel: string;
  participantCount: number;
  showMenu?: boolean;
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onReport?: () => void;
  onClick?: () => void;
}

export default function EventCard({
  imageUrl,
  imageAlt = 'Event cover',
  imageHeight,
  dateLabel,
  title,
  locationLabel,
  participantCount,
  showMenu = true,
  isMenuOpen = false,
  onMenuToggle = () => {},
  onShare = () => {},
  onSave = () => {},
  onReport = () => {},
  onClick,
}: EventCardProps) {
  return (
    <div
      className={`event-card${onClick ? ' event-card--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {showMenu && (
        <>
          <button
            type="button"
            className="event-card__menu-button"
            aria-label="Open event actions"
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div
              className="event-card__menu"
              onClick={(e) => e.stopPropagation()}
              role="menu"
            >
              <button type="button" className="event-card__menu-item" onClick={onShare}>
                Share
              </button>
              <button type="button" className="event-card__menu-item" onClick={onSave}>
                Save
              </button>
              <button type="button" className="event-card__menu-item" onClick={onReport}>
                Report event
              </button>
            </div>
          )}
        </>
      )}

      <div className="event-card__body">
        <div className="event-card__date">{dateLabel}</div>
        <h3 className="event-card__title">{title}</h3>
        <div className="event-card__row">
          <span className="event-card__label">Location</span>
          <span className="event-card__value">{locationLabel}</span>
        </div>
      </div>

      <div
        className="event-card__image"
        style={{
          backgroundImage: `url(${imageUrl})`,
          height: imageHeight ? `${imageHeight}px` : undefined,
        }}
        role="img"
        aria-label={imageAlt}
      />

      <div className="event-card__footer">
        <div className="event-card__row">
          <span className="event-card__label">Participants</span>
          <span className="event-card__value">{participantCount}</span>
        </div>
      </div>
    </div>
  );
}

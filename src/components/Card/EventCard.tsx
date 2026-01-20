import { MoreHorizontal } from 'lucide-react';
import './EventCard.css';

interface EventCardProps {
  imageUrl: string;
  imageAlt?: string;
  imageHeight?: number;
  dateLabel: string;
  title: string;
  locationLabel: string;
  participantCount?: number;
  footerLabel?: string;
  footerValue?: string | number;
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
  footerLabel,
  footerValue,
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
        <div className="event-card__location-value">{locationLabel}</div>
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

      {(footerLabel || footerValue !== undefined || participantCount !== undefined) && (
        <div className="event-card__footer">
          <div className="event-card__row">
            <span className="event-card__label">{footerLabel || 'Participants'}</span>
            <span className="event-card__value">
              {footerValue !== undefined ? footerValue : participantCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

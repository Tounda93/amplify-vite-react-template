import './ForSaleCard.css';

interface ForSaleCardProps {
  imageUrl: string;
  title: string;
  priceLabel: string;
  detailLine?: string;
  onClick?: () => void;
  phoneNumber?: string;
  onMessage?: () => void;
}

export default function ForSaleCard({
  imageUrl,
  title,
  priceLabel,
  detailLine,
  onClick,
  phoneNumber,
  onMessage,
}: ForSaleCardProps) {
  const hasPhone = Boolean(phoneNumber);
  const handleMessageClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onMessage) {
      onMessage();
    }
  };

  const handleCallClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className={`for-sale-card${onClick ? ' for-sale-card--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className="for-sale-card__image"
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={title}
      >
        <div className="for-sale-card__eyebrow">FOR SALE</div>
      </div>
      <div className="for-sale-card__body">
        <div className="for-sale-card__header">
          <h3 className="for-sale-card__title">{title}</h3>
          <span className="for-sale-card__price">{priceLabel}</span>
        </div>
        {detailLine && <div className="for-sale-card__details">{detailLine}</div>}
        <div className="for-sale-card__actions">
          {hasPhone ? (
            <a
              className="for-sale-card__action for-sale-card__action--call"
              href={`tel:${phoneNumber}`}
              onClick={handleCallClick}
            >
              Call {phoneNumber}
            </a>
          ) : (
            <button
              type="button"
              className="for-sale-card__action for-sale-card__action--call"
              disabled
              onClick={(event) => event.stopPropagation()}
            >
              Call
            </button>
          )}
          <button
            type="button"
            className="for-sale-card__action for-sale-card__action--message"
            onClick={handleMessageClick}
            disabled={!onMessage}
          >
            Message
          </button>
        </div>
      </div>
    </div>
  );
}

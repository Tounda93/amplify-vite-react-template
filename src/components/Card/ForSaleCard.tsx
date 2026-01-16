import './ForSaleCard.css';

interface ForSaleCardProps {
  imageUrl: string;
  title: string;
  priceLabel: string;
  detailLine?: string;
}

export default function ForSaleCard({
  imageUrl,
  title,
  priceLabel,
  detailLine,
}: ForSaleCardProps) {
  return (
    <div className="for-sale-card">
      <div
        className="for-sale-card__image"
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={title}
      />
      <div className="for-sale-card__body">
        <div className="for-sale-card__eyebrow">FOR SALE</div>
        <div className="for-sale-card__header">
          <h3 className="for-sale-card__title">{title}</h3>
          <span className="for-sale-card__price">{priceLabel}</span>
        </div>
        {detailLine && <div className="for-sale-card__details">{detailLine}</div>}
      </div>
    </div>
  );
}

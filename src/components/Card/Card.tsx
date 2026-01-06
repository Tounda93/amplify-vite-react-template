import './Card.css';

export type CardVariant = 'default' | 'compact' | 'wide';

export interface CardProps {
  /** Image URL for the card */
  imageUrl: string;
  /** First title - smaller, lighter text (e.g., category, date, source) */
  title1: string;
  /** Second title - main title, bolder text */
  title2: string;
  /** Separator text between titles and requirement pill */
  separatorText?: string;
  /** Requirement text shown in pill (e.g., "Members Only", "Free", "Premium") */
  requirement?: string;
  /** Card variant for different layouts */
  variant?: CardVariant;
  /** Click handler when card is clicked */
  onClick?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Alt text for the image */
  imageAlt?: string;
}

export default function Card({
  imageUrl,
  title1,
  title2,
  separatorText,
  requirement,
  variant = 'default',
  onClick,
  className = '',
  imageAlt = '',
}: CardProps) {
  const cardClassName = `card card--${variant} ${className}`.trim();

  return (
    <div
      className={cardClassName}
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
      {/* Card Image */}
      <div
        className="card__image"
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={imageAlt || title2}
      />

      {/* Card Content */}
      <div className="card__content">
        {/* Titles */}
        <div className="card__titles">
          <span className="card__title1">{title1}</span>
          <h3 className="card__title2">{title2}</h3>
        </div>

        {/* Separator with text and line */}
        {separatorText && (
          <div className="card__separator">
            <span className="card__separator-text">{separatorText}</span>
            <div className="card__separator-line" />
          </div>
        )}

        {/* Requirement Pill */}
        {requirement && (
          <div className="card__requirement">
            <span className="card__requirement-pill">{requirement}</span>
          </div>
        )}
      </div>
    </div>
  );
}

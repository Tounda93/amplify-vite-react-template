import { Heart, MessageCircle, Share2 } from 'lucide-react';
import './Card.css';

export type NewsCardVariant = 'default' | 'compact' | 'wide';

export interface NewsCardProps {
  /** Image URL for the card */
  imageUrl: string;
  /** Category title (e.g., "Event", "News", "Rooms") */
  category?: string;
  /** Author/poster name (user, magazine, event organizer) */
  authorName?: string;
  /** Author profile picture URL */
  authorImage?: string;
  /** Description text */
  description?: string;
  /** Separator text between titles and requirement pill */
  separatorText?: string;
  /** Requirement text shown in pill (e.g., "Members Only", "Free", "Premium") */
  requirement?: string;
  /** Card variant for different layouts */
  variant?: NewsCardVariant;
  /** Click handler when card is clicked */
  onClick?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Alt text for the image */
  imageAlt?: string;
  /** Like count */
  likeCount?: number;
  /** Comment count */
  commentCount?: number;
  /** Share count */
  shareCount?: number;
  /** Like handler */
  onLike?: () => void;
  /** Comment handler */
  onComment?: () => void;
  /** Share handler */
  onShare?: () => void;

  // Legacy props for backwards compatibility
  /** @deprecated Use category instead */
  title1?: string;
  /** @deprecated Use description instead */
  title2?: string;
}

export default function NewsCard({
  imageUrl,
  category,
  authorName,
  authorImage: _authorImage,
  description,
  separatorText,
  requirement,
  variant = 'default',
  onClick,
  className = '',
  imageAlt = '',
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
  onLike,
  onComment,
  onShare,
  // Legacy props
  title1,
  title2,
}: NewsCardProps) {
  const cardClassName = `card card--${variant} ${className}`.trim();

  // Support legacy props
  const displayCategory = category || title1 || 'Post';
  const displayDescription = description || title2;

  const handleActionClick = (e: React.MouseEvent, handler?: () => void) => {
    e.stopPropagation();
    handler?.();
  };

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
      {/* Card Header - Category, Author, Description */}
      <div className="card__header">
        {/* Category Badge */}
        <span className="card__category">{displayCategory}</span>

        {/* Author Info */}
        <div className="card__author">
          <span className="card__author-name">{authorName || 'Anonymous'}</span>
        </div>

        {/* Description */}
        {displayDescription && (
          <p className="card__description">{displayDescription}</p>
        )}
      </div>

      {/* Card Image */}
      <div
        className="card__image"
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={imageAlt || displayDescription || 'Card image'}
      />

      {/* Card Footer - Like, Comment, Share */}
      <div className="card__actions">
        <button
          className="card__action-btn"
          onClick={(e) => handleActionClick(e, onLike)}
          aria-label="Like"
        >
          <Heart size={18} />
          {likeCount > 0 && <span className="card__action-count">{likeCount}</span>}
        </button>

        <button
          className="card__action-btn"
          onClick={(e) => handleActionClick(e, onComment)}
          aria-label="Comment"
        >
          <MessageCircle size={18} />
          {commentCount > 0 && <span className="card__action-count">{commentCount}</span>}
        </button>

        <button
          className="card__action-btn"
          onClick={(e) => handleActionClick(e, onShare)}
          aria-label="Share"
        >
          <Share2 size={18} />
          {shareCount > 0 && <span className="card__action-count">{shareCount}</span>}
        </button>
      </div>

      {/* Optional: Separator and Requirement (for backwards compat) */}
      {(separatorText || requirement) && (
        <div className="card__extras">
          {separatorText && (
            <div className="card__separator">
              <span className="card__separator-text">{separatorText}</span>
              <div className="card__separator-line" />
            </div>
          )}
          {requirement && (
            <div className="card__requirement">
              <span className="card__requirement-pill">{requirement}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

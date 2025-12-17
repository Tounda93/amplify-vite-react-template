import { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { fetchNewsFeedItems, type NewsItem } from '../utils/newsFeed';
import './NewsCarousel.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80';
const FRAME_TEXT = 'Collectible Collectible Collectible Collectible Collectible Collectible Collectible';

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: 'Lotus Elise becomes future classic',
    link: '#',
    pubDate: new Date().toISOString(),
    description: 'Lightweight British roadsters continue to attract collectors with their analog feel.',
    source: 'Collectible',
    thumbnail: FALLBACK_IMAGE,
  },
  {
    title: 'Porsche 911 SC market snapshot',
    link: '#',
    pubDate: new Date().toISOString(),
    description: 'Values hold firm as buyers look for well-documented examples from the late seventies.',
    source: 'Collectible',
    thumbnail: FALLBACK_IMAGE,
  },
  {
    title: 'Classic rally events returning across Europe',
    link: '#',
    pubDate: new Date().toISOString(),
    description: 'Historic rally championships announce updated schedules for 2025.',
    source: 'Collectible',
    thumbnail: FALLBACK_IMAGE,
  },
];

export default function NewsCarousel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [allowHoverEffects, setAllowHoverEffects] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      try {
        const items = await fetchNewsFeedItems();
        if (items.length > 0) {
          setNews(items.slice(0, 12));
        } else {
          setNews(FALLBACK_NEWS);
        }
      } catch (error) {
        console.warn('Unable to fetch news feed for homepage. Using fallback content.', error);
        setNews(FALLBACK_NEWS);
      }
      setLoading(false);
    };
    loadNews();
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

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || news.length === 0) {
      return;
    }

    const updateActiveCard = () => {
      const cards = Array.from(container.children) as HTMLElement[];
      if (cards.length === 0) {
        return;
      }

      const viewportCenter = window.innerWidth / 2;
      let closestIndex = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(viewportCenter - cardCenter);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      setActiveCardIndex(closestIndex);
    };

    updateActiveCard();
    container.addEventListener('scroll', updateActiveCard);
    window.addEventListener('resize', updateActiveCard);

    return () => {
      container.removeEventListener('scroll', updateActiveCard);
      window.removeEventListener('resize', updateActiveCard);
    };
  }, [news]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '700' }}>
          Latest News
        </h2>
        <p style={{ color: '#666' }}>Loading news...</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '700' }}>
          Latest News
        </h2>
        <p style={{ color: '#666' }}>No news available.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '3rem', position: 'relative' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
          Latest News
        </h2>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '10px 5rem 10px 5rem',
          marginLeft: '-5rem',
          marginRight: '-5rem'
        }}
      >
        {news.map((item, index) => {
          const shouldShowFrame = allowHoverEffects
            ? hoveredCardIndex === index
            : index === activeCardIndex;
          return (
            <div
              key={index}
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
              onClick={() => window.open(item.link, '_blank')}
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
                {/* News Image */}
                <div style={{
                  width: '100%',
                  height: '310px',
                  backgroundColor: '#f3f4f6',
                  backgroundImage: `url(${item.thumbnail || FALLBACK_IMAGE})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}>
                  {/* Source Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '4px 12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: '400',
                  }}>
                    {item.source}
                  </div>
                </div>

                {/* News Details */}
                <div style={{ padding: '13px' }}>
                <div style={{
                  fontSize: '12px',
                  color: 'white',
                  marginBottom: '10px',
                  fontWeight: '400',
                }}>
                  {formatDate(item.pubDate)}
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
                    {item.title}
                  </h3>

                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '12px',
                    color: 'white',
                    fontWeight: '300',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {item.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}>
                    Read More <ExternalLink size={13} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

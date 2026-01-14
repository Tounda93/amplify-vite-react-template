import { useState, useEffect } from 'react';
import { NewsItem, RSS_FEEDS, fetchNewsFeedItems } from './utils/newsFeed';
import { useIsMobile } from './hooks/useIsMobile';
import './NewsSection.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

// Magazine carousel placeholder data (7 items)
const MAGAZINE_CARDS = [
  { id: 1, name: 'Magazine 1', price: '9,99€', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80' },
  { id: 2, name: 'Magazine 2', price: '9,99€', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80' },
  { id: 3, name: 'Magazine 3', price: '9,99€', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80' },
  { id: 4, name: 'Magazine 4', price: '9,99€', image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&q=80' },
  { id: 5, name: 'Magazine 5', price: '9,99€', image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80' },
  { id: 6, name: 'Magazine 6', price: '9,99€', image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&q=80' },
  { id: 7, name: 'Magazine 7', price: '9,99€', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&q=80' },
];

export function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';

  useEffect(() => {
    fetchAllNews();
  }, []);

  const fetchAllNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchNewsFeedItems();
      setNews(items);
    } catch (err) {
      setError('Unable to fetch news right now.');
    }
    setLoading(false);
  };

  // Filter by source only
  const filteredNews = news.filter(item => {
    const matchesSource = selectedSource === 'all' || item.source === selectedSource;
    return matchesSource;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleNewsClick = (item: NewsItem) => {
    window.open(item.link, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div style={{ width: '100%', backgroundColor: '#F2F3F5', padding: `2rem ${horizontalPadding}` }}>
        <div className="news-section__loading">
          <p>Loading news from car magazines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100%', backgroundColor: '#F2F3F5', padding: `2rem ${horizontalPadding}` }}>
        <div className="news-section__error">
          <p>{error}</p>
          <button onClick={fetchAllNews} className="news-section__retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', backgroundColor: '#F2F3F5', padding: `2rem ${horizontalPadding}` }}>
      {/* Magazine Carousel */}
      <div className="magazine-carousel-container" style={{
        position: 'relative',
        marginBottom: '2rem',
      }}>
        {/* Magazine Section Title */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#000',
          margin: '0 0 1rem 0',
          textAlign: 'left',
        }}>
          Get your favorite magazine delivered at home
        </h2>

        {/* Carousel */}
        <div
          className="magazine-carousel"
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
            padding: '0.5rem 0',
          }}
        >
          {MAGAZINE_CARDS.map((card) => (
            <div
              key={card.id}
              className="magazine-card-wrapper"
              style={{
                flexShrink: 0,
                width: 'calc((100% - 5rem) / 6)', // 6 cards with 5 gaps of 1rem (35% smaller)
                scrollSnapAlign: 'start',
              }}
            >
              <div
                className="magazine-card"
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1.414', // A4 ratio (width:height = 1:√2)
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: '#D9D9D9',
                  backgroundImage: `url(${card.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              />
              <div style={{ marginTop: '0.5rem', textAlign: 'left' }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#000',
                  margin: 0,
                }}>
                  {card.name}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  margin: '0.25rem 0 0 0',
                }}>
                  {card.price} per month
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Title Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#000',
          margin: 0
        }}>
          News
        </h2>
      </div>

      {/* Source Filter */}
      <div className="news-section__filters" style={{
        flexWrap: isMobile ? 'nowrap' : 'wrap',
        overflowX: isMobile ? 'auto' : undefined,
        paddingBottom: isMobile ? '0.25rem' : undefined
      }}>
        <button
          onClick={() => setSelectedSource('all')}
          className={`news-section__filter-btn ${selectedSource === 'all' ? 'news-section__filter-btn--active' : ''}`}
        >
          All Sources
        </button>
        {RSS_FEEDS.map(feed => (
          <button
            key={feed.name}
            onClick={() => setSelectedSource(feed.name)}
            className={`news-section__filter-btn ${selectedSource === feed.name ? 'news-section__filter-btn--active' : ''}`}
          >
            {feed.name}
          </button>
        ))}
      </div>

      {/* News Articles - Single column layout */}
      <div className="news-section__articles">
        {filteredNews.map((item, index) => (
          <article
            key={`${item.source}-${index}`}
            className="news-article"
            onClick={() => handleNewsClick(item)}
          >
            <div
              className="news-article__image"
              style={{
                backgroundImage: `url(${item.thumbnail || FALLBACK_IMAGE})`,
              }}
            />
            <div className="news-article__content">
              <span className="news-article__source">{item.source}</span>
              <h3 className="news-article__title">{item.title}</h3>
              <p className="news-article__description">{item.description}</p>
              <span className="news-article__date">{formatDate(item.pubDate)}</span>
            </div>
          </article>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="news-section__empty">
          <p>No news found from this source.</p>
        </div>
      )}
    </div>
  );
}

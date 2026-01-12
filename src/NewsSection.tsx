import { useState, useEffect, useRef } from 'react';
import { NewsItem, RSS_FEEDS, fetchNewsFeedItems } from './utils/newsFeed';
import { useIsMobile } from './hooks/useIsMobile';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Carousel scroll handlers
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.querySelector('.magazine-card')?.clientWidth || 200;
      const scrollAmount = cardWidth + 16; // card width + gap
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

  // Filter by source and search query
  const filteredNews = news.filter(item => {
    const matchesSource = selectedSource === 'all' || item.source === selectedSource;
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesSearch;
  });

  // Focus input when search expands
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const handleSearchToggle = () => {
    if (searchExpanded) {
      setSearchQuery('');
      setSearchExpanded(false);
    } else {
      setSearchExpanded(true);
    }
  };

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
      <div className="news-section">
        <div className="news-section__loading">
          <p>Loading news from car magazines...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-section">
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
    <div className="news-section">
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
          textAlign: 'center',
        }}>
          Get your favorite magazine delivered at home
        </h2>
        {/* Left Arrow */}
        {!isMobile && (
          <button
            onClick={() => scrollCarousel('left')}
            className="magazine-carousel__arrow magazine-carousel__arrow--left"
            style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid #000',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Carousel */}
        <div
          ref={carouselRef}
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
              <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
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

        {/* Right Arrow */}
        {!isMobile && (
          <button
            onClick={() => scrollCarousel('right')}
            className="magazine-carousel__arrow magazine-carousel__arrow--right"
            style={{
              position: 'absolute',
              right: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid #000',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
          >
            <ChevronRight size={20} />
          </button>
        )}
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
        <div style={{
          flex: 1,
          height: '1px',
          backgroundColor: '#000'
        }} />
        {/* Animated Search Bar */}
        <div
          className={`news-search ${searchExpanded ? 'news-search--expanded' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: searchExpanded ? 'flex-end' : 'center',
            borderRadius: '999px',
            border: '1px solid #000',
            backgroundColor: searchExpanded ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
            overflow: 'hidden',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease',
            width: searchExpanded ? (isMobile ? 200 : 300) : 40,
            minWidth: 40,
            height: 40,
            flexShrink: 0,
            cursor: searchExpanded ? 'default' : 'pointer',
          }}
          onClick={!searchExpanded ? handleSearchToggle : undefined}
        >
          {/* Centered search icon when collapsed */}
          {!searchExpanded && (
            <Search size={18} style={{ color: '#000' }} />
          )}
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news..."
            style={{
              flex: searchExpanded ? 1 : 0,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              padding: searchExpanded ? '0 0.75rem' : '0',
              fontSize: '14px',
              color: '#000',
              width: searchExpanded ? '100%' : 0,
              minWidth: 0,
              opacity: searchExpanded ? 1 : 0,
              transition: 'opacity 0.3s ease, flex 0.4s ease, width 0.4s ease, padding 0.4s ease',
              display: searchExpanded ? 'block' : 'none',
            }}
          />
          {/* Close button - only visible when expanded */}
          {searchExpanded && (
            <button
              onClick={handleSearchToggle}
              style={{
                width: 40,
                height: 40,
                minWidth: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                backgroundColor: '#000',
                color: '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease, color 0.3s ease',
                flexShrink: 0,
                borderRadius: '50%',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
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

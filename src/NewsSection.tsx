import { useState, useEffect } from 'react';
import { NewsItem, RSS_FEEDS, fetchNewsFeedItems } from './utils/newsFeed';
import { useIsMobile } from './hooks/useIsMobile';
import { Card } from './components/Card';
import './NewsSection.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

export function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const isMobile = useIsMobile();

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

  const filteredNews = selectedSource === 'all'
    ? news
    : news.filter(item => item.source === selectedSource);

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

      {/* News Grid - 5 columns with 13px spacing */}
      <div className="news-section__grid">
        {filteredNews.map((item, index) => (
          <Card
            key={`${item.source}-${index}`}
            imageUrl={item.thumbnail || FALLBACK_IMAGE}
            title1={item.source}
            title2={item.title}
            separatorText={formatDate(item.pubDate)}
            onClick={() => handleNewsClick(item)}
          />
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

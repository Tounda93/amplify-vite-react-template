import { useState, useEffect } from 'react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
  source: string;
}

// RSS feeds from car magazines
const RSS_FEEDS = [
  { name: 'Top Gear', url: 'https://www.topgear.com/car-news/rss' },
  { name: 'Classic Driver', url: 'https://www.classicdriver.com/en/rss.xml' },
  { name: 'Motor1', url: 'https://www.motor1.com/rss/news/all/' },
  { name: 'Car and Driver', url: 'https://www.caranddriver.com/rss/all.xml/' },
];

// We use rss2json.com API to convert RSS to JSON (handles CORS)
const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

export function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('all');

  useEffect(() => {
    fetchAllNews();
  }, []);

  const fetchAllNews = async () => {
    setLoading(true);
    setError(null);
    const allNews: NewsItem[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        const response = await fetch(`${RSS_API}${encodeURIComponent(feed.url)}`);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
          const items = data.items.map((item: any) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            description: item.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            thumbnail: item.thumbnail || item.enclosure?.link,
            source: feed.name,
          }));
          allNews.push(...items);
        }
      } catch (err) {
        console.error(`Error fetching ${feed.name}:`, err);
      }
    }

    // Sort by date (newest first)
    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    setNews(allNews);
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Loading news from car magazines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#e74c3c' }}>
        <p>{error}</p>
        <button onClick={fetchAllNews} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Source Filter */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelectedSource('all')}
          style={{
            padding: '0.5rem 1rem',
            background: selectedSource === 'all' ? '#e74c3c' : '#ecf0f1',
            color: selectedSource === 'all' ? 'white' : 'black',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
          }}
        >
          All Sources
        </button>
        {RSS_FEEDS.map(feed => (
          <button
            key={feed.name}
            onClick={() => setSelectedSource(feed.name)}
            style={{
              padding: '0.5rem 1rem',
              background: selectedSource === feed.name ? '#e74c3c' : '#ecf0f1',
              color: selectedSource === feed.name ? 'white' : 'black',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
            }}
          >
            {feed.name}
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div style={{ 
        display: 'grid', 
        gap: '1.5rem', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' 
      }}>
        {filteredNews.slice(0, 20).map((item, index) => (
          <a
            key={index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #ddd',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {item.thumbnail && (
              <div style={{ 
                height: '160px', 
                overflow: 'hidden',
                background: '#f0f0f0'
              }}>
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div style={{ padding: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.5rem',
                fontSize: '0.8rem',
                color: '#666'
              }}>
                <span style={{ 
                  background: '#e74c3c', 
                  color: 'white', 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}>
                  {item.source}
                </span>
                <span>{formatDate(item.pubDate)}</span>
              </div>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1rem',
                lineHeight: '1.4'
              }}>
                {item.title}
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '0.85rem', 
                color: '#666',
                lineHeight: '1.5'
              }}>
                {item.description}
              </p>
            </div>
          </a>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666' }}>
          No news found from this source.
        </p>
      )}
    </div>
  );
}
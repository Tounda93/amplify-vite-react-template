import { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { fetchNewsFeedItems, type NewsItem } from '../utils/newsFeed';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80';

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
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '0 5rem 10px 5rem',
          marginLeft: '-5rem',
          marginRight: '-5rem'
        }}
      >
        {news.map((item, index) => (
          <div
            key={index}
            style={{
              minWidth: '320px',
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => window.open(item.link, '_blank')}
          >
            {/* News Image */}
            <div style={{
              width: '100%',
              height: '180px',
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
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
              }}>
                {item.source}
              </div>
            </div>

            {/* News Details */}
            <div style={{ padding: '16px' }}>
              <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                marginBottom: '8px',
                fontWeight: '600',
              }}>
                {formatDate(item.pubDate)}
              </div>

              <h3 style={{
                margin: '0 0 10px 0',
                fontSize: '15px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1.4',
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
                fontSize: '13px',
                color: '#6b7280',
                lineHeight: '1.5',
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
                color: '#3498db',
                fontSize: '13px',
                fontWeight: '600',
              }}>
                Read More <ExternalLink size={13} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

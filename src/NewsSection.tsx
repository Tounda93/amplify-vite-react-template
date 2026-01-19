import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { NewsItem, RSS_FEEDS } from './utils/newsFeed';
import { useIsMobile } from './hooks/useIsMobile';
import { openExternalUrl } from './utils/url';
import { FALLBACKS } from './utils/fallbacks';
import { useFetchNews } from './hooks/useFetchNews';
import { getImageUrl } from './utils/storageHelpers';
import './NewsSection.css';

const client = generateClient<Schema>();

type Magazine = Schema['Magazine']['type'];
type MagazineWithImage = Magazine & { imageUrl?: string };

export function NewsSection() {
  const { items: news, loading, error, refresh } = useFetchNews();
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [magazines, setMagazines] = useState<MagazineWithImage[]>([]);
  const [magazinesLoading, setMagazinesLoading] = useState(true);
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';

  useEffect(() => {
    const loadMagazines = async () => {
      setMagazinesLoading(true);
      try {
        const { data } = await client.models.Magazine.list({ limit: 100 });
        const sorted = (data || [])
          .filter((magazine) => magazine.isActive !== false)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const withImages = await Promise.all(
          sorted.map(async (magazine) => {
            const imageUrl = magazine.coverImage
              ? await getImageUrl(magazine.coverImage)
              : magazine.coverImageUrl || undefined;
            return { ...magazine, imageUrl: imageUrl ?? undefined };
          })
        );
        setMagazines(withImages);
      } catch (err) {
        console.error('Failed to load magazines', err);
        setMagazines([]);
      }
      setMagazinesLoading(false);
    };

    loadMagazines();
  }, []);

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

  const formatPriceInterval = (value?: string | null) => {
    switch (value) {
      case 'one_time':
        return 'one-time';
      case 'monthly':
        return 'monthly';
      case 'yearly':
        return 'yearly';
      case 'month':
        return 'monthly';
      case 'year':
        return 'yearly';
      default:
        return value || '';
    }
  };

  const handleNewsClick = (item: NewsItem) => {
    openExternalUrl(item.link);
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
          <p>Unable to fetch news right now.</p>
          <button onClick={refresh} className="news-section__retry-btn">
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
        {!magazinesLoading && magazines.length === 0 ? (
          <div className="news-section__empty">
            <p>No magazines available yet.</p>
          </div>
        ) : (
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
            {magazines.map((magazine) => {
              const priceLabel = magazine.price !== null && magazine.price !== undefined
                ? `${magazine.price}`
                : '--';
              const intervalLabel = formatPriceInterval(magazine.priceInterval);
              return (
                <div
                  key={magazine.id}
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
                      cursor: magazine.websiteUrl ? 'pointer' : 'default',
                      backgroundColor: '#D9D9D9',
                      backgroundImage: magazine.imageUrl ? `url(${magazine.imageUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onClick={() => {
                      if (magazine.websiteUrl) openExternalUrl(magazine.websiteUrl);
                    }}
                  />
                  <div style={{ marginTop: '0.5rem', textAlign: 'left' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#000',
                      margin: 0,
                    }}>
                      {magazine.name}
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: '#666',
                      margin: '0.25rem 0 0 0',
                    }}>
                      {intervalLabel ? `${priceLabel} per ${intervalLabel}` : priceLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
                backgroundImage: `url(${item.thumbnail || FALLBACKS.news})`,
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

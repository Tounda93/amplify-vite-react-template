import { useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card } from './Card';
import { useIsMobile } from '../hooks/useIsMobile';
import { NewsItem, fetchNewsFeedItems } from '../utils/newsFeed';
import './HomePage.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];
type WikiCarEntry = Schema['WikiCarEntry']['type'];

// Unified card item type for the feed
interface FeedItem {
  id: string;
  type: 'event' | 'wikicar' | 'news' | 'auction';
  imageUrl: string;
  title1: string;
  title2: string;
  separatorText?: string;
  requirement?: string;
  url?: string;
  data?: Event | WikiCarEntry | NewsItem;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';
const ITEMS_PER_PAGE = 10;

export default function HomePage() {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Setup infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, page]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Fetch news items first and store them
      const news = await fetchNewsFeedItems();
      setNewsItems(news);

      const items = await fetchFeedItems(0, news);
      setFeedItems(items);
      setHasMore(items.length >= ITEMS_PER_PAGE);
      setPage(1);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
    setLoading(false);
  };

  const loadMoreItems = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const newItems = await fetchFeedItems(page, newsItems);
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setFeedItems((prev) => [...prev, ...newItems]);
        setHasMore(newItems.length >= ITEMS_PER_PAGE);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more items:', error);
    }
    setLoadingMore(false);
  }, [page, loadingMore, hasMore, newsItems]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const fetchFeedItems = async (pageNum: number, news: NewsItem[]): Promise<FeedItem[]> => {
    const items: FeedItem[] = [];

    // Fetch events
    const { data: events } = await client.models.Event.list({
      limit: ITEMS_PER_PAGE,
    });

    // Fetch wiki car entries
    const { data: wikiCars } = await client.models.WikiCarEntry.list({
      limit: ITEMS_PER_PAGE,
    });

    // Transform events to feed items
    (events || []).forEach((event) => {
      items.push({
        id: `event-${event.id}`,
        type: 'event',
        imageUrl: event.coverImage || FALLBACK_IMAGE,
        title1: event.eventType?.replace('_', ' ').toUpperCase() || 'EVENT',
        title2: event.title || 'Untitled Event',
        separatorText: event.city && event.country ? `${event.city}, ${event.country}` : undefined,
        requirement: event.price || undefined,
        data: event,
      });
    });

    // Transform wiki cars to feed items
    (wikiCars || []).forEach((car) => {
      items.push({
        id: `wikicar-${car.id}`,
        type: 'wikicar',
        imageUrl: car.heroImageUrl || FALLBACK_IMAGE,
        title1: car.brandName || 'CAR',
        title2: car.makeName || 'Untitled',
        separatorText: car.production || undefined,
        requirement: undefined,
        data: car,
      });
    });

    // Transform news to feed items
    news.forEach((newsItem, index) => {
      items.push({
        id: `news-${index}-${newsItem.link}`,
        type: 'news',
        imageUrl: newsItem.thumbnail || FALLBACK_IMAGE,
        title1: newsItem.source,
        title2: newsItem.title,
        separatorText: formatDate(newsItem.pubDate),
        requirement: undefined,
        url: newsItem.link,
        data: newsItem,
      });
    });

    // Shuffle items for variety (in production, you'd want proper pagination)
    const shuffled = items.sort(() => Math.random() - 0.5);

    // Simulate pagination by slicing
    const start = pageNum * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    return shuffled.slice(start, end);
  };

  const handleCardClick = (item: FeedItem) => {
    if (item.type === 'news' && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else {
      // TODO: Navigate to detail page or open popup based on item type
      console.log('Card clicked:', item);
    }
  };

  if (loading) {
    return (
      <div className="home-page" style={{ padding: horizontalPadding }}>
        <div className="home-page__loading">
          <p>Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page" style={{ width: '100%', overflowX: 'hidden' }}>
      <div
        className="home-page__content"
        style={{ padding: `2rem ${horizontalPadding}` }}
      >
        {/* Card Grid */}
        <div className="home-page__grid">
          {feedItems.map((item) => (
            <Card
              key={item.id}
              imageUrl={item.imageUrl}
              title1={item.title1}
              title2={item.title2}
              separatorText={item.separatorText}
              requirement={item.requirement}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="home-page__load-more">
          {loadingMore && <p>Loading more...</p>}
          {!hasMore && feedItems.length > 0 && (
            <p className="home-page__end-message">You've reached the end</p>
          )}
        </div>

        {feedItems.length === 0 && !loading && (
          <div className="home-page__empty">
            <p>No content available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

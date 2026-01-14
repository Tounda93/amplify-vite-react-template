import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useIsMobile } from '../hooks/useIsMobile';
import { NewsItem, fetchNewsFeedItems } from '../utils/newsFeed';
import { getImageUrl } from '../utils/storageHelpers';
import { Card } from './Card';
import './HomePage.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

// Feed item types for the unified feed
type FeedItem =
  | { type: 'event'; data: EventWithImageUrl }
  | { type: 'news'; data: NewsItem }
  | { type: 'room'; data: { id: string; name: string } };

export default function HomePage() {
  const isMobile = useIsMobile();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Fetch news items
      const news = await fetchNewsFeedItems();

      // Fetch upcoming events (up to 7, sorted by date)
      const { data: events } = await client.models.Event.list({
        limit: 20,
      });
      // Sort by startDate and filter for future events
      const now = new Date();
      const upcoming = (events || [])
        .filter((e) => e.startDate && new Date(e.startDate) >= now)
        .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())
        .slice(0, 7);

      // Load image URLs for events
      const eventsWithUrls = await Promise.all(
        upcoming.map(async (event) => {
          const imageUrl = await getImageUrl(event.coverImage);
          return { ...event, imageUrl: imageUrl || FALLBACK_IMAGE };
        })
      );

      // Combine into a unified feed - interleave events and news
      const combinedFeed: FeedItem[] = [];
      const maxItems = Math.max(eventsWithUrls.length, news.length);

      for (let i = 0; i < maxItems; i++) {
        if (i < eventsWithUrls.length) {
          combinedFeed.push({ type: 'event', data: eventsWithUrls[i] });
        }
        if (i < news.length) {
          combinedFeed.push({ type: 'news', data: news[i] });
        }
      }

      setFeedItems(combinedFeed);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="home-page" style={{ padding: isMobile ? '1rem' : '2rem 5rem' }}>
        <div className="home-page__loading">
          <p>Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page" style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Social Media Style Feed */}
      <div className="home-feed" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isMobile ? '1rem' : '2rem 5rem',
        gap: '1.5rem',
        maxWidth: '960px',
        margin: '0 auto',
      }}>
        {/* Feed Cards - Stacked vertically */}
        {feedItems.length > 0 ? (
          feedItems.map((item, index) => {
            if (item.type === 'event') {
              const event = item.data;
              return (
                <Card
                  key={`event-${event.id}-${index}`}
                  imageUrl={event.imageUrl || FALLBACK_IMAGE}
                  category="EVENT"
                  authorName={event.venue || 'Event Organizer'}
                  description={event.title || 'Untitled Event'}
                  variant="wide"
                />
              );
            }

            if (item.type === 'news') {
              const newsItem = item.data;
              return (
                <Card
                  key={`news-${index}`}
                  imageUrl={newsItem.thumbnail || FALLBACK_IMAGE}
                  category="NEWS"
                  authorName={newsItem.source}
                  description={newsItem.title}
                  onClick={() => window.open(newsItem.link, '_blank', 'noopener,noreferrer')}
                  variant="wide"
                />
              );
            }

            return null;
          })
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No content available yet. Check back soon!
          </p>
        )}

        {/* Rooms Section - Create your room CTA */}
        <div style={{
          width: '100%',
          marginTop: '1rem',
          padding: '2rem',
          borderRadius: '5px',
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          border: '1px dashed rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#000',
            margin: '0 0 0.5rem 0',
          }}>
            Create Your Room
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '0 0 1rem 0',
          }}>
            Start a community discussion about your favorite cars
          </p>
          <button
            onClick={() => console.log('Create room clicked')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              border: '1px solid #000',
              backgroundColor: 'transparent',
              color: '#000',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#000';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#000';
            }}
          >
            Create your room
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card } from './Card';
import { useIsMobile } from '../hooks/useIsMobile';
import { NewsItem, fetchNewsFeedItems } from '../utils/newsFeed';
import { getImageUrl } from '../utils/storageHelpers';
import HeroCarousel from './HeroCarousel';
import CreateEventPopup from './CreateEventPopup';
import './HomePage.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

export default function HomePage() {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';

  const [upcomingEvents, setUpcomingEvents] = useState<EventWithImageUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [showCreateEventPopup, setShowCreateEventPopup] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Fetch news items
      const news = await fetchNewsFeedItems();
      setNewsItems(news);

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

      setUpcomingEvents(eventsWithUrls);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
    setLoading(false);
  };

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
      <div className="home-page" style={{ padding: horizontalPadding }}>
        <div className="home-page__loading">
          <p>Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page" style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Hero Section with Image/Video */}
      <HeroCarousel />

      {/* Upcoming Events Section */}
      <div style={{ padding: `2rem ${horizontalPadding}` }}>
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
            Upcoming Events
          </h2>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: '#000'
          }} />
          <button
            onClick={() => setShowCreateEventPopup(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              border: '1px solid #000',
              backgroundColor: 'transparent',
              color: '#000',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
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
            Create your event
          </button>
        </div>
        {upcomingEvents.length > 0 ? (
          <div
            className="home-page__events-scroll"
            style={{
              display: 'flex',
              gap: '0.8125rem',
              overflowX: 'auto',
              paddingBottom: '1rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {upcomingEvents.map((event) => (
              <Card
                key={event.id}
                imageUrl={event.imageUrl || FALLBACK_IMAGE}
                title1={event.eventType?.replace('_', ' ').toUpperCase() || 'EVENT'}
                title2={event.title || 'Untitled Event'}
                separatorText={event.city && event.country ? `${event.city}, ${event.country}` : undefined}
                requirement={event.price || undefined}
                onClick={() => console.log('Event clicked:', event)}
                variant="wide"
              />
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>No upcoming events. Create one!</p>
        )}
      </div>

      {/* Rooms Section */}
      <div style={{ padding: `2rem ${horizontalPadding}` }}>
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
            Rooms
          </h2>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: '#000'
          }} />
          <button
            onClick={() => console.log('Create room clicked')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              border: '1px solid #000',
              backgroundColor: 'transparent',
              color: '#000',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
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
        <p style={{ color: '#666' }}>No rooms available. Create one!</p>
      </div>

      {/* News Section */}
      {newsItems.length > 0 && (
        <div style={{ padding: `2rem ${horizontalPadding}` }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#000',
            margin: '0 0 1rem 0'
          }}>
            Latest news
          </h2>
          <div
            className="home-page__news-scroll"
            style={{
              display: 'flex',
              gap: '0.8125rem',
              overflowX: 'auto',
              paddingBottom: '1rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {newsItems.slice(0, 9).map((newsItem, index) => (
              <Card
                key={`news-row-${index}`}
                imageUrl={newsItem.thumbnail || FALLBACK_IMAGE}
                title1={newsItem.source}
                title2={newsItem.title}
                separatorText={formatDate(newsItem.pubDate)}
                onClick={() => window.open(newsItem.link, '_blank', 'noopener,noreferrer')}
                variant="wide"
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Event Popup */}
      <CreateEventPopup
        isOpen={showCreateEventPopup}
        onClose={() => setShowCreateEventPopup(false)}
        onEventCreated={loadInitialData}
      />
    </div>
  );
}

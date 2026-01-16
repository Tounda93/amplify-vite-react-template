import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useIsMobile } from '../hooks/useIsMobile';
import { NewsItem, fetchNewsFeedItems } from '../utils/newsFeed';
import { getImageUrl } from '../utils/storageHelpers';
import { NewsCard } from './Card';
import ForSaleCard from './Card/ForSaleCard';
import EventCard from './Card/EventCard';
import EventDetailPopup from './EventDetailPopup';
import RoomsCard from './Card/RoomsCard';
import './HomePage.css';

const client = generateClient<Schema>();

type Car = Schema['Car']['type'];
type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];
type CarWithImageUrl = Car & { imageUrl?: string; makeName?: string; modelName?: string };
type Event = Schema['Event']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

// Feed item types for the unified feed
type FeedItem =
  | { type: 'event'; data: EventWithImageUrl }
  | { type: 'news'; data: NewsItem }
  | { type: 'car'; data: CarWithImageUrl }
  | { type: 'room'; data: { id: string; name: string; excerpt: string; members: number } };

const FEATURED_ROOMS = [
  {
    id: 'lotus-owners-meet',
    name: 'Lotus Owners Meet 2024',
    excerpt: 'Share itineraries, road books, and favorite routes for Lotus gatherings.',
    members: 128,
  },
  {
    id: 'lightweight-track-tools',
    name: 'Lightweight Track Tools & Lotus Elise builds',
    excerpt: 'Compare suspension setups and lap times for Elise and Exige owners.',
    members: 86,
  },
  {
    id: 'british-icons',
    name: 'British Icons Appreciation Thread',
    excerpt: 'Celebrating Lotus, Aston Martin, and all things brilliantly British.',
    members: 204,
  },
];

export default function HomePage() {
  const isMobile = useIsMobile();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Fetch news items
      const news = await fetchNewsFeedItems();

      // Fetch published events (up to 7, sorted by date)
      const { data: events } = await client.models.Event.list({
        limit: 20,
      });
      const publishedEvents = (events || [])
        .filter((e) => e.isPublished !== false && e.startDate)
        .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())
        .slice(0, 7);

      const eventsWithUrls: EventWithImageUrl[] = await Promise.all(
        publishedEvents.map(async (event) => {
          const imageUrl = await getImageUrl(event.coverImage);
          return { ...event, imageUrl: imageUrl || FALLBACK_IMAGE };
        })
      );

      const [{ data: cars }, { data: makes }, { data: models }] = await Promise.all([
        client.models.Car.list({
          limit: 12,
          filter: { saleStatus: { eq: 'for_sale' } },
        }),
        client.models.Make.list({ limit: 500 }),
        client.models.Model.list({ limit: 1000 }),
      ]);

      const makesMap = new Map<string, string>();
      const modelsMap = new Map<string, string>();
      (makes || []).forEach((make: Make) => {
        makesMap.set(make.makeId, make.makeName);
      });
      (models || []).forEach((model: Model) => {
        modelsMap.set(model.modelId, model.modelName);
      });

      const carsWithUrls: CarWithImageUrl[] = await Promise.all(
        (cars || []).map(async (car) => {
          const photo = car.photos?.[0];
          const imageUrl = await getImageUrl(photo);
          return {
            ...car,
            imageUrl: imageUrl || FALLBACK_IMAGE,
            makeName: makesMap.get(car.makeId) || car.makeId,
            modelName: modelsMap.get(car.modelId) || car.modelId,
          };
        })
      );

      // Combine into a unified feed - interleave events and news
      const combinedFeed: FeedItem[] = [];
      const maxItems = Math.max(news.length, carsWithUrls.length, FEATURED_ROOMS.length, eventsWithUrls.length);

      for (let i = 0; i < maxItems; i++) {
        if (i < eventsWithUrls.length) {
          combinedFeed.push({ type: 'event', data: eventsWithUrls[i] });
        }
        if (i < news.length) {
          combinedFeed.push({ type: 'news', data: news[i] });
        }
        if (i < carsWithUrls.length) {
          combinedFeed.push({ type: 'car', data: carsWithUrls[i] });
        }
        if (i < FEATURED_ROOMS.length) {
          combinedFeed.push({ type: 'room', data: FEATURED_ROOMS[i] });
        }
      }

      setFeedItems(combinedFeed);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return 'Date TBA';
    }
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatLocation = (event: Event) => {
    const parts = [event.venue, event.city, event.region, event.country].filter(Boolean);
    return parts.join(', ') || 'Location TBA';
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
                <EventCard
                  key={`event-${event.id}-${index}`}
                  imageUrl={event.imageUrl || FALLBACK_IMAGE}
                  imageAlt={event.title || 'Event cover'}
                  imageHeight={400}
                  dateLabel={formatDate(event.startDate)}
                  title={event.title || 'Untitled Event'}
                  locationLabel={formatLocation(event)}
                  participantCount={event.participantCount ?? 0}
                  showMenu={false}
                  onClick={() => setSelectedEvent(event)}
                />
              );
            }

            if (item.type === 'news') {
              const newsItem = item.data;
              return (
                <NewsCard
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

            if (item.type === 'car') {
              const car = item.data;
              const detailParts = [
                car.mileage ? `${car.mileage.toLocaleString('en-US')} ${car.mileageUnit || 'km'}` : null,
                car.transmission ? car.transmission.replace('_', ' ') : null,
                car.color || null,
              ].filter(Boolean) as string[];
              const priceLabel = car.price ? `€${car.price.toLocaleString('en-US')}` : 'Price on request';
              return (
                <ForSaleCard
                  key={`car-${car.id}-${index}`}
                  imageUrl={car.imageUrl || FALLBACK_IMAGE}
                  title={`${car.year || ''} ${car.makeName || ''} ${car.modelName || ''}`.trim()}
                  priceLabel={priceLabel}
                  detailLine={detailParts.join(' • ')}
                />
              );
            }

            if (item.type === 'room') {
              const room = item.data;
              return (
                <RoomsCard
                  key={`room-${room.id}-${index}`}
                  title={room.name}
                  description={room.excerpt}
                  memberCount={room.members}
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

      <EventDetailPopup
        event={selectedEvent}
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

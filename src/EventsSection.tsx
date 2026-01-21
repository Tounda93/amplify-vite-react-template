import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { getImageUrl } from './utils/storageHelpers';
import EventDetailPopup from './components/EventDetailPopup';
import { FALLBACKS } from './utils/fallbacks';
import EventsMapPage from './components/EventsMapPage';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };

interface EventsSectionProps {
  onSaveEvent: (event: Event) => void;
}

export function EventsSection({ onSaveEvent }: EventsSectionProps) {
  const [allEvents, setAllEvents] = useState<EventWithImageUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();

    const subscription = client.models.Event.observeQuery().subscribe({
      next: ({ items }) => {
        console.log('Events subscription received:', items.length, 'items');
        const published = items.filter(e => e.isPublished !== false);
        processEvents(published);
        setLoading(false);
      },
      error: (err) => {
        console.error('Events subscription error:', err);
        setLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, errors } = await client.models.Event.list({ limit: 500 });
      if (errors) {
        console.error('Error loading events:', errors);
      }
      console.log('Loaded events:', data?.length || 0, 'items');
      const published = (data || []).filter(e => e.isPublished !== false);
      console.log('Published events:', published.length);
      processEvents(published);
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const processEvents = async (events: Event[]) => {
    // Sort by startDate (soonest first)
    const sorted = [...events].sort((a, b) => {
      const aVisibility = a.visibility === 'members' ? 1 : 0;
      const bVisibility = b.visibility === 'members' ? 1 : 0;
      if (aVisibility !== bVisibility) {
        return aVisibility - bVisibility;
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    const eventsWithUrls = await Promise.all(
      sorted.map(async (event) => {
        if (event.coverImage) {
          const imageUrl = await getImageUrl(event.coverImage);
          return { ...event, imageUrl: imageUrl || FALLBACKS.event };
        }
        return { ...event, imageUrl: FALLBACKS.event };
      })
    );

    setAllEvents(eventsWithUrls);
  };

  if (loading) {
    return (
      <div className="events-map-page">
        <div className="events-map-page__empty">
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <EventsMapPage
        events={allEvents}
        onOpenDetails={setSelectedEvent}
        onSaveEvent={onSaveEvent}
      />

      <EventDetailPopup
        event={selectedEvent}
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import type { Schema } from '../../amplify/data/resource';
import EventCard from './Card/EventCard';
import { FALLBACKS } from '../utils/fallbacks';
import { useIsMobile } from '../hooks/useIsMobile';
import 'mapbox-gl/dist/mapbox-gl.css';
import './EventsMapPage.css';

type Event = Schema['Event']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };

type VisibilityFilter = 'all' | 'public' | 'members';

interface EventsMapPageProps {
  events: EventWithImageUrl[];
  onOpenDetails: (event: Event) => void;
  onSaveEvent: (event: Event) => void;
}

type MapViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
};

const DEFAULT_VIEW: MapViewState = {
  latitude: 20,
  longitude: 0,
  zoom: 1.4,
  bearing: 0,
  pitch: 0,
};

export default function EventsMapPage({ events, onOpenDetails, onSaveEvent }: EventsMapPageProps) {
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = useState<EventWithImageUrl | null>(null);
  const [filter, setFilter] = useState<VisibilityFilter>('all');

  const mappableEvents = useMemo(
    () => events.filter((event) => typeof event.latitude === 'number' && typeof event.longitude === 'number'),
    [events]
  );

  const filteredEvents = useMemo(() => {
    if (filter === 'all') {
      return mappableEvents;
    }
    return mappableEvents.filter((event) => event.visibility === filter);
  }, [mappableEvents, filter]);

  const initialView = useMemo(() => {
    if (mappableEvents.length === 0) {
      return DEFAULT_VIEW;
    }
    const latSum = mappableEvents.reduce((sum, event) => sum + (event.latitude ?? 0), 0);
    const lngSum = mappableEvents.reduce((sum, event) => sum + (event.longitude ?? 0), 0);
    return {
      ...DEFAULT_VIEW,
      latitude: latSum / mappableEvents.length,
      longitude: lngSum / mappableEvents.length,
      zoom: Math.max(DEFAULT_VIEW.zoom, 2),
    };
  }, [mappableEvents]);

  const [viewState, setViewState] = useState<MapViewState>(initialView);

  useEffect(() => {
    setViewState(initialView);
  }, [initialView]);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

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
    if (event.locationLabel) {
      return event.locationLabel;
    }
    const parts = [event.venue, event.city, event.region, event.country].filter(Boolean);
    return parts.join(', ') || 'Location TBA';
  };

  return (
    <div className="events-map-page">
      <div className="events-map-page__map">
        {mapboxToken ? (
          <Map
            mapboxAccessToken={mapboxToken}
            mapStyle="mapbox://styles/mapbox/light-v11"
            initialViewState={initialView}
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState as MapViewState)}
            onClick={() => setSelectedEvent(null)}
            reuseMaps
            attributionControl={false}
          >
            {/* TODO: add clustering when marker volume grows. */}
            {filteredEvents.map((event) => (
              <Marker
                key={event.id}
                latitude={event.latitude as number}
                longitude={event.longitude as number}
                anchor="center"
                onClick={(evt) => {
                  evt.originalEvent.stopPropagation();
                  setSelectedEvent(event);
                }}
              >
                <button
                  type="button"
                  className={`events-map-page__marker${selectedEvent?.id === event.id ? ' events-map-page__marker--active' : ''}`}
                  aria-label={event.title || 'Event marker'}
                >
                  <svg viewBox="0 0 12 12" aria-hidden="true">
                    <circle cx="6" cy="6" r="4" />
                  </svg>
                </button>
              </Marker>
            ))}
          </Map>
        ) : (
          <div className="events-map-page__empty">
            <p>Add `VITE_MAPBOX_TOKEN` to your env to enable the Events map.</p>
          </div>
        )}
      </div>

      <div className="events-map-page__ui">
        <div className="events-map-page__panel">
          <div className="events-map-page__panel-header">
            <h2>All Events</h2>
            <div className="events-map-page__filters">
              {(['all', 'public', 'members'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`events-map-page__filter${filter === value ? ' events-map-page__filter--active' : ''}`}
                  onClick={() => setFilter(value)}
                >
                  {value === 'all' ? 'All' : value === 'public' ? 'Public' : 'Members'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedEvent && (
          <div className={`events-map-page__preview${isMobile ? ' events-map-page__preview--mobile' : ''}`}>
            <EventCard
              imageUrl={selectedEvent.imageUrl || FALLBACKS.event}
              imageAlt={selectedEvent.title || 'Event cover'}
              imageHeight={160}
              dateLabel={formatDate(selectedEvent.startDate)}
              title={selectedEvent.title || 'Event'}
              locationLabel={formatLocation(selectedEvent)}
              participantCount={selectedEvent.participantCount ?? 0}
              showMenu={false}
            />
            <div className="events-map-page__preview-actions">
              <button type="button" onClick={() => onOpenDetails(selectedEvent)}>
                View details
              </button>
              <button type="button" onClick={() => onSaveEvent(selectedEvent)}>
                Save event
              </button>
            </div>
          </div>
        )}

        {filteredEvents.length === 0 && mapboxToken && (
          <div className="events-map-page__empty">
            <p>No events match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

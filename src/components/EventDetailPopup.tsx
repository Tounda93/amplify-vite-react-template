import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Globe, Ticket, DollarSign, Users, Car, ChevronDown } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';
import { FALLBACKS } from '../utils/fallbacks';
import type { CalendarEventInput } from '../utils/calendar';
import AddToCalendarButton from './AddToCalendarButton';

// Helper to check if a string is a storage path
const isStoragePath = (str: string) => str.startsWith('car-photos/') || str.startsWith('event-photos/');

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];
type Car = Schema['Car']['type'];
type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];

interface EventDetailPopupProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailPopup({ event, isOpen, onClose }: EventDetailPopupProps) {
  const [showJoinSection, setShowJoinSection] = useState(false);
  const [userCars, setUserCars] = useState<Car[]>([]);
  const [makes, setMakes] = useState<Map<string, Make>>(new Map());
  const [models, setModels] = useState<Map<string, Model>>(new Map());
  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  // Load cover image URL from storage path
  useEffect(() => {
    const loadCoverImage = async () => {
      if (!event?.coverImage) {
        setCoverImageUrl(null);
        return;
      }

      // If it's already a URL (legacy data), use it directly
      if (!isStoragePath(event.coverImage)) {
        setCoverImageUrl(event.coverImage);
        return;
      }

      // Otherwise, get the URL from the storage path
      try {
        const result = await getUrl({ path: event.coverImage });
        setCoverImageUrl(result.url.toString());
      } catch (error) {
        console.error('Error loading cover image:', error);
        setCoverImageUrl(null);
      }
    };

    if (isOpen && event) {
      loadCoverImage();
    }
  }, [isOpen, event?.coverImage]);

  useEffect(() => {
    if (isOpen && event) {
      loadUserData();
      setParticipantCount(event.participantCount || 0);
    }
  }, [isOpen, event]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when popup closes
      setShowJoinSection(false);
      setSelectedCarId('');
      setAlreadyJoined(false);
    }
  }, [isOpen]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get current user ID
      const session = await fetchAuthSession();
      const currentUserId = session.tokens?.idToken?.payload?.sub as string;
      setUserId(currentUserId);

      if (!currentUserId || !event) return;

      // Check if user already joined this event
      const { data: existingParticipants } = await client.models.EventParticipant.list({
        filter: {
          eventId: { eq: event.id },
          oderId: { eq: currentUserId }
        }
      });

      if (existingParticipants && existingParticipants.length > 0) {
        setAlreadyJoined(true);
      }

      // Load user's cars
      const { data: cars } = await client.models.Car.list({
        filter: { ownerId: { eq: currentUserId } }
      });

      if (cars && cars.length > 0) {
        setUserCars(cars);

        // Load makes and models for the cars
        const makeIds = [...new Set(cars.map(c => c.makeId))];
        const modelIds = [...new Set(cars.map(c => c.modelId))];

        const [makesData, modelsData] = await Promise.all([
          Promise.all(makeIds.map(id => client.models.Make.get({ makeId: id }))),
          Promise.all(modelIds.map(id => client.models.Model.get({ modelId: id })))
        ]);

        const makesMap = new Map<string, Make>();
        makesData.forEach(result => {
          if (result.data) makesMap.set(result.data.makeId, result.data);
        });
        setMakes(makesMap);

        const modelsMap = new Map<string, Model>();
        modelsData.forEach(result => {
          if (result.data) modelsMap.set(result.data.modelId, result.data);
        });
        setModels(modelsMap);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCarDisplayName = (car: Car) => {
    const make = makes.get(car.makeId);
    const model = models.get(car.modelId);
    const makeName = make?.makeName || 'Unknown';
    const modelName = model?.modelName || 'Unknown';
    return `${car.year} ${makeName} ${modelName}`;
  };

  const handleJoinEvent = async () => {
    if (!event || !selectedCarId || !userId) return;

    const selectedCar = userCars.find(c => c.id === selectedCarId);
    if (!selectedCar) return;

    try {
      setJoining(true);

      const make = makes.get(selectedCar.makeId);
      const model = models.get(selectedCar.modelId);

      // Create participant record
      await client.models.EventParticipant.create({
        eventId: event.id,
        oderId: userId,
        carId: selectedCar.id,
        carMake: make?.makeName || 'Unknown',
        carModel: model?.modelName || 'Unknown',
        carYear: selectedCar.year,
        registeredAt: new Date().toISOString(),
      });

      // Update participant count on event
      const newCount = (event.participantCount || 0) + 1;
      await client.models.Event.update({
        id: event.id,
        participantCount: newCount,
      });

      setParticipantCount(newCount);
      setAlreadyJoined(true);
      setShowJoinSection(false);
      alert('You have successfully joined this event!');
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Failed to join event. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (!isOpen || !event) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Date TBD';
    }
    const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${datePart} – ${timePart}`;
  };

  const buildCalendarEvent = (): CalendarEventInput => {
    const locationParts = [event.venue, event.address, event.city, event.region, event.country].filter(Boolean);
    return {
      title: event.title || 'Event',
      startDate: event.startDate || '',
      endDate: event.endDate || null,
      location: event.googleMapsAddress || locationParts.join(', ') || undefined,
      description: event.description || null,
      url: event.ticketUrl || event.website || null,
      id: event.id,
    };
  };

  const getLocation = () => {
    const parts = [event.venue, event.city, event.country].filter(Boolean);
    return parts.join(', ') || 'Location TBD';
  };

  const getMapsUrl = () => {
    const query = event.googleMapsAddress?.trim() || getLocation();
    if (!query || query === 'Location TBD') {
      return '';
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '5px',
          width: 'min(92vw, 960px)',
          aspectRatio: '8.5 / 6.5',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'clamp(220px, 60%, 420px) 1fr',
        }}
      >
        {/* Header with Image */}
        <div style={{ position: 'relative' }}>
          <img
            src={coverImageUrl || FALLBACKS.event}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <X size={20} />
          </button>

          {/* Participant Count Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              padding: '0.375rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#000',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Users size={14} />
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 'clamp(0.75rem, 2vw, 1.5rem)', overflow: 'hidden' }}>
          {/* Title */}
          <h2 style={{ margin: '0 0 clamp(0.5rem, 1.5vw, 1rem) 0', fontSize: '1.5rem', fontWeight: 600, color: '#000' }}>
            {event.title}
          </h2>

          {/* Info Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 1.2vw, 0.875rem)', marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)' }}>
            {/* Date */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Calendar size={20} style={{ color: '#666', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 500, color: '#333' }}>
                    Start: {event.startDate ? formatDateTime(event.startDate) : 'Date TBD'}
                  </div>
                  <AddToCalendarButton event={buildCalendarEvent()} />
                </div>
                {event.endDate && (
                  <div style={{ fontWeight: 500, color: '#333' }}>
                    End: {formatDateTime(event.endDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <MapPin size={20} style={{ color: '#666', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontWeight: 500, color: '#333' }}>
                {getMapsUrl() ? (
                  <a
                    href={getMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    {getLocation()}
                  </a>
                ) : (
                  getLocation()
                )}
              </div>
            </div>

            {/* Price */}
            {event.price && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <DollarSign size={20} style={{ color: '#666', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 500, color: '#333' }}>{event.price}</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#333' }}>
                About this event
              </h3>
              <p
                style={{
                  margin: 0,
                  color: '#555',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {event.description}
              </p>
            </div>
          )}

          {/* Restrictions */}
          {event.restrictions && event.restrictions.length > 0 && (
            <div style={{ marginBottom: 'clamp(0.75rem, 2vw, 1.5rem)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#333' }}>
                Restrictions
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '3.5rem', overflow: 'hidden' }}>
                {event.restrictions.filter(Boolean).map((restriction, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: '#f3f4f6',
                      borderRadius: '999px',
                      fontSize: '0.875rem',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {restriction}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Join Section */}
          {showJoinSection && !alreadyJoined && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={18} />
                Select your car
              </h3>

              {loading ? (
                <p style={{ color: '#666', fontSize: '0.875rem' }}>Loading your cars...</p>
              ) : userCars.length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.875rem' }}>
                  You don't have any cars in your collection yet. Add a car to your garage first.
                </p>
              ) : (
                <>
                  <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <select
                      value={selectedCarId}
                      onChange={(e) => setSelectedCarId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '0.875rem',
                        appearance: 'none',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Choose a car from your collection...</option>
                      {userCars.map((car) => (
                        <option key={car.id} value={car.id}>
                          {getCarDisplayName(car)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => setShowJoinSection(false)}
                      style={{
                        padding: '0.75rem 1.25rem',
                        background: '#fff',
                        color: '#333',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoinEvent}
                      disabled={!selectedCarId || joining}
                      style={{
                        padding: '0.75rem 1.25rem',
                        background: !selectedCarId || joining ? '#ccc' : '#000',
                        color: '#fff',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: !selectedCarId || joining ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {joining ? 'Joining...' : 'Join event'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: '#fff',
                  color: '#000',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #000',
                }}
              >
                <Ticket size={16} />
                Get Tickets
              </a>
            )}
            {event.website && (
              <a
                href={event.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: '#fff',
                  color: '#000',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid #000',
                }}
              >
                <Globe size={16} />
                Visit Website
              </a>
            )}

            {/* Join Now Button */}
            {!alreadyJoined ? (
              <button
                onClick={() => setShowJoinSection(true)}
                disabled={showJoinSection}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: showJoinSection ? '#ccc' : '#000',
                  color: '#fff',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: showJoinSection ? 'default' : 'pointer',
                }}
              >
                <Users size={16} />
                Join now
              </button>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: '#22c55e',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                <Users size={16} />
                You're attending!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

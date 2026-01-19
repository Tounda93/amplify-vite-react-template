import { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, ArrowRight, X, Ticket, Car, ChevronDown } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { FALLBACKS } from '../utils/fallbacks';
import { getImageUrl } from '../utils/storageHelpers';
import './NewsCarousel.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };
type CarType = Schema['Car']['type'];
type MakeType = Schema['Make']['type'];
type ModelType = Schema['Model']['type'];

const FRAME_TEXT = 'Collectible Collectible Collectible Collectible Collectible Collectible Collectible';

// Car display info type
interface CarDisplayInfo {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string | null;
}

export default function EventsCarousel() {
  const [events, setEvents] = useState<EventWithImageUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [allowHoverEffects, setAllowHoverEffects] = useState(false);

  // Popup state
  const [selectedEvent, setSelectedEvent] = useState<EventWithImageUrl | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  // RSVP state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCars, setUserCars] = useState<CarDisplayInfo[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [showCarDropdown, setShowCarDropdown] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loadingCars, setLoadingCars] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateHoverCapability = (event?: MediaQueryListEvent) => {
      setAllowHoverEffects(event ? event.matches : mediaQuery.matches);
    };

    updateHoverCapability();
    mediaQuery.addEventListener('change', updateHoverCapability);

    return () => mediaQuery.removeEventListener('change', updateHoverCapability);
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await fetchAuthSession();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Load user's cars when popup opens
  useEffect(() => {
    if (showPopup && isAuthenticated) {
      loadUserCars();
    }
  }, [showPopup, isAuthenticated]);

  const loadUserCars = async () => {
    setLoadingCars(true);
    try {
      // Fetch user's cars
      const { data: cars } = await client.models.Car.list({ limit: 50 });

      if (cars && cars.length > 0) {
        // Fetch makes and models to get display names
        const [makesResult, modelsResult] = await Promise.all([
          client.models.Make.list({ limit: 100 }),
          client.models.Model.list({ limit: 500 }),
        ]);

        const makesMap = new Map<string, string>();
        const modelsMap = new Map<string, string>();

        (makesResult.data || []).forEach((make: MakeType) => {
          makesMap.set(make.makeId, make.makeName);
        });

        (modelsResult.data || []).forEach((model: ModelType) => {
          modelsMap.set(model.modelId, model.modelName);
        });

        const carsWithInfo: CarDisplayInfo[] = cars.map((car: CarType) => ({
          id: car.id,
          make: makesMap.get(car.makeId) || car.makeId,
          model: modelsMap.get(car.modelId) || car.modelId,
          year: car.year,
          color: car.color,
        }));

        setUserCars(carsWithInfo);
      } else {
        setUserCars([]);
      }
    } catch (error) {
      console.error('Error loading user cars:', error);
      setUserCars([]);
    }
    setLoadingCars(false);
  };

  const handleEventClick = (event: EventWithImageUrl) => {
    setSelectedEvent(event);
    setShowPopup(true);
    setRsvpStatus('idle');
    setSelectedCarId('');
    setShowCarDropdown(false);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedEvent(null);
    setRsvpStatus('idle');
    setSelectedCarId('');
    setShowCarDropdown(false);
  };

  const handleRsvp = () => {
    if (!selectedCarId) {
      return;
    }
    // Here you would typically save the RSVP to the backend
    // For now, we'll just show a success message
    setRsvpStatus('success');
    setShowCarDropdown(false);
  };

  const loadEvents = async () => {
    try {
      const { data } = await client.models.Event.list({ limit: 20 });

      // Filter upcoming events and sort by start date
      const upcoming = (data || [])
        .filter(event => {
          if (!event.startDate) return false;
          const eventDate = new Date(event.startDate);
          return eventDate >= new Date();
        })
        .sort((a, b) => {
          const dateA = new Date(a.startDate!);
          const dateB = new Date(b.startDate!);
          return dateA.getTime() - dateB.getTime();
        });

      // Convert storage paths to signed URLs
      const eventsWithUrls = await Promise.all(
        upcoming.slice(0, 12).map(async (event) => {
          // Try coverImage (uploaded file) first, then coverImageUrl (external URL)
          let imageUrl: string | null = null;
          if (event.coverImage) {
            imageUrl = await getImageUrl(event.coverImage);
          } else if (event.coverImageUrl) {
            imageUrl = event.coverImageUrl;
          }
          return { ...event, imageUrl: imageUrl || FALLBACKS.event };
        })
      );

      setEvents(eventsWithUrls);
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEventTypeEmoji = (type?: Event['eventType']) => {
    const emojiMap = {
      'car_show': '🚗',
      'race': '🏎️',
      'auction': '🔨',
      'meet': '🤝',
      'rally': '🏁',
      'festival': '🎉',
      'exhibition': '🏛️',
      'track_day': '🛞',
      'other': '📅',
    };
    return emojiMap[type || 'other'] || '📅';
  };

  if (loading) {
    return (
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '700' }}>
          Upcoming Events
        </h2>
        <p style={{ color: '#666' }}>Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '700' }}>
          Upcoming Events
        </h2>
        <p style={{ color: '#666' }}>No upcoming events yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '3rem', position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
          Upcoming Events
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
        {events.map((event, index) => {
          const shouldShowFrame = allowHoverEffects ? hoveredCardIndex === index : false;
          return (
          <div
            key={event.id}
            className={`news-card${shouldShowFrame ? ' news-card--active' : ''}`}
            style={{
              minWidth: '320px',
              marginTop: '20px',
              marginBottom: '12px',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              position: 'relative',
              overflow: 'visible',
              backgroundColor: 'transparent',
              boxShadow: shouldShowFrame ? '0 0 0 8px red' : 'none',
            }}
            onMouseEnter={() => {
              if (allowHoverEffects) {
                setHoveredCardIndex(index);
              }
            }}
            onMouseLeave={() => {
              if (allowHoverEffects) {
                setHoveredCardIndex(null);
              }
            }}
            onClick={() => handleEventClick(event)}
          >
            {shouldShowFrame && (
              <div className="news-card-frame-text" aria-hidden="true">
                <div className="frame-strip frame-strip-top">
                  <span>{FRAME_TEXT}</span>
                  <span>{FRAME_TEXT}</span>
                </div>
                <div className="frame-strip frame-strip-right">
                  <span>{FRAME_TEXT}</span>
                  <span>{FRAME_TEXT}</span>
                </div>
                <div className="frame-strip frame-strip-bottom">
                  <span>{FRAME_TEXT}</span>
                  <span>{FRAME_TEXT}</span>
                </div>
                <div className="frame-strip frame-strip-left">
                  <span>{FRAME_TEXT}</span>
                  <span>{FRAME_TEXT}</span>
                </div>
              </div>
            )}

            <div className="news-card__content">
              {/* Event Image */}
              <div style={{
                width: '100%',
                height: '310px',
                backgroundColor: '#f3f4f6',
                backgroundImage: `url(${event.imageUrl || FALLBACKS.event})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}>
                {/* Event Type Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  padding: '4px 12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}>
                  {getEventTypeEmoji(event.eventType)} {event.eventType?.replace('_', ' ').toUpperCase()}
                </div>

                {/* Featured Badge */}
                {event.isFeatured && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 12px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    borderRadius: '5px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}>
                    FEATURED
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div style={{ padding: '13px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'white',
                  marginBottom: '10px',
                  fontWeight: '400',
                }}>
                  <Calendar size={14} color="white" />
                  <span>{formatDate(event.startDate!)}</span>
                  {event.endDate && event.endDate !== event.startDate && (
                    <span>- {formatDate(event.endDate)}</span>
                  )}
                </div>

                <h3 style={{
                  margin: '0 0 10px 0',
                  fontSize: '23px',
                  fontWeight: '200',
                  color: 'white',
                  lineHeight: '1.2',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {event.title}
                </h3>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '12px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '300',
                }}>
                  <MapPin size={14} color="white" />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {event.city}, {event.country}
                  </span>
                </div>

                {event.price && (
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '12px',
                  }}>
                    {event.price}
                  </div>
                )}

                {event.website && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}>
                    Learn More <ArrowRight size={14} color="white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );})}
      </div>

      {/* Event Detail Popup */}
      {showPopup && selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={handleClosePopup}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover Image */}
            <div
              style={{
                width: '100%',
                height: '250px',
                backgroundImage: `url(${selectedEvent.imageUrl || FALLBACKS.event})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              {/* Close Button */}
              <button
                onClick={handleClosePopup}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
              >
                <X size={20} color="white" />
              </button>

              {/* Event Type Badge */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                padding: '6px 14px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                {getEventTypeEmoji(selectedEvent.eventType)} {selectedEvent.eventType?.replace('_', ' ').toUpperCase()}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 250px)' }}>
              {/* Title */}
              <h2 style={{
                margin: '0 0 16px 0',
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1.3',
              }}>
                {selectedEvent.title}
              </h2>

              {/* Date */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                color: '#4b5563',
                fontSize: '14px',
              }}>
                <Calendar size={18} color="#6b7280" />
                <span style={{ fontWeight: '500' }}>
                  {formatDate(selectedEvent.startDate!)}
                  {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate && (
                    <> - {formatDate(selectedEvent.endDate)}</>
                  )}
                </span>
              </div>

              {/* Location */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '16px',
                color: '#4b5563',
                fontSize: '14px',
              }}>
                <MapPin size={18} color="#6b7280" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  {selectedEvent.venue && <div style={{ fontWeight: '500' }}>{selectedEvent.venue}</div>}
                  {selectedEvent.address && <div>{selectedEvent.address}</div>}
                  <div>{selectedEvent.city}, {selectedEvent.region && `${selectedEvent.region}, `}{selectedEvent.country}</div>
                </div>
              </div>

              {/* Price */}
              {selectedEvent.price && (
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px',
                }}>
                  {selectedEvent.price}
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div style={{
                  marginBottom: '24px',
                  color: '#4b5563',
                  fontSize: '14px',
                  lineHeight: '1.6',
                }}>
                  {selectedEvent.description}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '20px',
              }}>
                {/* Get Tickets CTA */}
                {(selectedEvent.ticketUrl || selectedEvent.website) && (
                  <a
                    href={selectedEvent.ticketUrl || selectedEvent.website || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px 24px',
                      backgroundColor: '#111827',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
                  >
                    <Ticket size={18} />
                    {selectedEvent.ticketUrl ? 'Get Tickets' : 'Visit Website'}
                  </a>
                )}

                {/* RSVP Section */}
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}>
                    <Car size={18} color="#374151" />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      RSVP - Which car will you bring?
                    </span>
                  </div>

                  {!isAuthenticated ? (
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                      Sign in to RSVP with a car from your garage.
                    </p>
                  ) : rsvpStatus === 'success' ? (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#ecfdf5',
                      borderRadius: '8px',
                      color: '#065f46',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}>
                      You're all set! We'll see you and your {userCars.find(c => c.id === selectedCarId)?.year} {userCars.find(c => c.id === selectedCarId)?.make} {userCars.find(c => c.id === selectedCarId)?.model} at the event!
                    </div>
                  ) : loadingCars ? (
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                      Loading your garage...
                    </p>
                  ) : userCars.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                      No cars in your garage yet. Add a car to RSVP to events.
                    </p>
                  ) : (
                    <div>
                      {/* Car Dropdown */}
                      <div style={{ position: 'relative', marginBottom: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setShowCarDropdown(!showCarDropdown)}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: selectedCarId ? '#111827' : '#6b7280',
                          }}
                        >
                          {selectedCarId ? (
                            (() => {
                              const car = userCars.find(c => c.id === selectedCarId);
                              return car ? `${car.year} ${car.make} ${car.model}${car.color ? ` (${car.color})` : ''}` : 'Select a car';
                            })()
                          ) : (
                            'Select a car from your garage'
                          )}
                          <ChevronDown size={18} color="#6b7280" style={{
                            transform: showCarDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                          }} />
                        </button>

                        {/* Dropdown Menu */}
                        {showCarDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                            zIndex: 10,
                            maxHeight: '200px',
                            overflowY: 'auto',
                          }}>
                            {userCars.map((car) => (
                              <button
                                key={car.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCarId(car.id);
                                  setShowCarDropdown(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '12px 14px',
                                  backgroundColor: selectedCarId === car.id ? '#f3f4f6' : 'white',
                                  border: 'none',
                                  borderBottom: '1px solid #f3f4f6',
                                  fontSize: '14px',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  color: '#111827',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCarId === car.id ? '#f3f4f6' : 'white'}
                              >
                                <div style={{ fontWeight: '500' }}>
                                  {car.year} {car.make} {car.model}
                                </div>
                                {car.color && (
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                    {car.color}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* RSVP Button */}
                      <button
                        type="button"
                        onClick={handleRsvp}
                        disabled={!selectedCarId}
                        style={{
                          width: '100%',
                          padding: '12px 24px',
                          backgroundColor: selectedCarId ? '#059669' : '#d1d5db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: selectedCarId ? 'pointer' : 'not-allowed',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedCarId) e.currentTarget.style.backgroundColor = '#047857';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCarId) e.currentTarget.style.backgroundColor = '#059669';
                        }}
                      >
                        Confirm RSVP
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

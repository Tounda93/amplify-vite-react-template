import { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import AddCarPopup from './components/AddCarPopup';
import CarDetailPopup from './components/CarDetailPopup';
import CarCard from './components/CarCard';
import EventCard from './components/Card/EventCard';
import EventDetailPopup from './components/EventDetailPopup';
import { useIsMobile } from './hooks/useIsMobile';
import { isAdminEmail } from './constants/admins';
import { FALLBACKS } from './utils/fallbacks';
import { getImageUrl } from './utils/storageHelpers';

const client = generateClient<Schema>();

type CarType = Schema['Car']['type'];
type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];
type Event = Schema['Event']['type'];
type Profile = Schema['Profile']['type'];
type EventParticipant = Schema['EventParticipant']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };
type FriendRequest = Schema['FriendRequest']['type'];
type IncomingRequest = FriendRequest & { senderProfile?: Profile | null };

interface AmplifyUser {
  signInDetails?: {
    loginId?: string;
  };
  username?: string;
}

interface MyGarageSectionProps {
  user?: AmplifyUser;
  onSectionChange?: (section: string) => void;
  profileOverride?: Profile | null;
  onMessageUser?: (userId: string) => void;
}

export function MyGarageSection({
  user,
  onSectionChange,
  profileOverride,
  onMessageUser,
}: MyGarageSectionProps) {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';
  const [loading, setLoading] = useState(true);
  const [showAddCarPopup, setShowAddCarPopup] = useState(false);
  const [userCars, setUserCars] = useState<CarType[]>([]);
  const [makes, setMakes] = useState<Map<string, Make>>(new Map());
  const [models, setModels] = useState<Map<string, Model>>(new Map());
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventWithImageUrl | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithImageUrl[]>([]);
  const [pastEvents, setPastEvents] = useState<EventWithImageUrl[]>([]);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const eventsCarouselRef = useRef<HTMLDivElement>(null);
  const pastEventsCarouselRef = useRef<HTMLDivElement>(null);
  const userLoginId = user?.signInDetails?.loginId || user?.username || '';
  const derivedUsername = userLoginId.includes('@') ? userLoginId.split('@')[0] : userLoginId;
  const targetUserId = profileOverride?.ownerId || profileOverride?.id || currentUserId;
  const isOwner = Boolean(currentUserId && targetUserId && currentUserId === targetUserId);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload?.sub as string | undefined;
        setCurrentUserId(userId ?? null);
      } catch (error) {
        console.error('Error loading user session:', error);
        setCurrentUserId(null);
      }
    };
    loadUserId();
  }, []);

  useEffect(() => {
    const targetUserId = profileOverride?.ownerId || profileOverride?.id || currentUserId;
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    const loadAll = async () => {
      setLoading(true);
      if (profileOverride) {
        setProfile(profileOverride);
      } else if (currentUserId) {
        await loadProfile(currentUserId);
      }
      await Promise.all([
        loadUserCars(targetUserId),
        loadEventParticipation(targetUserId),
      ]);
      setLoading(false);
    };

    loadAll();
  }, [currentUserId, profileOverride]);

  const loadUserCars = async (userId: string) => {
    try {
      // Load user's cars
      const { data: cars } = await client.models.Car.list({
        filter: { ownerId: { eq: userId } }
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
      console.error('Error loading cars:', error);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await client.models.Profile.list({
        limit: 1,
        filter: { ownerId: { eq: userId } },
      });
      const existing = data?.[0] ?? null;
      if (!existing) {
        const created = await client.models.Profile.create({
          ownerId: userId,
          username: derivedUsername || undefined,
          email: userLoginId || undefined,
          displayName: derivedUsername || undefined,
        });
        setProfile(created.data ?? null);
        return;
      }

      const updates: Partial<Profile> = {};
      if (!existing.username && derivedUsername) updates.username = derivedUsername;
      if (!existing.email && userLoginId) updates.email = userLoginId;
      if (!existing.displayName && derivedUsername) updates.displayName = derivedUsername;
      if (Object.keys(updates).length > 0) {
        const updated = await client.models.Profile.update({
          id: existing.id,
          ...updates,
        });
        setProfile(updated.data ?? existing);
        return;
      }

      setProfile(existing);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const resolveImages = async () => {
      if (!profile) {
        setAvatarUrl(null);
        setCoverUrl(null);
        return;
      }
      const resolvedAvatar = profile.avatarUrl ? await getImageUrl(profile.avatarUrl) : null;
      const resolvedCover = profile.coverImageUrl ? await getImageUrl(profile.coverImageUrl) : null;
      setAvatarUrl(resolvedAvatar);
      setCoverUrl(resolvedCover);
    };
    void resolveImages();
  }, [profile]);

  useEffect(() => {
    if (!currentUserId) {
      setFriendStatus('none');
      setIncomingRequests([]);
      return;
    }
    if (isOwner) {
      void loadIncomingRequests(currentUserId);
      return;
    }
    if (targetUserId) {
      void loadFriendStatus(currentUserId, targetUserId);
    }
  }, [currentUserId, isOwner, targetUserId]);

  const loadEventParticipation = async (userId: string) => {
    try {
      const { data } = await client.models.EventParticipant.list({
        filter: { oderId: { eq: userId } },
      });
      const participants = (data || []) as EventParticipant[];
      if (participants.length === 0) {
        setUpcomingEvents([]);
        setPastEvents([]);
        return;
      }

      const eventIds = Array.from(new Set(participants.map((participant) => participant.eventId).filter(Boolean)));
      const events = await Promise.all(
        eventIds.map(async (eventId) => {
          const { data: event } = await client.models.Event.get({ id: eventId });
          if (!event) return null;
          let imageUrl = FALLBACKS.event;
          if (event.coverImage) {
            imageUrl = (await getImageUrl(event.coverImage)) || FALLBACKS.event;
          } else if (event.coverImageUrl) {
            imageUrl = event.coverImageUrl;
          }
          return { ...event, imageUrl };
        })
      );

      const now = new Date();
      const normalized = events.filter((event): event is NonNullable<typeof event> => event !== null) as EventWithImageUrl[];
      const upcoming = normalized
        .filter((event) => !event.startDate || new Date(event.startDate) >= now)
        .sort((a, b) => {
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
      const past = normalized
        .filter((event) => event.startDate && new Date(event.startDate) < now)
        .sort((a, b) => {
          if (!a.startDate || !b.startDate) return 0;
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });

      setUpcomingEvents(upcoming);
      setPastEvents(past);
    } catch (error) {
      console.error('Error loading event participation:', error);
      setUpcomingEvents([]);
      setPastEvents([]);
    }
  };

  const loadFriendStatus = async (viewerId: string, targetId: string) => {
    try {
      const { data: friendships } = await client.models.Friendship.list({
        filter: { userId: { eq: viewerId }, friendUserId: { eq: targetId } },
      });
      if (friendships && friendships.length > 0) {
        setFriendStatus('friends');
        return;
      }

      const { data: pending } = await client.models.FriendRequest.list({
        filter: {
          senderUserId: { eq: viewerId },
          receiverUserId: { eq: targetId },
          status: { eq: 'pending' },
        },
      });
      if (pending && pending.length > 0) {
        setFriendStatus('pending');
        return;
      }

      const { data: incoming } = await client.models.FriendRequest.list({
        filter: {
          senderUserId: { eq: targetId },
          receiverUserId: { eq: viewerId },
          status: { eq: 'pending' },
        },
      });
      if (incoming && incoming.length > 0) {
        setFriendStatus('pending');
        return;
      }

      setFriendStatus('none');
    } catch (error) {
      console.error('Error loading friend status', error);
      setFriendStatus('none');
    }
  };

  const loadIncomingRequests = async (viewerId: string) => {
    try {
      const { data } = await client.models.FriendRequest.list({
        filter: { receiverUserId: { eq: viewerId }, status: { eq: 'pending' } },
      });
      const pending = (data || []) as FriendRequest[];
      const enriched = await Promise.all(
        pending.map(async (request) => {
          const { data: byOwner } = await client.models.Profile.list({
            filter: { ownerId: { eq: request.senderUserId } },
          });
          return { ...request, senderProfile: byOwner?.[0] ?? null };
        })
      );
      setIncomingRequests(enriched);
    } catch (error) {
      console.error('Error loading incoming friend requests', error);
      setIncomingRequests([]);
    }
  };

  const getMakeName = (makeId: string) => makes.get(makeId)?.makeName || 'Unknown';
  const getModelName = (modelId: string) => models.get(modelId)?.modelName || 'Unknown';

  if (loading) {
    return (
      <div style={{ width: '100%', backgroundColor: '#F2F3F5', padding: `2rem ${horizontalPadding}` }}>
        <p style={{ color: '#666', textAlign: 'center' }}>Loading your garage...</p>
      </div>
    );
  }

  const targetProfile = profileOverride ?? profile;
  const fullName = (() => {
    if (targetProfile?.firstName || targetProfile?.lastName) {
      return `${targetProfile.firstName || ''} ${targetProfile.lastName || ''}`.trim();
    }
    return (
      targetProfile?.displayName ||
      targetProfile?.username ||
      derivedUsername ||
      'User'
    );
  })();
  const firstName =
    targetProfile?.firstName ||
    fullName.split(' ')[0] ||
    'User';

  const refreshCars = () => {
    if (!currentUserId) return;
    void loadUserCars(currentUserId);
  };

  const handleSendFriendRequest = async () => {
    if (!currentUserId || !targetUserId || isOwner) return;
    setFriendActionLoading(true);
    try {
      const { data: existing } = await client.models.FriendRequest.list({
        filter: {
          senderUserId: { eq: currentUserId },
          receiverUserId: { eq: targetUserId },
          status: { eq: 'pending' },
        },
      });
      if (existing && existing.length > 0) {
        setFriendStatus('pending');
        return;
      }
      await client.models.FriendRequest.create({
        senderUserId: currentUserId,
        receiverUserId: targetUserId,
        status: 'pending',
      });
      setFriendStatus('pending');
    } catch (error) {
      console.error('Failed to send friend request', error);
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleAcceptRequest = async (request: IncomingRequest) => {
    if (!currentUserId) return;
    setFriendActionLoading(true);
    try {
      await client.models.Friendship.create({
        userId: currentUserId,
        friendUserId: request.senderUserId,
      });
      await client.models.Friendship.create({
        userId: request.senderUserId,
        friendUserId: currentUserId,
      });
      await client.models.FriendRequest.delete({ id: request.id });
      setIncomingRequests((prev) => prev.filter((item) => item.id !== request.id));
    } catch (error) {
      console.error('Failed to accept friend request', error);
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleRejectRequest = async (request: IncomingRequest) => {
    setFriendActionLoading(true);
    try {
      await client.models.FriendRequest.update({
        id: request.id,
        status: 'rejected',
      });
      setIncomingRequests((prev) => prev.filter((item) => item.id !== request.id));
    } catch (error) {
      console.error('Failed to reject friend request', error);
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleMessageUser = () => {
    if (!targetUserId || !onMessageUser) return;
    onMessageUser(targetUserId);
  };

  return (
    <div style={{ width: '100%', overflowX: 'hidden', backgroundColor: '#F2F3F5', minHeight: '100vh', padding: `2rem ${horizontalPadding}` }}>
      {/* Profile header */}
      <section style={{ position: 'relative', marginBottom: '3rem' }}>
        <div style={{
          width: '100%',
          height: isMobile ? '180px' : '240px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#e5e7eb',
        }}>
          <img
            src={coverUrl || FALLBACKS.profileCover}
            alt="Profile cover"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {isOwner && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 2,
          }}>
            <button
              type="button"
              aria-label="Settings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.6)',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <Settings size={16} />
            </button>
          </div>
        )}

        <div style={{
          position: 'absolute',
          bottom: isMobile ? '-36px' : '-44px',
          left: isMobile ? '50%' : '2rem',
          transform: isMobile ? 'translateX(-50%)' : 'none',
          width: isMobile ? '90px' : '110px',
          height: isMobile ? '90px' : '110px',
          borderRadius: '50%',
          border: '4px solid #f2f3f5',
          backgroundColor: '#e5e7eb',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 700,
          color: '#111827',
        }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            fullName.slice(0, 1).toUpperCase()
          )}
        </div>
      </section>

      {/* User identity */}
      <section style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: '1.5rem',
        marginTop: isMobile ? '3rem' : '2rem',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
          gap: '1.5rem',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{fullName}</div>
            {targetProfile?.location && (
              <div style={{ marginTop: '0.35rem', color: '#6b7280' }}>
                {targetProfile.location}
              </div>
            )}
          </div>
          {!isOwner && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: isMobile ? 'flex-start' : 'flex-end' }}>
              {friendStatus === 'friends' ? (
                <button
                  type="button"
                  onClick={handleMessageUser}
                  style={{
                    padding: '0.55rem 1.2rem',
                    borderRadius: '999px',
                    border: '1px solid #111827',
                    backgroundColor: '#111827',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Message user
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSendFriendRequest}
                    disabled={friendStatus === 'pending' || friendActionLoading}
                    style={{
                      padding: '0.55rem 1.2rem',
                      borderRadius: '999px',
                      border: '1px solid #111827',
                      backgroundColor: '#111827',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: friendStatus === 'pending' ? 'not-allowed' : 'pointer',
                      opacity: friendStatus === 'pending' ? 0.7 : 1,
                    }}
                  >
                    {friendStatus === 'pending' ? 'Request pending' : 'Send friend request'}
                  </button>
                  <button
                    type="button"
                    disabled
                    style={{
                      padding: '0.55rem 1.2rem',
                      borderRadius: '999px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#f3f4f6',
                      color: '#9ca3af',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'not-allowed',
                    }}
                  >
                    Message user
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Action buttons */}
      <section style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '2rem',
      }}>
        {isOwner && (
          <button
            type="button"
            style={{
              padding: '0.55rem 1.2rem',
              borderRadius: '999px',
              border: '1px solid #111827',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Edit Profile
          </button>
        )}
        {isOwner && isAdminEmail(userLoginId) && (
          <button
            type="button"
            onClick={() => onSectionChange?.('admin')}
            style={{
              padding: '0.55rem 1.2rem',
              borderRadius: '999px',
              border: '1px solid #111827',
              backgroundColor: '#111827',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Admin Console
          </button>
        )}
      </section>

      {isOwner && incomingRequests.length > 0 && (
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>
            Friend Requests
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {incomingRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <span style={{ fontSize: '0.9rem', color: '#111827' }}>
                  {request.senderProfile?.displayName
                    || request.senderProfile?.username
                    || request.senderUserId}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => handleAcceptRequest(request)}
                    disabled={friendActionLoading}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '999px',
                      border: '1px solid #111827',
                      backgroundColor: '#111827',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(request)}
                    disabled={friendActionLoading}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '999px',
                      border: '1px solid #111827',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* User cars */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1rem',
        }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, margin: 0 }}>
            {firstName}&apos;s Garage
          </h2>
          {isOwner && (
            <button
              type="button"
              onClick={() => setShowAddCarPopup(true)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                border: '1px solid #111827',
                backgroundColor: 'transparent',
                color: '#111827',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Add a car
            </button>
          )}
        </div>

        {userCars.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px dashed #d1d5db',
            padding: '2rem',
            textAlign: 'center',
            color: '#6b7280',
          }}>
            No cars yet. Add your first car to start building your garage.
          </div>
        ) : (
          <div
            ref={carouselRef}
            style={{
              display: 'flex',
              gap: '1.5rem',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              paddingBottom: '1rem',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {userCars.map((car) => {
              const makeName = getMakeName(car.makeId);
              const modelName = getModelName(car.modelId);

              return (
                <div
                  key={car.id}
                  style={{
                    flexShrink: 0,
                    width: isMobile ? 'calc(100vw - 2rem)' : '28.2625rem',
                    scrollSnapAlign: 'start',
                  }}
                >
                  <CarCard
                    car={car}
                    makeName={makeName}
                    modelName={modelName}
                    onClick={() => setSelectedCar(car)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Events participation */}
      <section>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Participated Events</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.75rem 0' }}>Upcoming events</h3>
          {upcomingEvents.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px dashed #d1d5db',
              padding: '1.5rem',
              color: '#6b7280',
              textAlign: 'center',
            }}>
              No upcoming events yet.
            </div>
          ) : (
            <div
              ref={eventsCarouselRef}
              style={{
                display: 'flex',
                gap: '1.5rem',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                paddingBottom: '0.5rem',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    flexShrink: 0,
                    width: isMobile ? 'calc(100vw - 2rem)' : '26rem',
                    scrollSnapAlign: 'start',
                  }}
                >
                  <EventCard
                    imageUrl={event.imageUrl || FALLBACKS.event}
                    imageAlt={event.title || 'Event cover'}
                    dateLabel={event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }) : 'Date TBA'}
                    title={event.title || 'Event'}
                    locationLabel={[event.city, event.region, event.country].filter(Boolean).join(', ') || 'Location TBA'}
                    participantCount={event.participantCount ?? 0}
                    showMenu={false}
                    onClick={() => setSelectedEvent(event)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.75rem 0' }}>Past events</h3>
          {pastEvents.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px dashed #d1d5db',
              padding: '1.5rem',
              color: '#6b7280',
              textAlign: 'center',
            }}>
              No past events yet.
            </div>
          ) : (
            <div
              ref={pastEventsCarouselRef}
              style={{
                display: 'flex',
                gap: '1.5rem',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                paddingBottom: '0.5rem',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {pastEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    flexShrink: 0,
                    width: isMobile ? 'calc(100vw - 2rem)' : '26rem',
                    scrollSnapAlign: 'start',
                    opacity: 0.55,
                    filter: 'grayscale(0.4)',
                  }}
                >
                  <EventCard
                    imageUrl={event.imageUrl || FALLBACKS.event}
                    imageAlt={event.title || 'Event cover'}
                    dateLabel={event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }) : 'Date TBA'}
                    title={event.title || 'Event'}
                    locationLabel={[event.city, event.region, event.country].filter(Boolean).join(', ') || 'Location TBA'}
                    participantCount={event.participantCount ?? 0}
                    showMenu={false}
                    onClick={() => setSelectedEvent(event)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Add Car Popup */}
      <AddCarPopup
        isOpen={showAddCarPopup}
        onClose={() => setShowAddCarPopup(false)}
        onCarAdded={refreshCars}
      />

      {/* Car Detail Popup */}
      <CarDetailPopup
        car={selectedCar}
        makeName={selectedCar ? getMakeName(selectedCar.makeId) : ''}
        modelName={selectedCar ? getModelName(selectedCar.modelId) : ''}
        isOpen={selectedCar !== null}
        onClose={() => setSelectedCar(null)}
        onCarUpdated={refreshCars}
        onCarDeleted={refreshCars}
      />

      <EventDetailPopup
        event={selectedEvent}
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

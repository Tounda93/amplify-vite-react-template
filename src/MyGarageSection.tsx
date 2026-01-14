import { useState, useEffect, useRef } from 'react';
import { Car, Plus, Heart, Settings, User, Shield } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import AddCarPopup from './components/AddCarPopup';
import CarDetailPopup from './components/CarDetailPopup';
import { useIsMobile } from './hooks/useIsMobile';
import { isAdminEmail } from './constants/admins';

const client = generateClient<Schema>();

type CarType = Schema['Car']['type'];
type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];

interface AmplifyUser {
  signInDetails?: {
    loginId?: string;
  };
  username?: string;
}

interface MyGarageSectionProps {
  user?: AmplifyUser;
  signOut?: () => void;
  onSectionChange?: (section: string) => void;
}

const FALLBACK_CAR_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80';
const isStoragePath = (str: string) => str.startsWith('car-photos/') || str.startsWith('event-photos/');

export function MyGarageSection({ user, onSectionChange }: MyGarageSectionProps) {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';
  const [loading, setLoading] = useState(true);
  const [showAddCarPopup, setShowAddCarPopup] = useState(false);
  const [userCars, setUserCars] = useState<CarType[]>([]);
  const [carImageUrls, setCarImageUrls] = useState<Map<string, string>>(new Map());
  const [makes, setMakes] = useState<Map<string, Make>>(new Map());
  const [models, setModels] = useState<Map<string, Model>>(new Map());
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserCars();
  }, []);

  useEffect(() => {
    if (userCars.length === 0) {
      setCarImageUrls(new Map());
      return;
    }

    const loadCarImages = async () => {
      const entries = await Promise.all(
        userCars.map(async (car) => {
          const photoPath = car.photos && car.photos.length > 0 ? car.photos[0] : null;
          if (!photoPath) {
            return [car.id, FALLBACK_CAR_IMAGE] as const;
          }

          if (!isStoragePath(photoPath)) {
            return [car.id, photoPath] as const;
          }

          try {
            const result = await getUrl({ path: photoPath });
            return [car.id, result.url.toString()] as const;
          } catch (error) {
            console.error('Error loading car image:', error);
            return [car.id, FALLBACK_CAR_IMAGE] as const;
          }
        })
      );

      setCarImageUrls(new Map(entries));
    };

    loadCarImages();
  }, [userCars]);

  const loadUserCars = async () => {
    try {
      setLoading(true);

      // Get current user ID
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub as string;

      if (!userId) {
        setLoading(false);
        return;
      }

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
    } finally {
      setLoading(false);
    }
  };

  const computeProfileInitials = () => {
    const loginId = user?.signInDetails?.loginId || user?.username || '';
    if (!loginId) {
      return 'UU';
    }
    const cleaned = loginId.replace(/@.*/, '');
    const segments = cleaned.split(/[\s._-]+/).filter(Boolean);
    if (segments.length >= 2) {
      return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase();
    }
    if (segments.length === 1) {
      const segment = segments[0];
      return (segment.slice(0, 2)).toUpperCase();
    }
    return loginId.slice(0, 2).toUpperCase();
  };

  const profileInitials = computeProfileInitials();
  const userEmail = user?.signInDetails?.loginId || user?.username || 'User';

  const getMakeName = (makeId: string) => makes.get(makeId)?.makeName || 'Unknown';
  const getModelName = (modelId: string) => models.get(modelId)?.modelName || 'Unknown';

  if (loading) {
    return (
      <div style={{ width: '100%', backgroundColor: '#F2F3F5', padding: `2rem ${horizontalPadding}` }}>
        <p style={{ color: '#666', textAlign: 'center' }}>Loading your garage...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'hidden', backgroundColor: '#F2F3F5', minHeight: '100vh', padding: `2rem ${horizontalPadding}` }}>
      {/* Profile Button and Admin Button - Left aligned */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <button
          onClick={() => onSectionChange?.('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {profileInitials}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111' }}>
              {userEmail.split('@')[0]}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>View Profile</div>
          </div>
          <User size={16} style={{ color: '#666' }} />
        </button>

        {/* Admin Button - Only visible to admin users */}
        {isAdminEmail(userEmail) && (
          <button
            onClick={() => onSectionChange?.('admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Shield size={20} style={{ color: '#666' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111' }}>
                Admin
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>Manage Site</div>
            </div>
          </button>
        )}
      </div>

      {/* Title Section - Same as Upcoming Events */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000', margin: 0 }}>My Garage</h2>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: '#000'
          }} />
          <button
            onClick={() => setShowAddCarPopup(true)}
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
            Add a car
          </button>
        </div>
      </div>

      {userCars.length === 0 ? (
        <>
          {/* Empty State */}
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              border: '3px dashed #d1d5db'
            }}>
              <Car size={56} style={{ color: '#9ca3af' }} />
            </div>

            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.8rem' }}>
              Your Garage is Empty
            </h2>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '2rem' }}>
              Start building your collection by adding cars you own or wish to own.
              Track details, photos, and maintenance history for each vehicle.
            </p>

            <button
              onClick={() => setShowAddCarPopup(true)}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Plus size={20} />
              Add Your First Car
            </button>
          </div>

          {/* Feature Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            {/* Collection Card */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '10px',
                backgroundColor: '#e3f2fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Car size={28} style={{ color: '#1976d2' }} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>My Collection</h3>
              <p style={{ color: '#666', margin: 0, lineHeight: '1.5' }}>
                Keep track of all the cars you own with detailed information and photos
              </p>
            </div>

            {/* Wishlist Card */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '10px',
                backgroundColor: '#fce4ec',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Heart size={28} style={{ color: '#c2185b' }} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Wishlist</h3>
              <p style={{ color: '#666', margin: 0, lineHeight: '1.5' }}>
                Save your dream cars and get notified when they become available
              </p>
            </div>

            {/* Maintenance Card */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '10px',
                backgroundColor: '#fff3e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <Settings size={28} style={{ color: '#f57c00' }} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Maintenance Log</h3>
              <p style={{ color: '#666', margin: 0, lineHeight: '1.5' }}>
                Track service history, repairs, and modifications for each vehicle
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Cars Horizontal Carousel */}
          <div style={{ position: 'relative' }}>
            {/* Carousel Container */}
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
                const carImage = carImageUrls.get(car.id) || FALLBACK_CAR_IMAGE;
                const makeName = getMakeName(car.makeId);
                const modelName = getModelName(car.modelId);

                return (
                  <div
                    key={car.id}
                    onClick={() => setSelectedCar(car)}
                    style={{
                      flexShrink: 0,
                      width: isMobile ? 'calc(100vw - 2rem)' : '28.2625rem',
                      height: isMobile ? '18.2rem' : '25rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.625rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      scrollSnapAlign: 'start',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* Car Image */}
                    <div
                      style={{
                        width: '100%',
                        flex: '0 0 70%',
                        backgroundImage: `url(${carImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#f3f4f6',
                        position: 'relative',
                      }}
                    >
                      {/* Year Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          left: '0.75rem',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {car.year}
                      </div>
                    </div>

                    {/* Car Info */}
                    <div style={{ padding: '0.75rem 1rem', flex: '1 0 30%' }}>
                      <span style={{
                        display: 'block',
                        color: '#000',
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        marginBottom: '0.25rem',
                      }}>
                        MY CAR
                      </span>
                      <h3 style={{
                        margin: 0,
                        color: '#000',
                        fontSize: '1rem',
                        fontWeight: 500,
                        lineHeight: '1.25rem',
                      }}>
                        {makeName} {modelName}
                      </h3>

                      <div style={{ margin: '0.5rem 0' }}>
                        <span style={{
                          display: 'block',
                          color: '#000',
                          fontSize: '0.625rem',
                          fontWeight: 400,
                        }}>
                          {[car.color, car.transmission?.replace('_', ' ')].filter(Boolean).join(' • ') || 'No details'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Add Car Popup */}
      <AddCarPopup
        isOpen={showAddCarPopup}
        onClose={() => setShowAddCarPopup(false)}
        onCarAdded={loadUserCars}
      />

      {/* Car Detail Popup */}
      <CarDetailPopup
        car={selectedCar}
        makeName={selectedCar ? getMakeName(selectedCar.makeId) : ''}
        modelName={selectedCar ? getModelName(selectedCar.modelId) : ''}
        isOpen={selectedCar !== null}
        onClose={() => setSelectedCar(null)}
        onCarUpdated={loadUserCars}
        onCarDeleted={loadUserCars}
      />
    </div>
  );
}

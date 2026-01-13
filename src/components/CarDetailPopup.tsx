import { X, Calendar, Palette, Settings, Gauge, Car as CarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';

type Car = Schema['Car']['type'];

const FALLBACK_CAR_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

// Helper to check if a string is a storage path or a URL
const isStoragePath = (str: string) => str.startsWith('car-photos/') || str.startsWith('event-photos/');

interface CarDetailPopupProps {
  car: Car | null;
  makeName: string;
  modelName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CarDetailPopup({ car, makeName, modelName, isOpen, onClose }: CarDetailPopupProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const photoPaths = car?.photos?.filter(Boolean) as string[] || [];

  useEffect(() => {
    const loadPhotos = async () => {
      if (!car || photoPaths.length === 0) {
        setPhotoUrls([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const urls: string[] = [];

      for (const path of photoPaths) {
        // If it's already a URL (legacy data), use it directly
        if (!isStoragePath(path)) {
          urls.push(path);
          continue;
        }

        // Otherwise, get the URL from the storage path
        try {
          const result = await getUrl({ path });
          urls.push(result.url.toString());
        } catch (error) {
          console.error('Error loading photo:', error);
        }
      }

      setPhotoUrls(urls);
      setLoading(false);
    };

    loadPhotos();
  }, [car?.id]);

  if (!isOpen || !car) return null;

  const currentImage = photoUrls.length > 0 ? photoUrls[currentPhotoIndex] : FALLBACK_CAR_IMAGE;

  const nextPhoto = () => {
    if (photoUrls.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photoUrls.length);
    }
  };

  const prevPhoto = () => {
    if (photoUrls.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photoUrls.length) % photoUrls.length);
    }
  };

  const formatTransmission = (transmission: string | null | undefined) => {
    if (!transmission) return null;
    return transmission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with Image */}
        <div style={{ position: 'relative' }}>
          <img
            src={currentImage}
            alt={`${makeName} ${modelName}`}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
            }}
          />

          {/* Close Button */}
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

          {/* Photo Navigation */}
          {photoUrls.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
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
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextPhoto}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
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
                <ChevronRight size={20} />
              </button>

              {/* Photo Indicators */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.5rem',
                }}
              >
                {photoUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      background: index === currentPhotoIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Year Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              padding: '0.375rem 0.75rem',
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
              borderRadius: '999px',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {car.year}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', padding: '1.5rem' }}>
          {/* Title */}
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 600, color: '#000' }}>
            {makeName} {modelName}
          </h2>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Year */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
            }}>
              <Calendar size={20} style={{ color: '#666' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Year</div>
                <div style={{ fontWeight: 500, color: '#333' }}>{car.year}</div>
              </div>
            </div>

            {/* Exterior Color */}
            {car.color && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}>
                <Palette size={20} style={{ color: '#666' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>Exterior</div>
                  <div style={{ fontWeight: 500, color: '#333' }}>{car.color}</div>
                </div>
              </div>
            )}

            {/* Interior Color */}
            {car.interiorColor && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}>
                <Palette size={20} style={{ color: '#666' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>Interior</div>
                  <div style={{ fontWeight: 500, color: '#333' }}>{car.interiorColor}</div>
                </div>
              </div>
            )}

            {/* Transmission */}
            {car.transmission && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}>
                <Settings size={20} style={{ color: '#666' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>Transmission</div>
                  <div style={{ fontWeight: 500, color: '#333' }}>{formatTransmission(car.transmission)}</div>
                </div>
              </div>
            )}

            {/* Engine */}
            {car.engineVariantId && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}>
                <Gauge size={20} style={{ color: '#666' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>Engine</div>
                  <div style={{ fontWeight: 500, color: '#333' }}>{car.engineVariantId}</div>
                </div>
              </div>
            )}

            {/* Mileage */}
            {car.mileage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}>
                <CarIcon size={20} style={{ color: '#666' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>Mileage</div>
                  <div style={{ fontWeight: 500, color: '#333' }}>
                    {car.mileage.toLocaleString()} {car.mileageUnit || 'km'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {car.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#333' }}>
                Description
              </h3>
              <p style={{ margin: 0, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {car.description}
              </p>
            </div>
          )}

          {/* Photo Thumbnails */}
          {photoUrls.length > 1 && (
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#333' }}>
                Photos ({photoUrls.length})
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '0.5rem',
              }}>
                {photoUrls.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: index === currentPhotoIndex ? '2px solid #000' : '2px solid transparent',
                      padding: 0,
                      cursor: 'pointer',
                      background: 'none',
                    }}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

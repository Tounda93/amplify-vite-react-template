import { Car as CarIcon } from 'lucide-react';
import type { Schema } from '../../amplify/data/resource';

type Car = Schema['Car']['type'];

interface CarCardProps {
  car: Car;
  makeName: string;
  modelName: string;
  onClick?: () => void;
  compact?: boolean;
}

const FALLBACK_CAR_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80';

export default function CarCard({ car, makeName, modelName, onClick, compact = false }: CarCardProps) {
  const carImage = car.photos && car.photos.length > 0 ? car.photos[0] : null;

  if (compact) {
    // Compact version for dropdowns/lists
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          if (onClick) e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          if (onClick) e.currentTarget.style.backgroundColor = '#fff';
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: '#f3f4f6',
            backgroundImage: carImage ? `url(${carImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {!carImage && <CarIcon size={24} style={{ color: '#9ca3af' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111' }}>
            {car.year} {makeName} {modelName}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {[car.color, car.transmission].filter(Boolean).join(' • ') || 'No details'}
          </div>
        </div>
      </div>
    );
  }

  // Full card version for garage display
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '5px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        height: '280px',
      }}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }
      }}
      onMouseOut={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
      }}
    >
      {/* Car Image - 70% of card height */}
      <div
        style={{
          flex: '0 0 70%',
          backgroundColor: '#f3f4f6',
          backgroundImage: carImage ? `url(${carImage})` : `url(${FALLBACK_CAR_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {!carImage && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CarIcon size={48} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </div>
        )}

        {/* Year badge */}
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
      <div style={{ padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600, color: '#111' }}>
          {makeName} {modelName}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {car.color && (
            <span
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#666',
              }}
            >
              {car.color}
            </span>
          )}
          {car.transmission && (
            <span
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#666',
                textTransform: 'capitalize',
              }}
            >
              {car.transmission.replace('_', ' ')}
            </span>
          )}
          {car.interiorColor && (
            <span
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#666',
              }}
            >
              {car.interiorColor} interior
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 1: Simple Popup WITHOUT a cover photo
// ============================================
// This is like your AddCarPopup - just a form with no image at the top

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BasePopup from './BasePopup';
import { FALLBACKS } from '../utils/fallbacks';

interface AddCarPopupExampleProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCarPopupExample({ isOpen, onClose }: AddCarPopupExampleProps) {
  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      config={{
        title: 'Add a Car to Your Garage',
        // No coverPhoto property = no cover photo!
        maxWidth: '600px',
      }}
    >
      {/* Your form goes here - just the content, no wrapper needed */}
      <form>
        <div style={{ marginBottom: '1rem' }}>
          <label>Make</label>
          <select style={{ width: '100%', padding: '0.75rem' }}>
            <option>Select a make</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>Model</label>
          <select style={{ width: '100%', padding: '0.75rem' }}>
            <option>Select a model</option>
          </select>
        </div>
        
        <button type="submit" style={{ padding: '1rem', width: '100%' }}>
          Add Car
        </button>
      </form>
    </BasePopup>
  );
}


// ============================================
// EXAMPLE 2: Popup WITH a cover photo
// ============================================
// This is like your EventDetailPopup - shows an image at the top

interface EventDetailPopupExampleProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    title: string;
    coverImageUrl?: string;
    description?: string;
    startDate?: string;
    venue?: string;
  } | null;
}

export function EventDetailPopupExample({ isOpen, onClose, event }: EventDetailPopupExampleProps) {
  if (!event) return null;
  
  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      config={{
        title: event.title || 'Event Details',
        
        // This popup HAS a cover photo
        coverPhoto: {
          imageUrl: event.coverImageUrl || FALLBACKS.event,
          imageAlt: event.title,
          height: '250px',                    // Custom height
          fallbackUrl: FALLBACKS.event,       // Backup if image fails to load
        },
        
        maxWidth: '700px',
      }}
    >
      {/* Event details content */}
      <div>
        <p>{event.description || 'No description available.'}</p>
        
        {event.startDate && (
          <p><strong>Date:</strong> {event.startDate}</p>
        )}
        
        {event.venue && (
          <p><strong>Location:</strong> {event.venue}</p>
        )}
        
        <button style={{ padding: '1rem', marginTop: '1rem' }}>
          Join Event
        </button>
      </div>
    </BasePopup>
  );
}


// ============================================
// EXAMPLE 3: Popup with cover photo AND overlay content
// ============================================
// This is like your CarDetailPopup - has navigation arrows over the photo

interface CarDetailPopupExampleProps {
  isOpen: boolean;
  onClose: () => void;
  car: {
    makeName: string;
    modelName: string;
    year?: number;
    photos: string[];
  } | null;
}

export function CarDetailPopupExample({ isOpen, onClose, car }: CarDetailPopupExampleProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  if (!car) return null;
  
  const currentPhoto = car.photos[currentPhotoIndex] || FALLBACKS.car;
  const hasMultiplePhotos = car.photos.length > 1;
  
  // This is the content that appears ON TOP of the cover photo
  const photoNavigation = hasMultiplePhotos && (
    <>
      <button
        onClick={() => setCurrentPhotoIndex(prev => prev - 1)}
        disabled={currentPhotoIndex === 0}
        style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.9)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
        }}
      >
        <ChevronLeft />
      </button>
      
      <button
        onClick={() => setCurrentPhotoIndex(prev => prev + 1)}
        disabled={currentPhotoIndex === car.photos.length - 1}
        style={{
          position: 'absolute',
          right: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.9)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
        }}
      >
        <ChevronRight />
      </button>
      
      {/* Photo counter badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          fontSize: '0.875rem',
        }}
      >
        {currentPhotoIndex + 1} / {car.photos.length}
      </div>
    </>
  );
  
  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      config={{
        title: `${car.year || ''} ${car.makeName} ${car.modelName}`.trim(),
        
        coverPhoto: {
          imageUrl: currentPhoto,
          imageAlt: `${car.makeName} ${car.modelName}`,
          height: '350px',
          fallbackUrl: FALLBACKS.car,
          overlayContent: photoNavigation, // The navigation arrows and counter
        },
        
        maxWidth: '900px',
      }}
    >
      {/* Car details content */}
      <div>
        <h4>Vehicle Details</h4>
        <p>Year: {car.year}</p>
        <p>Make: {car.makeName}</p>
        <p>Model: {car.modelName}</p>
      </div>
    </BasePopup>
  );
}


// ============================================
// QUICK REFERENCE: Configuration Options
// ============================================
/*

BasePopup config options:

1. REQUIRED:
   - title: string              The popup title

2. OPTIONAL:
   - maxWidth: string           Default '600px'
   - maxHeight: string          Default '90vh'
   
3. COVER PHOTO (optional - omit entirely if not needed):
   coverPhoto: {
     imageUrl: string           REQUIRED - the image source
     imageAlt?: string          Optional - defaults to title
     height?: string            Optional - defaults to '200px'
     fallbackUrl?: string       Optional - backup image
     overlayContent?: ReactNode Optional - content over the image
   }

USAGE PATTERN:

// WITHOUT cover photo:
<BasePopup
  isOpen={isOpen}
  onClose={onClose}
  config={{ title: 'My Popup' }}
>
  <YourContent />
</BasePopup>

// WITH cover photo:
<BasePopup
  isOpen={isOpen}
  onClose={onClose}
  config={{
    title: 'My Popup',
    coverPhoto: {
      imageUrl: someImageUrl,
      height: '250px',
    }
  }}
>
  <YourContent />
</BasePopup>

*/

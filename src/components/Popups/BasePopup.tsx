import { ReactNode } from 'react';
import { X } from 'lucide-react';

// ============================================
// CONFIGURATION OPTIONS
// ============================================
// These are the settings each popup can customize

interface BasePopupConfig {
  // The title shown in the header (e.g., "Add a Car", "Event Details")
  title: string;
  
  // COVER PHOTO OPTIONS
  // Set to false (or omit) if your popup doesn't need a cover photo
  coverPhoto?: {
    imageUrl: string;           // The URL of the cover image
    imageAlt?: string;          // Alt text for accessibility (defaults to title)
    height?: string;            // How tall the cover photo area is (default: '200px')
    fallbackUrl?: string;       // Backup image if main one fails to load
    overlayContent?: ReactNode; // Optional content to show ON TOP of the cover photo
                                // (like navigation arrows for a photo gallery)
  };
  
  // SIZE OPTIONS
  maxWidth?: string;   // Maximum width of popup (default: '600px')
  maxHeight?: string;  // Maximum height of popup (default: '90vh')
}

interface BasePopupProps {
  // Is the popup currently visible?
  isOpen: boolean;
  
  // Function to call when popup should close
  onClose: () => void;
  
  // The configuration options from above
  config: BasePopupConfig;
  
  // The actual content of your popup (forms, text, buttons, etc.)
  children: ReactNode;
  
  // Optional: content to put in the header area (right side, next to close button)
  headerActions?: ReactNode;
}

// ============================================
// THE BASE POPUP COMPONENT
// ============================================

export default function BasePopup({
  isOpen,
  onClose,
  config,
  children,
  headerActions,
}: BasePopupProps) {
  // Don't render anything if popup is closed
  if (!isOpen) return null;

  // Extract configuration with defaults
  const {
    title,
    coverPhoto,
    maxWidth = '600px',
    maxHeight = '90vh',
  } = config;

  return (
    // THE DARK OVERLAY
    // Covers the entire screen. Clicking it closes the popup.
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
        // Only close if they clicked directly on the overlay (not the popup content)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* THE POPUP CONTAINER */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* COVER PHOTO SECTION (only if configured) */}
        {coverPhoto && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: coverPhoto.height || '200px',
              flexShrink: 0, // Prevents the cover from shrinking
            }}
          >
            <img
              src={coverPhoto.imageUrl}
              alt={coverPhoto.imageAlt || title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                // If image fails to load and we have a fallback, use it
                if (coverPhoto.fallbackUrl) {
                  (e.target as HTMLImageElement).src = coverPhoto.fallbackUrl;
                }
              }}
            />
            
            {/* Close button positioned over the cover photo */}
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
              <X size={18} />
            </button>
            
            {/* Any overlay content (navigation arrows, badges, etc.) */}
            {coverPhoto.overlayContent}
          </div>
        )}

        {/* HEADER (title + close button) */}
        {/* Only show standard header if there's NO cover photo */}
        {!coverPhoto && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #eee',
              flexShrink: 0,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              {title}
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Any custom header actions */}
              {headerActions}
              
              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f0f0f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* TITLE BELOW COVER PHOTO (if cover photo exists) */}
        {coverPhoto && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #eee',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              {title}
            </h3>
            {headerActions}
          </div>
        )}

        {/* SCROLLABLE CONTENT AREA */}
        {/* This is where your popup's actual content goes */}
        <div
          style={{
            overflowY: 'auto',
            padding: '1.5rem',
            flex: 1, // Takes up remaining space
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

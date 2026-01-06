import { useState, useEffect } from 'react';
import { Car, Plus, Heart, Settings, User, LogOut } from 'lucide-react';

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

export function MyGarageSection({ user, signOut, onSectionChange }: MyGarageSectionProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#666' }}>Loading your garage...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw' }}>
      {/* Account Section - Profile & Sign Out */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 2rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        {/* Profile Button */}
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

        {/* Sign Out Button */}
        {signOut && (
          <button
            onClick={signOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        )}
      </div>

      {/* Garage Header */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 0 2rem 0',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <Car size={48} style={{ color: '#3498db', marginBottom: '1rem' }} />
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: 'bold' }}>
          My Garage
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Manage your collection and wishlist
        </p>
      </div>

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

        <button style={{
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
        margin: '4rem 0'
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

      {/* Coming Soon Banner */}
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '2rem',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '2rem 0'
      }}>
        <p style={{
          margin: 0,
          color: '#1976d2',
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          Full garage management features coming soon!
        </p>
      </div>
    </div>
  );
}

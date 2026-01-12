import { useState, useEffect } from 'react';
import { User, Mail, Calendar, MapPin, Edit, Camera, Shield, LogOut } from 'lucide-react';
import WikiCarAdminPanel from './components/WikiCarAdminPanel';
import { useIsMobile } from './hooks/useIsMobile';

interface AmplifyUser {
  signInDetails?: {
    loginId?: string;
  };
  username?: string;
}

interface ProfileSectionProps {
  user: AmplifyUser | undefined;
  signOut?: () => void;
}

export function ProfileSection({ user, signOut }: ProfileSectionProps) {
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div style={{ width: '100%', backgroundColor: '#FFFFFF', padding: `2rem ${horizontalPadding}` }}>
        <p style={{ color: '#666', textAlign: 'center' }}>Loading profile...</p>
      </div>
    );
  }

  const userEmail = user?.signInDetails?.loginId || 'user@example.com';
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#FFFFFF', minHeight: '100vh', padding: `2rem ${horizontalPadding}` }}>
      {/* Profile Header */}
      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        padding: '3rem',
        marginBottom: '2rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Profile Picture */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3498db, #2980b9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '3rem',
            fontWeight: 'bold',
            border: '4px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {userInitial}
          </div>
          <button style={{
            position: 'absolute',
            bottom: '5px',
            right: '5px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#3498db',
            border: '2px solid white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}>
            <Camera size={18} style={{ color: 'white' }} />
          </button>
        </div>

        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
          {userEmail.split('@')[0]}
        </h1>
        <p style={{ color: '#666', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Mail size={16} />
          {userEmail}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '600',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Edit size={18} />
            Edit Profile
          </button>

          {signOut && (
            <button
              onClick={signOut}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Account Details */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={24} style={{ color: '#3498db' }} />
            Account Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Email Address
              </label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                color: '#374151'
              }}>
                {userEmail}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Member Since
              </label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={16} />
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Location
              </label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                color: '#999',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <MapPin size={16} />
                Not set
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={24} style={{ color: '#3498db' }} />
            Activity
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <span style={{ color: '#666' }}>Cars in Garage</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>0</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <span style={{ color: '#666' }}>Wishlist Items</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>0</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <span style={{ color: '#666' }}>Forum Posts</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
          Settings & Preferences
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
          >
            <span style={{ fontWeight: '500' }}>Email Notifications</span>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Coming Soon</span>
          </button>

          <button style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
          >
            <span style={{ fontWeight: '500' }}>Privacy Settings</span>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Coming Soon</span>
          </button>

          <button style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.2s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
          >
            <span style={{ fontWeight: '500' }}>Change Password</span>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Coming Soon</span>
          </button>
        </div>
      </div>

      <WikiCarAdminPanel />
    </div>
  );
}

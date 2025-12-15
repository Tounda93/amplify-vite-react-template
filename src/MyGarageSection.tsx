import { useState, useEffect } from 'react';
import { Car, Plus, Heart, Settings } from 'lucide-react';

export function MyGarageSection() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#666' }}>Loading your garage...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw' }}>
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

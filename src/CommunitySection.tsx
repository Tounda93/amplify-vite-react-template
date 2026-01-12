import { useState, useEffect } from 'react';
import { Users, MessageCircle, Heart, Share2 } from 'lucide-react';
import { useIsMobile } from './hooks/useIsMobile';

export function CommunitySection() {
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
        <p style={{ color: '#666', textAlign: 'center' }}>Loading community...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', backgroundColor: '#FFFFFF', minHeight: '100vh', padding: `2rem ${horizontalPadding}` }}>
      {/* Community Header */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 0 2rem 0',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <Users size={48} style={{ color: '#3498db', marginBottom: '1rem' }} />
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: 'bold' }}>
          Community
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Connect with fellow car enthusiasts worldwide
        </p>
      </div>

      {/* Feature Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        margin: '3rem 0'
      }}>
        {/* Forums Card */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <MessageCircle size={40} style={{ color: '#3498db', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Forums</h3>
          <p style={{ color: '#666', margin: '0 0 1rem 0' }}>
            Join discussions about your favorite cars
          </p>
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#1976d2'
          }}>
            Coming Soon
          </div>
        </div>

        {/* Groups Card */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <Users size={40} style={{ color: '#3498db', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Groups</h3>
          <p style={{ color: '#666', margin: '0 0 1rem 0' }}>
            Create and join car enthusiast groups
          </p>
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#1976d2'
          }}>
            Coming Soon
          </div>
        </div>

        {/* Events Card */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <Share2 size={40} style={{ color: '#3498db', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Member Events</h3>
          <p style={{ color: '#666', margin: '0 0 1rem 0' }}>
            Organize meetups and car shows
          </p>
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#1976d2'
          }}>
            Coming Soon
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '3rem',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '2rem 0'
      }}>
        <Heart size={48} style={{ color: '#e74c3c', marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 1rem 0' }}>Build Your Network</h2>
        <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          The Collectible community is where car enthusiasts come together to share their passion,
          knowledge, and experiences. Stay tuned for forums, groups, and exclusive member events.
        </p>
      </div>
    </div>
  );
}

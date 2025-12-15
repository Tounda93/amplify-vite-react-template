import { useState, useEffect } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';

export function ChatSection() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#666' }}>Loading chat...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Chat Header */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 0 2rem 0',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <MessageSquare size={48} style={{ color: '#3498db', marginBottom: '1rem' }} />
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: 'bold' }}>
          Chat
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Connect with other collectors in real-time
        </p>
      </div>

      {/* Chat Interface Placeholder */}
      <div style={{
        maxWidth: '1200px',
        margin: '3rem auto',
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '2rem',
        minHeight: '600px'
      }}>
        {/* Sidebar - Contacts */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Conversations</h3>
          <div style={{
            textAlign: 'center',
            padding: '2rem 0',
            color: '#666'
          }}>
            <User size={40} style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.9rem' }}>No conversations yet</p>
          </div>
        </div>

        {/* Main Chat Area */}
        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <MessageSquare size={64} style={{ color: '#3498db', marginBottom: '1.5rem' }} />
          <h2 style={{ margin: '0 0 1rem 0' }}>Chat Feature Coming Soon</h2>
          <p style={{ color: '#666', textAlign: 'center', maxWidth: '500px', lineHeight: '1.6' }}>
            Soon you'll be able to chat with other car enthusiasts, share photos,
            discuss restoration tips, and connect with buyers and sellers.
          </p>

          {/* Mock Message Input */}
          <div style={{
            width: '100%',
            maxWidth: '600px',
            marginTop: '2rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input
              type="text"
              placeholder="Type a message..."
              disabled
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#ffffff',
                color: '#999',
                cursor: 'not-allowed'
              }}
            />
            <button
              disabled
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Send size={18} />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        margin: '3rem 0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <MessageSquare size={28} style={{ color: '#1976d2' }} />
          </div>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Direct Messages</h4>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Send private messages to other members
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <User size={28} style={{ color: '#1976d2' }} />
          </div>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Group Chats</h4>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Create group conversations with friends
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Send size={28} style={{ color: '#1976d2' }} />
          </div>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Share Photos</h4>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Share images of your collection
          </p>
        </div>
      </div>
    </div>
  );
}

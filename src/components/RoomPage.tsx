import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { getImageUrl } from '../utils/storageHelpers';
import { getRoomById, getRoomShareUrl, RoomRecord } from '../utils/roomsStorage';
import { addRoomPost, generatePostId, loadRoomPosts, RoomPost } from '../utils/roomPostsStorage';

interface LocationState {
  showShare?: boolean;
  roomUrl?: string;
}

export default function RoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [posts, setPosts] = useState<RoomPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const roomId = useMemo(() => {
    const path = location.pathname;
    const parts = path.split('/rooms/');
    return parts[1] || '';
  }, [location.pathname]);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setCoverUrl(null);
      setPosts([]);
      return;
    }
    const found = getRoomById(roomId);
    setRoom(found);
    if (found?.coverImage) {
      getImageUrl(found.coverImage).then((url) => setCoverUrl(url));
    } else {
      setCoverUrl(null);
    }
    setPosts(loadRoomPosts(roomId));
  }, [roomId]);

  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.showShare) {
      const url = state.roomUrl || getRoomShareUrl(roomId);
      setShareUrl(url);
      setShowShareModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate, roomId]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return;
    }
    window.prompt('Copy this room URL:', shareUrl);
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: room?.name || 'Collectible Room',
          url: shareUrl,
        });
        return;
      } catch {
        // fall back to copy
      }
    }
    await handleCopy();
  };

  const handleCreatePost = () => {
    if (!room || !newPost.trim()) {
      return;
    }
    const post: RoomPost = {
      id: generatePostId(),
      roomId: room.id,
      content: newPost.trim(),
      createdAt: new Date().toISOString(),
      authorName: room.creatorName || 'Owner',
    };
    const updated = addRoomPost(post);
    setPosts(updated);
    setNewPost('');
  };

  if (!room) {
    return (
      <div style={{ width: '100%', backgroundColor: '#F2F3F5', padding: `2rem ${horizontalPadding}` }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '2rem',
          textAlign: 'center',
          color: '#6b7280',
        }}>
          Room not found.
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', backgroundColor: '#F2F3F5', padding: `2rem ${horizontalPadding}` }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '260px',
            backgroundColor: '#e5e7eb',
            backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
          <div style={{ padding: '1.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>{room.name}</h1>
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid #e5e7eb',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#111',
                backgroundColor: '#f9fafb',
              }}>
                {room.isPublic ? 'Public room' : 'Private room'}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#6b7280',
              }}>
                {room.memberCount ?? 0} members
              </span>
            </div>
            <p style={{ margin: '0.75rem 0 0', color: '#6b7280' }}>
              {room.description || 'No description yet.'}
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write something..."
            rows={3}
            style={{
              width: '100%',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              padding: '0.75rem',
              resize: 'vertical',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCreatePost}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                border: '1px solid #111',
                background: '#111',
                color: '#fff',
                fontWeight: 600,
                cursor: newPost.trim() ? 'pointer' : 'not-allowed',
                opacity: newPost.trim() ? 1 : 0.5,
              }}
            >
              Post
            </button>
          </div>
        </div>

        {posts.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            color: '#6b7280',
            textAlign: 'center',
          }}>
            No posts yet. Start the conversation!
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                {post.authorName} • {new Date(post.createdAt).toLocaleDateString('en-GB')}
              </div>
              <div style={{ fontSize: '0.95rem', color: '#111' }}>
                {post.content}
              </div>
            </div>
          ))
        )}

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          color: '#6b7280',
          textAlign: 'center',
        }}>
          Rooms are shared with anyone who has the link.
        </div>
      </div>

      {showShareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShareModal(false);
            }
          }}
        >
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '480px',
          }}>
            <h3 style={{ marginTop: 0 }}>Room URL</h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              wordBreak: 'break-all',
              marginBottom: '1rem',
            }}>
              <span style={{ flex: 1 }}>{shareUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid #111',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Copy
              </button>
              <button
                type="button"
                onClick={handleShare}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid #111',
                  background: '#111',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Share
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '999px',
                border: '1px solid #111',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

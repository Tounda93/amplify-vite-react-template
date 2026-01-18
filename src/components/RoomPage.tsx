import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { uploadData } from 'aws-amplify/storage';
import { getImageUrl } from '../utils/storageHelpers';
import { getRoomById, getRoomShareUrl, RoomRecord, updateRoom } from '../utils/roomsStorage';
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
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showJoinMenu, setShowJoinMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);
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
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('collectible.roomMemberships');
      const memberships = stored ? (JSON.parse(stored) as string[]) : [];
      setIsJoined(memberships.includes(roomId));
    }
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

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !room) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setCoverUrl(preview);
    };
    reader.readAsDataURL(file);

    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const result = await uploadData({
        path: ({ identityId }) => `room-photos/${identityId}/${timestamp}-${safeName}`,
        data: file,
        options: { contentType: file.type },
      }).result;
      const updated = updateRoom(room.id, { coverImage: result.path });
      if (updated) {
        setRoom(updated);
        const resolved = await getImageUrl(result.path);
        if (resolved) {
          setCoverUrl(resolved);
        }
      }
    } catch (error) {
      console.error('Failed to upload cover photo', error);
      alert('Failed to upload cover photo. Please try again.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const persistMembership = (joined: boolean) => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('collectible.roomMemberships');
    const memberships = stored ? (JSON.parse(stored) as string[]) : [];
    const next = joined
      ? Array.from(new Set([...memberships, roomId]))
      : memberships.filter((id) => id !== roomId);
    window.localStorage.setItem('collectible.roomMemberships', JSON.stringify(next));
  };

  const handleJoinToggle = (nextJoined: boolean) => {
    setIsJoined(nextJoined);
    persistMembership(nextJoined);
    setShowJoinMenu(false);
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

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      e.target.value = '';
    }
  };

  const handlePostFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      alert('Please use Upload image for image files');
      e.target.value = '';
    }
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
            height: '340px',
            backgroundColor: '#e5e7eb',
            backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer',
          }} onClick={() => setShowCoverModal(true)} />
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>{room.name}</h1>
                <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111' }}>
                    {room.isPublic ? 'Public room' : 'Private room'}
                  </span>
                  <span style={{ width: '20px', height: '1px', backgroundColor: '#d1d5db' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>
                    {room.memberCount ?? 0} members
                  </span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: '#6b7280', flex: '1 1 60%' }}>
                {room.description || 'No description yet.'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleShare}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '999px',
                    border: '1px solid #111',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  Share
                </button>
                {isJoined ? (
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setShowJoinMenu((prev) => !prev)}
                      style={{
                        padding: '0.4rem 0.9rem',
                        borderRadius: '999px',
                        border: '1px solid #111',
                        background: '#111',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Joined
                    </button>
                    {showJoinMenu && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '120%',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                        padding: '0.5rem',
                        zIndex: 5,
                      }}>
                        <button
                          type="button"
                          onClick={() => handleJoinToggle(false)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Leave group
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleJoinToggle(true)}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '999px',
                      border: '1px solid #111',
                      background: '#111',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    Join group
                  </button>
                )}
              </div>
            </div>
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
          <input
            ref={postImageInputRef}
            type="file"
            accept="image/*"
            onChange={handlePostImageSelect}
            style={{ display: 'none' }}
          />
          <input
            ref={postFileInputRef}
            type="file"
            onChange={handlePostFileSelect}
            style={{ display: 'none' }}
          />
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => postImageInputRef.current?.click()}
              style={{
                padding: '0.36rem 0.8rem',
                borderRadius: '999px',
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#111',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Upload image
            </button>
            <button
              type="button"
              onClick={() => postFileInputRef.current?.click()}
              style={{
                padding: '0.36rem 0.8rem',
                borderRadius: '999px',
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#111',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Upload file
            </button>
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

      {showCoverModal && (
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
              setShowCoverModal(false);
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '1rem',
              maxWidth: '720px',
              width: '100%',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '420px',
                borderRadius: '10px',
                backgroundColor: '#f3f4f6',
                backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111',
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              {!coverUrl && room.name.slice(0, 1)}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                right: '24px',
                bottom: '24px',
                padding: '0.6rem 1.25rem',
                borderRadius: '999px',
                border: '1px solid #111',
                backgroundColor: '#111',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Change cover photo
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

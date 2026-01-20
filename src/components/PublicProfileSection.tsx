import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getImageUrl } from '../utils/storageHelpers';

const client = generateClient<Schema>();

type Profile = Schema['Profile']['type'];
type FriendRequest = Schema['FriendRequest']['type'];

interface PublicProfileSectionProps {
  profile: Profile;
  currentUserId: string | null;
  onBack?: () => void;
  onFriendUpdated?: () => void;
}

type FriendStatus = 'self' | 'friends' | 'pending-sent' | 'pending-received' | 'none';

export default function PublicProfileSection({
  profile,
  currentUserId,
  onBack,
  onFriendUpdated,
}: PublicProfileSectionProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<FriendStatus>('none');
  const [pendingRequest, setPendingRequest] = useState<FriendRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const targetUserId = profile.ownerId || profile.id;

  useEffect(() => {
    const resolveAvatar = async () => {
      if (profile.avatarUrl) {
        const resolved = await getImageUrl(profile.avatarUrl);
        setAvatarUrl(resolved);
      } else {
        setAvatarUrl(null);
      }
    };
    resolveAvatar();
  }, [profile.avatarUrl]);

  useEffect(() => {
    const loadStatus = async () => {
      if (!currentUserId) {
        setStatus('none');
        setLoading(false);
        return;
      }
      if (currentUserId === targetUserId) {
        setStatus('self');
        setLoading(false);
        return;
      }
      try {
        const { data: friends } = await client.models.Friend.list({
          filter: {
            userId: { eq: currentUserId },
            friendId: { eq: targetUserId },
          },
        });
        if (friends && friends.length > 0) {
          setStatus('friends');
          setLoading(false);
          return;
        }

        const { data: outgoing } = await client.models.FriendRequest.list({
          filter: {
            senderId: { eq: currentUserId },
            receiverId: { eq: targetUserId },
            status: { eq: 'pending' },
          },
        });
        if (outgoing && outgoing.length > 0) {
          setStatus('pending-sent');
          setPendingRequest(outgoing[0]);
          setLoading(false);
          return;
        }

        const { data: incoming } = await client.models.FriendRequest.list({
          filter: {
            senderId: { eq: targetUserId },
            receiverId: { eq: currentUserId },
            status: { eq: 'pending' },
          },
        });
        if (incoming && incoming.length > 0) {
          setStatus('pending-received');
          setPendingRequest(incoming[0]);
          setLoading(false);
          return;
        }

        setStatus('none');
      } catch (error) {
        console.error('Failed to load friend status', error);
      } finally {
        setLoading(false);
      }
    };
    loadStatus();
  }, [currentUserId, targetUserId]);

  const handleSendRequest = async () => {
    if (!currentUserId || currentUserId === targetUserId) return;
    setLoading(true);
    try {
      const { data: existing } = await client.models.FriendRequest.list({
        filter: {
          senderId: { eq: currentUserId },
          receiverId: { eq: targetUserId },
          status: { eq: 'pending' },
        },
      });
      if (existing && existing.length > 0) {
        setStatus('pending-sent');
        setPendingRequest(existing[0]);
        return;
      }
      const { data: incoming } = await client.models.FriendRequest.list({
        filter: {
          senderId: { eq: targetUserId },
          receiverId: { eq: currentUserId },
          status: { eq: 'pending' },
        },
      });
      if (incoming && incoming.length > 0) {
        setStatus('pending-received');
        setPendingRequest(incoming[0]);
        return;
      }
      const created = await client.models.FriendRequest.create({
        senderId: currentUserId,
        receiverId: targetUserId,
        status: 'pending',
      });
      setPendingRequest(created.data ?? null);
      setStatus('pending-sent');
    } catch (error) {
      console.error('Failed to send friend request', error);
    } finally {
      setLoading(false);
      onFriendUpdated?.();
    }
  };

  const handleAccept = async () => {
    if (!currentUserId || !pendingRequest) return;
    setLoading(true);
    try {
      await client.models.FriendRequest.update({
        id: pendingRequest.id,
        status: 'accepted',
      });
      await client.models.Friend.create({
        userId: currentUserId,
        friendId: targetUserId,
      });
      await client.models.Friend.create({
        userId: targetUserId,
        friendId: currentUserId,
      });
      setStatus('friends');
      setPendingRequest(null);
    } catch (error) {
      console.error('Failed to accept friend request', error);
    } finally {
      setLoading(false);
      onFriendUpdated?.();
    }
  };

  const handleReject = async () => {
    if (!pendingRequest) return;
    setLoading(true);
    try {
      await client.models.FriendRequest.update({
        id: pendingRequest.id,
        status: 'rejected',
      });
      setStatus('none');
      setPendingRequest(null);
    } catch (error) {
      console.error('Failed to reject friend request', error);
    } finally {
      setLoading(false);
      onFriendUpdated?.();
    }
  };

  const displayName = profile.displayName || profile.nickname || 'Unknown user';

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      padding: '2rem',
      minHeight: '400px',
      marginTop: '2rem',
    }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#111827',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '1rem',
          }}
        >
          Back to friends
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          backgroundColor: '#d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 600,
          color: '#111827',
          overflow: 'hidden',
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            displayName[0]
          )}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{displayName}</h2>
          {profile.location && <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>{profile.location}</p>}
          {profile.bio && <p style={{ margin: 0, color: '#374151' }}>{profile.bio}</p>}
        </div>
      </div>

      <div>
        {status === 'self' && (
          <button type="button" disabled style={{
            padding: '0.6rem 1rem',
            borderRadius: '999px',
            border: '1px solid #d1d5db',
            background: '#f3f4f6',
            color: '#6b7280',
          }}>
            This is you
          </button>
        )}
        {status === 'friends' && (
          <button type="button" disabled style={{
            padding: '0.6rem 1rem',
            borderRadius: '999px',
            border: '1px solid #d1d5db',
            background: '#f3f4f6',
            color: '#111827',
          }}>
            Friends
          </button>
        )}
        {status === 'pending-sent' && (
          <button type="button" disabled style={{
            padding: '0.6rem 1rem',
            borderRadius: '999px',
            border: '1px solid #d1d5db',
            background: '#f3f4f6',
            color: '#6b7280',
          }}>
            Request sent
          </button>
        )}
        {status === 'pending-received' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '999px',
                border: 'none',
                background: '#111827',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={loading}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '999px',
                border: '1px solid #111827',
                background: '#fff',
                color: '#111827',
                cursor: 'pointer',
              }}
            >
              Reject
            </button>
          </div>
        )}
        {status === 'none' && (
          <button
            type="button"
            onClick={handleSendRequest}
            disabled={loading}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '999px',
              border: 'none',
              background: '#111827',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Add friend
          </button>
        )}
      </div>
    </div>
  );
}

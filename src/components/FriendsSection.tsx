import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getImageUrl } from '../utils/storageHelpers';

const client = generateClient<Schema>();

type Profile = Schema['Profile']['type'];
type Friend = Schema['Friend']['type'];

interface FriendsSectionProps {
  currentUserId: string | null;
  refreshKey?: number;
  onSelectProfile: (profile: Profile) => void;
}

export default function FriendsSection({
  currentUserId,
  refreshKey = 0,
  onSelectProfile,
}: FriendsSectionProps) {
  const [friends, setFriends] = useState<Array<Profile & { resolvedAvatar?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFriends = async () => {
      if (!currentUserId) {
        setFriends([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data } = await client.models.Friend.list({
          filter: { userId: { eq: currentUserId } }
        });
        const friendRecords = (data || []) as Friend[];
        const profiles = await Promise.all(
          friendRecords.map(async (friend) => {
            const { data: byOwner } = await client.models.Profile.list({
              filter: { ownerId: { eq: friend.friendId } }
            });
            const profile = byOwner?.[0];
            if (!profile) {
              const { data: byId } = await client.models.Profile.get({ id: friend.friendId });
              return byId ?? null;
            }
            return profile;
          })
        );
        const validProfiles = profiles.filter((p): p is NonNullable<typeof p> => p !== null);
        const resolved = await Promise.all(
          validProfiles.map(async (profile) => ({
            ...profile,
            resolvedAvatar: profile.avatarUrl ? (await getImageUrl(profile.avatarUrl)) ?? undefined : undefined,
          }))
        );
        setFriends(resolved);
      } catch (error) {
        console.error('Failed to load friends', error);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [currentUserId, refreshKey]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: '#6b7280' }}>
        Loading friends...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      padding: '1.5rem',
      minHeight: '400px',
      marginTop: '2rem',
    }}>
      <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Friends</h2>
      {friends.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          padding: '2rem 0',
        }}>
          Go make some friends
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {friends.map((friend) => (
            <button
              key={friend.id}
              type="button"
              onClick={() => onSelectProfile(friend)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#d1d5db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111827',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {friend.resolvedAvatar ? (
                  <img
                    src={friend.resolvedAvatar}
                    alt={friend.displayName || friend.nickname || 'Friend'}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  (friend.displayName || friend.nickname || 'U')[0]
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#111827' }}>
                  {friend.displayName || friend.nickname || 'Unknown user'}
                </div>
                {friend.location && (
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{friend.location}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

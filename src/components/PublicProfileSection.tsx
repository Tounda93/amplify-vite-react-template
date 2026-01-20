import { useEffect, useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { getImageUrl } from '../utils/storageHelpers';

type Profile = Schema['Profile']['type'];

interface PublicProfileSectionProps {
  profile: Profile;
  currentUserId: string | null;
  onBack?: () => void;
}

export default function PublicProfileSection({
  profile,
  currentUserId,
  onBack,
}: PublicProfileSectionProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const targetUserId = profile.ownerId || profile.id;
  const isSelf = currentUserId ? currentUserId === targetUserId : false;

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

  const displayName = profile.displayName || profile.username || profile.nickname || 'Unknown user';

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
        <button
          type="button"
          disabled={isSelf}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '999px',
            border: '1px solid #111827',
            background: isSelf ? '#f3f4f6' : '#111827',
            color: isSelf ? '#6b7280' : '#fff',
            cursor: isSelf ? 'not-allowed' : 'pointer',
          }}
        >
          + Add friend
        </button>
      </div>
    </div>
  );
}

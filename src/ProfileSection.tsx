import { useState, useEffect, useRef } from 'react';
import { User, Calendar, MapPin, Edit, Shield, LogOut } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import { useIsMobile } from './hooks/useIsMobile';
import { getImageUrl } from './utils/storageHelpers';
import { normalizePhoneNumber } from './utils/sanitize';
import './ProfileSection.css';

const client = generateClient<Schema>();

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
  const userLoginId = user?.signInDetails?.loginId || user?.username || '';
  const derivedUsername = userLoginId.includes('@') ? userLoginId.split('@')[0] : userLoginId;
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const session = await fetchAuthSession();
        const userId = session.tokens?.idToken?.payload?.sub as string | undefined;
        setCurrentUserId(userId ?? null);
      } catch (error) {
        console.error('Failed to load user session', error);
      }
    };
    loadUserId();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await client.models.Profile.list({
          limit: 1,
          filter: currentUserId ? { ownerId: { eq: currentUserId } } : undefined,
        });
        const profile = data?.[0];
        if (profile?.id) {
          setProfileId(profile.id);
          const updates: Partial<Schema['Profile']['type']> = {};
          if (!profile.username && derivedUsername) updates.username = derivedUsername;
          if (!profile.email && userLoginId) updates.email = userLoginId;
          if (!profile.displayName && derivedUsername) updates.displayName = derivedUsername;
          if (Object.keys(updates).length > 0) {
            await client.models.Profile.update({
              id: profile.id,
              ...updates,
            });
          }
        }
        if (profile?.phoneNumber) {
          setPhoneNumber(profile.phoneNumber);
        }
        if (profile?.avatarUrl) {
          const resolved = await getImageUrl(profile.avatarUrl);
          if (resolved) {
            setAvatarPreview(resolved);
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('collectible.profileAvatar', resolved);
            }
          }
        } else if (typeof window !== 'undefined') {
          const cached = window.localStorage.getItem('collectible.profileAvatar');
          if (cached) {
            setAvatarPreview(cached);
          }
        }
      } catch (error) {
        console.error('Failed to load profile', error);
        if (typeof window !== 'undefined') {
          const cached = window.localStorage.getItem('collectible.profileAvatar');
          if (cached) {
            setAvatarPreview(cached);
          }
        }
      }
    };

    loadProfile();
  }, [currentUserId]);

  const handleSavePhone = async () => {
    setSavingPhone(true);
    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      if (profileId) {
        await client.models.Profile.update({
          id: profileId,
          phoneNumber: normalizedPhone || undefined,
          username: derivedUsername || undefined,
          email: userLoginId || undefined,
          displayName: derivedUsername || undefined,
        });
      } else {
        const created = await client.models.Profile.create({
          ownerId: currentUserId || undefined,
          phoneNumber: normalizedPhone || undefined,
          username: derivedUsername || undefined,
          email: userLoginId || undefined,
          displayName: derivedUsername || undefined,
        });
        setProfileId(created.data?.id ?? null);
      }
      setPhoneNumber(normalizedPhone);
    } catch (error) {
      console.error('Failed to save phone number', error);
      alert('Failed to save phone number. Please try again.');
    } finally {
      setSavingPhone(false);
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', backgroundColor: '#FFFFFF', padding: `2rem ${horizontalPadding}` }}>
        <p style={{ color: '#666', textAlign: 'center' }}>Loading profile...</p>
      </div>
    );
  }

  const userEmail = user?.signInDetails?.loginId || 'user@example.com';
  const userInitial = userEmail.charAt(0).toUpperCase();

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = previewUrl;
    setPendingAvatar(previewUrl);
    setPendingFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmAvatar = async () => {
    if (!pendingFile) {
      return;
    }
    setUploadingAvatar(true);
    try {
      const timestamp = Date.now();
      const sanitizedName = pendingFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const result = await uploadData({
        path: ({ identityId }) => `profile-photos/${identityId}/${timestamp}-${sanitizedName}`,
        data: pendingFile,
        options: {
          contentType: pendingFile.type,
        },
      }).result;

      if (profileId) {
        await client.models.Profile.update({
          id: profileId,
          avatarUrl: result.path,
          username: derivedUsername || undefined,
          email: userLoginId || undefined,
          displayName: derivedUsername || undefined,
        });
      } else {
        const created = await client.models.Profile.create({
          ownerId: currentUserId || undefined,
          avatarUrl: result.path,
          username: derivedUsername || undefined,
          email: userLoginId || undefined,
          displayName: derivedUsername || undefined,
        });
        setProfileId(created.data?.id ?? null);
      }

      const resolved = await getImageUrl(result.path);
      if (resolved) {
        setAvatarPreview(resolved);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('collectible.profileAvatar', resolved);
        }
      }
      setPendingAvatar(null);
      setPendingFile(null);
    } catch (error) {
      console.error('Failed to upload profile image', error);
      alert('Failed to upload profile image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#F2F3F5', minHeight: '100vh', padding: `2rem ${horizontalPadding}` }}>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <div
            className="profile-avatar"
            style={{
              backgroundImage: (pendingAvatar || avatarPreview) ? `url(${pendingAvatar || avatarPreview})` : undefined,
              backgroundSize: (pendingAvatar || avatarPreview) ? 'contain' : 'cover',
            }}
            onClick={() => setIsAvatarModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsAvatarModalOpen(true);
              }
            }}
            aria-label="Open profile photo"
          >
            {!pendingAvatar && !avatarPreview && userInitial}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className="profile-info-card">
          <div className="profile-info-main">
            <h1 className="profile-name">{userEmail.split('@')[0]}</h1>
            <div className="profile-location">
              <MapPin size={16} />
              <span>Location not set</span>
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="profile-action profile-action--primary"
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Edit size={18} />
              Edit Profile
            </button>

            {signOut && (
              <button
                onClick={signOut}
                className="profile-action profile-action--danger"
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

            <div>
              <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                Phone Number
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Add phone number"
                  style={{
                    flex: '1 1 200px',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    color: '#111',
                  }}
                />
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '6px',
                    border: '1px solid #111827',
                    backgroundColor: '#111827',
                    color: '#fff',
                    cursor: savingPhone ? 'not-allowed' : 'pointer',
                    opacity: savingPhone ? 0.6 : 1,
                    fontWeight: 600,
                  }}
                >
                  {savingPhone ? 'Saving...' : 'Save'}
                </button>
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

      {isAvatarModalOpen && (
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
              setIsAvatarModalOpen(false);
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '1rem',
              maxWidth: '600px',
              width: '100%',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '420px',
                borderRadius: '10px',
                backgroundColor: '#f3f4f6',
                backgroundImage: (pendingAvatar || avatarPreview) ? `url(${pendingAvatar || avatarPreview})` : 'none',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111',
                fontSize: '3rem',
                fontWeight: 700,
              }}
            >
              {!pendingAvatar && !avatarPreview && userInitial}
            </div>
            <button
              type="button"
              onClick={() => {
                if (uploadingAvatar) {
                  return;
                }
                if (pendingAvatar) {
                  handleConfirmAvatar();
                  return;
                }
                fileInputRef.current?.click();
              }}
              style={{
                position: 'absolute',
                right: '24px',
                bottom: '24px',
                padding: '0.6rem 1.25rem',
                borderRadius: '999px',
                backgroundColor: '#e1e1e1b6',
                color: '#020202',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                opacity: uploadingAvatar ? 0.6 : 1,
              }}
            >
              {pendingAvatar ? 'Confirm photo' : avatarPreview ? 'Change photo' : 'Upload photo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

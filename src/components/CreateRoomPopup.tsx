import { useState, useRef } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { Upload, X, Plus, Link, Users } from 'lucide-react';

interface CreateRoomPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: () => void;
}

export default function CreateRoomPopup({ isOpen, onClose, onRoomCreated }: CreateRoomPopupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Input states for dynamic fields
  const [ruleInput, setRuleInput] = useState('');
  const [linkInput, setLinkInput] = useState({ title: '', url: '' });

  const [newRoom, setNewRoom] = useState({
    title: '',
    description: '',
    rules: [] as string[],
    links: [] as { title: string; url: string }[],
    allowMemberEvents: false,
    isPublic: true,
    members: [] as string[],
    applicationRules: '',
    coverImage: '',
  });

  // Mock friends list (placeholder until friends feature is implemented)
  const mockFriends = [
    { id: '1', name: 'John Doe', avatar: '' },
    { id: '2', name: 'Jane Smith', avatar: '' },
    { id: '3', name: 'Mike Johnson', avatar: '' },
    { id: '4', name: 'Sarah Williams', avatar: '' },
    { id: '5', name: 'Chris Brown', avatar: '' },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      const result = await uploadData({
        path: ({ identityId }) => `room-photos/${identityId}/${timestamp}-${sanitizedName}`,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      setNewRoom({ ...newRoom, coverImage: result.path });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setNewRoom({ ...newRoom, coverImage: '' });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addRule = () => {
    const trimmed = ruleInput.trim();
    if (trimmed && newRoom.rules.length < 10) {
      setNewRoom({ ...newRoom, rules: [...newRoom.rules, trimmed] });
      setRuleInput('');
    }
  };

  const removeRule = (index: number) => {
    setNewRoom({ ...newRoom, rules: newRoom.rules.filter((_, i) => i !== index) });
  };

  const addLink = () => {
    if (linkInput.title.trim() && linkInput.url.trim() && newRoom.links.length < 10) {
      setNewRoom({ ...newRoom, links: [...newRoom.links, { title: linkInput.title.trim(), url: linkInput.url.trim() }] });
      setLinkInput({ title: '', url: '' });
    }
  };

  const removeLink = (index: number) => {
    setNewRoom({ ...newRoom, links: newRoom.links.filter((_, i) => i !== index) });
  };

  const toggleMember = (memberId: string) => {
    if (newRoom.members.includes(memberId)) {
      setNewRoom({ ...newRoom, members: newRoom.members.filter(id => id !== memberId) });
    } else {
      setNewRoom({ ...newRoom, members: [...newRoom.members, memberId] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // TODO: Save room to database when Room model is added
      console.log('Creating room:', newRoom);
      alert('Room created successfully!');

      resetForm();
      onRoomCreated?.();
      onClose();
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error saving room');
    }
  };

  const resetForm = () => {
    setNewRoom({
      title: '',
      description: '',
      rules: [],
      links: [],
      allowMemberEvents: false,
      isPublic: true,
      members: [],
      applicationRules: '',
      coverImage: '',
    });
    setImagePreview(null);
    setRuleInput('');
    setLinkInput({ title: '', url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    boxSizing: 'border-box' as const,
    fontSize: '0.875rem',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 600,
    fontSize: '0.875rem',
    color: '#333',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #eee',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            Create New Room
          </h3>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: '#f0f0f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', padding: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Title */}
              <div>
                <label style={labelStyle}>Room Title *</label>
                <input
                  type="text"
                  value={newRoom.title}
                  onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
                  required
                  placeholder="e.g., Classic Porsche Enthusiasts"
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="Describe your room..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Cover Image */}
              <div>
                <label style={labelStyle}>Cover Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />

                {!imagePreview && !newRoom.coverImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #ccc',
                      borderRadius: '8px',
                      padding: '2rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#fafafa',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#000'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#ccc'}
                  >
                    {uploading ? (
                      <p style={{ margin: 0, color: '#666' }}>Uploading...</p>
                    ) : (
                      <>
                        <Upload size={32} style={{ color: '#999', marginBottom: '0.5rem' }} />
                        <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                          Click to upload image (max 5MB)
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={imagePreview || newRoom.coverImage}
                      alt="Cover preview"
                      style={{
                        maxWidth: '300px',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#dc3545',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Public/Private Toggle */}
              <div>
                <label style={labelStyle}>Room Visibility *</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, isPublic: true })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: newRoom.isPublic ? '2px solid #000' : '1px solid #ddd',
                      backgroundColor: newRoom.isPublic ? '#f8f8f8' : '#fff',
                      cursor: 'pointer',
                      fontWeight: newRoom.isPublic ? 600 : 400,
                    }}
                  >
                    Public Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, isPublic: false })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: !newRoom.isPublic ? '2px solid #000' : '1px solid #ddd',
                      backgroundColor: !newRoom.isPublic ? '#f8f8f8' : '#fff',
                      cursor: 'pointer',
                      fontWeight: !newRoom.isPublic ? 600 : 400,
                    }}
                  >
                    Private Room
                  </button>
                </div>
              </div>

              {/* Allow Member Events Toggle */}
              <div>
                <label style={labelStyle}>Allow members to create public events</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, allowMemberEvents: true })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: newRoom.allowMemberEvents ? '2px solid #000' : '1px solid #ddd',
                      backgroundColor: newRoom.allowMemberEvents ? '#f8f8f8' : '#fff',
                      cursor: 'pointer',
                      fontWeight: newRoom.allowMemberEvents ? 600 : 400,
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, allowMemberEvents: false })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: !newRoom.allowMemberEvents ? '2px solid #000' : '1px solid #ddd',
                      backgroundColor: !newRoom.allowMemberEvents ? '#f8f8f8' : '#fff',
                      cursor: 'pointer',
                      fontWeight: !newRoom.allowMemberEvents ? 600 : 400,
                    }}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Rules (up to 10) */}
              <div>
                <label style={labelStyle}>Rules (up to 10)</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={ruleInput}
                    onChange={(e) => setRuleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRule();
                      }
                    }}
                    placeholder="e.g., Be respectful to all members"
                    disabled={newRoom.rules.length >= 10}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      opacity: newRoom.rules.length >= 10 ? 0.5 : 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={addRule}
                    disabled={!ruleInput.trim() || newRoom.rules.length >= 10}
                    style={{
                      padding: '0.75rem 1rem',
                      background: (!ruleInput.trim() || newRoom.rules.length >= 10) ? '#ccc' : '#000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (!ruleInput.trim() || newRoom.rules.length >= 10) ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {newRoom.rules.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {newRoom.rules.map((rule, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f5f5f5',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                        }}
                      >
                        <span style={{ color: '#666', fontWeight: 600, minWidth: '24px' }}>{index + 1}.</span>
                        <span style={{ flex: 1 }}>{rule}</span>
                        <button
                          type="button"
                          onClick={() => removeRule(index)}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#dc3545',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
                  {newRoom.rules.length}/10 rules added
                </p>
              </div>

              {/* Links (up to 10) */}
              <div>
                <label style={labelStyle}>Links (up to 10)</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={linkInput.title}
                    onChange={(e) => setLinkInput({ ...linkInput, title: e.target.value })}
                    placeholder="Link title"
                    disabled={newRoom.links.length >= 10}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      opacity: newRoom.links.length >= 10 ? 0.5 : 1,
                    }}
                  />
                  <input
                    type="url"
                    value={linkInput.url}
                    onChange={(e) => setLinkInput({ ...linkInput, url: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLink();
                      }
                    }}
                    placeholder="https://..."
                    disabled={newRoom.links.length >= 10}
                    style={{
                      ...inputStyle,
                      flex: 2,
                      opacity: newRoom.links.length >= 10 ? 0.5 : 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    disabled={!linkInput.title.trim() || !linkInput.url.trim() || newRoom.links.length >= 10}
                    style={{
                      padding: '0.75rem 1rem',
                      background: (!linkInput.title.trim() || !linkInput.url.trim() || newRoom.links.length >= 10) ? '#ccc' : '#000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (!linkInput.title.trim() || !linkInput.url.trim() || newRoom.links.length >= 10) ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {newRoom.links.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {newRoom.links.map((link, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f5f5f5',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                        }}
                      >
                        <Link size={14} style={{ color: '#666' }} />
                        <span style={{ fontWeight: 500 }}>{link.title}</span>
                        <span style={{ color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {link.url}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#dc3545',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
                  {newRoom.links.length}/10 links added
                </p>
              </div>

              {/* Add Members */}
              <div>
                <label style={labelStyle}>
                  <Users size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  Add Members (from your friends)
                </label>
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {mockFriends.length > 0 ? (
                    mockFriends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => toggleMember(friend.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          backgroundColor: newRoom.members.includes(friend.id) ? '#f0f7ff' : 'transparent',
                          borderBottom: '1px solid #eee',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#666',
                        }}>
                          {friend.name.charAt(0)}
                        </div>
                        <span style={{ flex: 1, fontSize: '0.875rem' }}>{friend.name}</span>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: newRoom.members.includes(friend.id) ? '2px solid #000' : '2px solid #ccc',
                          backgroundColor: newRoom.members.includes(friend.id) ? '#000' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {newRoom.members.includes(friend.id) && (
                            <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ padding: '1rem', color: '#666', textAlign: 'center', margin: 0 }}>
                      No friends to add. Add friends from your profile first.
                    </p>
                  )}
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
                  {newRoom.members.length} member{newRoom.members.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              {/* Application Rules */}
              <div>
                <label style={labelStyle}>Application Rules</label>
                <textarea
                  value={newRoom.applicationRules}
                  onChange={(e) => setNewRoom({ ...newRoom, applicationRules: e.target.value })}
                  placeholder="Describe the requirements for new members to join this room..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
                  Leave empty if no application is required
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !newRoom.title.trim()}
                style={{
                  padding: '0.75rem 2rem',
                  background: (uploading || !newRoom.title.trim()) ? '#ccc' : '#000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (uploading || !newRoom.title.trim()) ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Create Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

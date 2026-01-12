import { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';
import { Upload, X } from 'lucide-react';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain',
  'Belgium', 'Netherlands', 'Switzerland', 'Austria', 'Japan', 'Australia',
  'Canada', 'United Arab Emirates', 'Monaco', 'Portugal', 'Sweden', 'Norway',
];

interface CreateEventPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: () => void;
}

export default function CreateEventPopup({ isOpen, onClose, onEventCreated }: CreateEventPopupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [restrictionInput, setRestrictionInput] = useState('');

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    venue: '',
    city: '',
    country: '',
    startDate: '',
    endDate: '',
    coverImage: '',
    website: '',
    ticketUrl: '',
    price: '',
    restrictions: [] as string[],
  });

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
      const key = `events/${timestamp}-${sanitizedName}`;

      await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      const urlResult = await getUrl({ key });
      const imageUrl = urlResult.url.toString().split('?')[0];

      setNewEvent({ ...newEvent, coverImage: imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setNewEvent({ ...newEvent, coverImage: '' });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const startDateISO = newEvent.startDate
        ? new Date(newEvent.startDate + 'T00:00:00').toISOString()
        : '';
      const endDateISO = newEvent.endDate
        ? new Date(newEvent.endDate + 'T23:59:59').toISOString()
        : undefined;

      const eventData = {
        title: newEvent.title,
        description: newEvent.description || undefined,
        eventType: 'other' as Event['eventType'],
        venue: newEvent.venue || undefined,
        city: newEvent.city,
        country: newEvent.country,
        startDate: startDateISO,
        endDate: endDateISO,
        coverImage: newEvent.coverImage || undefined,
        website: newEvent.website || undefined,
        ticketUrl: newEvent.ticketUrl || undefined,
        price: newEvent.price || undefined,
        restrictions: newEvent.restrictions.length > 0 ? newEvent.restrictions : undefined,
        isPublished: true,
      };

      await client.models.Event.create(eventData);
      alert('Event created successfully!');

      resetForm();
      onEventCreated?.();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      venue: '',
      city: '',
      country: '',
      startDate: '',
      endDate: '',
      coverImage: '',
      website: '',
      ticketUrl: '',
      price: '',
      restrictions: [],
    });
    setImagePreview(null);
    setRestrictionInput('');
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
            Create New Event
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
          <form onSubmit={handleSubmitEvent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* ROW 1: Event Title */}
              <div>
                <label style={labelStyle}>Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                  placeholder="e.g., Goodwood Festival of Speed"
                  style={inputStyle}
                />
              </div>

              {/* ROW 2: Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Describe the event..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* ROW 3: Upload Cover Image */}
              <div>
                <label style={labelStyle}>Upload Cover Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />

                {!imagePreview && !newEvent.coverImage ? (
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
                      src={imagePreview || newEvent.coverImage}
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

              {/* ROW 4: Start Date, End Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* ROW 5: Country, City, Venue */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Country *</label>
                  <select
                    value={newEvent.country}
                    onChange={(e) => setNewEvent({ ...newEvent, country: e.target.value })}
                    required
                    style={inputStyle}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input
                    type="text"
                    value={newEvent.city}
                    onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                    required
                    placeholder="e.g., Chichester"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Venue</label>
                  <input
                    type="text"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    placeholder="e.g., Goodwood Estate"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* ROW 6: Website, Ticket URL, Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input
                    type="url"
                    value={newEvent.website}
                    onChange={(e) => setNewEvent({ ...newEvent, website: e.target.value })}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ticket URL</label>
                  <input
                    type="url"
                    value={newEvent.ticketUrl}
                    onChange={(e) => setNewEvent({ ...newEvent, ticketUrl: e.target.value })}
                    placeholder="https://..."
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Price</label>
                  <input
                    type="text"
                    value={newEvent.price}
                    onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                    placeholder="e.g., Free, $50"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* ROW 7: Restrictions */}
              <div>
                <label style={labelStyle}>Restrictions (max 3, up to 3 words each)</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={restrictionInput}
                    onChange={(e) => {
                      const words = e.target.value.trim().split(/\s+/);
                      if (words.length <= 3) {
                        setRestrictionInput(e.target.value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = restrictionInput.trim();
                        if (trimmed && newEvent.restrictions.length < 3) {
                          setNewEvent({
                            ...newEvent,
                            restrictions: [...newEvent.restrictions, trimmed]
                          });
                          setRestrictionInput('');
                        }
                      }
                    }}
                    placeholder="e.g., Members Only, Pre-1970 Cars"
                    disabled={newEvent.restrictions.length >= 3}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      opacity: newEvent.restrictions.length >= 3 ? 0.5 : 1,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = restrictionInput.trim();
                      if (trimmed && newEvent.restrictions.length < 3) {
                        setNewEvent({
                          ...newEvent,
                          restrictions: [...newEvent.restrictions, trimmed]
                        });
                        setRestrictionInput('');
                      }
                    }}
                    disabled={!restrictionInput.trim() || newEvent.restrictions.length >= 3}
                    style={{
                      padding: '0.75rem 1rem',
                      background: (!restrictionInput.trim() || newEvent.restrictions.length >= 3) ? '#ccc' : '#000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (!restrictionInput.trim() || newEvent.restrictions.length >= 3) ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    Add
                  </button>
                </div>
                {newEvent.restrictions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {newEvent.restrictions.map((restriction, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.375rem 0.75rem',
                          background: '#e9ecef',
                          borderRadius: '999px',
                          fontSize: '0.875rem',
                          color: '#333',
                        }}
                      >
                        <span>{restriction}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewEvent({
                              ...newEvent,
                              restrictions: newEvent.restrictions.filter((_, i) => i !== index)
                            });
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#6c757d',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            fontSize: '12px',
                            lineHeight: 1,
                          }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
                  {newEvent.restrictions.length}/3 restrictions added
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
                disabled={uploading}
                style={{
                  padding: '0.75rem 2rem',
                  background: uploading ? '#ccc' : '#000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

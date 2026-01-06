import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import { isAdminEmail } from './constants/admins';
import { Card } from './components/Card';
import { useIsMobile } from './hooks/useIsMobile';
import { Upload, X } from 'lucide-react';
import './EventsSection.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain',
  'Belgium', 'Netherlands', 'Switzerland', 'Austria', 'Japan', 'Australia',
  'Canada', 'United Arab Emirates', 'Monaco', 'Portugal', 'Sweden', 'Norway',
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

export function EventsSection() {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '1rem' : '5rem';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // New event form
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
  });

  useEffect(() => {
    checkAdminStatus();
    loadEvents();

    const subscription = client.models.Event.observeQuery().subscribe({
      next: ({ items }) => {
        const published = items.filter(e => e.isPublished !== false);
        setEvents(published);
        filterUpcomingEvents(published);
        setLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const session = await fetchAuthSession();
      const email = session.tokens?.idToken?.payload?.email as string | undefined;
      const admin = isAdminEmail(email);
      setIsAdmin(admin);
    } catch (error) {
      console.log('Not logged in:', error);
      setIsAdmin(false);
    }
  };

  const loadEvents = async () => {
    try {
      const { data } = await client.models.Event.list({ limit: 500 });
      const published = (data || []).filter(e => e.isPublished !== false);
      setEvents(published);
      filterUpcomingEvents(published);
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const filterUpcomingEvents = (allEvents: Event[]) => {
    const now = new Date();
    const upcoming = allEvents
      .filter(e => new Date(e.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    setUpcomingEvents(upcoming);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `events/${timestamp}-${sanitizedName}`;

      // Upload to S3
      await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      // Get the URL
      const urlResult = await getUrl({ key });
      const imageUrl = urlResult.url.toString().split('?')[0]; // Remove query params for cleaner URL

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
      // Convert date strings to start of day ISO strings
      const startDateISO = newEvent.startDate
        ? new Date(newEvent.startDate + 'T00:00:00').toISOString()
        : '';
      const endDateISO = newEvent.endDate
        ? new Date(newEvent.endDate + 'T23:59:59').toISOString()
        : undefined;

      const eventData = {
        title: newEvent.title,
        description: newEvent.description || undefined,
        eventType: 'other' as Event['eventType'], // Default type
        venue: newEvent.venue || undefined,
        city: newEvent.city,
        country: newEvent.country,
        startDate: startDateISO,
        endDate: endDateISO,
        coverImage: newEvent.coverImage || undefined,
        website: newEvent.website || undefined,
        ticketUrl: newEvent.ticketUrl || undefined,
        price: newEvent.price || undefined,
        isPublished: true,
      };

      if (editingEvent) {
        await client.models.Event.update({ id: editingEvent.id, ...eventData });
        alert('Event updated successfully!');
      } else {
        await client.models.Event.create(eventData);
        alert('Event created successfully!');
      }

      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      venue: event.venue || '',
      city: event.city,
      country: event.country,
      startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 10) : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 10) : '',
      coverImage: event.coverImage || '',
      website: event.website || '',
      ticketUrl: event.ticketUrl || '',
      price: event.price || '',
    });
    setImagePreview(event.coverImage || null);
    setShowAddForm(true);
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    try {
      await client.models.Event.delete({ id: event.id });
    } catch (error) {
      console.error('Error deleting event:', error);
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
    });
    setEditingEvent(null);
    setShowAddForm(false);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCardClick = (event: Event) => {
    console.log('Event clicked:', event);
  };

  if (loading) {
    return (
      <div className="events-section" style={{ padding: horizontalPadding }}>
        <div className="events-section__loading">
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

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
    <div className="events-section" style={{ width: '100%', overflowX: 'hidden' }}>
      <div
        className="events-section__content"
        style={{ padding: `2rem ${horizontalPadding}` }}
      >
        {/* Admin Controls */}
        {isAdmin && (
          <div className="events-section__admin-bar">
            <span className="events-section__admin-label">
              Admin Mode
            </span>
            <button
              onClick={() => { setShowAddForm(!showAddForm); if (showAddForm) resetForm(); }}
              className={`events-section__admin-btn ${showAddForm ? 'events-section__admin-btn--cancel' : 'events-section__admin-btn--add'}`}
            >
              {showAddForm ? 'Cancel' : '+ Add Event'}
            </button>
          </div>
        )}

        {/* Add/Edit Event Form (Admin Only) */}
        {isAdmin && showAddForm && (
          <div style={{
            background: '#f8f9fa',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '2px solid #28a745',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h3>
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
                        backgroundColor: '#fff',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = '#28a745'}
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
              </div>

              {/* Submit Buttons */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: '0.75rem 2rem',
                    background: uploading ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Title Section */}
        <div className="events-section__title-wrapper">
          <h2 className="events-section__title">Upcoming events</h2>
          <div className="events-section__separator-line" />
        </div>

        {/* Events Grid */}
        {upcomingEvents.length > 0 ? (
          <div className="events-section__grid">
            {upcomingEvents.map((event) => (
              <div key={event.id} style={{ position: 'relative' }}>
                <Card
                  imageUrl={event.coverImage || FALLBACK_IMAGE}
                  title1="EVENT"
                  title2={event.title}
                  separatorText={event.city && event.country ? `${event.city}, ${event.country}` : undefined}
                  requirement={event.price || undefined}
                  onClick={() => handleCardClick(event)}
                />
                {/* Admin Controls on Card */}
                {isAdmin && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0.5rem',
                    left: '0.5rem',
                    right: '0.5rem',
                    display: 'flex',
                    gap: '0.25rem',
                    zIndex: 10,
                  }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                      style={{
                        flex: 1,
                        padding: '0.25rem',
                        background: '#ffc107',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event); }}
                      style={{
                        flex: 1,
                        padding: '0.25rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="events-section__empty">
            <div className="events-section__empty-icon">No events found</div>
            <h3>No Upcoming Events</h3>
            <p>
              {events.length === 0
                ? 'No automotive events have been added yet.'
                : 'Check back soon for upcoming events.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

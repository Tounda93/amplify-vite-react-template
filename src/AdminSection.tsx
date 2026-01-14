import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import {
  Home,
  Calendar,
  BookOpen,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import './AdminSection.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];
type Magazine = Schema['Magazine']['type'];

type AdminTab = 'home' | 'events' | 'magazines' | 'settings';

export function AdminSection() {
  const [activeTab, setActiveTab] = useState<AdminTab>('home');

  const tabs: { id: AdminTab; label: string; icon: typeof Calendar }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'magazines', label: 'Magazines', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <h1>Back Office</h1>
        <p>Manage your website content</p>
      </div>

      {/* Tab Navigation */}
      <div className="admin-section__tabs">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-section__tab ${activeTab === tab.id ? 'admin-section__tab--active' : ''}`}
            >
              <IconComponent size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="admin-section__content">
        {activeTab === 'home' && <HomeAdmin />}
        {activeTab === 'events' && <EventsAdmin />}
        {activeTab === 'magazines' && <MagazinesAdmin />}
        {activeTab === 'settings' && <SettingsAdmin />}
      </div>
    </div>
  );
}

// ============================================
// HOME ADMIN - Hero Content Management
// ============================================
const HERO_STORAGE_KEY = 'collectible_hero_content';

interface HeroContent {
  imageUrl?: string;
  videoUrl?: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  todaysHighlight?: string;
}

const DEFAULT_HERO_CONTENT: HeroContent = {
  videoUrl: 'https://www.youtube.com/watch?v=bI_mT2SWWOI',
  imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=2000&q=80&auto=format&fit=crop',
  title: 'Welcome to Collectible',
  subtitle: 'Curated encyclopedia for enthusiasts by enthusiasts.',
  ctaText: 'Explore Events',
  ctaLink: '#section=events',
  todaysHighlight: "Today's pick",
};

function HomeAdmin() {
  const [formData, setFormData] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved hero content on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HERO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as HeroContent;
        setFormData({ ...DEFAULT_HERO_CONTENT, ...parsed });
      }
    } catch (err) {
      console.error('Failed to load saved hero content', err);
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileName = `hero/${Date.now()}-${file.name}`;
      await uploadData({
        path: fileName,
        data: file,
        options: { contentType: file.type }
      }).result;
      const urlResult = await getUrl({ path: fileName });
      const imageUrl = urlResult.url.toString().split('?')[0];
      setFormData(prev => ({ ...prev, imageUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(formData));
      alert('Hero content saved successfully! Refresh the homepage to see changes.');
    } catch (err) {
      console.error('Failed to save hero content', err);
      alert('Failed to save hero content');
    }
    setSaving(false);
  };

  const handleReset = () => {
    if (confirm('Reset to default hero content?')) {
      setFormData(DEFAULT_HERO_CONTENT);
      localStorage.removeItem(HERO_STORAGE_KEY);
      alert('Hero content reset to defaults.');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Homepage Hero Management</h2>
      </div>

      <div style={{ maxWidth: '800px' }}>
        {/* Preview */}
        <div style={{
          marginBottom: '2rem',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          height: '300px',
          backgroundColor: '#1a1a2e',
        }}>
          {formData.videoUrl ? (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
            }}>
              <p style={{ color: '#fff', fontSize: '0.875rem' }}>
                Video preview: {formData.videoUrl}
              </p>
            </div>
          ) : formData.imageUrl ? (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${formData.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2d2d4a',
            }}>
              <p style={{ color: '#888' }}>No media selected</p>
            </div>
          )}
          {/* Overlay preview */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '1.5rem',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            color: 'white',
          }}>
            {formData.todaysHighlight && (
              <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.5rem 0', opacity: 0.8 }}>
                {formData.todaysHighlight}
              </p>
            )}
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{formData.title || 'Hero Title'}</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.85 }}>{formData.subtitle || 'Subtitle text'}</p>
          </div>
        </div>

        {/* Form */}
        <div className="admin-form">
          <div className="admin-form__grid">
            {/* Media Section */}
            <div className="admin-form__field admin-form__field--full">
              <label>YouTube Video URL</label>
              <input
                type="url"
                value={formData.videoUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                If a video URL is provided, it will be used instead of the image
              </p>
            </div>

            <div className="admin-form__field admin-form__field--full">
              <label>Fallback Image</label>
              <div className="admin-form__image-upload">
                <input
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  style={{ flex: 1 }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="admin-btn admin-btn--secondary"
                  disabled={uploading}
                >
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                Used when video is not available or as background
              </p>
            </div>

            {/* Content Section */}
            <div className="admin-form__field admin-form__field--full">
              <label>Today's Highlight Label</label>
              <input
                type="text"
                value={formData.todaysHighlight || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, todaysHighlight: e.target.value }))}
                placeholder="e.g., Today's pick"
              />
            </div>

            <div className="admin-form__field admin-form__field--full">
              <label>Hero Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Main headline"
                required
              />
            </div>

            <div className="admin-form__field admin-form__field--full">
              <label>Subtitle / Description *</label>
              <textarea
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Supporting text under the title"
                rows={3}
                required
              />
            </div>

            {/* CTA Section */}
            <div className="admin-form__field">
              <label>CTA Button Text</label>
              <input
                type="text"
                value={formData.ctaText || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                placeholder="e.g., Learn More"
              />
            </div>

            <div className="admin-form__field">
              <label>CTA Button Link</label>
              <input
                type="text"
                value={formData.ctaLink || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                placeholder="e.g., #section=events or /page"
              />
            </div>
          </div>

          <div className="admin-form__actions">
            <button
              type="button"
              onClick={handleReset}
              className="admin-btn admin-btn--secondary"
            >
              Reset to Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="admin-btn admin-btn--primary"
              disabled={saving || !formData.title || !formData.subtitle}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EVENTS ADMIN
// ============================================
function EventsAdmin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    eventType: 'car_show' | 'race' | 'auction' | 'meet' | 'rally' | 'festival' | 'exhibition' | 'track_day' | 'other';
    venue: string;
    city: string;
    country: string;
    startDate: string;
    endDate: string;
    coverImage: string;
    website: string;
    ticketUrl: string;
    price: string;
    restrictions: string[];
    isPublished: boolean;
    isFeatured: boolean;
  }>({
    title: '',
    description: '',
    eventType: 'car_show',
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
    isPublished: true,
    isFeatured: false,
  });
  const [restrictionInput, setRestrictionInput] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Event.list({ limit: 500 });
      // Sort by start date descending
      const sorted = (data || []).sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      setEvents(sorted);
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileName = `events/${Date.now()}-${file.name}`;
      await uploadData({
        path: fileName,
        data: file,
        options: { contentType: file.type }
      }).result;
      const urlResult = await getUrl({ path: fileName });
      const imageUrl = urlResult.url.toString().split('?')[0];
      setFormData(prev => ({ ...prev, coverImage: imageUrl }));
      setImagePreview(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const addRestriction = () => {
    const trimmed = restrictionInput.trim();
    if (!trimmed) return;
    const words = trimmed.split(/\s+/);
    if (words.length > 3) {
      alert('Maximum 3 words per restriction');
      return;
    }
    if (formData.restrictions.length >= 3) {
      alert('Maximum 3 restrictions allowed');
      return;
    }
    setFormData(prev => ({
      ...prev,
      restrictions: [...prev.restrictions, trimmed]
    }));
    setRestrictionInput('');
  };

  const removeRestriction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      restrictions: prev.restrictions.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventType: 'car_show',
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
      isPublished: true,
      isFeatured: false,
    });
    setEditingEvent(null);
    setShowForm(false);
    setImagePreview(null);
    setRestrictionInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      eventType: event.eventType || 'car_show',
      venue: event.venue || '',
      city: event.city || '',
      country: event.country || '',
      startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
      coverImage: event.coverImage || '',
      website: event.website || '',
      ticketUrl: event.ticketUrl || '',
      price: event.price || '',
      restrictions: (event.restrictions || []).filter((r): r is string => r !== null),
      isPublished: event.isPublished !== false,
      isFeatured: event.isFeatured === true,
    });
    setImagePreview(event.coverImage || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.city || !formData.country || !formData.startDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || undefined,
        eventType: formData.eventType,
        venue: formData.venue || undefined,
        city: formData.city,
        country: formData.country,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        coverImage: formData.coverImage || undefined,
        website: formData.website || undefined,
        ticketUrl: formData.ticketUrl || undefined,
        price: formData.price || undefined,
        restrictions: formData.restrictions.length > 0 ? formData.restrictions : undefined,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
      };

      if (editingEvent) {
        await client.models.Event.update({
          id: editingEvent.id,
          ...eventData,
        });
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

  const handleDelete = async (event: Event) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;

    try {
      await client.models.Event.delete({ id: event.id });
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event');
    }
  };

  const togglePublished = async (event: Event) => {
    try {
      await client.models.Event.update({
        id: event.id,
        isPublished: !event.isPublished,
      });
      loadEvents();
    } catch (error) {
      console.error('Error toggling published:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="admin-loading">Loading events...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Events Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="admin-btn admin-btn--primary"
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => resetForm()}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
              <button onClick={resetForm} className="admin-modal__close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form__grid">
                <div className="admin-form__field admin-form__field--full">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="admin-form__field">
                  <label>Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value as typeof formData.eventType }))}
                  >
                    <option value="car_show">Car Show</option>
                    <option value="race">Race</option>
                    <option value="auction">Auction</option>
                    <option value="meet">Meet</option>
                    <option value="rally">Rally</option>
                    <option value="festival">Festival</option>
                    <option value="exhibition">Exhibition</option>
                    <option value="track_day">Track Day</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="admin-form__field">
                  <label>Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  />
                </div>

                <div className="admin-form__field">
                  <label>City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form__field">
                  <label>Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form__field">
                  <label>Start Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form__field">
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>

                <div className="admin-form__field">
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>

                <div className="admin-form__field">
                  <label>Ticket URL</label>
                  <input
                    type="url"
                    value={formData.ticketUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, ticketUrl: e.target.value }))}
                  />
                </div>

                <div className="admin-form__field">
                  <label>Price</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g., Free, $50, €25-€100"
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Cover Image</label>
                  <div className="admin-form__image-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="admin-btn admin-btn--secondary"
                      disabled={uploading}
                    >
                      <Upload size={16} />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="admin-form__image-preview" />
                    )}
                  </div>
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Restrictions (max 3, max 3 words each)</label>
                  <div className="admin-form__restrictions">
                    <div className="admin-form__restriction-input">
                      <input
                        type="text"
                        value={restrictionInput}
                        onChange={(e) => setRestrictionInput(e.target.value)}
                        placeholder="e.g., Members only"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRestriction())}
                      />
                      <button type="button" onClick={addRestriction} className="admin-btn admin-btn--small">
                        Add
                      </button>
                    </div>
                    <div className="admin-form__restriction-pills">
                      {formData.restrictions.map((r, i) => (
                        <span key={i} className="admin-pill">
                          {r}
                          <button type="button" onClick={() => removeRestriction(i)}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                    />
                    Published
                  </label>
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    />
                    Featured
                  </label>
                </div>
              </div>

              <div className="admin-form__actions">
                <button type="button" onClick={resetForm} className="admin-btn admin-btn--secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={uploading}>
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Date</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>
                  <div className="admin-table__title-cell">
                    {event.coverImage && (
                      <img src={event.coverImage} alt="" className="admin-table__thumbnail" />
                    )}
                    <span>{event.title}</span>
                  </div>
                </td>
                <td>{event.city}, {event.country}</td>
                <td>{formatDate(event.startDate)}</td>
                <td>
                  <span className="admin-badge">{event.eventType?.replace('_', ' ')}</span>
                </td>
                <td>
                  <button
                    onClick={() => togglePublished(event)}
                    className={`admin-status ${event.isPublished ? 'admin-status--published' : 'admin-status--draft'}`}
                  >
                    {event.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                    {event.isPublished ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td>
                  <div className="admin-table__actions">
                    <button onClick={() => handleEdit(event)} className="admin-action-btn" title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(event)} className="admin-action-btn admin-action-btn--danger" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <div className="admin-empty">No events found. Create your first event!</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAGAZINES ADMIN
// ============================================
function MagazinesAdmin() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState<Magazine | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverImage: '',
    price: '',
    priceInterval: 'month',
    websiteUrl: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    loadMagazines();
  }, []);

  const loadMagazines = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Magazine.list({ limit: 100 });
      const sorted = (data || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setMagazines(sorted);
    } catch (error) {
      console.error('Error loading magazines:', error);
    }
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileName = `magazines/${Date.now()}-${file.name}`;
      await uploadData({
        path: fileName,
        data: file,
        options: { contentType: file.type }
      }).result;
      const urlResult = await getUrl({ path: fileName });
      const imageUrl = urlResult.url.toString().split('?')[0];
      setFormData(prev => ({ ...prev, coverImage: imageUrl }));
      setImagePreview(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      coverImage: '',
      price: '',
      priceInterval: 'month',
      websiteUrl: '',
      isActive: true,
      sortOrder: magazines.length,
    });
    setEditingMagazine(null);
    setShowForm(false);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (magazine: Magazine) => {
    setEditingMagazine(magazine);
    setFormData({
      name: magazine.name || '',
      description: magazine.description || '',
      coverImage: magazine.coverImage || '',
      price: magazine.price || '',
      priceInterval: magazine.priceInterval || 'month',
      websiteUrl: magazine.websiteUrl || '',
      isActive: magazine.isActive !== false,
      sortOrder: magazine.sortOrder || 0,
    });
    setImagePreview(magazine.coverImage || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      alert('Please fill in name and price');
      return;
    }

    try {
      const magazineData = {
        name: formData.name,
        description: formData.description || undefined,
        coverImage: formData.coverImage || undefined,
        price: formData.price,
        priceInterval: formData.priceInterval,
        websiteUrl: formData.websiteUrl || undefined,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };

      if (editingMagazine) {
        await client.models.Magazine.update({
          id: editingMagazine.id,
          ...magazineData,
        });
        alert('Magazine updated successfully!');
      } else {
        await client.models.Magazine.create(magazineData);
        alert('Magazine created successfully!');
      }

      resetForm();
      loadMagazines();
    } catch (error) {
      console.error('Error saving magazine:', error);
      alert('Error saving magazine');
    }
  };

  const handleDelete = async (magazine: Magazine) => {
    if (!confirm(`Are you sure you want to delete "${magazine.name}"?`)) return;

    try {
      await client.models.Magazine.delete({ id: magazine.id });
      loadMagazines();
    } catch (error) {
      console.error('Error deleting magazine:', error);
      alert('Error deleting magazine');
    }
  };

  const toggleActive = async (magazine: Magazine) => {
    try {
      await client.models.Magazine.update({
        id: magazine.id,
        isActive: !magazine.isActive,
      });
      loadMagazines();
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading magazines...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Magazines Management</h2>
        <button
          onClick={() => { setFormData(prev => ({ ...prev, sortOrder: magazines.length })); setShowForm(true); }}
          className="admin-btn admin-btn--primary"
        >
          <Plus size={18} />
          Add Magazine
        </button>
      </div>

      {/* Magazine Form Modal */}
      {showForm && (
        <div className="admin-modal-overlay" onClick={() => resetForm()}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>{editingMagazine ? 'Edit Magazine' : 'Add New Magazine'}</h3>
              <button onClick={resetForm} className="admin-modal__close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form__grid">
                <div className="admin-form__field admin-form__field--full">
                  <label>Magazine Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="admin-form__field">
                  <label>Price *</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g., 9,99€"
                    required
                  />
                </div>

                <div className="admin-form__field">
                  <label>Price Interval</label>
                  <select
                    value={formData.priceInterval}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceInterval: e.target.value }))}
                  >
                    <option value="month">Per Month</option>
                    <option value="year">Per Year</option>
                  </select>
                </div>

                <div className="admin-form__field">
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                  />
                </div>

                <div className="admin-form__field">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Cover Image</label>
                  <div className="admin-form__image-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="admin-btn admin-btn--secondary"
                      disabled={uploading}
                    >
                      <Upload size={16} />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="admin-form__image-preview admin-form__image-preview--magazine" />
                    )}
                  </div>
                </div>

                <div className="admin-form__field">
                  <label className="admin-form__checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="admin-form__actions">
                <button type="button" onClick={resetForm} className="admin-btn admin-btn--secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={uploading}>
                  {editingMagazine ? 'Update Magazine' : 'Create Magazine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Magazines Grid */}
      <div className="admin-magazines-grid">
        {magazines.map((magazine) => (
          <div key={magazine.id} className={`admin-magazine-card ${!magazine.isActive ? 'admin-magazine-card--inactive' : ''}`}>
            <div
              className="admin-magazine-card__image"
              style={{ backgroundImage: magazine.coverImage ? `url(${magazine.coverImage})` : undefined }}
            />
            <div className="admin-magazine-card__content">
              <h4>{magazine.name}</h4>
              <p className="admin-magazine-card__price">
                {magazine.price} per {magazine.priceInterval}
              </p>
              <div className="admin-magazine-card__actions">
                <button
                  onClick={() => toggleActive(magazine)}
                  className={`admin-status admin-status--small ${magazine.isActive ? 'admin-status--published' : 'admin-status--draft'}`}
                >
                  {magazine.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => handleEdit(magazine)} className="admin-action-btn" title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(magazine)} className="admin-action-btn admin-action-btn--danger" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {magazines.length === 0 && (
          <div className="admin-empty">No magazines found. Create your first magazine!</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SETTINGS ADMIN
// ============================================
function SettingsAdmin() {
  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Settings</h2>
      </div>
      <div className="admin-settings">
        <div className="admin-settings__section">
          <h3>General Settings</h3>
          <p>Site configuration options will be available here.</p>
        </div>
        <div className="admin-settings__section">
          <h3>Coming Soon</h3>
          <ul>
            <li>RSS Feed configuration</li>
            <li>Homepage layout settings</li>
            <li>User management</li>
            <li>Analytics dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import { getImageUrl } from './utils/storageHelpers';
import { getRoomShareUrl, loadRooms, RoomRecord } from './utils/roomsStorage';
import { FALLBACKS } from './utils/fallbacks';
import {
  Calendar,
  BookOpen,
  Gavel,
  Users,
  Car,
  Settings,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import './AdminSection.css';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];
type Magazine = Schema['Magazine']['type'];
type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];
type Auction = Schema['Auction']['type'];

type MagazineWithImageUrl = Magazine & { imageUrl?: string };

type AdminTab = 'events' | 'rooms' | 'magazines' | 'auctions' | 'wikicars' | 'settings';

declare global {
  interface Window {
    google?: any;
  }
}

export function AdminSection() {
  const [activeTab, setActiveTab] = useState<AdminTab>('events');

  const tabs: { id: AdminTab; label: string; icon: typeof Calendar }[] = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'rooms', label: 'Rooms', icon: Users },
    { id: 'magazines', label: 'Magazines', icon: BookOpen },
    { id: 'auctions', label: 'Auctions', icon: Gavel },
    { id: 'wikicars', label: 'WikiCars', icon: Car },
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
        {activeTab === 'events' && <EventsAdmin />}
        {activeTab === 'rooms' && <RoomsAdmin />}
        {activeTab === 'magazines' && <MagazinesAdmin />}
        {activeTab === 'auctions' && <AuctionsAdmin />}
        {activeTab === 'wikicars' && <WikiCarsAdmin />}
        {activeTab === 'settings' && <SettingsAdmin />}
      </div>
    </div>
  );
}

// ============================================
// EVENTS ADMIN
// ============================================
type EventWithImageUrl = Event & { imageUrl?: string };

function EventsAdmin() {
  const [events, setEvents] = useState<EventWithImageUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    eventType: 'car_show' | 'race' | 'auction' | 'meet' | 'rally' | 'festival' | 'exhibition' | 'track_day' | 'other';
    venue: string;
    address: string;
    googleMapsAddress: string;
    city: string;
    region: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    startDate: string;
    startTime: string;
    startTimeZone: string;
    endDate: string;
    endTime: string;
    endTimeZone: string;
    coverImage: string;
    coverImageUrl: string;
    website: string;
    ticketUrl: string;
    price: string;
    restrictions: string[];
    isPublished: boolean;
    isFeatured: boolean;
    visibility: 'public' | 'members';
  }>({
    title: '',
    description: '',
    eventType: 'other',
    venue: '',
    address: '',
    googleMapsAddress: '',
    city: '',
    region: '',
    country: '',
    latitude: null,
    longitude: null,
    startDate: '',
    startTime: '',
    startTimeZone: '',
    endDate: '',
    endTime: '',
    endTimeZone: '',
    coverImage: '',
    coverImageUrl: '',
    website: '',
    ticketUrl: '',
    price: '',
    restrictions: [],
    isPublished: true,
    isFeatured: false,
    visibility: 'public',
  });
  const [restrictionInput, setRestrictionInput] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [coverUrlInput, setCoverUrlInput] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (!showForm) return;
    if (autocompleteRef.current || !locationInputRef.current) return;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!apiKey) return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="places"]'
    );
    if (existingScript) {
      initializePlacesAutocomplete();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'places';
    script.onload = () => initializePlacesAutocomplete();
    document.head.appendChild(script);
  }, [showForm]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Event.list({ limit: 500 });
      // Sort by start date descending
      const sorted = (data || []).sort((a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      // Resolve image URLs for display
      const eventsWithUrls = await Promise.all(
        sorted.map(async (event) => {
          const imageUrl = event.coverImage
            ? await getImageUrl(event.coverImage)
            : event.coverImageUrl || undefined;
          return { ...event, imageUrl: imageUrl || undefined };
        })
      );

      setEvents(eventsWithUrls);
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      // Use identity-based path pattern that matches storage configuration
      const result = await uploadData({
        path: ({ identityId }) => `event-photos/${identityId}/${timestamp}-${sanitizedName}`,
        data: file,
        options: { contentType: file.type }
      }).result;

      // Store the path, not the signed URL (which expires)
      setFormData(prev => ({ ...prev, coverImage: result.path }));
      setImagePreview(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
    setUploading(false);
  };

  const initializePlacesAutocomplete = () => {
    if (!locationInputRef.current || !window.google?.maps?.places) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      locationInputRef.current,
      { fields: ['address_components', 'formatted_address', 'geometry'] }
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place) return;

      const addressComponents = place.address_components || [];
      const getComponent = (type: string) =>
        addressComponents.find((component: { types: string[]; long_name: string }) => component.types.includes(type))?.long_name || '';

      const city = getComponent('locality') || getComponent('postal_town');
      const region = getComponent('administrative_area_level_1');
      const country = getComponent('country');
      const formattedAddress = place.formatted_address || locationQuery;

      const latitude = place.geometry?.location?.lat?.() ?? null;
      const longitude = place.geometry?.location?.lng?.() ?? null;

      setLocationQuery(formattedAddress);
      setFormData(prev => ({
        ...prev,
        address: formattedAddress,
        googleMapsAddress: formattedAddress,
        city,
        region,
        country,
        latitude,
        longitude,
      }));
    });
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

  const padNumber = (value: number) => value.toString().padStart(2, '0');

  const toLocalDateInput = (date: Date) =>
    `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

  const toLocalTimeInput = (date: Date) =>
    `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;

  const roundToNearestHour = (date: Date) => {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    if (minutes >= 30) {
      rounded.setHours(rounded.getHours() + 1);
    }
    rounded.setMinutes(0, 0, 0);
    return rounded;
  };

  const getLocalTimeZone = () =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const getDefaultStartDateTime = () => {
    const start = new Date();
    start.setHours(start.getHours() + 1);
    const roundedStart = roundToNearestHour(start);
    return {
      date: toLocalDateInput(roundedStart),
      time: toLocalTimeInput(roundedStart),
    };
  };

  const addHoursToLocal = (date: string, time: string, hours: number) => {
    if (!date || !time) {
      return { date: '', time: '' };
    }
    const base = new Date(`${date}T${time}`);
    if (Number.isNaN(base.getTime())) {
      return { date: '', time: '' };
    }
    base.setHours(base.getHours() + hours);
    const rounded = roundToNearestHour(base);
    return {
      date: toLocalDateInput(rounded),
      time: toLocalTimeInput(rounded),
    };
  };

  const buildEmptyFormData = () => {
    const defaultStart = getDefaultStartDateTime();
    const defaultEnd = addHoursToLocal(defaultStart.date, defaultStart.time, 2);
    const timeZone = getLocalTimeZone();

    return {
      title: '',
      description: '',
      eventType: 'other' as const,
      venue: '',
      address: '',
      googleMapsAddress: '',
      city: '',
      region: '',
      country: '',
      latitude: null,
      longitude: null,
      startDate: defaultStart.date,
      startTime: defaultStart.time,
      startTimeZone: timeZone,
      endDate: defaultEnd.date,
      endTime: defaultEnd.time,
      endTimeZone: timeZone,
      coverImage: '',
      coverImageUrl: '',
      website: '',
      ticketUrl: '',
      price: '',
      restrictions: [] as string[],
      isPublished: true,
      isFeatured: false,
      visibility: 'public' as const,
    };
  };

  const resetForm = () => {
    setFormData(buildEmptyFormData());
    setEditingEvent(null);
    setShowForm(false);
    setImagePreview(null);
    setRestrictionInput('');
    setLocationQuery('');
    setCoverUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openNewEventForm = () => {
    setFormData(buildEmptyFormData());
    setEditingEvent(null);
    setImagePreview(null);
    setRestrictionInput('');
    setLocationQuery('');
    setCoverUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowForm(true);
  };

  const handleCoverUrlApply = () => {
    const trimmed = coverUrlInput.trim();
    if (!trimmed) {
      alert('Please enter an image URL.');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      alert('Please enter a valid URL.');
      return;
    }
    setFormData(prev => ({ ...prev, coverImageUrl: trimmed }));
    if (!formData.coverImage) {
      setImagePreview(trimmed);
    }
  };

  const handleEdit = async (event: Event) => {
    const startDate = event.startDate ? new Date(event.startDate) : null;
    const endDate = event.endDate ? new Date(event.endDate) : null;
    const fallbackEnd = startDate ? new Date(startDate) : null;
    if (fallbackEnd) fallbackEnd.setHours(fallbackEnd.getHours() + 2);
    const timeZone = getLocalTimeZone();

    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      eventType: event.eventType || 'other',
      venue: event.venue || '',
      address: event.address || '',
      googleMapsAddress: event.googleMapsAddress || '',
      city: event.city || '',
      region: event.region || '',
      country: event.country || '',
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
      startDate: startDate ? toLocalDateInput(startDate) : '',
      startTime: startDate ? toLocalTimeInput(startDate) : '',
      startTimeZone: timeZone,
      endDate: endDate ? toLocalDateInput(endDate) : fallbackEnd ? toLocalDateInput(fallbackEnd) : '',
      endTime: endDate ? toLocalTimeInput(endDate) : fallbackEnd ? toLocalTimeInput(fallbackEnd) : '',
      endTimeZone: timeZone,
      coverImage: event.coverImage || '',
      coverImageUrl: event.coverImageUrl || '',
      website: event.website || '',
      ticketUrl: event.ticketUrl || '',
      price: event.price || '',
      restrictions: (event.restrictions || []).filter((r): r is string => r !== null),
      isPublished: event.isPublished !== false,
      isFeatured: event.isFeatured === true,
      visibility: event.visibility === 'members' ? 'members' : 'public',
    });
    setLocationQuery(event.address || [event.city, event.country].filter(Boolean).join(', '));
    setCoverUrlInput(event.coverImageUrl || '');
    // Resolve storage path to URL for preview
    const imageUrl = event.coverImage
      ? await getImageUrl(event.coverImage)
      : event.coverImageUrl || null;
    setImagePreview(imageUrl);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startDate || !formData.startTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.city || !formData.country) {
      alert('Please select a location from the suggestions.');
      return;
    }
    if (!formData.googleMapsAddress) {
      alert('Please enter a Google Maps address.');
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    if (Number.isNaN(startDateTime.getTime())) {
      alert('Please enter a valid start date and time.');
      return;
    }

    const endDateTime = formData.endDate && formData.endTime
      ? new Date(`${formData.endDate}T${formData.endTime}`)
      : null;

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || undefined,
        eventType: formData.eventType,
        venue: formData.venue || undefined,
        address: formData.address || undefined,
        googleMapsAddress: formData.googleMapsAddress || undefined,
        city: formData.city,
        region: formData.region || undefined,
        country: formData.country,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime && !Number.isNaN(endDateTime.getTime()) ? endDateTime.toISOString() : undefined,
        coverImage: formData.coverImage || undefined,
        coverImageUrl: formData.coverImageUrl.trim() || undefined,
        website: formData.website || undefined,
        ticketUrl: formData.ticketUrl || undefined,
        price: formData.price || undefined,
        restrictions: formData.restrictions.length > 0 ? formData.restrictions : undefined,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        visibility: formData.visibility,
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
          onClick={openNewEventForm}
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
                  <label>Cover image</label>
                  <div
                    className="admin-form__cover-upload"
                    style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : undefined}
                  >
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
                      className="admin-btn admin-btn--secondary admin-form__cover-button"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : '+ Add'}
                    </button>
                  </div>
                  <div className="admin-form__row" style={{ marginTop: '0.75rem' }}>
                    <input
                      type="url"
                      placeholder="Paste image URL"
                      value={coverUrlInput}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCoverUrlInput(next);
                        setFormData(prev => ({ ...prev, coverImageUrl: next }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCoverUrlApply}
                      className="admin-btn admin-btn--secondary"
                      disabled={uploading}
                    >
                      Use URL
                    </button>
                  </div>
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Event name *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Start date *</label>
                  <div className="admin-form__row">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        const nextDate = e.target.value;
                        setFormData(prev => {
                          const updated = { ...prev, startDate: nextDate };
                          const end = addHoursToLocal(updated.startDate, updated.startTime, 2);
                          return { ...updated, endDate: end.date, endTime: end.time, endTimeZone: updated.startTimeZone };
                        });
                      }}
                      required
                    />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => {
                        const nextTime = e.target.value;
                        setFormData(prev => {
                          const updated = { ...prev, startTime: nextTime };
                          const end = addHoursToLocal(updated.startDate, updated.startTime, 2);
                          return { ...updated, endDate: end.date, endTime: end.time, endTimeZone: updated.startTimeZone };
                        });
                      }}
                      required
                    />
                    <input
                      type="text"
                      value={formData.startTimeZone}
                      readOnly
                    />
                  </div>
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>End date</label>
                  <div className="admin-form__row">
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                    <input
                      type="text"
                      value={formData.endTimeZone}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTimeZone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Location *</label>
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setFormData(prev => ({ ...prev, address: e.target.value }));
                    }}
                    placeholder="Search for an address"
                    required
                  />
                  {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                    <span className="admin-form__helper">
                      Add `VITE_GOOGLE_MAPS_API_KEY` to enable address search.
                    </span>
                  )}
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Google Maps Address *</label>
                  <input
                    type="text"
                    value={formData.googleMapsAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, googleMapsAddress: e.target.value }))}
                    placeholder="Paste the address used for Google Maps"
                    required
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>What are the details?</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe the event..."
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

                <div className="admin-form__field">
                  <label>Visibility</label>
                  <div className="admin-toggle">
                    <button
                      type="button"
                      className={`admin-btn admin-btn--secondary admin-toggle__option ${formData.visibility === 'public' ? 'admin-toggle__option--active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      className={`admin-btn admin-btn--secondary admin-toggle__option ${formData.visibility === 'members' ? 'admin-toggle__option--active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'members' }))}
                    >
                      Members only
                    </button>
                  </div>
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Requirements (max 3, max 3 words each)</label>
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
              </div>

              <div className="admin-form__actions">
                <button type="button" onClick={resetForm} className="admin-btn admin-btn--secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={uploading}>
                  {editingEvent ? 'Update event' : 'Create event'}
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
                    {event.imageUrl && (
                      <img src={event.imageUrl} alt="" className="admin-table__thumbnail" />
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
// ROOMS ADMIN
// ============================================
function RoomsAdmin() {
  const [rooms, setRooms] = useState<RoomRecord[]>([]);

  useEffect(() => {
    setRooms(loadRooms());
  }, []);

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Rooms</h2>
      </div>

      {rooms.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '2rem',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          No rooms have been created yet.
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Room name</th>
                <th>Visibility</th>
                <th>Created</th>
                <th>Room link</th>
                <th>Members</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.name}</td>
                  <td>{room.isPublic ? 'Public' : 'Private'}</td>
                  <td>{new Date(room.createdAt).toLocaleDateString('en-GB')}</td>
                  <td>
                    <a href={getRoomShareUrl(room.id)} target="_blank" rel="noreferrer">
                      {getRoomShareUrl(room.id)}
                    </a>
                  </td>
                  <td>{room.memberCount ?? 0}</td>
                  <td>
                    <a href="/profile">{room.creatorName || 'Owner'}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAGAZINES ADMIN
// ============================================
function MagazinesAdmin() {
  const [magazines, setMagazines] = useState<MagazineWithImageUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState<Magazine | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverImage: '',
    coverImageUrl: '',
    price: '',
    priceInterval: 'monthly',
    websiteUrl: '',
    discountType: '',
    discountValue: '',
    discountCriteria: [] as Array<{ key: string; operator: string; value: string }>,
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
      const withImageUrls = await Promise.all(
        sorted.map(async (magazine) => {
          const imageUrl = magazine.coverImage
            ? await getImageUrl(magazine.coverImage)
            : magazine.coverImageUrl || undefined;
          return { ...magazine, imageUrl: imageUrl ?? undefined };
        })
      );
      setMagazines(withImageUrls);
    } catch (error) {
      console.error('Error loading magazines:', error);
    }
    setLoading(false);
  };

  const formatPriceInterval = (value?: string | null) => {
    switch (value) {
      case 'one_time':
        return 'one-time';
      case 'month':
        return 'monthly';
      case 'monthly':
        return 'monthly';
      case 'year':
        return 'yearly';
      case 'yearly':
        return 'yearly';
      default:
        return value || '';
    }
  };

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const result = await uploadData({
        path: ({ identityId }) => `magazine-photos/${identityId}/${timestamp}-${safeName}`,
        data: file,
        options: { contentType: file.type }
      }).result;
      setFormData(prev => ({ ...prev, coverImage: result.path }));
      const url = await getImageUrl(result.path);
      setImagePreview(url);
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
      coverImageUrl: '',
      price: '',
      priceInterval: 'monthly',
      websiteUrl: '',
      discountType: '',
      discountValue: '',
      discountCriteria: [],
      isActive: true,
      sortOrder: 0,
    });
    setEditingMagazine(null);
    setShowForm(false);
    setImagePreview(null);
    setCoverUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = async (magazine: Magazine) => {
    setEditingMagazine(magazine);
    let parsedCriteria: Array<{ key: string; operator: string; value: string }> = [];
    if (magazine.discountCriteria) {
      try {
        const parsed = JSON.parse(magazine.discountCriteria);
        if (Array.isArray(parsed)) {
          parsedCriteria = parsed.filter(Boolean);
        }
      } catch (error) {
        console.error('Failed to parse discount criteria', error);
      }
    }
    const normalizedInterval = magazine.priceInterval || 'monthly';
    setFormData({
      name: magazine.name || '',
      description: magazine.description || '',
      coverImage: magazine.coverImage || '',
      coverImageUrl: magazine.coverImageUrl || '',
      price: magazine.price !== null && magazine.price !== undefined ? String(magazine.price) : '',
      priceInterval: normalizedInterval,
      websiteUrl: magazine.websiteUrl || '',
      discountType: magazine.discountType || '',
      discountValue: magazine.discountValue !== null && magazine.discountValue !== undefined ? String(magazine.discountValue) : '',
      discountCriteria: parsedCriteria,
      isActive: magazine.isActive !== false,
      sortOrder: magazine.sortOrder || 0,
    });
    const previewUrl = magazine.coverImage
      ? await getImageUrl(magazine.coverImage)
      : magazine.coverImageUrl || null;
    setImagePreview(previewUrl);
    setCoverUrlInput(magazine.coverImageUrl || '');
    setShowForm(true);
  };

  const handleCoverUrlApply = () => {
    const trimmed = coverUrlInput.trim();
    if (!trimmed) {
      alert('Please enter an image URL.');
      return;
    }
    if (!isValidUrl(trimmed)) {
      alert('Please enter a valid URL.');
      return;
    }
    setFormData(prev => ({ ...prev, coverImageUrl: trimmed }));
    if (!formData.coverImage) {
      setImagePreview(trimmed);
    }
  };

  const addDiscountCriterion = () => {
    setFormData(prev => ({
      ...prev,
      discountCriteria: [...prev.discountCriteria, { key: '', operator: 'equals', value: '' }],
    }));
  };

  const updateDiscountCriterion = (index: number, patch: Partial<{ key: string; operator: string; value: string }>) => {
    setFormData(prev => ({
      ...prev,
      discountCriteria: prev.discountCriteria.map((criterion, idx) =>
        idx === index ? { ...criterion, ...patch } : criterion
      ),
    }));
  };

  const removeDiscountCriterion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      discountCriteria: prev.discountCriteria.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (trimmedName.length < 2) {
      alert('Magazine name must be at least 2 characters.');
      return;
    }

    const priceValue = Number(formData.price);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      alert('Please enter a valid price (0 or higher).');
      return;
    }

    if (formData.websiteUrl && !isValidUrl(formData.websiteUrl)) {
      alert('Please enter a valid website URL.');
      return;
    }

    if (formData.coverImageUrl && !isValidUrl(formData.coverImageUrl)) {
      alert('Please enter a valid cover image URL.');
      return;
    }

    const discountValueNumber = formData.discountValue === '' ? null : Number(formData.discountValue);
    if (discountValueNumber !== null && (Number.isNaN(discountValueNumber) || discountValueNumber < 0)) {
      alert('Discount value must be 0 or higher.');
      return;
    }
    if (formData.discountType === 'percent' && discountValueNumber !== null && discountValueNumber > 100) {
      alert('Percent discount must be between 0 and 100.');
      return;
    }

    const criteriaHasPartial = formData.discountCriteria.some((criterion) => {
      const hasAny = Boolean(criterion.key || criterion.operator || criterion.value);
      const hasAll = Boolean(criterion.key && criterion.operator && criterion.value);
      return hasAny && !hasAll;
    });
    if (criteriaHasPartial) {
      alert('Please complete or remove incomplete discount criteria.');
      return;
    }

    const trimmedCriteria = formData.discountCriteria.filter(
      (criterion) => criterion.key && criterion.operator && criterion.value
    );

    try {
      const magazineData = {
        name: trimmedName,
        description: formData.description || undefined,
        coverImage: formData.coverImage || undefined,
        coverImageUrl: formData.coverImageUrl.trim() || undefined,
        price: priceValue,
        priceInterval: formData.priceInterval as 'one_time' | 'monthly' | 'yearly',
        websiteUrl: formData.websiteUrl || undefined,
        discountType: (formData.discountType || undefined) as 'fixed' | 'percent' | undefined,
        discountValue: discountValueNumber === null ? undefined : discountValueNumber,
        discountCriteria: trimmedCriteria.length > 0 ? JSON.stringify(trimmedCriteria) : undefined,
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
          onClick={() => { setFormData(prev => ({ ...prev, sortOrder: 0 })); setShowForm(true); }}
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
                  <label>Cover image</label>
                  <div
                    className="admin-form__cover-upload"
                    style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : undefined}
                  >
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
                      className="admin-btn admin-btn--secondary admin-form__cover-button"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : '+ Add'}
                    </button>
                  </div>
                  <div className="admin-form__row" style={{ marginTop: '0.75rem' }}>
                    <input
                      type="url"
                      placeholder="Paste image URL"
                      value={coverUrlInput}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCoverUrlInput(next);
                        setFormData(prev => ({ ...prev, coverImageUrl: next }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCoverUrlApply}
                      className="admin-btn admin-btn--secondary"
                      disabled={uploading}
                    >
                      Use URL
                    </button>
                  </div>
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Magazine Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    minLength={2}
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
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g., 9.99"
                    required
                  />
                </div>

                <div className="admin-form__field">
                  <label>Price Interval</label>
                  <select
                    value={formData.priceInterval}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceInterval: e.target.value }))}
                  >
                    <option value="one_time">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
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
                  <label>Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                  >
                    <option value="">None</option>
                    <option value="fixed">Fixed</option>
                    <option value="percent">Percent</option>
                  </select>
                </div>

                <div className="admin-form__field">
                  <label>Discount Value</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                    placeholder={formData.discountType === 'percent' ? '0 - 100' : 'e.g., 5.00'}
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Discount Criteria</label>
                  {formData.discountCriteria.length === 0 && (
                    <p className="admin-form__helper">Add criteria to target specific users.</p>
                  )}
                  {formData.discountCriteria.map((criterion, index) => (
                    <div
                      key={`criterion-${index}`}
                      className="admin-form__row"
                      style={{ marginBottom: '0.5rem', gridTemplateColumns: '1fr 1fr 1fr auto' }}
                    >
                      <select
                        value={criterion.key}
                        onChange={(e) => updateDiscountCriterion(index, { key: e.target.value })}
                      >
                        <option value="">Select field</option>
                        <option value="membershipTier">membershipTier</option>
                        <option value="isPro">isPro</option>
                        <option value="country">country</option>
                        <option value="tag">tag</option>
                        <option value="role">role</option>
                      </select>
                      <select
                        value={criterion.operator}
                        onChange={(e) => updateDiscountCriterion(index, { operator: e.target.value })}
                      >
                        <option value="equals">equals</option>
                        <option value="contains">contains</option>
                        <option value="greater_than">greater_than</option>
                        <option value="less_than">less_than</option>
                        <option value="in_list">in_list</option>
                      </select>
                      <input
                        type="text"
                        value={criterion.value}
                        onChange={(e) => updateDiscountCriterion(index, { value: e.target.value })}
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-btn--small"
                        onClick={() => removeDiscountCriterion(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="admin-btn admin-btn--secondary admin-btn--small"
                    onClick={addDiscountCriterion}
                  >
                    Add criterion
                  </button>
                </div>

                <div className="admin-form__field">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  />
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
              style={{ backgroundImage: magazine.imageUrl ? `url(${magazine.imageUrl})` : undefined }}
            />
            <div className="admin-magazine-card__content">
              <h4>{magazine.name}</h4>
              <p className="admin-magazine-card__price">
                {magazine.price !== null && magazine.price !== undefined ? magazine.price : '--'}{' '}
                {formatPriceInterval(magazine.priceInterval)
                  ? `per ${formatPriceInterval(magazine.priceInterval)}`
                  : ''}
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
// AUCTIONS ADMIN - Basic Auction Intake
// ============================================
interface AuctionFormData {
  coverImage: string;
  title: string;
  auctionHouse: string;
  startDate: string;
  startTime: string;
  startTimeZone: string;
  endDate: string;
  endTime: string;
  endTimeZone: string;
  location: string;
  website: string;
}

function AuctionsAdmin() {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [auctionEvents, setAuctionEvents] = useState<Array<{
    id: string;
    name: string;
    location: string;
    date: string;
    auctionHouse: string;
    coverImage: string;
    lotCount: number;
    lots: Auction[];
  }>>([]);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const padNumber = (value: number) => value.toString().padStart(2, '0');

  const toLocalDateInput = (date: Date) =>
    `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

  const toLocalTimeInput = (date: Date) =>
    `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;

  const roundToNearestHour = (date: Date) => {
    const rounded = new Date(date);
    const minutes = rounded.getMinutes();
    if (minutes >= 30) {
      rounded.setHours(rounded.getHours() + 1);
    }
    rounded.setMinutes(0, 0, 0);
    return rounded;
  };

  const getLocalTimeZone = () =>
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const getDefaultStartDateTime = () => {
    const start = new Date();
    start.setHours(start.getHours() + 1);
    const roundedStart = roundToNearestHour(start);
    return {
      date: toLocalDateInput(roundedStart),
      time: toLocalTimeInput(roundedStart),
    };
  };

  const addHoursToLocal = (date: string, time: string, hours: number) => {
    if (!date || !time) {
      return { date: '', time: '' };
    }
    const base = new Date(`${date}T${time}`);
    if (Number.isNaN(base.getTime())) {
      return { date: '', time: '' };
    }
    base.setHours(base.getHours() + hours);
    const rounded = roundToNearestHour(base);
    return {
      date: toLocalDateInput(rounded),
      time: toLocalTimeInput(rounded),
    };
  };

  const buildEmptyForm = (): AuctionFormData => {
    const defaultStart = getDefaultStartDateTime();
    const defaultEnd = addHoursToLocal(defaultStart.date, defaultStart.time, 2);
    const timeZone = getLocalTimeZone();
    return {
      coverImage: '',
      title: '',
      auctionHouse: '',
      startDate: defaultStart.date,
      startTime: defaultStart.time,
      startTimeZone: timeZone,
      endDate: defaultEnd.date,
      endTime: defaultEnd.time,
      endTimeZone: timeZone,
      location: '',
      website: '',
    };
  };

  const [formData, setFormData] = useState<AuctionFormData>(buildEmptyForm());

  useEffect(() => {
    const subscription = client.models.Auction.observeQuery().subscribe({
      next: ({ items }) => {
        void refreshAuctionEvents(items);
      },
    });
    void loadAuctions();
    return () => subscription.unsubscribe();
  }, []);

  const loadAuctions = async () => {
    try {
      const { data } = await client.models.Auction.list({ limit: 500 });
      await refreshAuctionEvents(data || []);
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
    setLoading(false);
  };

  const hydrateAuctionImages = async (lots: Auction[]) => {
    const resolved = await Promise.all(
      lots.map(async (lot) => {
        if (!lot.imageUrl) return lot;
        const imageUrl = await getImageUrl(lot.imageUrl);
        return imageUrl ? { ...lot, imageUrl } : lot;
      })
    );
    return resolved;
  };

  const refreshAuctionEvents = async (lots: Auction[]) => {
    const resolvedLots = await hydrateAuctionImages(lots);
    const eventMap = new Map<string, {
      id: string;
      name: string;
      location: string;
      date: string;
      auctionHouse: string;
      coverImage: string;
      lotCount: number;
      lots: Auction[];
    }>();

    resolvedLots.forEach((lot) => {
      const name = lot.auctionName || lot.auctionLocation || lot.title || 'Upcoming Auction';
      const eventKey = `${lot.auctionHouse}-${name}`;
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, {
          id: eventKey,
          name,
          location: lot.auctionLocation || 'TBA',
          date: lot.auctionDate || '',
          auctionHouse: lot.auctionHouse || 'Unknown',
          coverImage: '',
          lotCount: 0,
          lots: [],
        });
      }
      const event = eventMap.get(eventKey)!;
      event.lots.push(lot);
      event.lotCount = event.lots.length;
    });

    eventMap.forEach((event) => {
      const lotWithImage = event.lots.find((lot) => lot.imageUrl && lot.imageUrl.length > 0);
      event.coverImage = lotWithImage?.imageUrl || FALLBACKS.auction;
    });

    const events = Array.from(eventMap.values()).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    setAuctionEvents(events);
    setLoading(false);
  };

  const toIsoDateTime = (date: string, time: string) => {
    if (!date || !time) return null;
    const value = new Date(`${date}T${time}`);
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBA';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const resetForm = () => {
    setFormData(buildEmptyForm());
    setImagePreview(null);
    setCoverUrlInput('');
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const result = await uploadData({
        path: ({ identityId }) => `auction-photos/${identityId}/${timestamp}-${safeName}`,
        data: file,
        options: { contentType: file.type },
      }).result;
      setFormData(prev => ({ ...prev, coverImage: result.path }));
      const url = await getImageUrl(result.path);
      setImagePreview(url);
    } catch (error) {
      console.error('Error uploading auction image:', error);
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

  const handleCoverUrlApply = () => {
    const trimmed = coverUrlInput.trim();
    if (!trimmed) {
      alert('Please enter an image URL.');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      alert('Please enter a valid URL.');
      return;
    }
    setFormData(prev => ({ ...prev, coverImage: trimmed }));
    setImagePreview(trimmed);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.auctionHouse || !formData.startDate || !formData.startTime || !formData.location) {
      alert('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const auctionDate = toIsoDateTime(formData.startDate, formData.startTime);
      await client.models.Auction.create({
        auctionHouse: formData.auctionHouse,
        lotNumber: '1',
        title: formData.title,
        description: '',
        imageUrl: formData.coverImage || undefined,
        currency: 'USD',
        reserveStatus: 'unknown',
        status: 'upcoming',
        auctionDate: auctionDate || undefined,
        auctionLocation: formData.location,
        auctionName: formData.title,
        lotUrl: formData.website || undefined,
        lastUpdated: new Date().toISOString(),
      });
      alert('Auction saved.');
      resetForm();
    } catch (error) {
      console.error('Error saving auction:', error);
      alert('Failed to save auction. Please try again.');
    }
    setSaving(false);
  };

  const deleteAuctionEvent = async (eventId: string, lots: Auction[]) => {
    if (!confirm('Delete this auction and all associated lots?')) return;
    try {
      for (const lot of lots) {
        await client.models.Auction.delete({ id: lot.id });
      }
      setAuctionEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting auction:', error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>Auctions</h2>
        <button
          onClick={() => setShowForm(true)}
          className="admin-btn admin-btn--primary"
        >
          <Plus size={18} />
          + Add auction
        </button>
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onClick={resetForm}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>Add new auction</h3>
              <button onClick={resetForm} className="admin-modal__close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form__grid">
                <div className="admin-form__field admin-form__field--full">
                  <label>Cover image</label>
                  <div
                    className="admin-form__cover-upload"
                    style={imagePreview ? { backgroundImage: `url(${imagePreview})` } : undefined}
                  >
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
                      className="admin-btn admin-btn--secondary admin-form__cover-button"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : '+ Add'}
                    </button>
                  </div>
                  <div className="admin-form__row" style={{ marginTop: '0.75rem' }}>
                    <input
                      type="url"
                      placeholder="Paste image URL"
                      value={coverUrlInput}
                      onChange={(e) => setCoverUrlInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleCoverUrlApply}
                      className="admin-btn admin-btn--secondary"
                      disabled={uploading}
                    >
                      Use URL
                    </button>
                  </div>
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Auction name *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Auction house *</label>
                  <input
                    type="text"
                    value={formData.auctionHouse}
                    onChange={(e) => setFormData(prev => ({ ...prev, auctionHouse: e.target.value }))}
                    placeholder="RM Sotheby's, Bonhams, Broad Arrow"
                    required
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Start date *</label>
                  <div className="admin-form__row">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        const nextDate = e.target.value;
                        setFormData(prev => {
                          const updated = { ...prev, startDate: nextDate };
                          const end = addHoursToLocal(updated.startDate, updated.startTime, 2);
                          return { ...updated, endDate: end.date, endTime: end.time, endTimeZone: updated.startTimeZone };
                        });
                      }}
                      required
                    />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => {
                        const nextTime = e.target.value;
                        setFormData(prev => {
                          const updated = { ...prev, startTime: nextTime };
                          const end = addHoursToLocal(updated.startDate, updated.startTime, 2);
                          return { ...updated, endDate: end.date, endTime: end.time, endTimeZone: updated.startTimeZone };
                        });
                      }}
                      required
                    />
                    <input
                      type="text"
                      value={formData.startTimeZone}
                      readOnly
                    />
                  </div>
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>End date</label>
                  <div className="admin-form__row">
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                    <input
                      type="text"
                      value={formData.endTimeZone}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTimeZone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Search for an address"
                    required
                  />
                </div>

                <div className="admin-form__field admin-form__field--full">
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>

              <div className="admin-form__actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save auction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-table-container" style={{ marginTop: '1.5rem' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Auction</th>
              <th>House</th>
              <th>Location</th>
              <th>Date</th>
              <th>Lots</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {auctionEvents.map((event) => (
              <tr key={event.id}>
                <td>
                  <div className="admin-table__title-cell">
                    <img src={event.coverImage} alt="" className="admin-table__thumbnail" />
                    <span>{event.name}</span>
                  </div>
                </td>
                <td>{event.auctionHouse}</td>
                <td>{event.location}</td>
                <td>{formatDate(event.date)}</td>
                <td>{event.lotCount}</td>
                <td>
                  <div className="admin-table__actions">
                    <button
                      onClick={() => deleteAuctionEvent(event.id, event.lots)}
                      className="admin-action-btn admin-action-btn--danger"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && auctionEvents.length === 0 && (
          <div className="admin-empty">No auctions found. Create your first auction!</div>
        )}
        {loading && (
          <div className="admin-empty">Loading auctions...</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// WIKICARS ADMIN - Manage Makes/Models
// ============================================
function WikiCarsAdmin() {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [makeForm, setMakeForm] = useState({ makeId: '', makeName: '', country: '' });
  const [modelForm, setModelForm] = useState({ makeId: '', modelName: '' });
  const [editingMakeId, setEditingMakeId] = useState<string | null>(null);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [makeEditValues, setMakeEditValues] = useState({ makeName: '', country: '' });
  const [modelEditValues, setModelEditValues] = useState({ modelName: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [makesResult, modelsResult] = await Promise.all([
          client.models.Make.list({ limit: 500 }),
          client.models.Model.list({ limit: 1000 }),
        ]);
        const sortedMakes = (makesResult.data || []).sort((a, b) => a.makeName.localeCompare(b.makeName));
        const sortedModels = (modelsResult.data || []).sort((a, b) => a.modelName.localeCompare(b.modelName));
        setMakes(sortedMakes);
        setModels(sortedModels);
      } catch (error) {
        console.error('Failed to load WikiCars data', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddMake = async () => {
    if (!makeForm.makeId.trim() || !makeForm.makeName.trim()) {
      alert('Please enter a make ID and name.');
      return;
    }
    try {
      const created = await client.models.Make.create({
        makeId: makeForm.makeId.trim(),
        makeName: makeForm.makeName.trim(),
        country: makeForm.country.trim() || undefined,
      });
      if (created.data) {
        const newMake = created.data;
        setMakes((prev) => [...prev, newMake].sort((a, b) => a.makeName.localeCompare(b.makeName)));
      }
      setMakeForm({ makeId: '', makeName: '', country: '' });
    } catch (error) {
      console.error('Failed to add make', error);
      alert('Failed to add make.');
    }
  };

  const handleAddModel = async () => {
    if (!modelForm.makeId || !modelForm.modelName.trim()) {
      alert('Please select a make and enter a model name.');
      return;
    }
    const makeName = makes.find((make) => make.makeId === modelForm.makeId)?.makeName || modelForm.makeId;
    const slug = modelForm.modelName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const modelId = `${modelForm.makeId}-${slug}`;
    try {
      const created = await client.models.Model.create({
        modelId,
        makeId: modelForm.makeId,
        modelName: modelForm.modelName.trim(),
        fullName: `${makeName} ${modelForm.modelName.trim()}`,
      });
      if (created.data) {
        const newModel = created.data;
        setModels((prev) => [...prev, newModel].sort((a, b) => a.modelName.localeCompare(b.modelName)));
      }
      setModelForm({ makeId: '', modelName: '' });
    } catch (error) {
      console.error('Failed to add model', error);
      alert('Failed to add model.');
    }
  };

  const startEditMake = (make: Make) => {
    setEditingMakeId(make.makeId);
    setMakeEditValues({ makeName: make.makeName, country: make.country || '' });
  };

  const saveEditMake = async () => {
    if (!editingMakeId) return;
    try {
      const updated = await client.models.Make.update({
        makeId: editingMakeId,
        makeName: makeEditValues.makeName.trim(),
        country: makeEditValues.country.trim() || undefined,
      });
      if (updated.data) {
        setMakes((prev) => prev.map((make) => (make.makeId === editingMakeId ? updated.data as Make : make)));
      }
      setEditingMakeId(null);
    } catch (error) {
      console.error('Failed to update make', error);
      alert('Failed to update make.');
    }
  };

  const startEditModel = (model: Model) => {
    setEditingModelId(model.modelId);
    setModelEditValues({ modelName: model.modelName });
  };

  const saveEditModel = async () => {
    if (!editingModelId) return;
    const model = models.find((entry) => entry.modelId === editingModelId);
    if (!model) return;
    const makeName = makes.find((make) => make.makeId === model.makeId)?.makeName || model.makeId;
    try {
      const updated = await client.models.Model.update({
        modelId: model.modelId,
        makeId: model.makeId,
        modelName: modelEditValues.modelName.trim(),
        fullName: `${makeName} ${modelEditValues.modelName.trim()}`,
      });
      if (updated.data) {
        setModels((prev) => prev.map((entry) => (entry.modelId === editingModelId ? updated.data as Model : entry)));
      }
      setEditingModelId(null);
    } catch (error) {
      console.error('Failed to update model', error);
      alert('Failed to update model.');
    }
  };

  if (loading) {
    return <div className="admin-panel">Loading makes and models...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h2>WikiCars</h2>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.75rem' }}>Makes</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Make ID"
              value={makeForm.makeId}
              onChange={(e) => setMakeForm((prev) => ({ ...prev, makeId: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Make name"
              value={makeForm.makeName}
              onChange={(e) => setMakeForm((prev) => ({ ...prev, makeName: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Country"
              value={makeForm.country}
              onChange={(e) => setMakeForm((prev) => ({ ...prev, country: e.target.value }))}
            />
            <button className="admin-btn admin-btn--primary" type="button" onClick={handleAddMake}>
              Add make
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Make ID</th>
                  <th>Make name</th>
                  <th>Country</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {makes.map((make) => (
                  <tr key={make.makeId}>
                    <td>{make.makeId}</td>
                    <td>
                      {editingMakeId === make.makeId ? (
                        <input
                          type="text"
                          value={makeEditValues.makeName}
                          onChange={(e) => setMakeEditValues((prev) => ({ ...prev, makeName: e.target.value }))}
                        />
                      ) : (
                        make.makeName
                      )}
                    </td>
                    <td>
                      {editingMakeId === make.makeId ? (
                        <input
                          type="text"
                          value={makeEditValues.country}
                          onChange={(e) => setMakeEditValues((prev) => ({ ...prev, country: e.target.value }))}
                        />
                      ) : (
                        make.country || '—'
                      )}
                    </td>
                    <td>
                      {editingMakeId === make.makeId ? (
                        <button className="admin-btn admin-btn--primary" type="button" onClick={saveEditMake}>
                          Save
                        </button>
                      ) : (
                        <button className="admin-btn admin-btn--secondary" type="button" onClick={() => startEditMake(make)}>
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: '0.75rem' }}>Models</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <select
              value={modelForm.makeId}
              onChange={(e) => setModelForm((prev) => ({ ...prev, makeId: e.target.value }))}
            >
              <option value="">Select make</option>
              {makes.map((make) => (
                <option key={make.makeId} value={make.makeId}>
                  {make.makeName}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Model name"
              value={modelForm.modelName}
              onChange={(e) => setModelForm((prev) => ({ ...prev, modelName: e.target.value }))}
            />
            <button className="admin-btn admin-btn--primary" type="button" onClick={handleAddModel}>
              Add model
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Make</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.modelId}>
                    <td>
                      {editingModelId === model.modelId ? (
                        <input
                          type="text"
                          value={modelEditValues.modelName}
                          onChange={(e) => setModelEditValues({ modelName: e.target.value })}
                        />
                      ) : (
                        model.modelName
                      )}
                    </td>
                    <td>{makes.find((make) => make.makeId === model.makeId)?.makeName || model.makeId}</td>
                    <td>
                      {editingModelId === model.modelId ? (
                        <button className="admin-btn admin-btn--primary" type="button" onClick={saveEditModel}>
                          Save
                        </button>
                      ) : (
                        <button className="admin-btn admin-btn--secondary" type="button" onClick={() => startEditModel(model)}>
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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

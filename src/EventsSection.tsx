import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

type Event = Schema['Event']['type'];

// Admin emails - add your email here
const ADMIN_EMAILS = ['onlinewebspacejunk@gmail.com'];

const EVENT_TYPES = [
  { value: 'car_show', label: '🚗 Car Show' },
  { value: 'race', label: '🏎️ Race' },
  { value: 'auction', label: '🔨 Auction' },
  { value: 'meet', label: '🤝 Car Meet' },
  { value: 'rally', label: '🏁 Rally' },
  { value: 'festival', label: '🎉 Festival' },
  { value: 'exhibition', label: '🏛️ Exhibition' },
  { value: 'track_day', label: '🛞 Track Day' },
  { value: 'other', label: '📅 Other' },
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 
  'Belgium', 'Netherlands', 'Switzerland', 'Austria', 'Japan', 'Australia',
  'Canada', 'United Arab Emirates', 'Monaco', 'Portugal', 'Sweden', 'Norway',
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

export function EventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  // Filters
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<string>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  
  // User location for distance filter
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterDistance, setFilterDistance] = useState<number>(0); // 0 = no distance filter
  
  // New event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventType: 'car_show' as Event['eventType'],
    venue: '',
    address: '',
    city: '',
    region: '',
    country: '',
    latitude: '',
    longitude: '',
    startDate: '',
    endDate: '',
    coverImage: '',
    website: '',
    ticketUrl: '',
    price: '',
    isFeatured: false,
  });

  useEffect(() => {
    checkAdminStatus();
    loadEvents();
    getUserLocation();
    
    const subscription = client.models.Event.observeQuery().subscribe({
      next: ({ items }) => {
        const published = items.filter(e => e.isPublished !== false);
        setEvents(published);
        setLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  // Apply filters when events or filters change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, filterCountry, filterType, filterTimeframe, filterDistance, searchQuery, userLocation]);

  const checkAdminStatus = async () => {
  try {
    const session = await fetchAuthSession();
    const email = session.tokens?.idToken?.payload?.email as string;
    console.log('User email:', email); // Debug log
    console.log('Is admin:', ADMIN_EMAILS.includes(email?.toLowerCase()));
    setIsAdmin(ADMIN_EMAILS.includes(email?.toLowerCase()));
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
    } catch (error) {
      console.error('Error loading events:', error);
    }
    setLoading(false);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.log('Location not available:', error)
      );
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const applyFilters = () => {
    let filtered = [...events];
    const now = new Date();

    // Timeframe filter
    if (filterTimeframe === 'upcoming') {
      filtered = filtered.filter(e => new Date(e.startDate) >= now);
    } else if (filterTimeframe === 'past') {
      filtered = filtered.filter(e => new Date(e.startDate) < now);
    } else if (filterTimeframe === 'this_month') {
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filtered = filtered.filter(e => {
        const date = new Date(e.startDate);
        return date >= now && date <= monthEnd;
      });
    } else if (filterTimeframe === 'this_year') {
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      filtered = filtered.filter(e => {
        const date = new Date(e.startDate);
        return date >= now && date <= yearEnd;
      });
    }

    // Country filter
    if (filterCountry !== 'all') {
      filtered = filtered.filter(e => e.country === filterCountry);
    }

    // Event type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.eventType === filterType);
    }

    // Distance filter
    if (filterDistance > 0 && userLocation) {
      filtered = filtered.filter(e => {
        if (!e.latitude || !e.longitude) return false;
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          e.latitude, e.longitude
        );
        return distance <= filterDistance;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.city?.toLowerCase().includes(query) ||
        e.venue?.toLowerCase().includes(query) ||
        e.country?.toLowerCase().includes(query)
      );
    }

    // Sort by date (soonest first for upcoming, most recent first for past)
    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return filterTimeframe === 'past' ? dateB - dateA : dateA - dateB;
    });

    // Featured events first
    filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

    setFilteredEvents(filtered);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description || undefined,
        eventType: newEvent.eventType,
        venue: newEvent.venue || undefined,
        address: newEvent.address || undefined,
        city: newEvent.city,
        region: newEvent.region || undefined,
        country: newEvent.country,
        latitude: newEvent.latitude ? parseFloat(newEvent.latitude) : undefined,
        longitude: newEvent.longitude ? parseFloat(newEvent.longitude) : undefined,
        startDate: new Date(newEvent.startDate).toISOString(),
        endDate: newEvent.endDate ? new Date(newEvent.endDate).toISOString() : undefined,
        coverImage: newEvent.coverImage || undefined,
        website: newEvent.website || undefined,
        ticketUrl: newEvent.ticketUrl || undefined,
        price: newEvent.price || undefined,
        isFeatured: newEvent.isFeatured,
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
      eventType: event.eventType || 'car_show',
      venue: event.venue || '',
      address: event.address || '',
      city: event.city,
      region: event.region || '',
      country: event.country,
      latitude: event.latitude?.toString() || '',
      longitude: event.longitude?.toString() || '',
      startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
      coverImage: event.coverImage || '',
      website: event.website || '',
      ticketUrl: event.ticketUrl || '',
      price: event.price || '',
      isFeatured: event.isFeatured || false,
    });
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
      eventType: 'car_show',
      venue: '',
      address: '',
      city: '',
      region: '',
      country: '',
      latitude: '',
      longitude: '',
      startDate: '',
      endDate: '',
      coverImage: '',
      website: '',
      ticketUrl: '',
      price: '',
      isFeatured: false,
    });
    setEditingEvent(null);
    setShowAddForm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateRange = (start: string, end?: string | null) => {
    const startDate = formatDate(start);
    if (!end || start === end) return startDate;
    const endDate = formatDate(end);
    return `${startDate} - ${endDate}`;
  };

  const getEventTypeLabel = (type: string | null | undefined) => {
    return EVENT_TYPES.find(t => t.value === type)?.label || '📅 Event';
  };

  const getDistanceText = (event: Event) => {
    if (!userLocation || !event.latitude || !event.longitude) return null;
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      event.latitude, event.longitude
    );
    return distance < 100 ? `${Math.round(distance)} km away` : `${Math.round(distance / 10) * 10} km away`;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading events...</div>;
  }

  return (
    <div>
      {/* Admin Controls */}
      {isAdmin && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <span style={{ fontWeight: 'bold', color: '#856404' }}>
            👑 Admin Mode
          </span>
          <button
            onClick={() => { setShowAddForm(!showAddForm); if (showAddForm) resetForm(); }}
            style={{
              padding: '0.5rem 1rem',
              background: showAddForm ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {showAddForm ? '✕ Cancel' : '+ Add Event'}
          </button>
        </div>
      )}

      {/* Add/Edit Event Form (Admin Only) */}
      {isAdmin && showAddForm && (
        <div style={{
          background: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '2px solid #28a745',
        }}>
          <h3 style={{ marginTop: 0 }}>
            {editingEvent ? '✏️ Edit Event' : '➕ Add New Event'}
          </h3>
          <form onSubmit={handleSubmitEvent}>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {/* Title */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                  placeholder="e.g., Goodwood Festival of Speed"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Event Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Event Type *</label>
                <select
                  value={newEvent.eventType || 'car_show'}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value as Event['eventType'] })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Venue */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Venue</label>
                <input
                  type="text"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  placeholder="e.g., Goodwood Estate"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* City */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>City *</label>
                <input
                  type="text"
                  value={newEvent.city}
                  onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                  required
                  placeholder="e.g., Chichester"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Region */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Region/State</label>
                <input
                  type="text"
                  value={newEvent.region}
                  onChange={(e) => setNewEvent({ ...newEvent, region: e.target.value })}
                  placeholder="e.g., West Sussex"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Country */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Country *</label>
                <select
                  value={newEvent.country}
                  onChange={(e) => setNewEvent({ ...newEvent, country: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Start Date *</label>
                <input
                  type="datetime-local"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* End Date */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>End Date</label>
                <input
                  type="datetime-local"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Cover Image */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Cover Image URL</label>
                <input
                  type="url"
                  value={newEvent.coverImage}
                  onChange={(e) => setNewEvent({ ...newEvent, coverImage: e.target.value })}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Website */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Website</label>
                <input
                  type="url"
                  value={newEvent.website}
                  onChange={(e) => setNewEvent({ ...newEvent, website: e.target.value })}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Ticket URL */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Ticket URL</label>
                <input
                  type="url"
                  value={newEvent.ticketUrl}
                  onChange={(e) => setNewEvent({ ...newEvent, ticketUrl: e.target.value })}
                  placeholder="https://..."
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Price */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Price</label>
                <input
                  type="text"
                  value={newEvent.price}
                  onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                  placeholder="e.g., Free, $50, €25-€100"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Coordinates */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={newEvent.latitude}
                  onChange={(e) => setNewEvent({ ...newEvent, latitude: e.target.value })}
                  placeholder="e.g., 50.8614"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={newEvent.longitude}
                  onChange={(e) => setNewEvent({ ...newEvent, longitude: e.target.value })}
                  placeholder="e.g., -0.7514"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Description */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Describe the event..."
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              {/* Featured */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={newEvent.isFeatured}
                  onChange={(e) => setNewEvent({ ...newEvent, isFeatured: e.target.checked })}
                />
                <label htmlFor="isFeatured" style={{ fontWeight: 'bold' }}>⭐ Featured Event</label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 2rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
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
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '1rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            border: '1px solid #ddd',
            minWidth: '200px',
            flex: '1',
          }}
        />

        {/* Timeframe */}
        <select
          value={filterTimeframe}
          onChange={(e) => setFilterTimeframe(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="upcoming">📅 Upcoming</option>
          <option value="this_month">📆 This Month</option>
          <option value="this_year">🗓️ This Year</option>
          <option value="past">⏪ Past Events</option>
          <option value="all">🌐 All Events</option>
        </select>

        {/* Country */}
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="all">🌍 All Countries</option>
          {COUNTRIES.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        {/* Event Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="all">📋 All Types</option>
          {EVENT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        {/* Distance (only if location available) */}
        {userLocation && (
          <select
            value={filterDistance}
            onChange={(e) => setFilterDistance(parseInt(e.target.value))}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="0">📍 Any Distance</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
            <option value="250">Within 250 km</option>
            <option value="500">Within 500 km</option>
            <option value="1000">Within 1000 km</option>
          </select>
        )}

        {/* Results count */}
        <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: 'auto' }}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {filteredEvents.map(event => (
            <div
              key={event.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: event.isFeatured ? '2px solid #ffc107' : 'none',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              {/* Cover Image */}
              <div style={{ position: 'relative' }}>
                <img
                  src={event.coverImage || FALLBACK_IMAGE}
                  alt={event.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                
                {/* Featured Badge */}
                {event.isFeatured && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: '#ffc107',
                    color: '#000',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                  }}>
                    ⭐ FEATURED
                  </div>
                )}

                {/* Event Type Badge */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.75)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}>
                  {getEventTypeLabel(event.eventType)}
                </div>

                {/* Date Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  background: 'rgba(255,255,255,0.95)',
                  color: '#1a1a2e',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                }}>
                  📅 {formatDateRange(event.startDate, event.endDate)}
                </div>
              </div>

              {/* Event Info */}
              <div style={{ padding: '1.25rem' }}>
                <h3 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  color: '#1a1a2e',
                  lineHeight: '1.3',
                }}>
                  {event.title}
                </h3>

                <p style={{
                  margin: '0 0 0.5rem 0',
                  color: '#555',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}>
                  📍 {event.venue ? `${event.venue}, ` : ''}{event.city}, {event.country}
                </p>

                {/* Distance from user */}
                {getDistanceText(event) && (
                  <p style={{
                    margin: '0 0 0.5rem 0',
                    color: '#3498db',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                  }}>
                    🚗 {getDistanceText(event)}
                  </p>
                )}

                {/* Price */}
                {event.price && (
                  <p style={{
                    margin: '0 0 0.75rem 0',
                    color: '#27ae60',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                  }}>
                    🎟️ {event.price}
                  </p>
                )}

                {/* Description */}
                {event.description && (
                  <p style={{
                    margin: '0 0 1rem 0',
                    color: '#666',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {event.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {event.website && (
                    <a
                      href={event.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        background: '#1a1a2e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                      }}
                    >
                      🌐 Website
                    </a>
                  )}
                  {event.ticketUrl && (
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                      }}
                    >
                      🎟️ Tickets
                    </a>
                  )}
                </div>

                {/* Admin Controls */}
                {isAdmin && event && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEditEvent(event)}
                      style={{
                        flex: 1,
                        padding: '0.4rem',
                        background: '#ffc107',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event)}
                      style={{
                        flex: 1,
                        padding: '0.4rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#f8f9fa',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏁</div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>No Events Found</h3>
          <p style={{ color: '#666' }}>
            {events.length === 0
              ? 'No automotive events have been added yet.'
              : 'Try adjusting your filters to see more events.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
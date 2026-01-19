import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { NewsSection } from './NewsSection';
import { AuctionsPage } from './AuctionsPage';
import { EventsSection } from './EventsSection';
import { SavedEventsSection } from './SavedEventsSection';
import { CommunitySection } from './CommunitySection';
import { ChatSection } from './ChatSection';
import { MyGarageSection } from './MyGarageSection';
import { ProfileSection } from './ProfileSection';
import { ShopSection } from './ShopSection';
import { AdminSection } from './AdminSection';

// NEW: Import the Header component
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import HomePage from './components/HomePage';
import Footer from './components/Footer';
import { useIsMobile } from './hooks/useIsMobile';
import { importAllData } from './importData';
import { isAdminEmail } from './constants/admins';
import { NewsItem, fetchNewsFeedItems } from './utils/newsFeed';
import { openExternalUrl } from './utils/url';
import { SearchResultItem, SearchResultGroups } from './types/search';
import RoomPage from './components/RoomPage';
import { AppUIProvider } from './context/AppUIContext';

const client = generateClient<Schema>();

type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];
type EventModel = Schema['Event']['type'];
type AuctionModel = Schema['Auction']['type'];

const SAVED_EVENTS_STORAGE_KEY = 'collectible.savedEvents';

const ROOM_THREADS = [
  {
    id: 'lotus-owners-meet',
    title: 'Lotus Owners Meet 2024',
    excerpt: 'Share itineraries, road books, and favorite routes for Lotus gatherings.',
  },
  {
    id: 'lightweight-track-tools',
    title: 'Lightweight Track Tools & Lotus Elise builds',
    excerpt: 'Compare suspension setups and lap times for Elise and Exige owners.',
  },
  {
    id: 'british-icons',
    title: 'British Icons Appreciation Thread',
    excerpt: 'Celebrating Lotus, Aston Martin, and all things brilliantly British.',
  },
  {
    id: 'garage-builds',
    title: 'Garage Builds: From Shell to Show',
    excerpt: 'Documenting major restorations including Europa, Esprit, and Evora projects.',
  },
];

const getEmptySearchResults = (): SearchResultGroups => ({
  news: [],
  events: [],
  auctions: [],
  rooms: [],
});

// =====================================================
// CarSearch Component Props
// Added props so the Header can control this component
// =====================================================
interface AmplifyUser {
  signInDetails?: {
    loginId?: string;
  };
  username?: string;
}

interface CarSearchProps {
  user: AmplifyUser | undefined;
  signOut: () => void;
}

// Map section IDs to URL paths
const sectionToPath: Record<string, string> = {
  home: '/home',
  events: '/events',
  news: '/news',
  rooms: '/rooms',
  garage: '/mygarage',
  profile: '/profile',
  chat: '/chat',
  notifications: '/notifications',
  shop: '/shop',
  saved: '/saved',
  auctions: '/auctions',
  admin: '/admin',
};

// Map URL paths back to section IDs
const pathToSection: Record<string, string> = {
  '/home': 'home',
  '/events': 'events',
  '/news': 'news',
  '/rooms': 'rooms',
  '/mygarage': 'garage',
  '/profile': 'profile',
  '/chat': 'chat',
  '/notifications': 'notifications',
  '/shop': 'shop',
  '/saved': 'saved',
  '/auctions': 'auctions',
  '/admin': 'admin',
  '/': 'home',
};

function CarSearch({ user, signOut }: CarSearchProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial section from URL path
  const getInitialSection = () => {
    const path = location.pathname;
    if (path.startsWith('/rooms/')) {
      return 'rooms';
    }
    return pathToSection[path] || 'home';
  };

  // Existing state
  const [searchTerm, setSearchTerm] = useState('');
  const [makes, setMakes] = useState<Make[]>([]);
  const [allMakes, setAllMakes] = useState<Make[]>([]);
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedMake, setSelectedMake] = useState<Make | null>(null);

  // Initialize activeSection from URL path
  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [newsCache, setNewsCache] = useState<NewsItem[]>([]);
  const [eventsCache, setEventsCache] = useState<EventModel[]>([]);
  const [auctionsCache, setAuctionsCache] = useState<AuctionModel[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResultGroups>(getEmptySearchResults());
  const [searchLoading, setSearchLoading] = useState(false);
  const [savedEvents, setSavedEvents] = useState<EventModel[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem(SAVED_EVENTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as EventModel[];
      }
    } catch (error) {
      console.error('Failed to load saved events:', error);
    }
    return [];
  });
  const isMobile = useIsMobile();
  // Mobile horizontal padding reduced by 80%: 2rem -> 0.4rem
  const horizontalPadding = isMobile ? '0.4rem' : '5rem';
  // No top padding needed
  const topPadding = '0';
  const [hasEnsuredSeedData, setHasEnsuredSeedData] = useState(false);
  const adminEmail = user?.signInDetails?.loginId?.toLowerCase();

  const computeUserInitials = () => {
    const loginId = user?.signInDetails?.loginId || user?.username || '';
    if (!loginId) {
      return 'UU';
    }
    const cleaned = loginId.replace(/@.*/, '');
    const segments = cleaned.split(/[\s._-]+/).filter(Boolean);
    if (segments.length >= 2) {
      return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase();
    }
    if (segments.length === 1) {
      return segments[0].slice(0, 2).toUpperCase();
    }
    return loginId.slice(0, 2).toUpperCase();
  };

  const userInitials = computeUserInitials();

  useEffect(() => {
    if (hasEnsuredSeedData || !adminEmail) {
      return;
    }

    let cancelled = false;

    const migrateInitialData = async () => {
      if (!isAdminEmail(adminEmail)) {
        if (!cancelled) {
          setHasEnsuredSeedData(true);
        }
        return;
      }

      try {
        const { data } = await client.models.Make.list({ limit: 1 });
        if (!data || data.length === 0) {
          console.info('[Collectible] Seeding base car makes/models into production backend...');
          await importAllData((message) => console.info(`[Import] ${message}`));
        }
      } catch (error) {
        console.error('Failed to seed base car data', error);
      } finally {
        if (!cancelled) {
          setHasEnsuredSeedData(true);
        }
      }
    };

    migrateInitialData();

    return () => {
      cancelled = true;
    };
  }, [adminEmail, hasEnsuredSeedData]);

  useEffect(() => {
    loadAllMakes();
    loadAllModels();
  }, []);

  // Sync activeSection with URL path changes (browser back/forward)
  useEffect(() => {
    const section = location.pathname.startsWith('/rooms/')
      ? 'rooms'
      : (pathToSection[location.pathname] || 'home');
    setActiveSection(section);
  }, [location.pathname]);

  const loadAllMakes = async () => {
    try {
      const { data } = await client.models.Make.list({ limit: 200 });
      const sorted = (data || []).sort((a, b) => a.makeName.localeCompare(b.makeName));
      setAllMakes(sorted);
    } catch (error) {
      console.error('Error loading makes:', error);
    }
  };

  const loadAllModels = async () => {
    try {
      const { data } = await client.models.Model.list({ limit: 500 });
      setAllModels(data || []);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  useEffect(() => {
    if (searchTerm.length < 1) {
      setMakes([]);
      return;
    }
    const filtered = allMakes.filter(make => 
      make.makeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setMakes(filtered);
  }, [searchTerm, allMakes]);

  const ensureNewsItems = async (): Promise<NewsItem[]> => {
    if (newsCache.length > 0) {
      return newsCache;
    }
    const items = await fetchNewsFeedItems();
    setNewsCache(items);
    return items;
  };

  const getNewsResults = async (term: string): Promise<SearchResultItem[]> => {
    try {
      const items = await ensureNewsItems();
      const query = term.toLowerCase();
      return items
        .filter((item) => {
          const haystack = `${item.title} ${item.description}`.toLowerCase();
          return haystack.includes(query);
        })
        .slice(0, 5)
        .map((item) => ({
          id: `news-${item.link}`,
          category: 'news',
          title: item.title,
          subtitle: item.source,
          description: item.description,
          url: item.link,
        }));
    } catch (error) {
      console.error('News search error:', error);
      return [];
    }
  };

  const ensureEvents = async (): Promise<EventModel[]> => {
    if (eventsCache.length > 0) {
      return eventsCache;
    }
    try {
      const { data } = await client.models.Event.list({ limit: 500 });
      const filtered = (data || []).filter((event) => event.isPublished !== false);
      setEventsCache(filtered);
      return filtered;
    } catch (error) {
      console.error('Error loading events for search:', error);
      return [];
    }
  };

  const getEventResults = async (term: string): Promise<SearchResultItem[]> => {
    const events = await ensureEvents();
    const query = term.toLowerCase();
    return events
      .filter((event) => {
        const haystack = `${event.title} ${event.description || ''}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 5)
      .map((event) => ({
        id: `event-${event.id}`,
        category: 'events',
        title: event.title,
        subtitle: [event.city, event.country].filter(Boolean).join(', '),
        description: event.description ? `${event.description.slice(0, 120)}...` : undefined,
        url: event.website || event.ticketUrl || undefined,
        data: event,
      }));
  };

  const ensureAuctions = async (): Promise<AuctionModel[]> => {
    if (auctionsCache.length > 0) {
      return auctionsCache;
    }
    try {
      const { data } = await client.models.Auction.list({ limit: 500 });
      setAuctionsCache(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading auctions for search:', error);
      return [];
    }
  };

  const getAuctionResults = async (term: string): Promise<SearchResultItem[]> => {
    const auctions = await ensureAuctions();
    const query = term.toLowerCase();
    return auctions
      .filter((lot) => (lot.title || '').toLowerCase().includes(query))
      .slice(0, 5)
      .map((lot) => ({
        id: `auction-${lot.id}`,
        category: 'auctions',
        title: lot.title || 'Auction Lot',
        subtitle: `${lot.auctionHouse || 'Auction'} • Lot ${lot.lotNumber}`,
        description: lot.auctionName || lot.auctionLocation || undefined,
        url: lot.lotUrl || undefined,
        data: lot,
      }));
  };

  const getRoomsResults = (term: string): SearchResultItem[] => {
    const query = term.toLowerCase();
    return ROOM_THREADS
      .filter((thread) => {
        const haystack = `${thread.title} ${thread.excerpt}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 5)
      .map((thread) => ({
        id: `room-${thread.id}`,
        category: 'rooms',
        title: thread.title,
        description: thread.excerpt,
      }));
  };

  useEffect(() => {
    let cancelled = false;
    const term = searchTerm.trim();

    if (term.length < 2) {
      setSearchResults(getEmptySearchResults());
      setSearchLoading(false);
      return;
    }

    const runSearch = async () => {
      setSearchLoading(true);
      try {
        const [news, events, auctions, rooms] = await Promise.all([
          getNewsResults(term),
          getEventResults(term),
          getAuctionResults(term),
          Promise.resolve(getRoomsResults(term)),
        ]);

        if (!cancelled) {
          setSearchResults({
            news,
            events,
            auctions,
            rooms,
          });
        }
      } catch (error) {
        console.error('Global search error:', error);
        if (!cancelled) {
          setSearchResults(getEmptySearchResults());
        }
      }

      if (!cancelled) {
        setSearchLoading(false);
      }
    };

    runSearch();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, allMakes, allModels]);

  const handleSelectMake = async (make: Make) => {
    setSelectedMake(make);
    setSearchTerm(make.makeName);
    setMakes([]);
    setActiveSection('home'); // Switch to home when selecting a make
    
    try {
      const { data } = await client.models.Model.list({
        filter: { makeId: { eq: make.makeId } }
      });
      const sorted = (data || []).sort((a, b) => (a.yearsFrom || 0) - (b.yearsFrom || 0));
      setModels(sorted);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    // Navigate to the new path
    const path = sectionToPath[section] || '/home';
    navigate(path);
    // Clear selection when switching sections
    if (section !== 'home') {
      setSelectedMake(null);
      setModels([]);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedMake(null);
    setModels([]);
    // Switch to home section when searching
    if (value.length > 0) {
      setActiveSection('home');
    }
    if (value.trim().length < 2) {
      setSearchResults(getEmptySearchResults());
    }
  };

  const handleSearchResultSelect = async (result: SearchResultItem) => {
    if (result.category === 'news') {
      setActiveSection('news');
      navigate('/news');
      if (result.url) {
        openExternalUrl(result.url);
      }
    } else if (result.category === 'events') {
      setActiveSection('events');
      navigate('/events');
      if (result.url) {
        openExternalUrl(result.url);
      }
    } else if (result.category === 'auctions') {
      setActiveSection('auctions');
      navigate('/auctions');
      if (result.url) {
        openExternalUrl(result.url);
      }
    } else if (result.category === 'rooms') {
      setActiveSection('rooms');
      navigate('/rooms');
    }

    setSearchTerm('');
    setSearchResults(getEmptySearchResults());
  };

  const persistSavedEvents = (updater: (prev: EventModel[]) => EventModel[]) => {
    setSavedEvents((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SAVED_EVENTS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSaveEvent = (event: EventModel) => {
    persistSavedEvents((prev) => {
      if (prev.some((saved) => saved.id === event.id)) {
        return prev;
      }
      return [...prev, event];
    });
  };

  const appUIContextValue = {
    activeSection,
    setActiveSection: handleSectionChange,
    searchTerm,
    setSearchTerm: handleSearchChange,
    searchResults,
    searchLoading,
    onSearchResultSelect: handleSearchResultSelect,
  };

  const mainBackgroundColor = '#FFFFFF';

  return (
    <AppUIProvider value={appUIContextValue}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: mainBackgroundColor,
        overflowX: 'visible',
        width: '100%',
        position: 'relative',
        paddingTop: topPadding
      }}>
        <Header />

      {/* Main layout with sidebar and content - 10% / 80% / 10% */}
      <div style={{
        display: 'flex',
        width: '100%',
        minHeight: 'calc(100vh - 60px)',
        backgroundColor: '#F2F3F5',
      }}>
        {/* Left Column - 10% */}
        {!isMobile && (
          <div style={{
            width: '10%',
            flexShrink: 0,
            backgroundColor: '#F2F3F5',
            position: 'relative',
          }}>
            <LeftSidebar
              userInitials={userInitials}
            />
          </div>
        )}

        {/* Main Content Area - 80% */}
        <div style={{
          width: isMobile ? '100%' : '80%',
          minWidth: 0,
          backgroundColor: '#F2F3F5',
        }}>
          {/* NEWS SECTION */}
          {activeSection === 'news' && (
            <NewsSection />
          )}

          {/* AUCTIONS SECTION */}
          {activeSection === 'auctions' && (
            <AuctionsPage />
          )}

          {/* EVENTS SECTION */}
          {activeSection === 'events' && (
            <EventsSection onSaveEvent={handleSaveEvent} />
          )}

          {/* ROOMS SECTION */}
          {activeSection === 'rooms' && !location.pathname.startsWith('/rooms/') && (
            <CommunitySection />
          )}

          {/* SHOP SECTION */}
          {activeSection === 'shop' && (
            <ShopSection />
          )}

          {/* SAVED EVENTS SECTION */}
          {activeSection === 'saved' && (
            <SavedEventsSection savedEvents={savedEvents} onSaveEvent={handleSaveEvent} />
          )}

          {/* CHAT SECTION */}
          {activeSection === 'chat' && (
            <div style={{
              width: '100%',
              padding: `2rem ${horizontalPadding}`
            }}>
              <ChatSection />
            </div>
          )}

          {/* MY GARAGE SECTION */}
          {activeSection === 'garage' && (
            <MyGarageSection
              user={user}
              signOut={signOut}
              onSectionChange={handleSectionChange}
            />
          )}

          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <ProfileSection user={user} signOut={signOut} />
          )}

          {/* ADMIN SECTION */}
          {activeSection === 'admin' && (
            <div style={{ width: '100%' }}>
              <AdminSection />
            </div>
          )}

          {/* ROOM DETAIL PAGE */}
          {location.pathname.startsWith('/rooms/') && (
            <RoomPage />
          )}

          {/* HOME SECTION - New HomePage component with all sections */}
          {!location.pathname.startsWith('/rooms/') && activeSection === 'home' && !selectedMake && makes.length === 0 && (
            <HomePage />
          )}

          {/* Search Results or Selected Make View */}
          {activeSection === 'home' && (selectedMake || makes.length > 0) && (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
              {/* Search Results Dropdown */}
              {makes.length > 0 && !selectedMake && (
                <div style={{
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  marginBottom: '1.5rem'
                }}>
                  {makes.map((make) => (
                    <div
                      key={make.makeId}
                      onClick={() => handleSelectMake(make)}
                      style={{ padding: '1rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <strong>{make.makeName}</strong>
                      {make.country && <span style={{ color: '#666', marginLeft: '0.5rem' }}>({make.country})</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Make Details */}
              {selectedMake && (
                <>
                  <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                    <h2>{selectedMake.makeName}</h2>
                    <p><strong>Country:</strong> {selectedMake.country || 'Unknown'}</p>
                    <p><strong>Classic Brand:</strong> {selectedMake.isClassic ? 'Yes' : 'No'}</p>
                    {selectedMake.yearsFrom && <p><strong>Founded:</strong> {selectedMake.yearsFrom}</p>}
                  </div>

                  {/* Models List */}
                  {models.length > 0 && (
                    <div>
                      <h3>Models ({models.length})</h3>
                      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                        {models.map((model) => (
                          <div key={model.modelId} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0' }}>{model.modelName}</h4>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{model.fullName}</p>
                            {model.yearsFrom && (
                              <p style={{ margin: '0.5rem 0 0 0', color: '#888', fontSize: '0.8rem' }}>
                                {model.yearsFrom}{model.yearsTo ? ` - ${model.yearsTo}` : ' - Present'}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Column - 10% */}
        {!isMobile && (
          <div style={{
            width: '10%',
            flexShrink: 0,
            backgroundColor: '#F2F3F5',
          }}>
            {/* Empty column for now */}
          </div>
        )}
      </div>

      <Footer />
      </div>
    </AppUIProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Authenticator>
        {({ signOut, user }) => (
          <Routes>
            <Route path="*" element={<CarSearch user={user} signOut={signOut || (() => {})} />} />
          </Routes>
        )}
      </Authenticator>
    </BrowserRouter>
  );
}

export default App;

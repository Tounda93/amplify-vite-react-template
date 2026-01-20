import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { getImageUrl } from './utils/storageHelpers';
import { FALLBACKS } from './utils/fallbacks';

const client = generateClient<Schema>();

type Auction = Schema['Auction']['type'];

interface AuctionEvent {
  id: string;
  name: string;
  location: string;
  date: string;
  auctionHouse: string;
  coverImage: string;
  lotCount: number;
  lots: Auction[];
}

export function AuctionsSection() {
  const [auctionEvents, setAuctionEvents] = useState<AuctionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuctionEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuctions();
    const subscription = client.models.Auction.observeQuery().subscribe({
      next: ({ items }) => {
        void handleAuctionsUpdate(items);
      },
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selected event when auctions change (for live updates)
  useEffect(() => {
    if (selectedEvent) {
      const updated = auctionEvents.find(e => e.id === selectedEvent.id);
      if (updated) setSelectedEvent(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionEvents]);

  const loadAuctions = async () => {
    try {
      const { data } = await client.models.Auction.list({ limit: 500 });
      await handleAuctionsUpdate(data || []);
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

  const handleAuctionsUpdate = async (items: Auction[]) => {
    const resolved = await hydrateAuctionImages(items);
    groupAuctionsByEvent(resolved);
    setLoading(false);
  };

  const groupAuctionsByEvent = (lots: Auction[]) => {
    const eventMap = new Map<string, AuctionEvent>();

    lots.forEach(lot => {
      const eventKey = `${lot.auctionHouse}-${lot.auctionName || lot.auctionLocation || 'Unknown'}`;
      
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, {
          id: eventKey,
          name: lot.auctionName || lot.auctionLocation || 'Upcoming Auction',
          location: lot.auctionLocation || 'TBA',
          date: lot.auctionDate || '',
          auctionHouse: lot.auctionHouse || 'Unknown',
          coverImage: '', // Will be set from lots
          lotCount: 0,
          lots: [],
        });
      }

      const event = eventMap.get(eventKey)!;
      event.lots.push(lot);
      event.lotCount = event.lots.length;
    });

    // Set cover image from lots (use first lot with an image)
    eventMap.forEach(event => {
      const lotWithImage = event.lots.find(lot => lot.imageUrl && lot.imageUrl.length > 0);
      event.coverImage = lotWithImage?.imageUrl || FALLBACKS.auction;
    });

    const events = Array.from(eventMap.values()).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    setAuctionEvents(events);
  };

  const deleteAuction = async (auction: Auction) => {
    if (!confirm(`Delete "${auction.title}"?`)) return;
    try {
      await client.models.Auction.delete({ id: auction.id });
    } catch (error) {
      console.error('Error deleting auction:', error);
    }
  };

  const deleteAllLotsInEvent = async (event: AuctionEvent) => {
    if (!confirm(`Delete all ${event.lotCount} lots in "${event.name}"?`)) return;
    try {
      for (const lot of event.lots) {
        await client.models.Auction.delete({ id: lot.id });
      }
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting lots:', error);
    }
  };

  const formatPrice = (amount: number | null | undefined, currency: string = 'USD') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date TBA';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).toUpperCase();
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const styles: Record<string, { bg: string; text: string }> = {
      live: { bg: '#e74c3c', text: '🔴 LIVE' },
      upcoming: { bg: '#3498db', text: '📅 Upcoming' },
      sold: { bg: '#27ae60', text: '✅ Sold' },
      not_sold: { bg: '#95a5a6', text: '❌ Not Sold' },
      withdrawn: { bg: '#7f8c8d', text: '⏸️ Withdrawn' },
    };
    const style = styles[status || 'upcoming'] || styles.upcoming;
    return (
      <span style={{
        background: style.bg,
        color: 'white',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading auctions...</div>;
  }

  return (
    <div>
      {/* Action Buttons - Always visible */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {selectedEvent && (
          <button
            onClick={() => setSelectedEvent(null)}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#1a1a2e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ← Back to Auctions
          </button>
        )}
      </div>

      {/* ===== LOTS VIEW (inside an auction event) ===== */}
      {selectedEvent ? (
        <div>
          {/* Event Header */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <img
              src={selectedEvent.coverImage || FALLBACKS.auction}
              alt={selectedEvent.name}
              style={{
                width: '150px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACKS.auction;
              }}
            />
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                {selectedEvent?.auctionHouse}
              </div>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{selectedEvent.name}</h2>
              <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
                📍 {selectedEvent.location} &nbsp;•&nbsp; 📅 {formatDate(selectedEvent.date)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{
                background: '#e8f4f8',
                color: '#1a1a2e',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontWeight: 'bold',
              }}>
                {selectedEvent.lotCount} Lots
              </span>
              <button
                onClick={() => deleteAllLotsInEvent(selectedEvent)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                🗑️ Delete All
              </button>
            </div>
          </div>

          {/* Lots Grid - Scrollable Container */}
          <div style={{
            maxHeight: 'calc(100vh - 400px)',
            minHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '0.5rem',
            borderRadius: '12px',
            background: '#f5f5f5',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
            }}>
              {selectedEvent.lots
                .sort((a, b) => parseInt(a.lotNumber || '0') - parseInt(b.lotNumber || '0'))
                .map(lot => (
                  <div
                    key={lot.id}
                    style={{
                      background: 'white',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                    }}
                  >
                    {/* Lot Image */}
                    <div style={{ position: 'relative' }}>
                      <img
                        src={lot.imageUrl || FALLBACKS.auction}
                        alt={lot.title || 'Lot'}
                        style={{
                          width: '100%',
                          height: '140px',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACKS.auction;
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                      }}>
                        Lot {lot.lotNumber}
                      </div>
                      {lot.reserveStatus === 'no_reserve' && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#f39c12',
                          color: 'white',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          fontSize: '0.65rem',
                        }}>
                          NO RESERVE
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                      }}>
                        {getStatusBadge(lot.status)}
                      </div>
                    </div>

                    {/* Lot Info */}
                    <div style={{ padding: '0.75rem' }}>
                      <h4 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.85rem',
                        lineHeight: '1.25',
                        height: '2.5rem',
                        overflow: 'hidden',
                        color: '#1a1a2e',
                      }}>
                        {lot.lotUrl ? (
                          <a
                            href={lot.lotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1a1a2e', textDecoration: 'none' }}
                          >
                            {lot.title}
                          </a>
                        ) : lot.title}
                      </h4>

                      {/* Estimate */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#888', marginBottom: '0.1rem', textTransform: 'uppercase' }}>
                          Estimate
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#1a1a2e' }}>
                          {lot.estimateLow && lot.estimateHigh
                            ? `${formatPrice(lot.estimateLow, lot.currency || 'USD')} - ${formatPrice(lot.estimateHigh, lot.currency || 'USD')}`
                            : 'On Request'
                          }
                        </div>
                      </div>

                      {/* Sold/Bid Price */}
                      {lot.status === 'sold' && lot.soldPrice && (
                        <div style={{
                          background: '#d4edda',
                          color: '#155724',
                          padding: '0.4rem',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          marginBottom: '0.5rem',
                        }}>
                          SOLD: {formatPrice(lot.soldPrice, lot.currency || 'USD')}
                        </div>
                      )}
                      {lot.status === 'live' && lot.currentBid && (
                        <div style={{
                          background: '#f8d7da',
                          color: '#721c24',
                          padding: '0.4rem',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          marginBottom: '0.5rem',
                          animation: 'pulse 2s infinite',
                        }}>
                          BID: {formatPrice(lot.currentBid, lot.currency || 'USD')}
                        </div>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => deleteAuction(lot)}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          background: 'transparent',
                          color: '#e74c3c',
                          border: '1px solid #e74c3c',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* ===== AUCTION EVENTS VIEW (main view) ===== */
        auctionEvents.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.5rem',
          }}>
            {auctionEvents.map(event => (
              <div
                key={event.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
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
                    src={event.coverImage || FALLBACKS.auction}
                    alt={event.name}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACKS.auction;
                    }}
                  />
                  {/* Available Lots Button */}
                  <button
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      padding: '0.6rem 1.2rem',
                      background: 'rgba(255,255,255,0.95)',
                      color: '#1a1a2e',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#1a1a2e';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                      e.currentTarget.style.color = '#1a1a2e';
                    }}
                  >
                    {event.lotCount} Available Lots
                  </button>

                  {/* Auction House Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                  }}>
                    {event.auctionHouse}
                  </div>
                </div>

                {/* Event Info */}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{
                    margin: '0 0 0.4rem 0',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: '#1a1a2e',
                  }}>
                    {event.name}
                  </h3>
                  <p style={{
                    margin: '0 0 0.2rem 0',
                    color: '#555',
                    fontSize: '0.9rem',
                  }}>
                    {event.location}
                  </p>
                  <p style={{
                    margin: '0 0 0.75rem 0',
                    color: '#888',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {formatDate(event.date)}
                  </p>

                  <button
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: '#1a1a2e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e74c3c'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#1a1a2e'}
                  >
                    VIEW ALL LOTS
                  </button>
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
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔨</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>No Auctions Yet</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Auctions will appear here as they are added.
            </p>
          </div>
        )
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        /* Responsive: 2 columns on tablet, 1 on mobile */
        @media (max-width: 1200px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: repeat(4"], 
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: repeat(4"],
          div[style*="grid-template-columns: repeat(3"],
          div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

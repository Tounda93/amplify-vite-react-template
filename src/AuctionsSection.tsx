import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

type Auction = Schema['Auction']['type'];
type AuctionStatus = NonNullable<Auction['status']>;
type AuctionReserveStatus = NonNullable<Auction['reserveStatus']>;

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

const AUCTION_HOUSES = [
  { id: 'rm_sothebys', name: "RM Sotheby's", logo: '🔵', url: 'https://rmsothebys.com/' },
  { id: 'broad_arrow', name: 'Broad Arrow', logo: '🟠', url: 'https://www.broadarrowauctions.com/' },
  { id: 'bonhams', name: 'Bonhams', logo: '🔴', url: 'https://www.bonhams.com/department/MOT-CAR/' },
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80';

const parseMoneyValue = (value: string | null | undefined): number | undefined => {
  if (!value) return undefined;
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return undefined;
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseEstimateRange = (estimate: string | null | undefined): { low?: number; high?: number } => {
  if (!estimate) return {};
  const matches = estimate.match(/[\d,.]+/g);
  if (!matches || matches.length === 0) return {};
  const low = parseMoneyValue(matches[0]);
  const high = matches[1] ? parseMoneyValue(matches[1]) : undefined;
  return { low, high };
};

const detectAuctionHouseFromUrl = (url?: string): string => {
  if (!url) return 'Unknown';
  const value = url.toLowerCase();
  if (value.includes('broadarrow')) return 'Broad Arrow';
  if (value.includes('bonhams')) return 'Bonhams';
  if (value.includes('rmsothebys') || value.includes('rmauction')) return "RM Sotheby's";
  return 'Unknown';
};

const normalizeStatus = (status?: string | null): AuctionStatus => {
  const value = (status || '').toLowerCase();
  if (value.includes('sold')) return 'sold';
  if (value.includes('live')) return 'live';
  if (value.includes('pass') || value.includes('unsold')) return 'not_sold';
  return 'upcoming';
};

type UnknownRecord = Record<string, unknown>;

interface NormalizedLot {
  auctionHouse: string;
  lotNumber: string;
  title: string;
  description: string;
  imageUrl?: string;
  estimateLow?: number;
  estimateHigh?: number;
  currency: string;
  currentBid?: number;
  soldPrice?: number;
  reserveStatus: AuctionReserveStatus;
  status: AuctionStatus;
  auctionDate?: string | null;
  auctionLocation: string;
  auctionName: string;
  lotUrl?: string;
  lastUpdated: string;
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (obj: UnknownRecord | undefined, key: string): string | undefined => {
  if (!obj) return undefined;
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
};

const getNestedString = (obj: UnknownRecord | undefined, path: string[]): string | undefined => {
  let current: unknown = obj;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
};

const normalizeReserveStatus = (status?: string | null): AuctionReserveStatus => {
  const value = (status || '').toLowerCase().trim();
  if (!value) return 'unknown';
  if (value === 'no_reserve') return 'no_reserve';
  if (value === 'reserve') return 'reserve';
  if (value.includes('no') && value.includes('reserve')) return 'no_reserve';
  if (value.includes('reserve')) return 'reserve';
  return 'unknown';
};

const normalizeLotNumber = (rawLotNumber: string | undefined, lotUrl: string | undefined, index: number): string => {
  const raw = (rawLotNumber || '').trim();
  const lowered = raw.toLowerCase();
  const invalid = new Set(['sold', 'not sold', 'notsold', 'closed', 'withdrawn', 'live', 'upcoming']);

  if (raw && !invalid.has(lowered)) {
    if (/^\d+$/.test(raw)) return raw;
    const digits = raw.match(/\d+/)?.[0];
    if (digits) return digits.replace(/^0+/, '') || digits;
  }

  const url = lotUrl || '';
  const slug = url.split('/').filter(Boolean).pop() || '';
  const slugMatch = slug.match(/^[a-z]0*([0-9]{1,})-/i);
  if (slugMatch) return slugMatch[1];

  return String(index + 1);
};

const normalizeRawLot = (rawLot: UnknownRecord, index: number, meta?: UnknownRecord, auctionIdFallback?: string): NormalizedLot => {
  const estimateText = getString(rawLot, 'estimate');
  const { low, high } = parseEstimateRange(estimateText);

  const lotUrl = getString(rawLot, 'lotUrl');
  const auctionUrl = getString(meta, 'auctionUrl') || getString(meta, 'auctionURL') || getString(meta, 'url');

  const statusLabel = getString(rawLot, 'statusLabel') || getString(rawLot, 'status');
  const currency = getString(rawLot, 'currency') || 'USD';

  const title =
    getString(rawLot, 'lotTitle') ||
    getString(rawLot, 'title') ||
    'Unknown Vehicle';

  const description =
    getString(rawLot, 'description') ||
    getString(rawLot, 'shortDescription') ||
    '';

  const imageUrl = getString(rawLot, 'lotCoverImageUrl') || getString(rawLot, 'imageUrl');

  const currentBidText = getString(rawLot, 'currentBid');
  const currentBid = parseMoneyValue(currentBidText);
  const soldPrice = (statusLabel || '').toLowerCase() === 'sold' ? currentBid : undefined;

  return {
    auctionHouse: getString(rawLot, 'auctionHouse') || detectAuctionHouseFromUrl(auctionUrl || lotUrl),
    lotNumber: normalizeLotNumber(getString(rawLot, 'lotNumber'), lotUrl, index),
    title,
    description,
    imageUrl,
    estimateLow: low,
    estimateHigh: high,
    currency,
    currentBid,
    soldPrice,
    reserveStatus: normalizeReserveStatus(getString(rawLot, 'reserveStatus')),
    status: normalizeStatus(statusLabel),
    auctionDate: getNestedString(meta, ['biddingStartDateTime', 'iso']) || getString(meta, 'auctionDate') || null,
    auctionLocation: getString(meta, 'location') || getString(meta, 'auctionLocation') || '',
    auctionName: getString(meta, 'title') || getString(meta, 'auctionName') || auctionIdFallback || 'Upcoming Auction',
    lotUrl,
    lastUpdated: new Date().toISOString(),
  };
};

const flattenExtensionPayload = (payload: unknown): NormalizedLot[] => {
  console.log('[flattenExtensionPayload] Input type:', typeof payload, Array.isArray(payload) ? 'array' : '');

  if (!payload) {
    console.log('[flattenExtensionPayload] payload is falsy');
    return [];
  }

  // Format A: already an array of lots
  if (Array.isArray(payload)) {
    console.log('[flattenExtensionPayload] payload is array with', payload.length, 'items');
    return payload
      .filter(isRecord)
      .map((lot, index) => normalizeRawLot(lot, index, undefined, undefined));
  }

  if (!isRecord(payload)) return [];

  console.log('[flattenExtensionPayload] payload keys:', Object.keys(payload));

  // Format B: wrapper object with a `lots: []` array (common when copying from DevTools)
  if (Array.isArray(payload.lots)) {
    console.log('[flattenExtensionPayload] payload has lots[] with', payload.lots.length, 'items');
    const meta = payload;
    return payload.lots
      .filter(isRecord)
      .map((lot, index) => normalizeRawLot(lot, index, meta, getString(meta, 'auctionName')));
  }

  // Format C: { auctions: [], lotsByAuctionId: { [auctionId]: [] } }
  const auctionsById = new Map<string, UnknownRecord>();
  if (Array.isArray(payload.auctions)) {
    const auctions = payload.auctions.filter(isRecord);
    console.log('[flattenExtensionPayload] Found', auctions.length, 'auctions');
    auctions.forEach((auction) => {
      const auctionId = getString(auction, 'auctionId');
      if (auctionId) auctionsById.set(auctionId, auction);
    });
  }

  const lotsById = isRecord(payload.lotsByAuctionId) ? payload.lotsByAuctionId : {};
  console.log('[flattenExtensionPayload] lotsByAuctionId keys:', Object.keys(lotsById));

  const lots: NormalizedLot[] = [];
  Object.entries(lotsById).forEach(([auctionId, lotArray]) => {
    console.log(
      '[flattenExtensionPayload] Processing auctionId:',
      auctionId,
      'isArray:',
      Array.isArray(lotArray),
      'length:',
      Array.isArray(lotArray) ? lotArray.length : 'N/A'
    );

    if (!Array.isArray(lotArray)) {
      console.log('[flattenExtensionPayload] Skipping', auctionId, '- not an array');
      return;
    }

    const meta = auctionsById.get(auctionId);
    lotArray
      .filter(isRecord)
      .forEach((rawLot, index) => {
        lots.push(normalizeRawLot(rawLot, index, meta, auctionId));
      });
  });

  console.log('[flattenExtensionPayload] Total lots processed:', lots.length);
  return lots;
};

export function AuctionsSection() {
  const [auctionEvents, setAuctionEvents] = useState<AuctionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuctionEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');

  useEffect(() => {
    loadAuctions();
    const subscription = client.models.Auction.observeQuery().subscribe({
      next: ({ items }) => {
        groupAuctionsByEvent(items);
        setLoading(false);
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
      groupAuctionsByEvent(data || []);
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
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
      event.coverImage = lotWithImage?.imageUrl || FALLBACK_IMAGE;
    });

    const events = Array.from(eventMap.values()).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    setAuctionEvents(events);
  };

  const handleImportFromExtension = async () => {
    try {
      const data = JSON.parse(importJson);
      console.log('Parsed JSON data:', data);
      console.log('lotsByAuctionId keys:', data.lotsByAuctionId ? Object.keys(data.lotsByAuctionId) : 'none');

      const normalizedLots = flattenExtensionPayload(data);
      console.log('Normalized lots count:', normalizedLots?.length || 0);

      if (!normalizedLots || normalizedLots.length === 0) {
        // Provide more helpful error message
        let errorMsg = 'Invalid data format.\n\n';
        if (!data) {
          errorMsg += 'No data found in JSON.';
        } else if (Array.isArray(data) && data.length === 0) {
          errorMsg += 'Empty array provided.';
        } else if ((data as { lotsByAuctionId?: unknown })?.lotsByAuctionId) {
          const auctionIds = Object.keys(data.lotsByAuctionId);
          if (auctionIds.length === 0) {
            errorMsg += 'No auctions found in lotsByAuctionId.';
          } else {
            const totalLots = auctionIds.reduce((sum, id) => {
              const lots = data.lotsByAuctionId[id];
              return sum + (Array.isArray(lots) ? lots.length : 0);
            }, 0);
            errorMsg += `Found ${auctionIds.length} auction(s) but ${totalLots} lots could not be processed.`;
          }
        } else if ((data as { lots?: unknown })?.lots && Array.isArray((data as { lots?: unknown }).lots)) {
          errorMsg += `Found ${(data as { lots: unknown[] }).lots.length} lot(s) under "lots", but they could not be processed.`;
        } else {
          errorMsg += 'Expected an array of lots, or { lots: [...] }, or { auctions: [], lotsByAuctionId: { ... } }.';
        }
        alert(errorMsg);
        return;
      }
      
      let imported = 0;
      for (const lot of normalizedLots) {
        try {
          await client.models.Auction.create({
            auctionHouse: lot.auctionHouse,
            lotNumber: lot.lotNumber,
            title: lot.title,
            description: lot.description,
            imageUrl: lot.imageUrl,
            estimateLow: lot.estimateLow,
            estimateHigh: lot.estimateHigh,
            currency: lot.currency,
            currentBid: lot.currentBid,
            soldPrice: lot.soldPrice,
            reserveStatus: lot.reserveStatus,
            status: lot.status,
            auctionDate: lot.auctionDate,
            auctionLocation: lot.auctionLocation,
            auctionName: lot.auctionName,
            lotUrl: lot.lotUrl,
            lastUpdated: new Date().toISOString(),
          });
          imported++;
        } catch (err) {
          console.error('Error importing lot:', err);
        }
      }
      
      alert(`Successfully imported ${imported} auction lots!`);
      setImportJson('');
      setShowImport(false);
      loadAuctions();
    } catch (error) {
      alert('Invalid JSON. Please paste the data copied from the Chrome extension.');
    }
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
      {/* Auction House Links - Always visible */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {AUCTION_HOUSES.map(house => (
          <a
            key={house.id}
            href={house.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'white',
              border: '2px solid #ddd',
              borderRadius: '8px',
              textDecoration: 'none',
              color: '#333',
              fontWeight: 'bold',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#e74c3c';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{house.logo}</span>
            {house.name}
          </a>
        ))}
      </div>

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
        <button
          onClick={() => { setShowImport(!showImport); }}
          style={{
            padding: '0.75rem 1.5rem',
            background: showImport ? '#c0392b' : '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {showImport ? '✕ Cancel' : '📥 Import from Extension'}
        </button>
      </div>

      {/* Import from Extension */}
      {showImport && (
        <div style={{
          background: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '2px solid #9b59b6',
        }}>
          <h3 style={{ marginTop: 0 }}>📥 Import from Chrome Extension</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            1. Go to an auction page on RM Sotheby's, Bonhams, or Broad Arrow<br/>
            2. Click the "Collectible Tracker" extension icon<br/>
            3. Click "Scrape This Page"<br/>
            4. Click "Copy Data to Clipboard"<br/>
            5. Paste below and click Import
          </p>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder='Paste JSON data here...'
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleImportFromExtension}
            disabled={!importJson.trim()}
            style={{
              padding: '0.75rem 2rem',
              background: importJson.trim() ? '#27ae60' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: importJson.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
            }}
          >
            Import Auction Data
          </button>
        </div>
      )}

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
              src={selectedEvent.coverImage || FALLBACK_IMAGE}
              alt={selectedEvent.name}
              style={{
                width: '150px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
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
                        src={lot.imageUrl || FALLBACK_IMAGE}
                        alt={lot.title || 'Lot'}
                        style={{
                          width: '100%',
                          height: '140px',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
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
                    src={event.coverImage || FALLBACK_IMAGE}
                    alt={event.name}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
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
              Use the Chrome extension to scrape auction data from RM Sotheby's, Bonhams, or Broad Arrow.
            </p>
            <button
              onClick={() => setShowImport(true)}
              style={{
                padding: '0.75rem 2rem',
                background: '#9b59b6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              📥 Import Auction Data
            </button>
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

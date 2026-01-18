import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getImageUrl } from '../utils/storageHelpers';

const client = generateClient<Schema>();

type Auction = Schema['Auction']['type'];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80';

export default function AuctionsCarousel() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    try {
      const { data } = await client.models.Auction.list({ limit: 50 });
      const resolved = await Promise.all(
        (data || []).map(async (auction) => {
          if (!auction.imageUrl) return auction;
          const imageUrl = await getImageUrl(auction.imageUrl);
          return imageUrl ? { ...auction, imageUrl } : auction;
        })
      );

      // Filter upcoming and live auctions, sort by date
      const relevantAuctions = resolved
        .filter(auction => {
          if (!auction.auctionDate) return false;
          const auctionDate = new Date(auction.auctionDate);
          const now = new Date();
          // Show auctions from 7 days ago to future
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return auctionDate >= sevenDaysAgo;
        })
        .sort((a, b) => {
          const dateA = new Date(a.auctionDate!);
          const dateB = new Date(b.auctionDate!);
          return dateA.getTime() - dateB.getTime();
        });

      setAuctions(relevantAuctions.slice(0, 12)); // Show max 12 auctions
    } catch (error) {
      console.error('Error loading auctions:', error);
    }
    setLoading(false);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 350;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return 'No estimate';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return formatted;
  };

  const getStatusColor = (status?: Auction['status']) => {
    const colors = {
      'upcoming': '#3498db',
      'live': '#e74c3c',
      'sold': '#27ae60',
      'not_sold': '#95a5a6',
      'withdrawn': '#95a5a6',
    };
    return colors[status || 'upcoming'] || '#95a5a6';
  };

  const getStatusLabel = (status?: Auction['status']) => {
    const labels = {
      'upcoming': 'UPCOMING',
      'live': 'LIVE NOW',
      'sold': 'SOLD',
      'not_sold': 'NOT SOLD',
      'withdrawn': 'WITHDRAWN',
    };
    return labels[status || 'upcoming'] || 'UPCOMING';
  };

  if (loading) {
    return (
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '700' }}>
          Featured Auctions
        </h2>
        <p style={{ color: '#666' }}>Loading auctions...</p>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: '700' }}>
          Featured Auctions
        </h2>
        <p style={{ color: '#666' }}>No upcoming auctions yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '3rem', position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
          Featured Auctions
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => scroll('left')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={20} color="#666" />
          </button>
          <button
            onClick={() => scroll('right')}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={20} color="#666" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '20px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '0 5rem 10px 5rem',
          marginLeft: '-5rem',
          marginRight: '-5rem'
        }}
      >
        {auctions.map((auction) => (
          <div
            key={auction.id}
            style={{
              minWidth: '320px',
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => {
              if (auction.lotUrl) {
                window.open(auction.lotUrl, '_blank');
              }
            }}
          >
            {/* Auction Image */}
            <div style={{
              width: '100%',
              height: '180px',
              backgroundColor: '#f3f4f6',
              backgroundImage: `url(${auction.imageUrl || FALLBACK_IMAGE})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}>
              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '4px 12px',
                backgroundColor: getStatusColor(auction.status),
                color: 'white',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                animation: auction.status === 'live' ? 'pulse 2s infinite' : 'none',
              }}>
                {getStatusLabel(auction.status)}
              </div>

              {/* Auction House */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '4px 12px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
              }}>
                {auction.auctionHouse}
              </div>

              {/* Lot Number */}
              {auction.lotNumber && (
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                }}>
                  LOT {auction.lotNumber}
                </div>
              )}
            </div>

            {/* Auction Details */}
            <div style={{ padding: '16px' }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '15px',
                fontWeight: '700',
                color: '#111827',
                lineHeight: '1.4',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {auction.title}
              </h3>

              {/* Estimate */}
              {auction.estimateLow && auction.estimateHigh && (
                <div style={{
                  marginBottom: '12px',
                  padding: '10px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    marginBottom: '4px',
                    fontWeight: '600',
                  }}>
                    ESTIMATE
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#111827',
                  }}>
                    {formatCurrency(auction.estimateLow, auction.currency || undefined)} - {formatCurrency(auction.estimateHigh, auction.currency || undefined)}
                  </div>
                </div>
              )}

              {/* Sold Price */}
              {auction.soldPrice && (
                <div style={{
                  marginBottom: '12px',
                  padding: '10px',
                  backgroundColor: '#d1fae5',
                  borderRadius: '8px',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#065f46',
                    marginBottom: '4px',
                    fontWeight: '600',
                  }}>
                    SOLD FOR
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#065f46',
                  }}>
                    {formatCurrency(auction.soldPrice, auction.currency || undefined)}
                  </div>
                </div>
              )}

              {/* Date */}
              {auction.auctionDate && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                  color: '#6b7280',
                  fontSize: '13px',
                }}>
                  <Calendar size={14} />
                  <span>{formatDate(auction.auctionDate)}</span>
                </div>
              )}

              {/* Location */}
              {auction.auctionLocation && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '12px',
                  color: '#6b7280',
                  fontSize: '13px',
                }}>
                  <MapPin size={14} />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {auction.auctionLocation}
                  </span>
                </div>
              )}

              {/* Reserve Status */}
              {auction.reserveStatus && auction.reserveStatus === 'no_reserve' && (
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  marginBottom: '12px',
                }}>
                  NO RESERVE
                </div>
              )}

              {/* View Lot Button */}
              {auction.lotUrl && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#3498db',
                  fontSize: '13px',
                  fontWeight: '600',
                }}>
                  View Lot <ExternalLink size={13} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

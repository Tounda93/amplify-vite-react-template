import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { getImageUrl } from '../utils/storageHelpers';
import { FALLBACKS } from '../utils/fallbacks';
import { openExternalUrl } from '../utils/url';
import EventCard from './Card/EventCard';

const client = generateClient<Schema>();

type Auction = Schema['Auction']['type'];

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
          <div key={auction.id} style={{ minWidth: '320px' }}>
            <EventCard
              imageUrl={auction.imageUrl || FALLBACKS.auctionCarousel}
              imageAlt={auction.title || 'Auction lot'}
              imageHeight={180}
              dateLabel={auction.auctionDate ? formatDate(auction.auctionDate) : 'Date TBA'}
              title={auction.title || 'Auction Lot'}
              locationLabel={auction.auctionLocation || auction.auctionHouse || 'Auction'}
              footerLabel="Lot"
              footerValue={auction.lotNumber || '—'}
              showMenu={false}
              onClick={() => {
                if (auction.lotUrl) {
                  openExternalUrl(auction.lotUrl);
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

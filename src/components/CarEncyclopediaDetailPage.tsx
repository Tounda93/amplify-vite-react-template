import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from './Header';
import { SearchResultGroups } from '../types/search';

export type CarOverview = {
  production: string;
  designer: string;
  kerbWeight: string;
  engine: string;
  transmission: string;
  power: string;
  fuel: string;
};

export type CarEncyclopediaComment = {
  id: string;
  userName: string;
  avatarUrl?: string;
  text: string;
};

export interface CarEncyclopediaDetail {
  make: string;
  model: string;
  variant?: string;
  releaseYear: number | string;
  heroImageUrl: string;
  sideImageUrl: string;
  heroGallery?: string[];
  brandLogoUrl?: string;
  summary?: string;
  overview: CarOverview;
  extraFields?: { label: string; value: string }[];
  comments?: CarEncyclopediaComment[];
}

interface StatProps {
  label: string;
  value: React.ReactNode;
}

function Stat({ label, value }: StatProps) {
  return (
    <div>
      <div className="text-[12px] font-semibold text-black">{label}</div>
      <div className="mt-1 text-[15px] text-black">{value}</div>
    </div>
  );
}

function OverviewCard({
  overview,
  extraFields = [],
}: {
  overview: CarOverview;
  extraFields?: { label: string; value: string }[];
}) {
  const rows: Array<[string, string]> = [
    ['Production', overview.production],
    ['Designer', overview.designer],
    ['Kerb weight', overview.kerbWeight],
    ['Engine', overview.engine],
    ['Transmission', overview.transmission],
    ['Power', overview.power],
    ['Fuel', overview.fuel],
  ];

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-sm">
      <h2 className="text-[25px] font-semibold text-black">Car overview</h2>

      <div className="mt-4 border-t border-black/20">
        {[...rows, ...extraFields.map(({ label, value }) => [label, value] as [string, string])].map(
          ([k, v]) => (
          <div
            key={k}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1.5rem',
              padding: '0.75rem 0',
              borderBottom: '1px solid rgba(0,0,0,0.12)',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#000', flex: '0 0 40%' }}>{k}</span>
            <span style={{ fontSize: '15px', color: '#000', flex: '1', textAlign: 'left' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentsCard({
  comments = [],
  onAddComment,
}: {
  comments?: CarEncyclopediaComment[];
  onAddComment: (name: string, message: string) => void;
}) {
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    onAddComment(author.trim(), message.trim());
    setMessage('');
  };

  return (
    <div className="mt-10">
      <h2 className="text-[25px] font-semibold text-black">Comments</h2>

      {comments.length === 0 ? (
        <div className="mt-4 rounded-[12px] bg-[#F7F7F7] px-6 py-5 text-[15px] text-black">
          Be the first to add a comment.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-[12px] bg-[#F7F7F7] p-4">
              <div className="flex gap-3">
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1f2937',
                  }}
                >
                  {(comment.avatarUrl && (
                    <img
                      src={comment.avatarUrl}
                      alt={comment.userName}
                      style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                  )) ||
                    comment.userName?.charAt(0).toUpperCase() ||
                    'U'}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-black">{comment.userName}</div>
                  <p className="mt-1 text-[15px] leading-5 text-black">{comment.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-[12px] border border-black/10 bg-white px-5 py-4 shadow-sm"
      >
        <div className="mb-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full rounded-md border border-black/20 px-3 py-2 text-[14px]"
          />
        </div>
        <div className="mb-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your experience..."
            className="w-full rounded-md border border-black/20 px-3 py-2 text-[14px]"
            rows={3}
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-black px-5 py-2 text-[14px] font-medium text-white disabled:opacity-50"
          disabled={!message.trim()}
        >
          Post Comment
        </button>
      </form>
    </div>
  );
}

interface DetailPageProps {
  car: CarEncyclopediaDetail;
  showHeader?: boolean;
}

const EmptyResults: SearchResultGroups = {
  wikicars: [],
  news: [],
  events: [],
  auctions: [],
  community: [],
};

export default function CarEncyclopediaDetailPage({ car, showHeader = true }: DetailPageProps) {
  if (!car) {
    return null;
  }

  const heroImages = useMemo(() => {
    const sources = [
      ...(car.heroGallery || []),
      car.heroImageUrl,
      car.sideImageUrl,
    ].filter((url): url is string => Boolean(url));
    const unique = Array.from(new Set(sources));
    return unique.length > 0 ? unique : [car.heroImageUrl];
  }, [car.heroGallery, car.heroImageUrl, car.sideImageUrl]);

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [heroImages.join('|')]);

  const goToHeroSlide = (direction: 'prev' | 'next') => {
    setActiveHeroIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? heroImages.length - 1 : prev - 1;
      }
      return prev === heroImages.length - 1 ? 0 : prev + 1;
    });
  };

  const baseComments = car.comments || [];
  const storageKey = useMemo(
    () => `wikicars-comments:${car.make}:${car.model}:${car.variant || 'base'}`,
    [car.make, car.model, car.variant]
  );
  const [localComments, setLocalComments] = useState<CarEncyclopediaComment[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      setLocalComments(stored ? JSON.parse(stored) : []);
    } catch {
      setLocalComments([]);
    }
  }, [storageKey]);

  const combinedComments = useMemo(
    () => [...baseComments, ...localComments],
    [baseComments, localComments]
  );

  const handleAddComment = (name: string, text: string) => {
    const entry: CarEncyclopediaComment = {
      id: `${Date.now()}`,
      userName: name || 'Anonymous Enthusiast',
      text,
    };
    const updated = [...localComments, entry];
    setLocalComments(updated);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch {
      /* ignore storage errors */
    }
  };

  const detail = (
    <main className="w-full px-6 py-10">
      {/* Top carousel grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3" style={{ alignItems: 'stretch', overflow: 'visible' }}>
        <div
          className="md:col-span-2"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '10px',
            height: '320px',
          }}
        >
          <img
            src={heroImages[activeHeroIndex]}
            alt={`${car.make} ${car.model} ${car.variant || ''}`.trim()}
            className="w-full object-cover"
            style={{ height: '100%' }}
          />
          {heroImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goToHeroSlide('prev')}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '1rem',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.4rem',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => goToHeroSlide('next')}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '1rem',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.4rem',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={20} />
              </button>
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.4rem',
                }}
              >
                {heroImages.map((_, idx) => (
                  <span
                    key={`${idx}`}
                    style={{
                      width: idx === activeHeroIndex ? '28px' : '8px',
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: idx === activeHeroIndex ? '#ffffff' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.25s',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pill chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[car.make, car.model, car.variant].filter(Boolean).map((token, index) => (
          <span
            key={`${token as string}-${index}`}
            className="rounded-full bg-[#F7F7F7] px-4 py-1 text-[15px] font-medium text-black"
          >
            {token}
          </span>
        ))}
      </div>

      {/* Brand + stats */}
      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
      >
        <div style={{ flex: '0 0 auto', padding: '1.25rem', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
          <img
            src={car.brandLogoUrl || 'https://placehold.co/83x82'}
            alt={`${car.make} logo`}
            style={{ width: '83px', height: '82px' }}
          />
        </div>
        <div style={{ flex: '0 0 0.5px', background: 'rgba(0,0,0,0.15)', alignSelf: 'stretch' }} />
        <div style={{ flex: '1 1 200px', display: 'flex', gap: '1.5rem', background: '#fff', borderRadius: '10px', padding: '1.25rem' }}>
          <Stat label="Make" value={car.make} />
          <Stat label="Model" value={car.model} />
          <Stat label="Variant" value={car.variant || '—'} />
          <Stat label="Release date" value={car.releaseYear} />
        </div>
      </div>

      {/* Summary & overview */}
      <div
        style={{
          marginTop: '3rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2.5rem',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            flex: '2 1 520px',
            minWidth: '320px',
            paddingRight: '1.25rem',
            borderRight: '0.5px solid rgba(0,0,0,0.15)',
          }}
        >
          <h2 className="text-[25px] font-semibold text-black">Summary</h2>
          {car.summary && <p className="mt-4 text-[20px] leading-7 text-black">{car.summary}</p>}
        </div>
        <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
          <OverviewCard overview={car.overview} extraFields={car.extraFields} />
        </div>
      </div>

      {/* Comments */}
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <CommentsCard comments={combinedComments} onAddComment={handleAddComment} />
        </div>
        <div className="md:col-span-1" />
      </div>
    </main>
  );

  if (!showHeader) {
    return <div className="bg-white">{detail}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        user={{ signInDetails: { loginId: 'collector@collectible.com' } }}
        signOut={() => {}}
        activeSection="wikicars"
        onSectionChange={() => {}}
        searchTerm=""
        onSearchChange={() => {}}
        searchResults={EmptyResults}
        searchLoading={false}
        onSearchResultSelect={() => {}}
        showHeroCarousel={false}
      />
      {detail}
    </div>
  );
}

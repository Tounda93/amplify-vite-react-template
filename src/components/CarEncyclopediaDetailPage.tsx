import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import Header from './Header';

export type CarOverview = {
  production: string;
  designer: string;
  kerbWeight: string;
  engine: string;
  transmission: string;
  power: string;
  fuel: string;
  topSpeed: string;
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

export type CarEditPayload = {
  summary: string;
  overview: CarOverview;
  heroGallery: string[];
};

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
  actionSlot,
}: {
  overview: CarOverview;
  extraFields?: { label: string; value: string }[];
  actionSlot?: React.ReactNode;
}) {
  const rows: Array<[string, string]> = [
    ['Production', overview.production],
    ['Designer', overview.designer],
    ['Kerb weight', overview.kerbWeight],
    ['Engine', overview.engine],
    ['Transmission', overview.transmission],
    ['Power', overview.power],
    ['Fuel', overview.fuel],
    ['Top speed', overview.topSpeed],
  ];

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-sm">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <h2 className="text-[25px] font-semibold text-black">Car overview</h2>
        {actionSlot}
      </div>

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
  onRequestEdit?: (payload: CarEditPayload) => Promise<void>;
  editingEnabled?: boolean;
}

const MAX_GALLERY_IMAGES = 10;
const MAX_GALLERY_BYTES = 850 * 1024;
const MAX_RESIZE_DIMENSION = 2000;

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const getCanvasBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Unable to generate image blob'));
      },
      'image/jpeg',
      quality
    );
  });

const compressImageFile = async (file: File): Promise<File> => {
  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImageElement(dataUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  let width = img.width;
  let height = img.height;
  if (width > MAX_RESIZE_DIMENSION || height > MAX_RESIZE_DIMENSION) {
    const ratio = Math.min(MAX_RESIZE_DIMENSION / width, MAX_RESIZE_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const drawScaled = () => {
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
  };

  drawScaled();
  let quality = 0.9;
  let blob = await getCanvasBlob(canvas, quality);

  while (blob.size > MAX_GALLERY_BYTES && quality > 0.4) {
    quality -= 0.1;
    blob = await getCanvasBlob(canvas, quality);
  }

  while (blob.size > MAX_GALLERY_BYTES && (width > 400 || height > 400)) {
    width = Math.round(width * 0.9);
    height = Math.round(height * 0.9);
    drawScaled();
    blob = await getCanvasBlob(canvas, quality);
  }

  return new File([blob], `${Date.now()}-${file.name}`.replace(/\s+/g, '_'), { type: 'image/jpeg' });
};

const OVERVIEW_FIELD_META: Array<{ key: keyof CarOverview; label: string }> = [
  { key: 'production', label: 'Production' },
  { key: 'designer', label: 'Designer' },
  { key: 'kerbWeight', label: 'Kerb weight' },
  { key: 'engine', label: 'Engine' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'power', label: 'Power' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'topSpeed', label: 'Top speed' },
];

export default function CarEncyclopediaDetailPage({
  car,
  showHeader = true,
  onRequestEdit,
  editingEnabled = false,
}: DetailPageProps) {
  // All hooks must be called before any conditional returns
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');
  const [overviewDraft, setOverviewDraft] = useState<CarOverview>({
    production: '',
    designer: '',
    kerbWeight: '',
    engine: '',
    transmission: '',
    power: '',
    fuel: '',
    topSpeed: '',
  });
  const [galleryDraft, setGalleryDraft] = useState<string[]>(['']);
  const [savingEdits, setSavingEdits] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const editGalleryFileInputRef = useRef<HTMLInputElement | null>(null);
  const [editGalleryUploading, setEditGalleryUploading] = useState(false);
  const [editGalleryUploadMessage, setEditGalleryUploadMessage] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState<CarEncyclopediaComment[]>([]);

  const heroImages = useMemo(() => {
    if (!car) return [''];
    const hasCustomGallery = Array.isArray(car.heroGallery);
    const gallerySources = hasCustomGallery
      ? car.heroGallery
      : [car.heroImageUrl, car.sideImageUrl];
    const sources = (gallerySources || []).filter((url): url is string => Boolean(url));
    const unique = Array.from(new Set(sources));
    return unique.length > 0 ? unique : [car.heroImageUrl];
  }, [car]);

  const baseGallery = useMemo(
    () => {
      if (!car) return [''];
      return car.heroGallery !== undefined
        ? car.heroGallery
        : [car.heroImageUrl, car.sideImageUrl].filter((url): url is string => Boolean(url));
    },
    [car]
  );

  const ensureGalleryDraft = (gallery: string[]) => {
    const trimmed = gallery.slice(0, MAX_GALLERY_IMAGES);
    return trimmed.length > 0 ? trimmed : [''];
  };

  const storageKey = useMemo(
    () => car ? `wikicars-comments:${car.make}:${car.model}:${car.variant || 'base'}` : '',
    [car]
  );

  const baseComments = useMemo(() => car?.comments || [], [car]);

  const combinedComments = useMemo(
    () => [...baseComments, ...localComments],
    [baseComments, localComments]
  );

  const heroImagesKey = useMemo(() => heroImages.join('|'), [heroImages]);

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [heroImagesKey]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        await fetchAuthSession();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!car) return;
    setSummaryDraft(car.summary || '');
    setOverviewDraft(car.overview);
    setGalleryDraft(ensureGalleryDraft(baseGallery));
  }, [car, baseGallery]);

  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      setLocalComments(stored ? JSON.parse(stored) : []);
    } catch {
      setLocalComments([]);
    }
  }, [storageKey]);

  // Early return after all hooks
  if (!car) {
    return null;
  }

  const goToHeroSlide = (direction: 'prev' | 'next') => {
    setActiveHeroIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? heroImages.length - 1 : prev - 1;
      }
      return prev === heroImages.length - 1 ? 0 : prev + 1;
    });
  };

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

  const canEdit = Boolean(onRequestEdit) && editingEnabled && isAuthenticated;

  const handleGalleryChange = (index: number, value: string) => {
    setGalleryDraft((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryDraft((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddGalleryImage = () => {
    if (galleryDraft.length >= MAX_GALLERY_IMAGES) {
      setEditFeedback({
        type: 'error',
        message: `You can add up to ${MAX_GALLERY_IMAGES} images in the carousel.`,
      });
      return;
    }
    setEditFeedback(null);
    setGalleryDraft((prev) => [...prev, '']);
  };

  const handleSubmitEdits = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onRequestEdit) return;
    const sanitizedGallery = galleryDraft.map((url) => url.trim()).filter((url) => url.length > 0);
    if (sanitizedGallery.length === 0) {
      setEditFeedback({ type: 'error', message: 'Please provide at least one image URL for the carousel.' });
      return;
    }
    const limitedGallery = sanitizedGallery.slice(0, MAX_GALLERY_IMAGES);
    setSavingEdits(true);
    setEditFeedback(null);
    try {
      await onRequestEdit({
        summary: summaryDraft.trim(),
        overview: overviewDraft,
        heroGallery: limitedGallery,
      });
      setEditFeedback({ type: 'success', message: 'Changes saved successfully.' });
      setEditing(false);
    } catch (error) {
      console.error('Failed to save wiki car edits', error);
      setEditFeedback({ type: 'error', message: 'Unable to save changes. Please try again.' });
    }
    setSavingEdits(false);
  };

  const handleEditGalleryUploadClick = () => {
    if (editGalleryUploading || galleryDraft.length >= MAX_GALLERY_IMAGES) return;
    editGalleryFileInputRef.current?.click();
  };

  const handleEditGalleryFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setEditGalleryUploading(true);
    setEditGalleryUploadMessage('Optimizing photo...');
    try {
      const compressed = await compressImageFile(file);
      if (compressed.size > MAX_GALLERY_BYTES) {
        throw new Error('Unable to compress photo under 850 KB.');
      }
      setEditGalleryUploadMessage('Uploading photo...');
      const uploadResult = await uploadData({
        path: ({ identityId }) => `car-photos/${identityId}/${Date.now()}-${compressed.name}`,
        data: compressed,
        options: {
          contentType: compressed.type,
        },
      }).result;
      setGalleryDraft((prev) => [...prev, uploadResult.path]);
      setEditGalleryUploadMessage('Photo uploaded successfully.');
    } catch (error) {
      console.error('Failed to upload photo', error);
      setEditGalleryUploadMessage('Failed to upload photo. Please try again.');
    }
    setEditGalleryUploading(false);
  };

  const handleCancelEditing = () => {
    setEditing(false);
    setEditFeedback(null);
    setSummaryDraft(car.summary || '');
    setOverviewDraft(car.overview);
    setGalleryDraft(ensureGalleryDraft(baseGallery));
    setEditGalleryUploadMessage(null);
    setEditGalleryUploading(false);
  };

  const detail = (
    <main className="w-full px-6 py-10">
      {/* Top carousel grid */}
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        style={{ alignItems: 'stretch', overflow: 'visible', maxWidth: '1200px', margin: '0 auto', justifyItems: 'center' }}
      >
        <div
          className="md:col-span-2"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '10px',
            height: '320px',
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto',
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
          <p
            className="mt-4 text-[20px] leading-7 text-black"
            style={{ whiteSpace: 'pre-line' }}
          >
            {car.summary || 'No summary has been added yet for this entry.'}
          </p>
        </div>
        <div style={{ flex: '1 1 280px', minWidth: '260px' }}>
          <OverviewCard
            overview={car.overview}
            extraFields={car.extraFields}
            actionSlot={
              canEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing((prev) => !prev);
                    setEditFeedback(null);
                  }}
                  style={{
                    border: '1px solid #0f172a',
                    color: '#0f172a',
                    backgroundColor: 'white',
                    borderRadius: '999px',
                    padding: '0.3rem 0.9rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {editing ? 'Close' : 'Edit'}
                </button>
              ) : null
            }
          />
        </div>
      </div>

      {editing && canEdit && (
        <form
          onSubmit={handleSubmitEdits}
          style={{
            marginTop: '2rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Edit wiki entry</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>
              Summary
            </label>
            <textarea
              value={summaryDraft}
              onChange={(e) => setSummaryDraft(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #cbd5f5',
                padding: '0.75rem',
                fontSize: '0.95rem',
              }}
              placeholder="Share the story behind this car..."
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            {OVERVIEW_FIELD_META.map(({ key, label }) => (
              <div key={key as string}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={overviewDraft[key]}
                  onChange={(e) => setOverviewDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    border: '1px solid #cbd5f5',
                    padding: '0.6rem',
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#475569' }}>Carousel photos</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleEditGalleryUploadClick}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: editGalleryUploading || galleryDraft.length >= MAX_GALLERY_IMAGES ? '#94a3b8' : '#2563eb',
                    cursor: editGalleryUploading || galleryDraft.length >= MAX_GALLERY_IMAGES ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    opacity: editGalleryUploading || galleryDraft.length >= MAX_GALLERY_IMAGES ? 0.6 : 1,
                  }}
                  disabled={editGalleryUploading || galleryDraft.length >= MAX_GALLERY_IMAGES}
                >
                  {editGalleryUploading ? 'Uploading...' : '+ Upload photo'}
                </button>
                <button
                  type="button"
                  onClick={handleAddGalleryImage}
                  style={{
                    border: '1px solid #cbd5f5',
                    background: '#f8fafc',
                    color: '#0f172a',
                    borderRadius: '999px',
                    padding: '0.35rem 0.9rem',
                    fontSize: '0.85rem',
                    cursor: galleryDraft.length >= MAX_GALLERY_IMAGES ? 'not-allowed' : 'pointer',
                    opacity: galleryDraft.length >= MAX_GALLERY_IMAGES ? 0.5 : 1,
                  }}
                  disabled={galleryDraft.length >= MAX_GALLERY_IMAGES}
                >
                  Add URL
                </button>
                <input
                  ref={editGalleryFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleEditGalleryFileSelected}
                />
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Up to {MAX_GALLERY_IMAGES} images will be shown in the carousel. Uploaded photos are compressed to stay below 850 KB.
            </div>
            {editGalleryUploadMessage && (
              <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>{editGalleryUploadMessage}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {galleryDraft.map((url, index) => (
                <div key={`gallery-${index}`} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleGalleryChange(index, e.target.value)}
                    placeholder="https://..."
                    style={{
                      flex: 1,
                      borderRadius: '8px',
                      border: '1px solid #cbd5f5',
                      padding: '0.6rem',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(index)}
                    style={{
                      border: '1px solid #e11d48',
                      color: '#e11d48',
                      backgroundColor: 'white',
                      borderRadius: '999px',
                      padding: '0.35rem 0.9rem',
                      cursor: 'pointer',
                    }}
                    disabled={galleryDraft.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {editFeedback && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: editFeedback.type === 'error' ? '#fee2e2' : '#ecfdf5',
                color: editFeedback.type === 'error' ? '#991b1b' : '#14532d',
                fontSize: '0.9rem',
              }}
            >
              {editFeedback.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancelEditing}
              style={{
                border: '1px solid #cbd5f5',
                color: '#0f172a',
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '0.6rem 1.25rem',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                border: 'none',
                color: 'white',
                backgroundColor: '#111827',
                borderRadius: '8px',
                padding: '0.6rem 1.5rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: savingEdits ? 0.7 : 1,
              }}
              disabled={savingEdits}
            >
              {savingEdits ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

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
        activeSection="wikicars"
        onSectionChange={() => {}}
      />
      {detail}
    </div>
  );
}

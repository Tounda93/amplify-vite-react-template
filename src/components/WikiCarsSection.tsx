import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, RefObject } from 'react';
import { getUrl, uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import CarEncyclopediaDetailPage, { CarEditPayload, CarEncyclopediaDetail } from './CarEncyclopediaDetailPage';

type Make = Schema['Make']['type'];
type WikiCarEntry = Schema['WikiCarEntry']['type'];
type WikiCarEntryWithAssets = WikiCarEntry & { heroGalleryList: string[] };
const MAX_GALLERY_IMAGES = 10;
const MAX_GALLERY_BYTES = 850 * 1024;
const MAX_RESIZE_DIMENSION = 2000;
type ExtraField = { label: string; value: string };
type ImageFieldKey = 'heroImageUrl' | 'sideImageUrl' | 'brandLogoUrl';

interface WikiCarsSectionProps {
  makes: Make[];
  selectedMake?: Make | null;
  onSelectMake?: (make: Make) => void;
}

type BrandGroup = {
  makeId: string;
  label: string;
  entries: WikiCarEntryWithAssets[];
};

const client = generateClient<Schema>();

const HERO_IMAGES: Record<string, string> = {
  lotus: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1600&q=80',
  porsche: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1600&q=80',
  ferrari: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=1600&q=80',
  lamborghini: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?w=1600&q=80',
  aston_martin: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1600&q=80',
  default: 'https://images.unsplash.com/photo-1511910849309-0dffb15285a1?w=1600&q=80',
};

const SECONDARY_IMAGES: Record<string, string> = {
  lotus: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=800&q=80',
  porsche: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800&q=80',
  ferrari: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80',
};

const BRAND_LOGOS: Record<string, string> = {
  lotus: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/49/Lotus_Cars_logo.svg/200px-Lotus_Cars_logo.svg.png',
  porsche: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Porsche_logo.svg/200px-Porsche_logo.svg.png',
  ferrari: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d0/Ferrari_logo.svg/200px-Ferrari_logo.svg.png',
  default: 'https://placehold.co/83x82?text=Logo',
};

const getImageForMake = (makeId: string, imageMap: Record<string, string>) => {
  const normalizedId = makeId?.toLowerCase().replace(/\s+/g, '_') || 'default';
  return imageMap[normalizedId] || imageMap.default;
};

const resolveStorageAsset = async (path?: string | null) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  try {
    const urlResult = await getUrl({
      path,
      options: { expiresIn: 60 * 60 * 24 * 7 },
    });
    return urlResult.url.toString();
  } catch (error) {
    console.warn('Unable to resolve asset', error);
    return undefined;
  }
};

const parseAdditionalFields = (value?: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item && typeof item.label === 'string' && typeof item.value === 'string')
        .map((item) => ({ label: item.label, value: item.value }));
    }
  } catch {
    return [];
  }
  return [];
};

const parseHeroGallery = (value?: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .slice(0, MAX_GALLERY_IMAGES);
    }
  } catch {
    return [];
  }
  return [];
};

const buildCarDetailFromEntry = (entry: WikiCarEntryWithAssets): CarEncyclopediaDetail => ({
  make: entry.brandName || entry.makeName,
  model: entry.makeName,
  variant: entry.variant || undefined,
  releaseYear: entry.production || '—',
  heroImageUrl: entry.heroImageUrl || HERO_IMAGES.default,
  sideImageUrl: entry.sideImageUrl || SECONDARY_IMAGES.default,
  brandLogoUrl: entry.brandLogoUrl || BRAND_LOGOS.default,
  summary: entry.summary ?? undefined,
  heroGallery: entry.heroGalleryList,
  overview: {
    production: entry.production || '—',
    designer: entry.designer || '—',
    kerbWeight: entry.kerbWeight || '—',
    engine: entry.engine || '—',
    transmission: entry.transmission || '—',
    power: entry.power || '—',
    fuel: entry.fuel || '—',
    topSpeed: entry.topSpeed || '—',
  },
  extraFields: parseAdditionalFields(entry.additionalFields),
  comments: [],
});

const buildMakeFromEntry = (entry: WikiCarEntryWithAssets): Make =>
  ({
    makeId: entry.makeId,
    makeName: entry.brandName || entry.makeName,
  } as Make);

const decorateEntry = async (entry: WikiCarEntry): Promise<WikiCarEntryWithAssets> => {
  const fallbackKey = entry.makeId || 'default';
  const galleryPaths = parseHeroGallery(entry.heroGallery);
  const resolvedGallery = await Promise.all(
    galleryPaths.map(async (image) => (await resolveStorageAsset(image)) || image)
  );

  return {
    ...entry,
    heroImageUrl: (await resolveStorageAsset(entry.heroImageUrl)) || getImageForMake(fallbackKey, HERO_IMAGES),
    sideImageUrl: (await resolveStorageAsset(entry.sideImageUrl)) || getImageForMake(fallbackKey, SECONDARY_IMAGES),
    brandLogoUrl: (await resolveStorageAsset(entry.brandLogoUrl)) || getImageForMake(fallbackKey, BRAND_LOGOS),
    heroGalleryList: resolvedGallery.filter((url): url is string => Boolean(url)),
  };
};

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
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Unable to generate image blob'));
        }
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

  const drawToCanvas = () => {
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
  };

  drawToCanvas();
  let quality = 0.9;
  let blob = await getCanvasBlob(canvas, quality);

  while (blob.size > MAX_GALLERY_BYTES && quality > 0.4) {
    quality -= 0.1;
    blob = await getCanvasBlob(canvas, quality);
  }

  while (blob.size > MAX_GALLERY_BYTES && (width > 400 || height > 400)) {
    width = Math.round(width * 0.9);
    height = Math.round(height * 0.9);
    drawToCanvas();
    blob = await getCanvasBlob(canvas, quality);
  }

  return new File([blob], `${Date.now()}-${file.name}`.replace(/\s+/g, '_'), { type: 'image/jpeg' });
};

const ADD_ENTRY_INITIAL = {
  makeId: '',
  brandName: '',
  makeName: '',
  variant: '',
  summary: '',
  heroImageUrl: '',
  sideImageUrl: '',
  brandLogoUrl: '',
  production: '',
  designer: '',
  kerbWeight: '',
  engine: '',
  transmission: '',
  power: '',
  fuel: '',
  topSpeed: '',
};

const sanitizeGalleryForPayload = (images: string[]) =>
  images
    .map((image) => image.trim())
    .filter((image) => image.length > 0)
    .slice(0, MAX_GALLERY_IMAGES);

const formatAdditionalFieldsPayload = (fields: ExtraField[]) => {
  const filtered = fields.filter((field) => field.label.trim() && field.value.trim());
  return filtered.length ? JSON.stringify(filtered) : undefined;
};

export default function WikiCarsSection({ makes, selectedMake, onSelectMake }: WikiCarsSectionProps) {
  const [query, setQuery] = useState('');
  const [internalSelectedMake, setInternalSelectedMake] = useState<Make | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [wikiEntries, setWikiEntries] = useState<WikiCarEntryWithAssets[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(ADD_ENTRY_INITIAL);
  const [addGalleryInputs, setAddGalleryInputs] = useState<string[]>([]);
  const [addExtraFields, setAddExtraFields] = useState<ExtraField[]>([]);
  const [galleryUploadMessage, setGalleryUploadMessage] = useState<string | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);
  const heroFileInputRef = useRef<HTMLInputElement | null>(null);
  const sideFileInputRef = useRef<HTMLInputElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const assetInputRefs: Record<ImageFieldKey, RefObject<HTMLInputElement>> = {
    heroImageUrl: heroFileInputRef,
    sideImageUrl: sideFileInputRef,
    brandLogoUrl: logoFileInputRef,
  };
  const [assetUploading, setAssetUploading] = useState<Record<ImageFieldKey, boolean>>({
    heroImageUrl: false,
    sideImageUrl: false,
    brandLogoUrl: false,
  });
  const [assetUploadMessage, setAssetUploadMessage] = useState<Record<ImageFieldKey, string | null>>({
    heroImageUrl: null,
    sideImageUrl: null,
    brandLogoUrl: null,
  });
  const [addStatusMessage, setAddStatusMessage] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const activeMake = selectedMake ?? internalSelectedMake;
  const activeMakeId = activeMake?.makeId ?? null;

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.models.WikiCarEntry.list({ limit: 500 });
      const entries = data || [];
      if (entries.length === 0) {
        setWikiEntries([]);
        setStatusMessage('No WikiCars entries available yet. Add one from the admin panel to begin.');
      } else {
        const resolved = await Promise.all(entries.map(decorateEntry));
        setWikiEntries(resolved);
        setStatusMessage(null);
      }
    } catch (error) {
      console.error('Error loading wiki entries', error);
      setWikiEntries([]);
      setStatusMessage('Unable to load encyclopedia entries. Please try again later.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await fetchAuthSession();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const findMakeById = useCallback(
    (makeId: string) => makes.find((make) => make.makeId === makeId) ?? null,
    [makes]
  );

  const brandGroups = useMemo<BrandGroup[]>(() => {
    const map = new Map<string, BrandGroup>();
    wikiEntries.forEach((entry) => {
      const label = entry.brandName || entry.makeName;
      if (!map.has(entry.makeId)) {
        map.set(entry.makeId, { makeId: entry.makeId, label, entries: [] });
      }
      map.get(entry.makeId)!.entries.push(entry);
    });
    const groups = Array.from(map.values());
    groups.forEach((group) =>
      group.entries.sort((a, b) => (a.makeName || '').localeCompare(b.makeName || ''))
    );
    return groups.sort((a, b) => a.label.localeCompare(b.label));
  }, [wikiEntries]);

  useEffect(() => {
    if ((selectedMake || internalSelectedMake) || brandGroups.length === 0) return;
    const firstEntry = brandGroups[0].entries[0];
    if (!firstEntry) return;
    const derived = findMakeById(firstEntry.makeId) ?? buildMakeFromEntry(firstEntry);
    setInternalSelectedMake(derived);
  }, [brandGroups, findMakeById, selectedMake, internalSelectedMake]);

  const activeBrand = useMemo(
    () => brandGroups.find((group) => group.makeId === activeMakeId) ?? null,
    [brandGroups, activeMakeId]
  );

  useEffect(() => {
    if (!activeBrand) {
      setSelectedEntryId(null);
      return;
    }
    if (!selectedEntryId || !activeBrand.entries.some((entry) => entry.id === selectedEntryId)) {
      setSelectedEntryId(activeBrand.entries[0]?.id ?? null);
    }
  }, [activeBrand, selectedEntryId]);

  const filteredBrands = useMemo(() => {
    if (!query.trim()) {
      return brandGroups;
    }
    const lowered = query.toLowerCase();
    return brandGroups.filter(
      (group) =>
        group.label.toLowerCase().includes(lowered) ||
        group.entries.some(
          (entry) =>
            entry.makeName?.toLowerCase().includes(lowered) ||
            entry.variant?.toLowerCase().includes(lowered)
        )
    );
  }, [brandGroups, query]);

  const entriesForActiveBrand = activeBrand?.entries ?? [];
  const activeEntry =
    entriesForActiveBrand.find((entry) => entry.id === selectedEntryId) ||
    entriesForActiveBrand[0] ||
    null;

  const carDetail = activeEntry ? buildCarDetailFromEntry(activeEntry) : null;

  const handleSelectBrand = (brand: BrandGroup) => {
    const firstEntry = brand.entries[0];
    if (!firstEntry) return;
    const nextMake = findMakeById(brand.makeId) ?? buildMakeFromEntry(firstEntry);
    if (onSelectMake) {
      onSelectMake(nextMake);
    } else {
      setInternalSelectedMake(nextMake);
    }
    setSelectedEntryId(brand.entries[0]?.id ?? null);
  };

  const handleSelectEntry = (entryId: string) => setSelectedEntryId(entryId);

  const handleSaveEntryUpdates = async (payload: CarEditPayload) => {
    if (!activeEntry) {
      throw new Error('No wiki entry selected');
    }
    const gallery = payload.heroGallery.slice(0, MAX_GALLERY_IMAGES);
    try {
      await client.models.WikiCarEntry.update({
        id: activeEntry.id,
        summary: payload.summary,
        production: payload.overview.production,
        designer: payload.overview.designer,
        kerbWeight: payload.overview.kerbWeight,
        engine: payload.overview.engine,
        transmission: payload.overview.transmission,
        power: payload.overview.power,
        fuel: payload.overview.fuel,
        topSpeed: payload.overview.topSpeed,
        heroGallery: gallery.length > 0 ? JSON.stringify(gallery) : undefined,
      });
      setWikiEntries((prev) =>
        prev.map((entry) =>
          entry.id === activeEntry.id
            ? {
                ...entry,
                summary: payload.summary,
                production: payload.overview.production,
                designer: payload.overview.designer,
                kerbWeight: payload.overview.kerbWeight,
                engine: payload.overview.engine,
                transmission: payload.overview.transmission,
                power: payload.overview.power,
                fuel: payload.overview.fuel,
                topSpeed: payload.overview.topSpeed,
                heroGallery: gallery.length ? JSON.stringify(gallery) : undefined,
                heroGalleryList: gallery,
              }
            : entry
        )
      );
    } catch (error) {
      console.error('Failed to update wiki entry', error);
      throw error;
    }
  };

  const resetAddForm = () => {
    setAddForm(ADD_ENTRY_INITIAL);
    setAddGalleryInputs([]);
    setAddExtraFields([]);
    setAddStatusMessage(null);
    setGalleryUploadMessage(null);
    setGalleryUploading(false);
    setAssetUploading({ heroImageUrl: false, sideImageUrl: false, brandLogoUrl: false });
    setAssetUploadMessage({ heroImageUrl: null, sideImageUrl: null, brandLogoUrl: null });
  };

  const handleOpenAddModal = () => {
  if (!isAuthenticated) return;
  resetAddForm();
  setShowAddModal(true);
};

const handleAddFormChange = (field: keyof typeof ADD_ENTRY_INITIAL, value: string) => {
  setAddForm((prev) => ({ ...prev, [field]: value }));
};

const handleGalleryButtonClick = () => {
  if (addGalleryInputs.length >= MAX_GALLERY_IMAGES || galleryUploading) return;
  galleryFileInputRef.current?.click();
};

const handleGalleryFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  setGalleryUploading(true);
  setGalleryUploadMessage('Optimizing photo...');
  try {
    const compressed = await compressImageFile(file);
    if (compressed.size > MAX_GALLERY_BYTES) {
      throw new Error('Unable to compress photo under 850 KB.');
    }
    setGalleryUploadMessage('Uploading photo...');
    const uploadResult = await uploadData({
      path: ({ identityId }) => `car-photos/${identityId}/${Date.now()}-${compressed.name}`,
      data: compressed,
      options: {
        contentType: compressed.type,
      },
    }).result;
    setAddGalleryInputs((prev) => [...prev, uploadResult.path]);
    setGalleryUploadMessage('Photo uploaded successfully.');
  } catch (error) {
    console.error('Gallery upload failed', error);
    setGalleryUploadMessage('Failed to upload photo. Please try again.');
  }
  setGalleryUploading(false);
};

const handleGalleryRemove = (index: number) => {
  setAddGalleryInputs((prev) => prev.filter((_, idx) => idx !== index));
};

const triggerAssetUpload = (field: ImageFieldKey) => {
  if (assetUploading[field]) return;
  assetInputRefs[field].current?.click();
};

const handleAssetFileSelected = (field: ImageFieldKey, event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  setAssetUploading((prev) => ({ ...prev, [field]: true }));
  setAssetUploadMessage((prev) => ({ ...prev, [field]: 'Optimizing photo...' }));

  compressImageFile(file)
    .then(async (compressed) => {
      if (compressed.size > MAX_GALLERY_BYTES) {
        throw new Error('Unable to compress photo under 850 KB.');
      }
      setAssetUploadMessage((prev) => ({ ...prev, [field]: 'Uploading photo...' }));
      const uploadResult = await uploadData({
        path: ({ identityId }) => `car-photos/${identityId}/${Date.now()}-${compressed.name}`,
        data: compressed,
        options: {
          contentType: compressed.type,
        },
      }).result;
      setAddForm((prev) => ({ ...prev, [field]: uploadResult.path }));
      setAssetUploadMessage((prev) => ({ ...prev, [field]: 'Photo uploaded successfully.' }));
    })
    .catch((error) => {
      console.error('Image upload failed', error);
      setAssetUploadMessage((prev) => ({ ...prev, [field]: 'Failed to upload photo. Please try again.' }));
    })
    .finally(() => {
      setAssetUploading((prev) => ({ ...prev, [field]: false }));
    });
};

const handleAddExtraField = () => {
  setAddExtraFields((prev) => [...prev, { label: '', value: '' }]);
};

  const handleExtraFieldChange = (index: number, field: keyof ExtraField, value: string) => {
    setAddExtraFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveExtraField = (index: number) => {
    setAddExtraFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitNewEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setAddStatusMessage('Please sign in to add a car.');
      return;
    }
    if (!addForm.makeId.trim() || !addForm.brandName.trim() || !addForm.makeName.trim()) {
      setAddStatusMessage('Make ID, Brand Name, and Model are required.');
      return;
    }
    setAddSubmitting(true);
    setAddStatusMessage(null);
    try {
      const galleryPayload = sanitizeGalleryForPayload(addGalleryInputs);
      const payload = {
        makeId: addForm.makeId.trim(),
        brandName: addForm.brandName.trim(),
        makeName: addForm.makeName.trim(),
        variant: addForm.variant.trim() || undefined,
        summary: addForm.summary.trim() || undefined,
        heroImageUrl: addForm.heroImageUrl.trim() || undefined,
        sideImageUrl: addForm.sideImageUrl.trim() || undefined,
        brandLogoUrl: addForm.brandLogoUrl.trim() || undefined,
        production: addForm.production.trim() || undefined,
        designer: addForm.designer.trim() || undefined,
        kerbWeight: addForm.kerbWeight.trim() || undefined,
        engine: addForm.engine.trim() || undefined,
        transmission: addForm.transmission.trim() || undefined,
        power: addForm.power.trim() || undefined,
        fuel: addForm.fuel.trim() || undefined,
        topSpeed: addForm.topSpeed.trim() || undefined,
        heroGallery: galleryPayload.length ? JSON.stringify(galleryPayload) : undefined,
        additionalFields: formatAdditionalFieldsPayload(addExtraFields),
      };

      const { data } = await client.models.WikiCarEntry.create(payload);
      if (data) {
        const decorated = await decorateEntry(data);
        setWikiEntries((prev) => [...prev, decorated]);
      } else {
        await loadEntries();
      }
      resetAddForm();
      setAddStatusMessage('Entry added successfully.');
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create wiki entry', error);
      setAddStatusMessage('Unable to add this car. Please try again.');
    }
    setAddSubmitting(false);
  };

  const hasSearchQuery = query.trim().length > 0;
  const noSearchResults = hasSearchQuery && !loading && filteredBrands.length === 0;

  return (
    <div style={{ width: '100%', backgroundColor: '#ffffffff', padding: '2rem', minHeight: '80vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', maxWidth: '520px', width: '100%' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search curated brands and models..."
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '999px',
                border: '1px solid #d3dae6',
                fontSize: '1rem',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
              }}
            />
          </div>
          {noSearchResults && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              disabled={!isAuthenticated}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: '1px solid #111827',
                backgroundColor: isAuthenticated ? '#111827' : '#e5e7eb',
                color: isAuthenticated ? '#ffffff' : '#475569',
                cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
              title={!isAuthenticated ? 'Sign in to add a car entry' : undefined}
            >
              Add a car
            </button>
          )}
        </div>
        {noSearchResults && (
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.75rem' }}>
            No WikiCars entry found for "{query.trim()}". {isAuthenticated ? 'Add it now.' : 'Sign in to add it.'}
          </p>
        )}
      </div>

      <div
        style={{
          maxWidth: '100%',
          margin: '0 auto 2.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'flex-start',
        }}
      >
        {filteredBrands.map((brand) => (
          <button
            key={brand.makeId}
            onClick={() => handleSelectBrand(brand)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: activeBrand?.makeId === brand.makeId ? '2px solid #111827' : '1px solid #dbe2f0',
              backgroundColor: activeBrand?.makeId === brand.makeId ? '#e0edff' : '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {brand.label}
            {brand.entries.length > 1 && (
              <span style={{ marginLeft: '6px', fontSize: '12px', color: '#475569' }}>
                ({brand.entries.length})
              </span>
            )}
          </button>
        ))}
        {!loading && filteredBrands.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            No curated entries match your search.
          </p>
        )}
      </div>

      {activeBrand && activeBrand.entries.length > 1 && (
        <div style={{ maxWidth: '1000px', margin: '0 auto 2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>
            Available entries for {activeBrand.label}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {activeBrand.entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleSelectEntry(entry.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: selectedEntryId === entry.id ? '2px solid #059669' : '1px solid #d1d5db',
                  backgroundColor: selectedEntryId === entry.id ? '#ecfdf5' : '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                {entry.makeName}
                {entry.variant && <span style={{ color: '#475569' }}> • {entry.variant}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          Loading encyclopedia entries…
        </div>
      )}

      {!loading && !brandGroups.length && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          {statusMessage}
        </div>
      )}

      <div style={{ width: '100%', padding: '0 15rem', boxSizing: 'border-box' }}>
        {carDetail && !loading ? (
          <CarEncyclopediaDetailPage
            car={carDetail}
            showHeader={false}
            onRequestEdit={activeEntry ? handleSaveEntryUpdates : undefined}
            editingEnabled={Boolean(activeEntry)}
          />
        ) : (
          !loading && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              {statusMessage || 'Select a brand with published data to view its encyclopedia entry.'}
            </div>
          )
        )}
      </div>

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(15,23,42,0.65)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '2rem',
            zIndex: 1000,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '800px',
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Add a WikiCars entry</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddStatusMessage(null);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
                aria-label="Close add car form"
              >
                ×
              </button>
            </div>
            {addStatusMessage && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: addStatusMessage.includes('successfully') ? '#ecfdf5' : '#fee2e2',
                  color: addStatusMessage.includes('successfully') ? '#14532d' : '#991b1b',
                  fontSize: '0.9rem',
                }}
              >
                {addStatusMessage}
              </div>
            )}
            <form onSubmit={handleSubmitNewEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {[
                  { field: 'makeId', label: 'Make ID *', placeholder: 'lotus' },
                  { field: 'brandName', label: 'Brand *', placeholder: 'Lotus' },
                  { field: 'makeName', label: 'Model *', placeholder: 'Elise' },
                  { field: 'variant', label: 'Variant', placeholder: '111S' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.3rem' }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      value={(addForm as Record<string, string>)[field]}
                      onChange={(e) => handleAddFormChange(field as keyof typeof ADD_ENTRY_INITIAL, e.target.value)}
                      placeholder={placeholder}
                      required={label.includes('*')}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.3rem' }}>
                  Summary / Description
                </label>
                <textarea
                  value={addForm.summary}
                  onChange={(e) => handleAddFormChange('summary', e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {([
                  { field: 'heroImageUrl', label: 'Hero image' },
                  { field: 'sideImageUrl', label: 'Secondary image' },
                  { field: 'brandLogoUrl', label: 'Brand logo' },
                ] as Array<{ field: ImageFieldKey; label: string }>).map(({ field, label }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.3rem' }}>
                      {label}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={addForm[field]}
                        onChange={(e) => handleAddFormChange(field, e.target.value)}
                        placeholder="Upload or paste URL..."
                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                      />
                      <button
                        type="button"
                        onClick={() => triggerAssetUpload(field)}
                        disabled={assetUploading[field]}
                        style={{
                          border: '1px solid #111827',
                          background: assetUploading[field] ? '#e5e7eb' : '#111827',
                          color: assetUploading[field] ? '#475569' : '#ffffff',
                          borderRadius: '8px',
                          padding: '0.45rem 0.9rem',
                          cursor: assetUploading[field] ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {assetUploading[field] ? 'Uploading...' : 'Upload'}
                      </button>
                      <input
                        ref={
                          {
                            heroImageUrl: heroFileInputRef,
                            sideImageUrl: sideFileInputRef,
                            brandLogoUrl: logoFileInputRef,
                          }[field]
                        }
                        type="file"
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={(event) => handleAssetFileSelected(field, event)}
                      />
                    </div>
                    {assetUploadMessage[field] && (
                      <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.3rem' }}>{assetUploadMessage[field]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {[
                  { field: 'production', label: 'Production' },
                  { field: 'designer', label: 'Designer' },
                  { field: 'kerbWeight', label: 'Kerb weight' },
                  { field: 'engine', label: 'Engine' },
                  { field: 'transmission', label: 'Transmission' },
                  { field: 'power', label: 'Power' },
                  { field: 'fuel', label: 'Fuel' },
                  { field: 'topSpeed', label: 'Top speed' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.3rem' }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      value={(addForm as Record<string, string>)[field]}
                      onChange={(e) => handleAddFormChange(field as keyof typeof ADD_ENTRY_INITIAL, e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#475569' }}>Carousel photos ({MAX_GALLERY_IMAGES} max)</label>
                  <button
                    type="button"
                    onClick={handleGalleryButtonClick}
                    disabled={addGalleryInputs.length >= MAX_GALLERY_IMAGES || galleryUploading}
                    style={{
                      border: 'none',
                      background: 'none',
                      color:
                        addGalleryInputs.length >= MAX_GALLERY_IMAGES || galleryUploading
                          ? '#94a3b8'
                          : '#2563eb',
                      cursor:
                        addGalleryInputs.length >= MAX_GALLERY_IMAGES || galleryUploading
                          ? 'not-allowed'
                          : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    + Add photo
                  </button>
                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleGalleryFileSelected}
                  />
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Photos are compressed to stay below 850 KB for faster loading.
                </p>
                {galleryUploadMessage && (
                  <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>{galleryUploadMessage}</p>
                )}
                {addGalleryInputs.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    No carousel photos yet. Use "+ Add photo" to upload directly from your device.
                  </p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {addGalleryInputs.map((path, index) => (
                      <li
                        key={`${path}-${index}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', color: '#0f172a', wordBreak: 'break-all' }}>
                          Photo {index + 1} – {path.split('/').pop()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleGalleryRemove(index)}
                          style={{
                            border: '1px solid #fecaca',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            borderRadius: '8px',
                            padding: '0.45rem 0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#475569' }}>Additional fields</label>
                  <button
                    type="button"
                    onClick={handleAddExtraField}
                    style={{
                      border: '1px solid #cbd5f5',
                      background: '#f8fafc',
                      borderRadius: '999px',
                      padding: '0.35rem 0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add field
                  </button>
                </div>
                {addExtraFields.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Add optional label/value pairs (e.g., "Chassis / 111S").
                  </p>
                ) : (
                  addExtraFields.map((field, index) => (
                    <div key={`extra-${index}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleExtraFieldChange(index, 'label', e.target.value)}
                        placeholder="Label"
                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleExtraFieldChange(index, 'value', e.target.value)}
                        placeholder="Value"
                        style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraField(index)}
                        style={{
                          border: '1px solid #fecaca',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          borderRadius: '8px',
                          padding: '0.45rem 0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddStatusMessage(null);
                  }}
                  style={{
                    border: '1px solid #cbd5f5',
                    background: '#ffffff',
                    color: '#0f172a',
                    borderRadius: '8px',
                    padding: '0.65rem 1.25rem',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  style={{
                    border: 'none',
                    background: '#111827',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '0.65rem 1.5rem',
                    fontWeight: 600,
                    cursor: addSubmitting ? 'not-allowed' : 'pointer',
                    opacity: addSubmitting ? 0.7 : 1,
                  }}
                >
                  {addSubmitting ? 'Saving...' : 'Save entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

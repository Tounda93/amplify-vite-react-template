import { useMemo, useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import CarEncyclopediaDetailPage, { CarEncyclopediaDetail, CarOverview } from './CarEncyclopediaDetailPage';

type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];
type EngineVariant = Schema['EngineVariant']['type'];
type WikiCarEntry = Schema['WikiCarEntry']['type'];

const client = generateClient<Schema>();

interface WikiCarsSectionProps {
  makes: Make[];
  selectedMake?: Make | null;
  onSelectMake?: (make: Make) => void;
}

// Placeholder images - in production, these would come from your database or CDN
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

const getImageForMake = (makeId: string, imageMap: Record<string, string>): string => {
  const normalizedId = makeId.toLowerCase().replace(/\s+/g, '_');
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

// Build overview from real engine variant data
const buildOverviewFromData = (
  make: Make,
  models: Model[],
  engineVariants: EngineVariant[]
): CarOverview => {
  // Find production years from models
  const allYearsFrom = models.map(m => m.yearsFrom).filter(Boolean) as number[];
  const allYearsTo = models.map(m => m.yearsTo).filter(Boolean) as number[];
  const minYear = allYearsFrom.length > 0 ? Math.min(...allYearsFrom) : make.yearsFrom;
  const maxYear = allYearsTo.length > 0 ? Math.max(...allYearsTo) : null;

  // Find engine info from variants
  const horsepowers = engineVariants.flatMap(v => [v.horsepowerMin, v.horsepowerMax]).filter(Boolean) as number[];
  const minHp = horsepowers.length > 0 ? Math.min(...horsepowers) : null;
  const maxHp = horsepowers.length > 0 ? Math.max(...horsepowers) : null;

  const fuelTypes = [...new Set(engineVariants.map(v => v.fuelType).filter(Boolean))];
  const engineTypes = [...new Set(engineVariants.map(v => {
    const parts = [];
    if (v.displacementLiters) parts.push(`${v.displacementLiters}L`);
    if (v.configuration) parts.push(v.configuration);
    if (v.aspiration) parts.push(v.aspiration);
    return parts.join(' ');
  }).filter(s => s.length > 0))];

  return {
    production: minYear
      ? `${minYear}${maxYear ? ` - ${maxYear}` : ' - Present'}`
      : make.yearsFrom
        ? `Since ${make.yearsFrom}`
        : 'Heritage marque',
    designer: 'Various designers',
    kerbWeight: engineVariants.length > 0 ? 'Varies by model' : 'Data pending',
    engine: engineTypes.length > 0 ? engineTypes.slice(0, 2).join(', ') : 'Various configurations',
    transmission: 'Manual / Automatic',
    power: minHp && maxHp ? `${minHp} - ${maxHp} hp` : 'Various outputs',
    fuel: fuelTypes.length > 0 ? fuelTypes.join(' / ') : 'Petrol',
  };
};

const buildCarDetailFromEntry = (entry: WikiCarEntry): CarEncyclopediaDetail => ({
  make: entry.brandName || entry.makeName,
  model: entry.makeName,
  variant: entry.variant || undefined,
  releaseYear: entry.production || '—',
  heroImageUrl: entry.heroImageUrl || HERO_IMAGES.default,
  sideImageUrl: entry.sideImageUrl || SECONDARY_IMAGES.default,
  brandLogoUrl: entry.brandLogoUrl || BRAND_LOGOS.default,
  summary: entry.summary ?? undefined,
  overview: {
    production: entry.production || '—',
    designer: entry.designer || '—',
    kerbWeight: entry.kerbWeight || '—',
    engine: entry.engine || '—',
    transmission: entry.transmission || '—',
    power: entry.power || '—',
    fuel: entry.fuel || '—',
  },
  extraFields: parseAdditionalFields(entry.additionalFields),
  comments: [],
});

// Build car detail from real database data
const buildCarDetailFromData = (
  make: Make,
  models: Model[],
  engineVariants: EngineVariant[],
  selectedModel?: Model | null
): CarEncyclopediaDetail => {
  const targetModel = selectedModel || models[0];
  const modelVariants = targetModel
    ? engineVariants.filter(v => v.modelId === targetModel.modelId)
    : engineVariants;

  return {
    make: make.makeName,
    model: targetModel?.modelName || make.makeName,
    variant: targetModel?.fullName || 'Heritage Collection',
    releaseYear: targetModel?.yearsFrom || make.yearsFrom || 'Classic',
    heroImageUrl: getImageForMake(make.makeId, HERO_IMAGES),
    sideImageUrl: getImageForMake(make.makeId, SECONDARY_IMAGES),
    brandLogoUrl: getImageForMake(make.makeId, BRAND_LOGOS),
    summary: `${make.makeName} has been producing ${make.isClassic ? 'legendary classic' : 'exceptional'} automobiles ${make.yearsFrom ? `since ${make.yearsFrom}` : 'for decades'}. ${make.country ? `Hailing from ${make.country}, ` : ''}this marque has ${models.length} model${models.length !== 1 ? 's' : ''} in our encyclopedia. ${targetModel ? `The ${targetModel.fullName || targetModel.modelName} represents the spirit of ${make.makeName} engineering.` : 'Explore the full range of models below.'}`,
    overview: buildOverviewFromData(make, models, modelVariants),
    comments: [],
  };
};

export default function WikiCarsSection({ makes, selectedMake, onSelectMake }: WikiCarsSectionProps) {
  const [query, setQuery] = useState('');
  const [internalSelectedMake, setInternalSelectedMake] = useState<Make | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [engineVariants, setEngineVariants] = useState<EngineVariant[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(false);
  const [wikiEntries, setWikiEntries] = useState<WikiCarEntry[]>([]);

  const activeMake = selectedMake ?? internalSelectedMake;

  // Load models and engine variants when a make is selected
  useEffect(() => {
    if (!activeMake) {
      setModels([]);
      setEngineVariants([]);
      setSelectedModel(null);
      setWikiEntries([]);
      return;
    }

    const loadMakeData = async () => {
      setLoading(true);
      try {
        // Fetch models for this make
        const { data: modelData } = await client.models.Model.list({
          filter: { makeId: { eq: activeMake.makeId } },
          limit: 100,
        });
        const sortedModels = (modelData || []).sort((a, b) =>
          (a.yearsFrom || 0) - (b.yearsFrom || 0)
        );
        setModels(sortedModels);

        // Fetch engine variants for all models of this make
        if (sortedModels.length > 0) {
          const modelIds = sortedModels.map(m => m.modelId);
          const allVariants: EngineVariant[] = [];

          // Fetch variants for each model (in batches to avoid too many requests)
          for (const modelId of modelIds.slice(0, 10)) {
            try {
              const { data: variantData } = await client.models.EngineVariant.list({
                filter: { modelId: { eq: modelId } },
                limit: 50,
              });
              if (variantData) {
                allVariants.push(...variantData);
              }
            } catch (err) {
              console.error(`Error loading variants for model ${modelId}:`, err);
            }
          }
          setEngineVariants(allVariants);
        } else {
          setEngineVariants([]);
        }
      } catch (error) {
        console.error('Error loading make data:', error);
        setModels([]);
        setEngineVariants([]);
      }
      setLoading(false);
    };

    const loadWikiEntries = async () => {
      try {
        const { data } = await client.models.WikiCarEntry.list({
          filter: { makeId: { eq: activeMake.makeId } },
          limit: 50,
        });
        const entries = data || [];
        const resolved = await Promise.all(
          entries.map(async (entry) => ({
            ...entry,
            heroImageUrl: (await resolveStorageAsset(entry.heroImageUrl)) || getImageForMake(activeMake.makeId, HERO_IMAGES),
            sideImageUrl: (await resolveStorageAsset(entry.sideImageUrl)) || getImageForMake(activeMake.makeId, SECONDARY_IMAGES),
            brandLogoUrl: (await resolveStorageAsset(entry.brandLogoUrl)) || getImageForMake(activeMake.makeId, BRAND_LOGOS),
          }))
        );
        setWikiEntries(resolved);
      } catch (error) {
        console.error('Error loading wiki entries', error);
        setWikiEntries([]);
      }
    };

    loadMakeData();
    loadWikiEntries();
  }, [activeMake?.makeId]);

  const handleSelect = (make: Make) => {
    setSelectedModel(null);
    if (onSelectMake) {
      onSelectMake(make);
    } else {
      setInternalSelectedMake(make);
    }
  };

  const filteredMakes = useMemo(() => {
    if (!query.trim()) {
      return makes.slice(0, 12);
    }
    const lowered = query.toLowerCase();
    return makes.filter((make) => make.makeName.toLowerCase().includes(lowered)).slice(0, 15);
  }, [makes, query]);

  const wikiEntryDetail = useMemo(() => {
    if (!activeMake || wikiEntries.length === 0) return null;
    if (selectedModel) {
      const match = wikiEntries.find(
        (entry) =>
          entry.makeId === activeMake.makeId &&
          entry.makeName.toLowerCase() === selectedModel.modelName.toLowerCase()
      );
      if (match) {
        return buildCarDetailFromEntry(match);
      }
    }
    return buildCarDetailFromEntry(wikiEntries[0]);
  }, [wikiEntries, activeMake?.makeId, selectedModel]);

  const carDetail = activeMake
    ? wikiEntryDetail || buildCarDetailFromData(activeMake, models, engineVariants, selectedModel)
    : null;

  return (
    <div style={{ width: '100%', backgroundColor: '#ffffffff', padding: '2rem', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ maxWidth: '800px', margin: '0 auto 2rem', textAlign: 'center' }}>
         <div style={{ position: 'relative', maxWidth: '520px', margin: '0 auto' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a brand name, e.g., Lotus, Porsche, Ferrari..."
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
      </div>

      {/* Brand Pills */}
      <div style={{ maxWidth: '100%', margin: '0 auto 2.5rem', display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'left' }}>
        {filteredMakes.map((make) => (
          <button
            key={make.makeId}
            onClick={() => handleSelect(make)}
            style={{
              padding: '5px 15px',
              borderRadius: '999px',
              border: activeMake?.makeId === make.makeId ? '2px solid #000000ff' : '1px solid #dbe2f0',
              backgroundColor: activeMake?.makeId === make.makeId ? '#e0edff' : '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              fontWeight: 400,
              transition: 'all 0.2s',
            }}
          >
            {make.makeName}
            {make.country && (
              <span style={{ marginLeft: '6px', fontSize: '12px', color: '#64748b' }}>
                ({make.country})
              </span>
            )}
          </button>
        ))}
        {filteredMakes.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>No brands match your search yet.</p>
        )}
      </div>

      {/* Model Selector - Show when a make is selected */}
      {activeMake && models.length > 0 && (
        <div style={{ maxWidth: '1000px', margin: '0 auto 8rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', marginBottom: '1rem', textAlign: 'center' }}>
            {models.length} Model{models.length !== 1 ? 's' : ''} Available
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedModel(null)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: !selectedModel ? '2px solid #059669' : '1px solid #d1d5db',
                backgroundColor: !selectedModel ? '#ecfdf5' : '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              All Models
            </button>
            {models.map((model) => (
              <button
                key={model.modelId}
                onClick={() => setSelectedModel(model)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: selectedModel?.modelId === model.modelId ? '2px solid #059669' : '1px solid #d1d5db',
                  backgroundColor: selectedModel?.modelId === model.modelId ? '#ecfdf5' : '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                {model.modelName}
                {model.yearsFrom && (
                  <span style={{ marginLeft: '4px', fontSize: '11px', color: '#64748b' }}>
                    ({model.yearsFrom}{model.yearsTo ? `-${model.yearsTo}` : '+'})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          Loading {activeMake?.makeName} data...
        </div>
      )}

      {/* Detail Card */}
      <div style={{ width: '100%' }}>
        {activeMake && carDetail && !loading ? (
          <>
            <CarEncyclopediaDetailPage car={carDetail} showHeader={false} />

            {/* Engine Variants Section */}
            {engineVariants.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                  Engine Variants ({engineVariants.filter(v => !selectedModel || v.modelId === selectedModel.modelId).length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {engineVariants
                    .filter(v => !selectedModel || v.modelId === selectedModel.modelId)
                    .map((variant, idx) => (
                      <div
                        key={`${variant.modelId}-${variant.variantName}-${idx}`}
                        style={{
                          padding: '1rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                          {variant.variantName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {variant.displacementLiters && (
                            <span>Engine: {variant.displacementLiters}L {variant.configuration || ''} {variant.aspiration || ''}</span>
                          )}
                          {(variant.horsepowerMin || variant.horsepowerMax) && (
                            <span>Power: {variant.horsepowerMin || '?'} - {variant.horsepowerMax || '?'} hp</span>
                          )}
                          {variant.fuelType && <span>Fuel: {variant.fuelType}</span>}
                          {variant.yearsFrom && (
                            <span>Years: {variant.yearsFrom}{variant.yearsTo ? ` - ${variant.yearsTo}` : '+'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : !loading && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            Select a brand above to explore its encyclopedia entry.
          </div>
        )}
      </div>
    </div>
  );
}

import { X, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl, uploadData } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';

type Car = Schema['Car']['type'];
type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];

const FALLBACK_CAR_IMAGE = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80';

// Helper to check if a string is a storage path or a URL
const isStoragePath = (str: string) => str.startsWith('car-photos/') || str.startsWith('event-photos/');

const client = generateClient<Schema>();

const TRANSMISSIONS = [
  { value: '', label: 'Select transmission' },
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'semi_automatic', label: 'Semi-Automatic' },
];

interface CarDetailPopupProps {
  car: Car | null;
  makeName: string;
  modelName: string;
  isOpen: boolean;
  onClose: () => void;
  onCarUpdated?: () => void;
  onCarDeleted?: () => void;
}

export default function CarDetailPopup({ car, makeName, modelName, isOpen, onClose, onCarUpdated, onCarDeleted }: CarDetailPopupProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [carData, setCarData] = useState<Car | null>(car);
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [editValues, setEditValues] = useState({
    makeId: '',
    modelId: '',
    year: '',
    engineVariantId: '',
    transmission: '' as '' | 'manual' | 'automatic' | 'semi_automatic',
    color: '',
    interiorColor: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoPaths = carData?.photos?.filter(Boolean) as string[] || [];

  useEffect(() => {
    setCarData(car);
    if (car) {
      setEditValues({
        makeId: car.makeId || '',
        modelId: car.modelId || '',
        year: car.year ? String(car.year) : '',
        engineVariantId: car.engineVariantId || '',
        transmission: (car.transmission || '') as '' | 'manual' | 'automatic' | 'semi_automatic',
        color: car.color || '',
        interiorColor: car.interiorColor || '',
      });
    } else {
      setEditValues({
        makeId: '',
        modelId: '',
        year: '',
        engineVariantId: '',
        transmission: '',
        color: '',
        interiorColor: '',
      });
    }
  }, [car]);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!carData || photoPaths.length === 0) {
        setPhotoUrls([]);
        return;
      }

      const urls: string[] = [];

      for (const path of photoPaths) {
        // If it's already a URL (legacy data), use it directly
        if (!isStoragePath(path)) {
          urls.push(path);
          continue;
        }

        // Otherwise, get the URL from the storage path
        try {
          const result = await getUrl({ path });
          urls.push(result.url.toString());
        } catch (error) {
          console.error('Error loading photo:', error);
        }
      }

      setPhotoUrls(urls);
    };

    loadPhotos();
  }, [carData?.id, carData?.photos, photoPaths.length]);

  useEffect(() => {
    if (!isOpen) return;
    const loadMakes = async () => {
      try {
        const { data: makesData } = await client.models.Make.list({ limit: 500 });
        const sorted = (makesData || []).sort((a, b) => a.makeName.localeCompare(b.makeName));
        setMakes(sorted);

        const { data: modelsData } = await client.models.Model.list({ limit: 1000 });
        setModels(modelsData || []);
      } catch (error) {
        console.error('Error loading makes/models:', error);
      }
    };

    loadMakes();
  }, [isOpen]);

  useEffect(() => {
    if (!editValues.makeId) {
      setFilteredModels([]);
      return;
    }
    const filtered = models.filter((model) => model.makeId === editValues.makeId);
    setFilteredModels(filtered);
    if (!filtered.find((model) => model.modelId === editValues.modelId)) {
      setEditValues((prev) => ({ ...prev, modelId: '' }));
    }
  }, [editValues.makeId, editValues.modelId, models]);

  if (!isOpen || !carData) return null;

  const currentImage = photoUrls.length > 0 ? photoUrls[currentPhotoIndex] : FALLBACK_CAR_IMAGE;
  const displayMakeName = makes.find((make) => make.makeId === carData.makeId)?.makeName || makeName;
  const displayModelName = models.find((model) => model.modelId === carData.modelId)?.modelName || modelName;

  const nextPhoto = () => {
    if (photoUrls.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photoUrls.length);
    }
  };

  const prevPhoto = () => {
    if (photoUrls.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photoUrls.length) % photoUrls.length);
    }
  };

  const formatTransmission = (transmission: string | null | undefined) => {
    if (!transmission) return null;
    return transmission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleEditPhotos = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadPhotos = async (carId: string, files: File[]) => {
    const uploadedPaths: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const photo = files[i];
      const fileExtension = photo.name.split('.').pop() || 'jpg';
      const fileName = `${carId}-${Date.now()}-${i}.${fileExtension}`;

      try {
        const result = await uploadData({
          path: ({ identityId }) => `car-photos/${identityId}/${fileName}`,
          data: photo,
          options: { contentType: photo.type }
        }).result;

        uploadedPaths.push(result.path);
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }

    return uploadedPaths;
  };

  const handlePhotoInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !carData) return;

    const selected = Array.from(files);
    if (selected.length === 0) return;

    try {
      setIsUploading(true);
      const newPaths = await uploadPhotos(carData.id, selected);
      const nextPaths = [...photoPaths, ...newPaths].filter(Boolean);

      if (newPaths.length > 0) {
        await client.models.Car.update({
          id: carData.id,
          photos: nextPaths,
        });

        const newUrls: string[] = [];
        for (const path of newPaths) {
          if (!isStoragePath(path)) {
            newUrls.push(path);
            continue;
          }
          try {
            const result = await getUrl({ path });
            newUrls.push(result.url.toString());
          } catch (error) {
            console.error('Error loading photo:', error);
          }
        }
        setPhotoUrls(prev => [...prev, ...newUrls]);
        setCarData(prev => prev ? { ...prev, photos: nextPaths } : prev);
        onCarUpdated?.();
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setMenuOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!carData) return;
    const confirmed = window.confirm('Delete this car from your garage? This cannot be undone.');
    if (!confirmed) return;

    try {
      await client.models.Car.delete({ id: carData.id });
      onCarDeleted?.();
      onClose();
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('Failed to delete car. Please try again.');
    } finally {
      setMenuOpen(false);
    }
  };

  const handleEdit = () => {
    if (!carData) return;
    setEditValues({
      makeId: carData.makeId || '',
      modelId: carData.modelId || '',
      year: carData.year ? String(carData.year) : '',
      engineVariantId: carData.engineVariantId || '',
      transmission: (carData.transmission || '') as '' | 'manual' | 'automatic' | 'semi_automatic',
      color: carData.color || '',
      interiorColor: carData.interiorColor || '',
    });
    setIsEditing(true);
    setMenuOpen(false);
  };

  const handleSave = async () => {
    if (!carData) return;
    if (!editValues.makeId || !editValues.modelId || !editValues.year) {
      alert('Please fill in all required fields.');
      return;
    }

    const year = parseInt(editValues.year, 10);
    if (Number.isNaN(year)) {
      alert('Please enter a valid year.');
      return;
    }

    try {
      await client.models.Car.update({
        id: carData.id,
        makeId: editValues.makeId,
        modelId: editValues.modelId,
        year,
        engineVariantId: editValues.engineVariantId || undefined,
        transmission: editValues.transmission || undefined,
        color: editValues.color || undefined,
        interiorColor: editValues.interiorColor || undefined,
      });

      setCarData(prev => prev ? ({
        ...prev,
        makeId: editValues.makeId,
        modelId: editValues.modelId,
        year,
        engineVariantId: editValues.engineVariantId || undefined,
        transmission: editValues.transmission || undefined,
        color: editValues.color || undefined,
        interiorColor: editValues.interiorColor || undefined,
      }) : prev);
      setIsEditing(false);
      onCarUpdated?.();
    } catch (error) {
      console.error('Error updating car:', error);
      alert('Failed to update car. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setMenuOpen(false);
    if (carData) {
      setEditValues({
        makeId: carData.makeId || '',
        modelId: carData.modelId || '',
        year: carData.year ? String(carData.year) : '',
        engineVariantId: carData.engineVariantId || '',
        transmission: (carData.transmission || '') as '' | 'manual' | 'automatic' | 'semi_automatic',
        color: carData.color || '',
        interiorColor: carData.interiorColor || '',
      });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with Image */}
        <div style={{ position: 'relative' }}>
          <img
            src={currentImage}
            alt={`${displayMakeName} ${displayModelName}`}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
            }}
          />

          {/* Actions */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              zIndex: 2,
            }}
          >
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid rgba(0,0,0,0.4)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  color: '#000',
                }}
                aria-label="More actions"
              >
                <MoreVertical size={20} />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: '180px',
                    overflow: 'hidden',
                    zIndex: 3,
                  }}
                >
                  <button
                    onClick={handleEdit}
                    disabled={isUploading}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      color: '#111',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#b91c1c',
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.4)',
                background: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                color: '#000',
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Photo Navigation */}
          {photoUrls.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextPhoto}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <ChevronRight size={20} />
              </button>

              {/* Photo Indicators */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '0.5rem',
                }}
              >
                {photoUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      border: 'none',
                      background: index === currentPhotoIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </>
          )}

        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handlePhotoInputChange}
        />

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 600, color: '#000' }}>
            {displayMakeName} {displayModelName}
          </h2>

          {!isEditing ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111' }}>
                <span>Car name</span>
                <span>{displayMakeName} {displayModelName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111' }}>
                <span>Date</span>
                <span>{carData.year || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111' }}>
                <span>Engine</span>
                <span>{carData.engineVariantId || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111' }}>
                <span>Transmission</span>
                <span>{formatTransmission(carData.transmission) || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111' }}>
                <span>Exterior colour</span>
                <span>{carData.color || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111' }}>
                <span>Interior colour</span>
                <span>{carData.interiorColor || '—'}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.5rem', color: '#111' }}>
                <span>Car name</span>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <select
                    value={editValues.makeId}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, makeId: e.target.value }))}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: '#fff',
                    }}
                  >
                    <option value="">Select make</option>
                    {makes.map((make) => (
                      <option key={make.makeId} value={make.makeId}>{make.makeName}</option>
                    ))}
                  </select>
                  <select
                    value={editValues.modelId}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, modelId: e.target.value }))}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: '#fff',
                    }}
                  >
                    <option value="">Select model</option>
                    {filteredModels.map((model) => (
                      <option key={model.modelId} value={model.modelId}>{model.modelName}</option>
                    ))}
                  </select>
                </div>
              </label>
              <label style={{ display: 'grid', gap: '0.5rem', color: '#111' }}>
                <span>Date</span>
                <input
                  type="number"
                  value={editValues.year}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, year: e.target.value }))}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.5rem', color: '#111' }}>
                <span>Engine</span>
                <input
                  type="text"
                  value={editValues.engineVariantId}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, engineVariantId: e.target.value }))}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.5rem', color: '#111' }}>
                <span>Transmission</span>
                <select
                  value={editValues.transmission}
                  onChange={(e) => setEditValues((prev) => ({
                    ...prev,
                    transmission: e.target.value as '' | 'manual' | 'automatic' | 'semi_automatic',
                  }))}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                  }}
                >
                  {TRANSMISSIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '0.5rem', color: '#111' }}>
                <span>Exterior colour</span>
                <input
                  type="text"
                  value={editValues.color}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, color: e.target.value }))}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.5rem', color: '#111' }}>
                <span>Interior colour</span>
                <input
                  type="text"
                  value={editValues.interiorColor}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, interiorColor: e.target.value }))}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                  }}
                />
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={handleEditPhotos}
                  disabled={isUploading}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '999px',
                    border: '1px solid #111',
                    background: '#fff',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  {isUploading ? 'Uploading…' : 'Upload photos'}
                </button>
                <span style={{ color: '#666', fontSize: '0.875rem' }}>
                  {photoUrls.length} photo{photoUrls.length === 1 ? '' : 's'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #111',
                    background: '#111',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Camera, Trash2 } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];

interface AddCarPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCarAdded?: () => void;
}

const TRANSMISSIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'semi_automatic', label: 'Semi-Automatic' },
];

const DRIVETRAINS = [
  { value: 'lhd', label: 'LHD' },
  { value: 'rhd', label: 'RHD' },
];

const FUEL_TYPES = [
  'Petrol',
  'Diesel',
  'Hybrid',
  'Electric',
  'Other',
];

const EXTERIOR_COLORS = [
  'Black', 'White', 'Silver', 'Grey', 'Red', 'Blue', 'Green', 'Yellow',
  'Orange', 'Brown', 'Beige', 'Gold', 'Bronze', 'Purple', 'Other'
];

const INTERIOR_COLORS = [
  'Black', 'Tan', 'Beige', 'Brown', 'Red', 'Grey', 'White', 'Blue', 'Other'
];

export default function AddCarPopup({ isOpen, onClose, onCarAdded }: AddCarPopupProps) {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    makeId: '',
    modelId: '',
    year: '',
    mileage: '',
    mileageUnit: 'km' as 'km' | 'miles',
    vin: '',
    driveType: '' as '' | 'lhd' | 'rhd',
    engineVariantId: '',
    transmission: '' as '' | 'manual' | 'automatic' | 'semi_automatic',
    color: '',
    interiorColor: '',
    description: '',
    fuelType: '',
    price: '',
  });
  const [isForSale, setIsForSale] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMakes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.makeId) {
      const filtered = models.filter(m => m.makeId === formData.makeId);
      setFilteredModels(filtered);
      // Reset model selection when make changes
      if (!filtered.find(m => m.modelId === formData.modelId)) {
        setFormData(prev => ({ ...prev, modelId: '' }));
      }
    } else {
      setFilteredModels([]);
    }
  }, [formData.makeId, models]);

  const loadMakes = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Make.list({ limit: 500 });
      const sorted = (data || []).sort((a, b) => a.makeName.localeCompare(b.makeName));
      setMakes(sorted);

      // Also load all models
      const { data: modelsData } = await client.models.Model.list({ limit: 1000 });
      setModels(modelsData || []);
    } catch (error) {
      console.error('Error loading makes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).slice(0, 10 - photos.length); // Max 10 photos

    // Create preview URLs
    const newPreviews = newPhotos.map(file => URL.createObjectURL(file));

    setPhotos(prev => [...prev, ...newPhotos]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(photoPreviews[index]);

    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (carId: string): Promise<string[]> => {
    const uploadedPaths: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileExtension = photo.name.split('.').pop();
      const fileName = `${carId}-${Date.now()}-${i}.${fileExtension}`;

      try {
        // Use identity-based path pattern for Amplify storage
        const result = await uploadData({
          path: ({ identityId }) => `car-photos/${identityId}/${fileName}`,
          data: photo,
          options: {
            contentType: photo.type,
          }
        }).result;

        // Store the path, not the signed URL (which expires)
        uploadedPaths.push(result.path);
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }

    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent, listForSale = false) => {
    e.preventDefault();

    if (!formData.makeId || !formData.modelId || !formData.year) {
      alert('Please fill in all required fields');
      return;
    }

    const year = parseInt(formData.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      alert('Please enter a valid year');
      return;
    }

    if (listForSale && !formData.price) {
      alert('Please enter a price to list the car.');
      return;
    }

    try {
      setSaving(true);

      // Get current user ID
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub as string;

      if (!userId) {
        alert('Please sign in to add a car');
        return;
      }

      const priceValue = formData.price ? Number(formData.price) : undefined;
      const descriptionParts = [
        formData.fuelType ? `Fuel type: ${formData.fuelType}` : null,
        formData.description,
      ].filter(Boolean);
      const combinedDescription = descriptionParts.join('\n\n');

      // Create car first to get the ID
      const carResult = await client.models.Car.create({
        ownerId: userId,
        makeId: formData.makeId,
        modelId: formData.modelId,
        year: year,
        vin: formData.vin || undefined,
        mileage: formData.mileage ? Number(formData.mileage) : undefined,
        mileageUnit: formData.mileage ? formData.mileageUnit : undefined,
        driveType: formData.driveType || undefined,
        engineVariantId: formData.engineVariantId || undefined,
        transmission: formData.transmission || undefined,
        color: formData.color || undefined,
        interiorColor: formData.interiorColor || undefined,
        description: combinedDescription || undefined,
        saleStatus: listForSale ? 'for_sale' : 'off_market',
        price: listForSale ? priceValue : undefined,
        isPublic: true,
      });

      // Upload photos if any
      if (photos.length > 0 && carResult.data?.id) {
        const photoPaths = await uploadPhotos(carResult.data.id);

        // Update car with photo paths
        if (photoPaths.length > 0) {
          await client.models.Car.update({
            id: carResult.data.id,
            photos: photoPaths,
          });
        }
      }

      alert(listForSale ? 'Car listed successfully!' : 'Car added to your garage!');
      resetForm();
      onCarAdded?.();
      onClose();
    } catch (error) {
      console.error('Error adding car:', error);
      alert('Failed to add car. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      makeId: '',
      modelId: '',
      year: '',
      mileage: '',
      mileageUnit: 'km',
      vin: '',
      driveType: '',
      engineVariantId: '',
      transmission: '',
      color: '',
      interiorColor: '',
      description: '',
      fuelType: '',
      price: '',
    });
    setIsForSale(false);
    // Clean up photo previews
    photoPreviews.forEach(url => URL.revokeObjectURL(url));
    setPhotos([]);
    setPhotoPreviews([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    boxSizing: 'border-box' as const,
    fontSize: '0.875rem',
    backgroundColor: '#fff',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 600,
    fontSize: '0.875rem',
    color: '#333',
  };

  const selectWrapperStyle = {
    position: 'relative' as const,
  };
  const yearOptions = Array.from(
    { length: new Date().getFullYear() - 1899 },
    (_, index) => String(new Date().getFullYear() - index)
  );

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
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #eee',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            Add a Car to Your Garage
          </h3>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: '#f0f0f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading makes and models...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Upload car images */}
                <div>
                  <label style={labelStyle}>Upload car images</label>
                  <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.75rem 0' }}>
                    Add up to 10 photos of your car
                  </p>

                  {photoPreviews.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                    }}>
                      {photoPreviews.map((preview, index) => (
                        <div
                          key={index}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #ddd',
                          }}
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                          {index === 0 && (
                            <div style={{
                              position: 'absolute',
                              bottom: '4px',
                              left: '4px',
                              padding: '2px 6px',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              fontSize: '0.625rem',
                              borderRadius: '4px',
                            }}>
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {photos.length < 10 && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoSelect}
                        style={{ display: 'none' }}
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '1rem',
                          border: '2px dashed #ddd',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: '#f9f9f9',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#999';
                          e.currentTarget.style.backgroundColor = '#f0f0f0';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#ddd';
                          e.currentTarget.style.backgroundColor = '#f9f9f9';
                        }}
                      >
                        <Camera size={20} style={{ color: '#666' }} />
                        <span style={{ color: '#666', fontSize: '0.875rem' }}>
                          {photos.length === 0 ? 'Add Photos' : `Add More (${10 - photos.length} remaining)`}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Make (required) */}
                <div>
                  <label style={labelStyle}>Make *</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={formData.makeId}
                      onChange={(e) => setFormData({ ...formData, makeId: e.target.value })}
                      required
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                    >
                      <option value="">Select a make...</option>
                      {makes.map((make) => (
                        <option key={make.makeId} value={make.makeId}>
                          {make.makeName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666',
                      }}
                    />
                  </div>
                </div>

                {/* Model (required) */}
                <div>
                  <label style={labelStyle}>Model *</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={formData.modelId}
                      onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                      required
                      disabled={!formData.makeId}
                      style={{
                        ...inputStyle,
                        appearance: 'none',
                        paddingRight: '2.5rem',
                        cursor: formData.makeId ? 'pointer' : 'not-allowed',
                        opacity: formData.makeId ? 1 : 0.6,
                      }}
                    >
                      <option value="">
                        {formData.makeId ? 'Select a model...' : 'Select a make first'}
                      </option>
                      {filteredModels.map((model) => (
                        <option key={model.modelId} value={model.modelId}>
                          {model.modelName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666',
                      }}
                    />
                  </div>
                </div>

                {/* Year of manufacture (required) */}
                <div>
                  <label style={labelStyle}>Year of manufacture *</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                    >
                      <option value="">Select year...</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666',
                      }}
                    />
                  </div>
                </div>

                {/* Mileage */}
                <div>
                  <label style={labelStyle}>Mileage</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="number"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      placeholder="e.g., 48000"
                      min="0"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <div style={{ width: '130px', position: 'relative' }}>
                      <select
                        value={formData.mileageUnit}
                        onChange={(e) => setFormData({ ...formData, mileageUnit: e.target.value as 'km' | 'miles' })}
                        style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                      >
                        <option value="km">km</option>
                        <option value="miles">miles</option>
                      </select>
                      <ChevronDown
                        size={18}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          color: '#666',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Chassis number */}
                <div>
                  <label style={labelStyle}>Chassis number</label>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    placeholder="e.g., WBA1234567890"
                    style={inputStyle}
                  />
                </div>

                {/* Drive */}
                <div>
                  <label style={labelStyle}>Drive</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={formData.driveType}
                      onChange={(e) => setFormData({ ...formData, driveType: e.target.value as typeof formData.driveType })}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                    >
                      <option value="">Select drive...</option>
                      {DRIVETRAINS.map((drive) => (
                        <option key={drive.value} value={drive.value}>
                          {drive.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666',
                      }}
                    />
                  </div>
                </div>

                {/* Gearbox */}
                <div>
                  <label style={labelStyle}>Gearbox</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={formData.transmission}
                      onChange={(e) => setFormData({ ...formData, transmission: e.target.value as typeof formData.transmission })}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                    >
                      <option value="">Select transmission...</option>
                      {TRANSMISSIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666',
                      }}
                    />
                  </div>
                </div>

                {/* Engine */}
                <div>
                  <label style={labelStyle}>Engine</label>
                  <input
                    type="text"
                    value={formData.engineVariantId}
                    onChange={(e) => setFormData({ ...formData, engineVariantId: e.target.value })}
                    placeholder="e.g., 3.0L Twin Turbo V6"
                    style={inputStyle}
                  />
                </div>

                {/* Fuel type */}
                <div>
                  <label style={labelStyle}>Fuel type</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={formData.fuelType}
                      onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                    >
                      <option value="">Select fuel type...</option>
                      {FUEL_TYPES.map((fuel) => (
                        <option key={fuel} value={fuel}>
                          {fuel}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666',
                      }}
                    />
                  </div>
                </div>

                {/* Exterior Colour */}
                <div>
                  <label style={labelStyle}>Exterior Colour</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                    >
                      <option value="">Select colour...</option>
                      {EXTERIOR_COLORS.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666',
                      }}
                    />
                  </div>
                </div>

                {/* Interior Colour */}
                <div>
                  <label style={labelStyle}>Interior Colour</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={formData.interiorColor}
                      onChange={(e) => setFormData({ ...formData, interiorColor: e.target.value })}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                    >
                      <option value="">Select colour...</option>
                      {INTERIOR_COLORS.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#666',
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Share key details about your car..."
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* For sale */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsForSale((prev) => !prev)}
                    style={{
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      color: '#000',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    For sale
                  </button>
                  {isForSale && (
                    <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.75rem' }}>
                      <div>
                        <label style={labelStyle}>Price</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="e.g., 45000"
                          min="0"
                          style={inputStyle}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: saving ? '#ccc' : '#111',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          alignSelf: 'flex-start',
                        }}
                      >
                        {saving ? 'Listing...' : 'List the car'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f0f0f0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.75rem 2rem',
                    background: saving ? '#ccc' : '#000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {saving ? 'Adding...' : 'Add Car'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

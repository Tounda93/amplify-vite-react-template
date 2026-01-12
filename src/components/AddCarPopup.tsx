import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
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

  const [formData, setFormData] = useState({
    makeId: '',
    modelId: '',
    year: '',
    purchaseDate: '',
    engineVariantId: '',
    transmission: '' as '' | 'manual' | 'automatic' | 'semi_automatic',
    color: '',
    interiorColor: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      setSaving(true);

      // Get current user ID
      const session = await fetchAuthSession();
      const userId = session.tokens?.idToken?.payload?.sub as string;

      if (!userId) {
        alert('Please sign in to add a car');
        return;
      }

      await client.models.Car.create({
        ownerId: userId,
        makeId: formData.makeId,
        modelId: formData.modelId,
        year: year,
        engineVariantId: formData.engineVariantId || undefined,
        transmission: formData.transmission || undefined,
        color: formData.color || undefined,
        interiorColor: formData.interiorColor || undefined,
        isPublic: true,
      });

      alert('Car added to your garage!');
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
      purchaseDate: '',
      engineVariantId: '',
      transmission: '',
      color: '',
      interiorColor: '',
    });
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

                {/* Year (required) */}
                <div>
                  <label style={labelStyle}>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                    placeholder="e.g., 2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    style={inputStyle}
                  />
                </div>

                {/* Date of Purchase */}
                <div>
                  <label style={labelStyle}>Date of Purchase</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    style={inputStyle}
                  />
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

                {/* Transmission */}
                <div>
                  <label style={labelStyle}>Transmission</label>
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

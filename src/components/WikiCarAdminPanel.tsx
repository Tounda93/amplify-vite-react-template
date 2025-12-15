import { useEffect, useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type WikiCarEntry = Schema['WikiCarEntry']['type'];

const INITIAL_FORM = {
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
};

type ExtraField = { label: string; value: string };

const parseAdditionalFields = (value?: string | null): ExtraField[] => {
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

const formatAdditionalFields = (fields: ExtraField[]): string | undefined => {
  const filtered = fields.filter((field) => field.label.trim() && field.value.trim());
  if (!filtered.length) return undefined;
  return JSON.stringify(filtered);
};

const WikiCarAdminPanel = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [extraFields, setExtraFields] = useState<ExtraField[]>([]);
  const [entries, setEntries] = useState<WikiCarEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const loadEntries = async () => {
    setLoadingEntries(true);
    try {
      const { data } = await client.models.WikiCarEntry.list({ limit: 200 });
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading encyclopedia entries', error);
    }
    setLoadingEntries(false);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleInputChange = (field: keyof typeof INITIAL_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = async (file: File | null, field: 'heroImageUrl' | 'sideImageUrl' | 'brandLogoUrl') => {
    if (!file) return;
    setStatusMessage('Uploading image...');
    try {
      const uploadKey = await uploadData({
        path: ({ identityId }) => `car-photos/${identityId}/${Date.now()}-${file.name}`,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      setForm((prev) => ({ ...prev, [field]: uploadKey.path }));
      setStatusMessage('Image uploaded successfully.');
    } catch (error) {
      console.error('Image upload failed', error);
      setStatusMessage('Image upload failed. Please try again.');
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setExtraFields([]);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.makeId.trim() || !form.brandName.trim() || !form.makeName.trim()) {
      setStatusMessage('Make ID, Brand name, and Make name are required.');
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        ...form,
        makeId: form.makeId.trim(),
        brandName: form.brandName.trim(),
        makeName: form.makeName.trim(),
        variant: form.variant.trim() || undefined,
        summary: form.summary.trim() || undefined,
        production: form.production.trim() || undefined,
        designer: form.designer.trim() || undefined,
        kerbWeight: form.kerbWeight.trim() || undefined,
        engine: form.engine.trim() || undefined,
        transmission: form.transmission.trim() || undefined,
        power: form.power.trim() || undefined,
        fuel: form.fuel.trim() || undefined,
        heroImageUrl: form.heroImageUrl || undefined,
        sideImageUrl: form.sideImageUrl || undefined,
        brandLogoUrl: form.brandLogoUrl || undefined,
        additionalFields: formatAdditionalFields(extraFields),
      };

      if (editingId) {
        await client.models.WikiCarEntry.update({
          id: editingId,
          ...payload,
        });
        setStatusMessage('Entry updated successfully.');
      } else {
        await client.models.WikiCarEntry.create(payload);
        setStatusMessage('Entry created successfully.');
      }

      resetForm();
      loadEntries();
    } catch (error) {
      console.error('Error saving encyclopedia entry', error);
      setStatusMessage('Unable to save the entry. Please try again.');
    }

    setSubmitting(false);
  };

  const handleEdit = (entry: WikiCarEntry) => {
    setEditingId(entry.id);
    setForm({
      makeId: entry.makeId || '',
      brandName: entry.brandName || entry.makeName || '',
      makeName: entry.makeName || '',
      variant: entry.variant || '',
      summary: entry.summary || '',
      heroImageUrl: entry.heroImageUrl || '',
      sideImageUrl: entry.sideImageUrl || '',
      brandLogoUrl: entry.brandLogoUrl || '',
      production: entry.production || '',
      designer: entry.designer || '',
      kerbWeight: entry.kerbWeight || '',
      engine: entry.engine || '',
      transmission: entry.transmission || '',
      power: entry.power || '',
      fuel: entry.fuel || '',
    });
    setExtraFields(parseAdditionalFields(entry.additionalFields));
    setStatusMessage(`Editing entry for ${entry.brandName || entry.makeName}`);
  };

  const handleDelete = async (entry: WikiCarEntry) => {
    if (!confirm(`Delete encyclopedia entry for ${entry.makeName}?`)) return;
    try {
      await client.models.WikiCarEntry.delete({ id: entry.id });
      setStatusMessage('Entry deleted.');
      if (editingId === entry.id) {
        resetForm();
      }
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry', error);
      setStatusMessage('Unable to delete entry.');
    }
  };

  const displayedEntries = useMemo(
    () => entries.sort((a, b) => a.brandName.localeCompare(b.brandName)),
    [entries]
  );

  return (
    <div style={{ marginTop: '3rem' }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '2rem',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>WikiCars Admin</h2>
        <p style={{ color: '#475569', marginTop: 0, marginBottom: '1.5rem' }}>
          Use this form to curate encyclopedia entries. Upload brand assets, provide descriptive text,
          and add bespoke fields for each car.
        </p>

        {statusMessage && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              color: '#0f172a',
              fontSize: '0.9rem',
            }}
          >
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#475569' }}>Make ID *</label>
              <input
                type="text"
                value={form.makeId}
                onChange={(e) => handleInputChange('makeId', e.target.value)}
                placeholder="lotus"
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#475569' }}>Brand name *</label>
              <input
                type="text"
                value={form.brandName}
                onChange={(e) => handleInputChange('brandName', e.target.value)}
                placeholder="Lotus"
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#475569' }}>Make name *</label>
              <input
                type="text"
                value={form.makeName}
                onChange={(e) => handleInputChange('makeName', e.target.value)}
                placeholder="Elise"
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#475569' }}>Variant</label>
              <input
                type="text"
                value={form.variant}
                onChange={(e) => handleInputChange('variant', e.target.value)}
                placeholder="111S"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#475569' }}>Summary / description</label>
            <textarea
              value={form.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
            />
          </div>

          {/* Image uploads */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              { label: 'Hero image (carousel)', field: 'heroImageUrl' as const },
              { label: 'Secondary image', field: 'sideImageUrl' as const },
              { label: 'Brand logo (PNG preferred)', field: 'brandLogoUrl' as const },
            ].map(({ label, field }) => (
              <div key={field}>
                <label style={{ fontSize: '0.85rem', color: '#475569' }}>{label}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0] ?? null, field)}
                  style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                />
                {form[field] && (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Stored at: {form[field]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Technical fields */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {[
              { field: 'production', label: 'Production' },
              { field: 'designer', label: 'Designer' },
              { field: 'kerbWeight', label: 'Kerb weight' },
              { field: 'engine', label: 'Engine' },
              { field: 'transmission', label: 'Transmission' },
              { field: 'power', label: 'Power' },
              { field: 'fuel', label: 'Fuel' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label style={{ fontSize: '0.85rem', color: '#475569' }}>{label}</label>
                <input
                  type="text"
                  value={(form as any)[field]}
                  onChange={(e) => handleInputChange(field as keyof typeof INITIAL_FORM, e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                />
              </div>
            ))}
          </div>

          {/* Extra fields */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Additional fields</h3>
              <button
                type="button"
                onClick={() => setExtraFields([...extraFields, { label: '', value: '' }])}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid #cbd5f5',
                  background: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                + Add field
              </button>
            </div>

            {extraFields.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Add optional label/value pairs (e.g., "Top speed / 220 km/h").
              </p>
            )}

            {extraFields.map((field, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => {
                    const copy = [...extraFields];
                    copy[index] = { ...copy[index], label: e.target.value };
                    setExtraFields(copy);
                  }}
                  placeholder="Label"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                />
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => {
                    const copy = [...extraFields];
                    copy[index] = { ...copy[index], value: e.target.value };
                    setExtraFields(copy);
                  }}
                  placeholder="Value"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5f5' }}
                />
                <button
                  type="button"
                  onClick={() => setExtraFields(extraFields.filter((_, i) => i !== index))}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #fee2e2',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.8rem 1.6rem',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: '#111827',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {editingId ? 'Update Entry' : 'Create Entry'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '0.8rem 1.6rem',
                  borderRadius: '999px',
                  border: '1px solid #cbd5f5',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Existing entries table */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Existing entries</h3>
        {loadingEntries ? (
          <p style={{ color: '#94a3b8' }}>Loading encyclopedia entries...</p>
        ) : displayedEntries.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No curated wiki entries yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Brand</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Make</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Variant</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Production</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedEntries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem' }}>{entry.brandName}</td>
                    <td style={{ padding: '0.75rem' }}>{entry.makeName}</td>
                    <td style={{ padding: '0.75rem' }}>{entry.variant || '—'}</td>
                    <td style={{ padding: '0.75rem' }}>{entry.production || '—'}</td>
                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        style={{
                          padding: '0.3rem 0.8rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5f5',
                          background: '#f8fafc',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry)}
                        style={{
                          padding: '0.3rem 0.8rem',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WikiCarAdminPanel;

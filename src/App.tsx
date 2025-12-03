import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

function CarSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [makes, setMakes] = useState<Schema['Make']['type'][]>([]);
  const [allMakes, setAllMakes] = useState<Schema['Make']['type'][]>([]);
  const [models, setModels] = useState<Schema['Model']['type'][]>([]);
  const [selectedMake, setSelectedMake] = useState<Schema['Make']['type'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Form states for adding data
  const [newMake, setNewMake] = useState({ makeId: '', makeName: '', country: '', isClassic: false, yearsFrom: '' });
  const [newModel, setNewModel] = useState({ modelId: '', makeId: '', modelName: '', fullName: '', yearsFrom: '' });

  // Load all makes on start
  useEffect(() => {
    loadAllMakes();
  }, []);

  const loadAllMakes = async () => {
    try {
      const { data } = await client.models.Make.list();
      setAllMakes(data || []);
    } catch (error) {
      console.error('Error loading makes:', error);
    }
  };

  // Search makes when user types
  useEffect(() => {
    if (searchTerm.length < 1) {
      setMakes([]);
      return;
    }

    const filtered = allMakes.filter(make => 
      make.makeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setMakes(filtered);
  }, [searchTerm, allMakes]);

  // Load models when a make is selected
  const handleSelectMake = async (make: Schema['Make']['type']) => {
    setSelectedMake(make);
    setSearchTerm(make.makeName);
    setMakes([]);
    
    try {
      const { data } = await client.models.Model.list({
        filter: { makeId: { eq: make.makeId } }
      });
      setModels(data || []);
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  // Add a new make
  const handleAddMake = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.models.Make.create({
        makeId: newMake.makeId.toLowerCase().replace(/\s+/g, '_'),
        makeName: newMake.makeName,
        country: newMake.country || undefined,
        isClassic: newMake.isClassic,
        yearsFrom: newMake.yearsFrom ? parseInt(newMake.yearsFrom) : undefined,
      });
      alert(`${newMake.makeName} added successfully!`);
      setNewMake({ makeId: '', makeName: '', country: '', isClassic: false, yearsFrom: '' });
      loadAllMakes();
    } catch (error) {
      console.error('Error adding make:', error);
      alert('Error adding make. Check console for details.');
    }
  };

  // Add a new model
  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.models.Model.create({
        modelId: newModel.modelId.toLowerCase().replace(/\s+/g, '_'),
        makeId: newModel.makeId,
        modelName: newModel.modelName,
        fullName: newModel.fullName,
        yearsFrom: newModel.yearsFrom ? parseInt(newModel.yearsFrom) : undefined,
      });
      alert(`${newModel.modelName} added successfully!`);
      setNewModel({ modelId: '', makeId: '', modelName: '', fullName: '', yearsFrom: '' });
    } catch (error) {
      console.error('Error adding model:', error);
      alert('Error adding model. Check console for details.');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>🚗 Car Encyclopedia</h1>
        <button 
          onClick={() => setShowAdmin(!showAdmin)}
          style={{ 
            padding: '0.5rem 1rem', 
            background: showAdmin ? '#e74c3c' : '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showAdmin ? 'Hide Admin' : 'Add Cars'}
        </button>
      </div>

      {/* Admin Section */}
      {showAdmin && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          border: '2px solid #3498db'
        }}>
          <h2>Admin: Add Car Data</h2>
          
          {/* Add Make Form */}
          <div style={{ marginBottom: '2rem' }}>
            <h3>Add New Make</h3>
            <form onSubmit={handleAddMake} style={{ display: 'grid', gap: '0.5rem', maxWidth: '400px' }}>
              <input
                placeholder="Make ID (e.g., porsche)"
                value={newMake.makeId}
                onChange={(e) => setNewMake({...newMake, makeId: e.target.value})}
                required
                style={{ padding: '0.5rem' }}
              />
              <input
                placeholder="Make Name (e.g., Porsche)"
                value={newMake.makeName}
                onChange={(e) => setNewMake({...newMake, makeName: e.target.value})}
                required
                style={{ padding: '0.5rem' }}
              />
              <input
                placeholder="Country Code (e.g., DE)"
                value={newMake.country}
                onChange={(e) => setNewMake({...newMake, country: e.target.value})}
                style={{ padding: '0.5rem' }}
              />
              <input
                placeholder="Year Founded (e.g., 1931)"
                value={newMake.yearsFrom}
                onChange={(e) => setNewMake({...newMake, yearsFrom: e.target.value})}
                style={{ padding: '0.5rem' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={newMake.isClassic}
                  onChange={(e) => setNewMake({...newMake, isClassic: e.target.checked})}
                />
                Classic Brand
              </label>
              <button type="submit" style={{ padding: '0.5rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Add Make
              </button>
            </form>
          </div>

          {/* Add Model Form */}
          <div>
            <h3>Add New Model</h3>
            <form onSubmit={handleAddModel} style={{ display: 'grid', gap: '0.5rem', maxWidth: '400px' }}>
              <select
                value={newModel.makeId}
                onChange={(e) => setNewModel({...newModel, makeId: e.target.value})}
                required
                style={{ padding: '0.5rem' }}
              >
                <option value="">Select Make...</option>
                {allMakes.map(make => (
                  <option key={make.makeId} value={make.makeId}>{make.makeName}</option>
                ))}
              </select>
              <input
                placeholder="Model ID (e.g., porsche_911)"
                value={newModel.modelId}
                onChange={(e) => setNewModel({...newModel, modelId: e.target.value})}
                required
                style={{ padding: '0.5rem' }}
              />
              <input
                placeholder="Model Name (e.g., 911)"
                value={newModel.modelName}
                onChange={(e) => setNewModel({...newModel, modelName: e.target.value})}
                required
                style={{ padding: '0.5rem' }}
              />
              <input
                placeholder="Full Name (e.g., Porsche 911)"
                value={newModel.fullName}
                onChange={(e) => setNewModel({...newModel, fullName: e.target.value})}
                required
                style={{ padding: '0.5rem' }}
              />
              <input
                placeholder="Year From (e.g., 1964)"
                value={newModel.yearsFrom}
                onChange={(e) => setNewModel({...newModel, yearsFrom: e.target.value})}
                style={{ padding: '0.5rem' }}
              />
              <button type="submit" style={{ padding: '0.5rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Add Model
              </button>
            </form>
          </div>
        </div>
      )}

      {/* All Makes (quick view) */}
      {allMakes.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>All Makes in Database ({allMakes.length})</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {allMakes.map(make => (
              <span 
                key={make.makeId}
                onClick={() => handleSelectMake(make)}
                style={{ 
                  background: '#e0e0e0', 
                  padding: '0.3rem 0.8rem', 
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {make.makeName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search car makes..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedMake(null);
            setModels([]);
          }}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.2rem',
            borderRadius: '8px',
            border: '2px solid #ddd',
            boxSizing: 'border-box',
          }}
        />
        
        {/* Search Results Dropdown */}
        {makes.length > 0 && !selectedMake && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}>
            {makes.map((make) => (
              <div
                key={make.makeId}
                onClick={() => handleSelectMake(make)}
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                <strong>{make.makeName}</strong>
                {make.country && <span style={{ color: '#666', marginLeft: '0.5rem' }}>({make.country})</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Make Details */}
      {selectedMake && (
        <div style={{ 
          background: '#f9f9f9', 
          padding: '1.5rem', 
          borderRadius: '8px',
          marginBottom: '2rem' 
        }}>
          <h2>{selectedMake.makeName}</h2>
          <p><strong>Country:</strong> {selectedMake.country || 'Unknown'}</p>
          <p><strong>Classic Brand:</strong> {selectedMake.isClassic ? 'Yes' : 'No'}</p>
          {selectedMake.yearsFrom && (
            <p><strong>Founded:</strong> {selectedMake.yearsFrom}</p>
          )}
        </div>
      )}

      {/* Models List */}
      {models.length > 0 && (
        <div>
          <h3>Models ({models.length})</h3>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {models.map((model) => (
              <div
                key={model.modelId}
                style={{
                  background: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{model.modelName}</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                  {model.fullName}
                </p>
                {model.yearsFrom && (
                  <p style={{ margin: '0.5rem 0 0 0', color: '#888', fontSize: '0.8rem' }}>
                    Since {model.yearsFrom}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allMakes.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
          <p>No cars in the database yet.</p>
          <p>Click "Add Cars" above to start adding makes and models!</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div>
          <header style={{ 
            background: '#1a1a2e', 
            color: 'white', 
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Welcome, {user?.signInDetails?.loginId}</span>
            <button onClick={signOut} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Sign Out</button>
          </header>
          <CarSearch />
        </div>
      )}
    </Authenticator>
  );
}

export default App;
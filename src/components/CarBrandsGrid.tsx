import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type Make = Schema['Make']['type'];

interface CarBrandsGridProps {
  onSelectMake: (make: Make) => void;
}

export default function CarBrandsGrid({ onSelectMake }: CarBrandsGridProps) {
  const [makes, setMakes] = useState<Make[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMakes();
  }, []);

  const loadMakes = async () => {
    try {
      const { data } = await client.models.Make.list({ limit: 200 });
      const sorted = (data || []).sort((a, b) => {
        // Sort by popularity seed (higher first), then alphabetically
        if (a.popularitySeed !== b.popularitySeed) {
          return (b.popularitySeed || 0) - (a.popularitySeed || 0);
        }
        return a.makeName.localeCompare(b.makeName);
      });
      setMakes(sorted);
    } catch (error) {
      console.error('Error loading makes:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#666' }}>Loading car brands...</p>
      </div>
    );
  }

  if (makes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#666' }}>No car brands in database yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '11px',
        maxHeight: '71px', // 2 rows: (30px height * 2) + (11px gap * 1)
        overflow: 'hidden',
      }}>
        {makes.map((make) => (
          <button
            key={make.makeId}
            onClick={() => onSelectMake(make)}
            style={{
              width: '100px',
              height: '30px',
              borderRadius: '100px',
              backgroundColor: '#E8E8E8',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '500',
              color: '#111827',
              padding: '0 12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#3498db';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#E8E8E8';
              e.currentTarget.style.color = '#111827';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {make.makeName}
          </button>
        ))}
      </div>
    </div>
  );
}

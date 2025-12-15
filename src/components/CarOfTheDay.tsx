import { useState, useEffect } from 'react';
import { Sparkles, Calendar, MapPin } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type Model = Schema['Model']['type'];
type Make = Schema['Make']['type'];

interface CarOfTheDayData {
  model: Model;
  make: Make;
}

export default function CarOfTheDay() {
  const [carData, setCarData] = useState<CarOfTheDayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarOfTheDay();
  }, []);

  const loadCarOfTheDay = async () => {
    try {
      // Get all models
      const { data: models } = await client.models.Model.list({ limit: 500 });

      if (!models || models.length === 0) {
        setLoading(false);
        return;
      }

      // Use date-based seed for consistent daily selection
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      const randomIndex = dayOfYear % models.length;
      const selectedModel = models[randomIndex];

      // Get the make details
      const { data: make } = await client.models.Make.get({ makeId: selectedModel.makeId });

      if (make) {
        setCarData({
          model: selectedModel,
          make: make,
        });
      }
    } catch (error) {
      console.error('Error loading car of the day:', error);
    }
    setLoading(false);
  };

  // Get car image (placeholder for now)
  const getCarImage = (_makeId: string, modelId: string) => {
    // In production, you would have actual car images
    // For now, using Unsplash with car-related keywords
    const searchTerm = modelId.replace(/_/g, '+');
    return `https://source.unsplash.com/1200x600/?${searchTerm},car,classic`;
  };

  if (loading) {
    return (
      <div style={{
        marginBottom: '3rem',
        padding: '3rem',
        backgroundColor: '#f9fafb',
        borderRadius: '16px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#666' }}>Loading Car of the Day...</p>
      </div>
    );
  }

  if (!carData) {
    return (
      <div style={{
        marginBottom: '3rem',
        padding: '3rem',
        backgroundColor: '#f9fafb',
        borderRadius: '16px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#666' }}>No cars in database yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '3rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <Sparkles size={28} color="#f59e0b" fill="#f59e0b" />
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
          Car of the Day
        </h2>
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '2px solid #f59e0b',
      }}>
        {/* Image Section */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '400px',
          backgroundColor: '#f3f4f6',
          backgroundImage: `url(${getCarImage(carData.make.makeId, carData.model.modelId)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          {/* Featured Badge */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '8px 16px',
            backgroundColor: '#f59e0b',
            color: 'white',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
          }}>
            <Sparkles size={16} fill="white" />
            FEATURED TODAY
          </div>

          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
          }} />
        </div>

        {/* Details Section */}
        <div style={{ padding: '32px' }}>
          {/* Make Badge */}
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '16px',
          }}>
            {carData.make.makeName}
            {carData.make.country && ` • ${carData.make.country}`}
          </div>

          {/* Model Name */}
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
          }}>
            {carData.model.fullName || carData.model.modelName}
          </h3>

          {/* Model Name (if different from full name) */}
          {carData.model.fullName && carData.model.fullName !== carData.model.modelName && (
            <p style={{
              margin: '0 0 20px 0',
              fontSize: '18px',
              color: '#6b7280',
            }}>
              Model: {carData.model.modelName}
            </p>
          )}

          {/* Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb',
          }}>
            {/* Years */}
            {carData.model.yearsFrom && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                  color: '#9ca3af',
                  fontSize: '13px',
                }}>
                  <Calendar size={16} />
                  <span>Production Years</span>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                }}>
                  {carData.model.yearsFrom}
                  {carData.model.yearsTo ? ` - ${carData.model.yearsTo}` : ' - Present'}
                </div>
              </div>
            )}

            {/* Origin */}
            {carData.make.country && (
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                  color: '#9ca3af',
                  fontSize: '13px',
                }}>
                  <MapPin size={16} />
                  <span>Origin</span>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                }}>
                  {carData.make.country}
                </div>
              </div>
            )}
          </div>

          {/* Classic Badge */}
          {carData.make.isClassic && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#fef3c7',
              borderRadius: '12px',
              border: '1px solid #fbbf24',
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#92400e',
                marginBottom: '4px',
              }}>
                Classic Heritage
              </div>
              <div style={{
                fontSize: '13px',
                color: '#78350f',
              }}>
                This vehicle is from a classic automobile manufacturer with a rich history in the automotive world.
              </div>
            </div>
          )}

          {/* View More Button */}
          <button
            style={{
              marginTop: '24px',
              width: '100%',
              padding: '14px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2980b9';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3498db';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Explore {carData.make.makeName} Models
          </button>
        </div>
      </div>
    </div>
  );
}

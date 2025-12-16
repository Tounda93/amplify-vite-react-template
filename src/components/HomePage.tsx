import CarBrandsGrid from './CarBrandsGrid';
import EventsCarousel from './EventsCarousel';
import NewsCarousel from './NewsCarousel';
import AuctionsCarousel from './AuctionsCarousel';
import { useIsMobile } from '../hooks/useIsMobile';
import type { Schema } from '../../amplify/data/resource';

type Make = Schema['Make']['type'];

interface HomePageProps {
  onSelectMake: (make: Make) => void;
}

export default function HomePage({ onSelectMake }: HomePageProps) {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '2rem' : '5rem';

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Car Brands Grid */}
      <div style={{
        width: '100%',
        padding: `1rem ${horizontalPadding} 0 ${horizontalPadding}`,
      }}>
        <CarBrandsGrid onSelectMake={onSelectMake} />
      </div>

      {/* Events Carousel */}
      <div style={{
        width: '100%',
        padding: `0 ${horizontalPadding}`,
      }}>
        <EventsCarousel />
      </div>

      {/* News Carousel */}
      <div style={{
        width: '100%',
        padding: `0 ${horizontalPadding}`,
      }}>
        <NewsCarousel />
      </div>

      {/* Auctions Carousel */}
      <div style={{
        width: '100%',
        padding: `0 ${horizontalPadding}`,
      }}>
        <AuctionsCarousel />
      </div>

    </div>
  );
}

import CarBrandsGrid from './CarBrandsGrid';
import EventsCarousel from './EventsCarousel';
import NewsCarousel from './NewsCarousel';
import AuctionsCarousel from './AuctionsCarousel';
import Footer from './Footer';
import type { Schema } from '../../amplify/data/resource';

type Make = Schema['Make']['type'];

interface HomePageProps {
  onSelectMake: (make: Make) => void;
}

export default function HomePage({ onSelectMake }: HomePageProps) {
  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Car Brands Grid */}
      <div style={{
        width: '100%',
        padding: '1rem 5rem 0 5rem',
      }}>
        <CarBrandsGrid onSelectMake={onSelectMake} />
      </div>

      {/* Events Carousel */}
      <div style={{
        width: '100%',
        padding: '0 5rem',
      }}>
        <EventsCarousel />
      </div>

      {/* News Carousel */}
      <div style={{
        width: '100%',
        padding: '0 5rem',
      }}>
        <NewsCarousel />
      </div>

      {/* Auctions Carousel */}
      <div style={{
        width: '100%',
        padding: '0 5rem',
      }}>
        <AuctionsCarousel />
      </div>

      {/* Footer - Full width */}
      <Footer />
    </div>
  );
}

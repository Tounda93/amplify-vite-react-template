import EventsCarousel from './EventsCarousel';
import NewsCarousel from './NewsCarousel';
import AuctionsCarousel from './AuctionsCarousel';
import { useIsMobile } from '../hooks/useIsMobile';
import './HomePage.css';
export default function HomePage() {
  const isMobile = useIsMobile();
  const horizontalPadding = isMobile ? '2rem' : '5rem';

  return (
    <div className="home-page" style={{ width: '100%', overflowX: 'hidden' }}>
      {/* Events Carousel */}
      <div style={{
        width: '100%',
        padding: `1rem ${horizontalPadding}`,
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
        padding: `0 ${horizontalPadding} 3rem ${horizontalPadding}`,
      }}>
        <AuctionsCarousel />
      </div>

    </div>
  );
}

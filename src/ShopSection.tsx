import { useIsMobile } from './hooks/useIsMobile';
import './ShopSection.css';

export function ShopSection() {
  const isMobile = useIsMobile();

  return (
    <div className={`section-shell shop-section${isMobile ? ' shop-section--mobile' : ''}`}>
      {/* Title Section */}
      <div className="section-title-row shop-section__title-row">
        <h2 className="section-title">Shop</h2>
      </div>

      {/* Coming Soon Message */}
      <div className="section-panel section-panel--center shop-section__panel">
        <h3 className="shop-section__panel-title">Coming Soon</h3>
        <p className="shop-section__panel-text">
          The Collectible Shop is currently under development.
          Check back soon for exclusive automotive merchandise and collectibles.
        </p>
      </div>
    </div>
  );
}

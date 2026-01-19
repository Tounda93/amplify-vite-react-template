import { AuctionsSection } from './AuctionsSection';
import './AuctionsPage.css';

export function AuctionsPage() {
  return (
    <div className="section-shell auctions-page">
      <div className="section-title-row auctions-page__title-row">
        <h2 className="section-title">Auctions</h2>
      </div>
      <AuctionsSection />
    </div>
  );
}

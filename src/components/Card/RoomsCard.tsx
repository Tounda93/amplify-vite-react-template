import './RoomsCard.css';

interface RoomsCardProps {
  title: string;
  description: string;
  memberCount: number;
}

export default function RoomsCard({ title, description, memberCount }: RoomsCardProps) {
  return (
    <div className="rooms-card">
      <div className="rooms-card__eyebrow">ROOMS</div>
      <h3 className="rooms-card__title">{title}</h3>
      <p className="rooms-card__description">{description}</p>
      <div className="rooms-card__footer">
        <span className="rooms-card__members">{memberCount} members</span>
        <button type="button" className="rooms-card__cta">
          Join room
        </button>
      </div>
    </div>
  );
}

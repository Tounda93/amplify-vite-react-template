import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Mail, Chrome, Cloud, AtSign, ChevronDown } from 'lucide-react';
import type { CalendarEventInput } from '../utils/calendar';
import { buildIcs, downloadIcs, getGoogleCalendarUrl } from '../utils/calendar';
import './AddToCalendarButton.css';

interface AddToCalendarButtonProps {
  event: CalendarEventInput;
  className?: string;
  style?: CSSProperties;
}

export default function AddToCalendarButton({ event, className, style }: AddToCalendarButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isStartValid = useMemo(() => {
    const parsed = new Date(event.startDate);
    return !Number.isNaN(parsed.getTime());
  }, [event.startDate]);

  useEffect(() => {
    if (!isStartValid) {
      console.error('Invalid event startDate for calendar integration.', event.startDate);
    }
  }, [isStartValid, event.startDate]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (eventTarget: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(eventTarget.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (eventTarget: KeyboardEvent) => {
      if (eventTarget.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleDownload = () => {
    const icsContent = buildIcs(event);
    if (!icsContent) return;
    downloadIcs(`Collectible - ${event.title}.ics`, icsContent);
  };

  const handleGoogle = () => {
    const url = getGoogleCalendarUrl(event);
    if (!url) return;
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      handleDownload();
    }
  };

  const handleSelect = (handler: () => void) => {
    handler();
    setOpen(false);
  };

  return (
    <div className={`add-to-calendar ${className || ''}`} style={style} ref={containerRef}>
      <button
        type="button"
        className="add-to-calendar__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={!isStartValid}
      >
        Add to calendar
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="add-to-calendar__menu" role="menu">
          <div className="add-to-calendar__title">Add to calendar</div>
          <button
            type="button"
            className="add-to-calendar__item"
            role="menuitem"
            onClick={() => handleSelect(handleDownload)}
          >
            <Mail size={16} />
            Outlook Calendar
          </button>
          <button
            type="button"
            className="add-to-calendar__item"
            role="menuitem"
            onClick={() => handleSelect(handleGoogle)}
          >
            <Chrome size={16} />
            Google Calendar
          </button>
          <button
            type="button"
            className="add-to-calendar__item"
            role="menuitem"
            onClick={() => handleSelect(handleDownload)}
          >
            <Cloud size={16} />
            iCloud Calendar
          </button>
          <button
            type="button"
            className="add-to-calendar__item"
            role="menuitem"
            onClick={() => handleSelect(handleDownload)}
          >
            <AtSign size={16} />
            Yahoo Calendar
          </button>
        </div>
      )}
    </div>
  );
}

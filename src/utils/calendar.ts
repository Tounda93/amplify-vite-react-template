export type CalendarEventInput = {
  title: string;
  startDate: string;
  endDate?: string | null;
  location?: string;
  description?: string | null;
  url?: string | null;
  id?: string | null;
};

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const escapeIcsText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

const toUtcStamp = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildUid = (event: CalendarEventInput, startStamp: string) => {
  if (event.id) {
    return `event-${event.id}@collectible.app`;
  }
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `event-${slug || 'event'}-${startStamp}@collectible.app`;
};

export const buildIcs = (event: CalendarEventInput): string => {
  const start = parseDate(event.startDate);
  if (!start) {
    return '';
  }

  const endCandidate = parseDate(event.endDate) || new Date(start.getTime() + TWO_HOURS_MS);
  const end = endCandidate < start ? new Date(start.getTime() + TWO_HOURS_MS) : endCandidate;

  const url = event.url?.trim();
  const descriptionParts = [event.description?.trim(), url].filter(Boolean) as string[];
  const description = descriptionParts.length > 0 ? descriptionParts.join('\n\n') : '';

  const location = event.location?.trim();
  const startStamp = toUtcStamp(start);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Collectible//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${buildUid(event, startStamp)}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DTSTART:${startStamp}`,
    `DTEND:${toUtcStamp(end)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : '',
    description ? `DESCRIPTION:${escapeIcsText(description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return `${lines.join('\r\n')}\r\n`;
};

export const downloadIcs = (filename: string, icsContent: string): void => {
  const safeName = filename.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'event.ics';
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  link.click();
  URL.revokeObjectURL(url);
};

export const getGoogleCalendarUrl = (event: CalendarEventInput): string => {
  const start = parseDate(event.startDate);
  if (!start) {
    return '';
  }
  const endCandidate = parseDate(event.endDate) || new Date(start.getTime() + TWO_HOURS_MS);
  const end = endCandidate < start ? new Date(start.getTime() + TWO_HOURS_MS) : endCandidate;

  const url = event.url?.trim();
  const descriptionParts = [event.description?.trim(), url].filter(Boolean) as string[];
  const description = descriptionParts.length > 0 ? descriptionParts.join('\n\n') : '';
  const location = event.location?.trim();

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
  });

  if (description) params.set('details', description);
  if (location) params.set('location', location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

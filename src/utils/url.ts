import { sanitizeUrl } from './sanitize';

export const openExternalUrl = (value: string) => {
  const safeUrl = sanitizeUrl(value);
  if (!safeUrl) {
    console.warn('Blocked unsafe URL', value);
    return;
  }
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
};

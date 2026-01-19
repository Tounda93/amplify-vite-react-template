const HTML_TAG_PATTERN = /<[^>]*>/g;

export const stripHtml = (value: string): string => value.replace(HTML_TAG_PATTERN, '');

export const sanitizeText = (value: string, maxLength = 240): string => {
  const trimmed = stripHtml(value || '').replace(/\s+/g, ' ').trim();
  if (!maxLength || trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trim()}...`;
};

export const sanitizeUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    const base = typeof window === 'undefined' ? 'https://example.com' : window.location.origin;
    const url = new URL(value, base);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
};

export const normalizePhoneNumber = (value: string): string => {
  const cleaned = (value || '').replace(/[^\d+]/g, '');
  return cleaned.replace(/^00/, '+');
};

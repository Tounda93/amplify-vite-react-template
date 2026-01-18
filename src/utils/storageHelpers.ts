import { getUrl } from 'aws-amplify/storage';

// Helper to check if a string is a storage path or a URL
export const isStoragePath = (str: string): boolean => {
  return str.startsWith('car-photos/')
    || str.startsWith('event-photos/')
    || str.startsWith('auction-photos/')
    || str.startsWith('hero/');
};

// Convert a storage path to a URL, or return the string if it's already a URL
export const getImageUrl = async (pathOrUrl: string | null | undefined): Promise<string | null> => {
  if (!pathOrUrl) return null;

  // If it's already a URL (legacy data or external URL), use it directly
  if (!isStoragePath(pathOrUrl)) {
    return pathOrUrl;
  }

  // Otherwise, get the URL from the storage path
  try {
    const result = await getUrl({ path: pathOrUrl });
    return result.url.toString();
  } catch (error) {
    console.error('Error getting URL for path:', pathOrUrl, error);
    return null;
  }
};

// Convert multiple storage paths to URLs
export const getImageUrls = async (pathsOrUrls: (string | null)[]): Promise<string[]> => {
  const urls: string[] = [];

  for (const pathOrUrl of pathsOrUrls) {
    const url = await getImageUrl(pathOrUrl);
    if (url) {
      urls.push(url);
    }
  }

  return urls;
};

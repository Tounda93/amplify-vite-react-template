import { sanitizeText, sanitizeUrl } from './sanitize';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
  source: string;
}

export const RSS_FEEDS = [
  { name: 'Top Gear', url: 'https://www.topgear.com/car-news/rss' },
  { name: 'Classic Driver', url: 'https://www.classicdriver.com/en/rss.xml' },
  { name: 'Motor1', url: 'https://www.motor1.com/rss/news/all/' },
  { name: 'Car and Driver', url: 'https://www.caranddriver.com/rss/all.xml/' },
];

const RSS_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

export async function fetchNewsFeedItems(): Promise<NewsItem[]> {
  const aggregated: NewsItem[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(`${RSS_API}${encodeURIComponent(feed.url)}`);
      const data = await response.json();

      if (data.status === 'ok' && Array.isArray(data.items)) {
        const items = data.items
          .map((item: { title?: string; link?: string; pubDate?: string; description?: string; thumbnail?: string; enclosure?: { link?: string } }): NewsItem | null => {
            const safeLink = sanitizeUrl(item.link);
            if (!safeLink) {
              return null;
            }
            return {
              title: sanitizeText(item.title || 'Untitled'),
              link: safeLink,
              pubDate: item.pubDate || new Date().toISOString(),
              description: sanitizeText(item.description || '', 200),
              thumbnail: sanitizeUrl(item.thumbnail || item.enclosure?.link) || undefined,
              source: feed.name,
            };
          })
          .filter((item: NewsItem | null): item is NewsItem => Boolean(item));
        aggregated.push(...items);
      }
    } catch (error) {
      console.error(`Error fetching RSS feed for ${feed.name}`, error);
    }
  }

  aggregated.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return aggregated;
}

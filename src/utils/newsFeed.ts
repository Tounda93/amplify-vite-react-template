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

      if (data.status === 'ok' && data.items) {
        const items = data.items.map((item: { title: string; link: string; pubDate: string; description?: string; thumbnail?: string; enclosure?: { link?: string } }) => ({
          title: item.title as string,
          link: item.link as string,
          pubDate: item.pubDate as string,
          description: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
          thumbnail: item.thumbnail || item.enclosure?.link,
          source: feed.name,
        }));
        aggregated.push(...items);
      }
    } catch (error) {
      console.error(`Error fetching RSS feed for ${feed.name}`, error);
    }
  }

  aggregated.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return aggregated;
}

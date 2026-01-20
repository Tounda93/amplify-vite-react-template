import type { NewsItem } from './newsFeed';

export const FALLBACKS = {
  event: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
  auction: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
  auctionCarousel: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
  news: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
  newsCarousel: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80',
  car: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80',
  carDetail: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
  profileCover: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200&q=80',
};

export const FALLBACK_NEWS_ITEMS: NewsItem[] = [
  {
    title: 'Collectible Highlights: Curated automotive stories',
    link: 'https://collectible.example.com',
    pubDate: new Date().toISOString(),
    description: 'Explore curated car culture news and community stories.',
    thumbnail: FALLBACKS.newsCarousel,
    source: 'Collectible',
  },
  {
    title: 'Market Watch: Rising classics to keep on your radar',
    link: 'https://collectible.example.com',
    pubDate: new Date().toISOString(),
    description: 'Stay ahead of the curve with notable auctions and sales.',
    thumbnail: FALLBACKS.newsCarousel,
    source: 'Collectible',
  },
  {
    title: 'Garage Picks: Weekend drives and club meets',
    link: 'https://collectible.example.com',
    pubDate: new Date().toISOString(),
    description: 'Find fresh inspiration for your next drive.',
    thumbnail: FALLBACKS.newsCarousel,
    source: 'Collectible',
  },
];

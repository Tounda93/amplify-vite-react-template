import { useEffect, useState } from 'react';
import { fetchNewsFeedItems, type NewsItem } from '../utils/newsFeed';
import { FALLBACK_NEWS_ITEMS } from '../utils/fallbacks';

interface UseFetchNewsOptions {
  limit?: number;
  fallback?: NewsItem[];
}

export const useFetchNews = ({ limit, fallback }: UseFetchNewsOptions = {}) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    const loadNews = async () => {
      setLoading(true);
      try {
        const news = await fetchNewsFeedItems();
        const next = limit ? news.slice(0, limit) : news;
        if (active) {
          setItems(next.length > 0 ? next : (fallback || FALLBACK_NEWS_ITEMS));
          setError(null);
        }
      } catch (err) {
        if (active) {
          setItems(fallback || FALLBACK_NEWS_ITEMS);
          setError(err as Error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadNews();
    return () => {
      active = false;
    };
  }, [limit, fallback, refreshIndex]);

  const refresh = () => setRefreshIndex((value) => value + 1);

  return { items, loading, error, refresh };
};

import { useCallback, useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { fetchNewsFeedItems } from '../utils/newsFeed';
import { getImageUrl } from '../utils/storageHelpers';
import { FALLBACKS } from '../utils/fallbacks';

const client = generateClient<Schema>();

type Car = Schema['Car']['type'];
type Make = Schema['Make']['type'];
type Model = Schema['Model']['type'];
type Event = Schema['Event']['type'];
type EventWithImageUrl = Event & { imageUrl?: string };
type CarWithImageUrl = Car & { imageUrl?: string; makeName?: string; modelName?: string };
export type HomeFeedItem =
  | { type: 'event'; data: EventWithImageUrl }
  | { type: 'news'; data: Awaited<ReturnType<typeof fetchNewsFeedItems>>[number] }
  | { type: 'car'; data: CarWithImageUrl };

export const useHomeFeed = () => {
  const [feedItems, setFeedItems] = useState<HomeFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerPhone, setSellerPhone] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const news = await fetchNewsFeedItems();

      const { data: events } = await client.models.Event.list({ limit: 20 });
      const publishedEvents = (events || [])
        .filter((event) => event.isPublished !== false && event.startDate)
        .sort((a, b) => {
          const aVisibility = a.visibility === 'members' ? 1 : 0;
          const bVisibility = b.visibility === 'members' ? 1 : 0;
          if (aVisibility !== bVisibility) {
            return aVisibility - bVisibility;
          }
          return new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime();
        })
        .slice(0, 7);

      const eventsWithUrls: EventWithImageUrl[] = await Promise.all(
        publishedEvents.map(async (event) => {
          const imageUrl = await getImageUrl(event.coverImage);
          return { ...event, imageUrl: imageUrl || FALLBACKS.event };
        })
      );

      const [{ data: cars }, { data: makes }, { data: models }, { data: profiles }] = await Promise.all([
        client.models.Car.list({
          limit: 12,
          filter: { saleStatus: { eq: 'for_sale' } },
        }),
        client.models.Make.list({ limit: 500 }),
        client.models.Model.list({ limit: 1000 }),
        client.models.Profile.list({ limit: 1 }),
      ]);

      const makesMap = new Map<string, string>();
      const modelsMap = new Map<string, string>();
      (makes || []).forEach((make: Make) => {
        makesMap.set(make.makeId, make.makeName);
      });
      (models || []).forEach((model: Model) => {
        modelsMap.set(model.modelId, model.modelName);
      });

      const carsWithUrls: CarWithImageUrl[] = await Promise.all(
        (cars || []).map(async (car) => {
          const photo = car.photos?.[0];
          const imageUrl = await getImageUrl(photo);
          return {
            ...car,
            imageUrl: imageUrl || FALLBACKS.car,
            makeName: makesMap.get(car.makeId) || car.makeId,
            modelName: modelsMap.get(car.modelId) || car.modelId,
          };
        })
      );

      const combinedFeed: HomeFeedItem[] = [];
      const maxItems = Math.max(news.length, carsWithUrls.length, eventsWithUrls.length);

      for (let i = 0; i < maxItems; i += 1) {
        if (i < eventsWithUrls.length) {
          combinedFeed.push({ type: 'event', data: eventsWithUrls[i] });
        }
        if (i < news.length) {
          combinedFeed.push({ type: 'news', data: news[i] });
        }
        if (i < carsWithUrls.length) {
          combinedFeed.push({ type: 'car', data: carsWithUrls[i] });
        }
      }

      setFeedItems(combinedFeed);
      setSellerPhone(profiles?.[0]?.phoneNumber || null);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return { feedItems, loading, sellerPhone, reload: loadFeed };
};

export type SearchCategory = 'news' | 'events' | 'auctions' | 'rooms' | 'users';

export interface SearchResultItem {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  data?: Record<string, unknown>;
}

export type SearchResultGroups = Record<SearchCategory, SearchResultItem[]>;

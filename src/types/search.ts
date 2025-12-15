export type SearchCategory = 'wikicars' | 'news' | 'events' | 'auctions' | 'community';

export interface SearchResultItem {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  data?: any;
}

export type SearchResultGroups = Record<SearchCategory, SearchResultItem[]>;

import { createContext, useContext } from 'react';
import type { SearchResultGroups, SearchResultItem } from '../types/search';

interface AppUIContextValue {
  activeSection: string;
  setActiveSection: (section: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchResults: SearchResultGroups;
  searchLoading: boolean;
  onSearchResultSelect: (result: SearchResultItem, options?: { clearInput?: boolean }) => void;
}

const AppUIContext = createContext<AppUIContextValue | null>(null);

export const AppUIProvider = AppUIContext.Provider;

export const useAppUI = () => {
  const context = useContext(AppUIContext);
  if (!context) {
    throw new Error('useAppUI must be used within AppUIProvider');
  }
  return context;
};

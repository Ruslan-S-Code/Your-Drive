import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SearchData {
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  dropoffLocation: string;
  dropoffDate: string;
  dropoffTime: string;
  differentReturnLocation: boolean;
}

interface SearchContextType {
  searchData: SearchData;
  updateSearchData: (data: Partial<SearchData>) => void;
  resetSearchData: () => void;
}

const defaultSearchData: SearchData = {
  pickupLocation: '',
  pickupDate: '',
  pickupTime: '',
  dropoffLocation: '',
  dropoffDate: '',
  dropoffTime: '',
  differentReturnLocation: false,
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchData, setSearchData] = useState<SearchData>(() => {
    // Загружаем данные из localStorage при инициализации
    const saved = localStorage.getItem('searchData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSearchData, ...parsed };
      } catch {
        return defaultSearchData;
      }
    }
    return defaultSearchData;
  });

  // Сохраняем данные в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('searchData', JSON.stringify(searchData));
  }, [searchData]);

  const updateSearchData = (data: Partial<SearchData>) => {
    setSearchData((prev) => {
      const newData = { ...prev, ...data };
      
      // Если differentReturnLocation = false, синхронизируем dropoff с pickup
      const shouldSync = data.differentReturnLocation === false || (!data.differentReturnLocation && !newData.differentReturnLocation);
      
      if (shouldSync) {
        // Если изменяется pickupLocation, копируем в dropoffLocation
        if (data.pickupLocation !== undefined) {
          newData.dropoffLocation = data.pickupLocation;
        }
        // Если изменяется pickupDate, копируем в dropoffDate
        if (data.pickupDate !== undefined) {
          newData.dropoffDate = data.pickupDate;
        }
        // Если изменяется pickupTime, копируем в dropoffTime
        if (data.pickupTime !== undefined) {
          newData.dropoffTime = data.pickupTime;
        }
      }
      
      return newData;
    });
  };

  const resetSearchData = () => {
    setSearchData(defaultSearchData);
    localStorage.removeItem('searchData');
  };

  return (
    <SearchContext.Provider
      value={{
        searchData,
        updateSearchData,
        resetSearchData,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

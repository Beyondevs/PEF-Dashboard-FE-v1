import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { FilterState } from '@/types';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
}

const FILTER_STORAGE_KEY = 'pef_dashboard_filters';

const defaultFilters: FilterState = {};

// Load filters from localStorage
const loadFiltersFromStorage = (): FilterState => {
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load filters from storage:', error);
  }
  return defaultFilters;
};

// Save filters to localStorage
const saveFiltersToStorage = (filters: FilterState) => {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filters to storage:', error);
  }
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<FilterState>(() => loadFiltersFromStorage());

  // Wrapper to save to localStorage whenever filters change
  const setFilters: React.Dispatch<React.SetStateAction<FilterState>> = (value) => {
    setFiltersState((prev) => {
      const newFilters = typeof value === 'function' ? value(prev) : value;
      saveFiltersToStorage(newFilters);
      return newFilters;
    });
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
    saveFiltersToStorage(defaultFilters);
  };

  // Load from storage on mount
  useEffect(() => {
    const storedFilters = loadFiltersFromStorage();
    if (Object.keys(storedFilters).length > 0) {
      setFiltersState(storedFilters);
    }
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

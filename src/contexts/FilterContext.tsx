import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FilterState } from '@/types';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
}

const FILTER_STORAGE_KEY = 'pef_dashboard_filters';

const getTodayISO = () => new Date().toISOString().split('T')[0];

const defaultFilters: FilterState = {
  startDate: getTodayISO(),
  endDate: getTodayISO(),
};

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
  const [filters, setFiltersState] = useState<FilterState>(() => {
    const stored = loadFiltersFromStorage();
    // Ensure dates are always set (either from storage or default to today)
    return {
      ...defaultFilters,
      ...stored,
      startDate: stored.startDate || getTodayISO(),
      endDate: stored.endDate || getTodayISO(),
    };
  });

  // Wrapper to save to localStorage whenever filters change
  const setFilters: React.Dispatch<React.SetStateAction<FilterState>> = (value) => {
    setFiltersState((prev) => {
      const newFilters = typeof value === 'function' ? value(prev) : value;
      saveFiltersToStorage(newFilters);
      return newFilters;
    });
  };

  const resetFilters = () => {
    const resetToDefaults: FilterState = {
      startDate: getTodayISO(),
      endDate: getTodayISO(),
    };
    setFiltersState(resetToDefaults);
    saveFiltersToStorage(resetToDefaults);
  };

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

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FilterState } from '@/types';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  dateRange: {
    from: new Date('2024-01-01'),
    to: new Date('2026-12-31'),
  },
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const resetFilters = () => {
    setFilters(defaultFilters);
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

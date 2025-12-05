import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FilterState } from '@/types';
import { useAuth } from './AuthContext';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  isDivisionLocked: boolean;
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
  const { role, divisionId, isLoading: authLoading } = useAuth();
  const isDivisionRole = role === 'division_role';
  const isDivisionLocked = isDivisionRole && !!divisionId;
  
  const [filters, setFiltersState] = useState<FilterState>(() => {
    const stored = loadFiltersFromStorage();
    // For division_role users, ensure division is set from auth context or localStorage if available
    const initialFilters = {
      ...defaultFilters,
      ...stored,
      startDate: stored.startDate || getTodayISO(),
      endDate: stored.endDate || getTodayISO(),
    };
    
    // Check localStorage for divisionId (for division_role users)
    // This ensures division is set even before auth context fully loads
    try {
      const storedDivisionId = localStorage.getItem('pef.divisionId');
      const storedRole = localStorage.getItem('pef.userRole');
      if (storedRole === 'division_role' && storedDivisionId && !initialFilters.division) {
        initialFilters.division = storedDivisionId;
      }
    } catch (error) {
      // Ignore localStorage errors
    }
    
    return initialFilters;
  });

  // Auto-apply division filter for division_role users
  useEffect(() => {
    if (!authLoading && isDivisionRole && divisionId) {
      setFiltersState(prev => {
        // Only update if division is different or not set
        if (prev.division !== divisionId) {
          const newFilters = {
            ...prev,
            division: divisionId,
            // Reset child filters when division changes
            district: undefined,
            tehsil: undefined,
            school: undefined,
            sessionId: undefined,
          };
          saveFiltersToStorage(newFilters);
          return newFilters;
        }
        return prev;
      });
    }
  }, [authLoading, isDivisionRole, divisionId]);

  // Wrapper to save to localStorage whenever filters change
  // For division_role users, prevent changing the division filter
  const setFilters: React.Dispatch<React.SetStateAction<FilterState>> = (value) => {
    setFiltersState((prev) => {
      const newFilters = typeof value === 'function' ? value(prev) : value;
      
      // For division_role users, always keep their division locked
      if (isDivisionRole && divisionId) {
        newFilters.division = divisionId;
      }
      
      saveFiltersToStorage(newFilters);
      return newFilters;
    });
  };

  const resetFilters = () => {
    const resetToDefaults: FilterState = {
      startDate: getTodayISO(),
      endDate: getTodayISO(),
      // For division_role users, keep division locked even on reset
      ...(isDivisionRole && divisionId ? { division: divisionId } : {}),
    };
    setFiltersState(resetToDefaults);
    saveFiltersToStorage(resetToDefaults);
  };

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters, isDivisionLocked }}>
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FilterState, UserRole } from '@/types';
import { useAuth } from './AuthContext';

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  isDivisionLocked: boolean;
}

// Generate role-specific storage key to isolate filters between different user roles
const getFilterStorageKey = (role: UserRole | null): string => {
  if (!role) return 'pef_dashboard_filters_guest';
  return `pef_dashboard_filters_${role}`;
};

// Clear all filter storage keys (called on logout)
export const clearAllFilterStorage = () => {
  const roles: (UserRole | 'guest')[] = ['admin', 'client', 'trainer', 'teacher', 'student', 'division_role', 'guest'];
  roles.forEach(role => {
    try {
      localStorage.removeItem(`pef_dashboard_filters_${role}`);
    } catch (error) {
      console.error(`Failed to clear filters for role ${role}:`, error);
    }
  });
};

const defaultFilters: FilterState = {
};

// Load filters from localStorage for specific role
const loadFiltersFromStorage = (role: UserRole | null): FilterState => {
  try {
    const storageKey = getFilterStorageKey(role);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load filters from storage:', error);
  }
  return defaultFilters;
};

// Save filters to localStorage for specific role
const saveFiltersToStorage = (filters: FilterState, role: UserRole | null) => {
  try {
    const storageKey = getFilterStorageKey(role);
    localStorage.setItem(storageKey, JSON.stringify(filters));
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
    const stored = loadFiltersFromStorage(role);
    // For division_role users, ensure division is set from auth context or localStorage if available
      const initialFilters = {
        ...defaultFilters,
        ...stored,
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

  // Reset filters when role changes to ensure isolation between different user roles
  useEffect(() => {
    if (!authLoading && role) {
      setFiltersState(() => {
        const stored = loadFiltersFromStorage(role);
        const initialFilters = {
          ...defaultFilters,
          ...stored,
        };
        
        // For division_role users, ensure division is set
        if (isDivisionRole && divisionId && !initialFilters.division) {
          initialFilters.division = divisionId;
        }
        
        return initialFilters;
      });
    }
  }, [role, authLoading]); // Only trigger when role changes

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
          saveFiltersToStorage(newFilters, role);
          return newFilters;
        }
        return prev;
      });
    }
  }, [authLoading, isDivisionRole, divisionId, role]);

  // Wrapper to save to localStorage whenever filters change
  // For division_role users, prevent changing the division filter
  const setFilters: React.Dispatch<React.SetStateAction<FilterState>> = (value) => {
    setFiltersState((prev) => {
      const newFilters = typeof value === 'function' ? value(prev) : value;
      
      // For division_role users, always keep their division locked
      if (isDivisionRole && divisionId) {
        newFilters.division = divisionId;
      }
      
      saveFiltersToStorage(newFilters, role);
      return newFilters;
    });
  };

  const resetFilters = () => {
    const resetToDefaults: FilterState = {
      // For division_role users, keep division locked even on reset
      ...(isDivisionRole && divisionId ? { division: divisionId } : {}),
    };
    setFiltersState(resetToDefaults);
    saveFiltersToStorage(resetToDefaults, role);
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

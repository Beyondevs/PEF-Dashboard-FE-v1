# Filter System - Developer Guide

## Overview

The PEF Dashboard uses a role-based filter isolation system where each user role maintains independent filter state in localStorage.

## Quick Reference

### Storage Keys

```typescript
// Format: pef_dashboard_filters_{role}
pef_dashboard_filters_client
pef_dashboard_filters_admin
pef_dashboard_filters_division_role
pef_dashboard_filters_trainer
pef_dashboard_filters_teacher
pef_dashboard_filters_student
pef_dashboard_filters_guest
```

### Key Files

| File | Purpose |
|------|---------|
| `src/contexts/FilterContext.tsx` | Filter state management and localStorage operations |
| `src/contexts/AuthContext.tsx` | Authentication and logout (clears filters) |
| `src/types/index.ts` | Type definitions for filters and roles |

## Using Filters in Components

### Basic Usage

```typescript
import { useFilters } from '@/contexts/FilterContext';

function MyComponent() {
  const { filters, setFilters, resetFilters, isDivisionLocked } = useFilters();
  
  // Read filter values
  const division = filters.division;
  const district = filters.district;
  
  // Update filters
  const handleDivisionChange = (newDivision: string) => {
    setFilters(prev => ({
      ...prev,
      division: newDivision,
      // Reset dependent filters
      district: undefined,
      tehsil: undefined,
      school: undefined
    }));
  };
  
  // Reset all filters
  const handleReset = () => {
    resetFilters();
  };
  
  return (
    <div>
      <p>Current Division: {division}</p>
      <button onClick={handleReset}>Reset Filters</button>
    </div>
  );
}
```

### Filter State Type

```typescript
interface FilterState {
  division?: string;
  district?: string;
  tehsil?: string;
  school?: string;
  sessionId?: string;
  startDate?: string;  // ISO format: YYYY-MM-DD
  endDate?: string;    // ISO format: YYYY-MM-DD
}
```

## Adding New Filter Fields

### Step 1: Update Type Definition

```typescript
// src/types/index.ts
export interface FilterState {
  // ... existing fields ...
  newField?: string;  // Add your new field
}
```

### Step 2: Use in Components

```typescript
const { filters, setFilters } = useFilters();

// Set the new field
setFilters(prev => ({
  ...prev,
  newField: 'some value'
}));

// Read the new field
const value = filters.newField;
```

### Step 3: Reset Logic (Optional)

If your new field depends on other filters:

```typescript
// When parent filter changes, reset dependent fields
setFilters(prev => ({
  ...prev,
  division: newDivision,
  // Reset child filters
  district: undefined,
  tehsil: undefined,
  school: undefined,
  newField: undefined  // Reset your new field if needed
}));
```

## Working with Role-Specific Filters

### Division Role (Special Case)

Division role users have their division filter auto-applied and locked:

```typescript
const { filters, isDivisionLocked } = useFilters();

// Check if division is locked
if (isDivisionLocked) {
  // Show read-only division selector
  // Division value comes from auth context
}

// The division filter is automatically:
// 1. Set from user's profile
// 2. Locked (cannot be changed)
// 3. Persisted even on reset
```

### Role Detection

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { role, isAdmin, isDivisionRole, canEdit } = useAuth();
  
  if (isAdmin()) {
    // Show admin-specific UI
  }
  
  if (isDivisionRole()) {
    // Handle division role specific logic
  }
  
  return <div>Role: {role}</div>;
}
```

## Filter Persistence

### How It Works

```
1. User changes filter → setFilters() called
2. FilterContext updates state
3. New state saved to localStorage with role-specific key
4. On page refresh → Filters loaded from localStorage
5. On logout → All filter keys cleared
6. On next login → Fresh/empty filters
```

### Manual Storage Operations

```typescript
// Get storage key for current role (internal function)
const getFilterStorageKey = (role: UserRole | null): string => {
  if (!role) return 'pef_dashboard_filters_guest';
  return `pef_dashboard_filters_${role}`;
};

// Clear all filter storage (exported from FilterContext)
import { clearAllFilterStorage } from '@/contexts/FilterContext';

clearAllFilterStorage(); // Clears all role-specific filter keys
```

## Common Patterns

### Pattern 1: Cascading Filters

When a parent filter changes, reset child filters:

```typescript
const handleDivisionChange = (newDivision: string) => {
  setFilters(prev => ({
    ...prev,
    division: newDivision,
    district: undefined,  // Clear child
    tehsil: undefined,    // Clear grandchild
    school: undefined     // Clear great-grandchild
  }));
};
```

### Pattern 2: Conditional Reset

Reset only specific filters:

```typescript
const handleConditionalReset = () => {
  setFilters(prev => ({
    ...prev,
    district: undefined,
    tehsil: undefined,
    school: undefined,
    // Keep division and dates
  }));
};
```

### Pattern 3: Complete Reset

```typescript
const { resetFilters } = useFilters();

// Resets to default state
// For division role: keeps division locked
// For others: clears everything
resetFilters();
```

### Pattern 4: Bulk Update

```typescript
const applyPresetFilters = () => {
  setFilters({
    division: 'Division A',
    district: 'District 1',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });
};
```

## API Integration

### Sending Filters to Backend

```typescript
import { useFilters } from '@/contexts/FilterContext';

function fetchData() {
  const { filters } = useFilters();
  
  // Convert filters to query params
  const params = new URLSearchParams();
  
  if (filters.division) params.append('division', filters.division);
  if (filters.district) params.append('district', filters.district);
  if (filters.startDate) params.append('startDate', filters.startDate);
  // ... add other filters
  
  // Make API call
  fetch(`/api/data?${params.toString()}`);
}
```

### Filter Validation

```typescript
const isValidFilterState = (filters: FilterState): boolean => {
  // Check if required filters are present
  if (!filters.division) return false;
  
  // Validate date range
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    if (start > end) return false;
  }
  
  return true;
};
```

## Debugging

### View Current Filter State

```typescript
// In component
const { filters } = useFilters();
console.log('Current filters:', filters);

// In browser DevTools
// Application → Local Storage → your-domain
// Look for keys: pef_dashboard_filters_{role}
```

### Common Issues

#### Issue 1: Filters Not Persisting

```typescript
// ❌ Wrong: Direct state mutation
filters.division = 'new value';

// ✅ Correct: Use setFilters
setFilters(prev => ({ ...prev, division: 'new value' }));
```

#### Issue 2: Filters From Previous Role

```typescript
// This is fixed by the role-specific storage keys
// If you see old filters, check:
// 1. Is logout calling clearAllFilterStorage()?
// 2. Is the role prop being passed correctly?
// 3. Check browser localStorage for stale keys
```

#### Issue 3: Division Role Can't Change Division

```typescript
// This is by design! Division role users have locked division
const { isDivisionLocked } = useFilters();

if (isDivisionLocked) {
  // Don't allow division change
  // Show read-only UI
}
```

## Testing

### Unit Testing Filters

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFilters } from '@/contexts/FilterContext';

test('should update filters', () => {
  const { result } = renderHook(() => useFilters());
  
  act(() => {
    result.current.setFilters({ division: 'Test Division' });
  });
  
  expect(result.current.filters.division).toBe('Test Division');
});
```

### Integration Testing

1. Login as different roles
2. Apply filters
3. Logout
4. Login as different role
5. Verify filters are independent

## Performance Considerations

### Optimization Tips

1. **Avoid Unnecessary Renders**
   ```typescript
   // Use specific filter values instead of entire state
   const division = filters.division; // Good
   // vs watching entire filters object
   ```

2. **Debounce Filter Changes**
   ```typescript
   import { useMemo } from 'react';
   import debounce from 'lodash/debounce';
   
   const debouncedSetFilters = useMemo(
     () => debounce(setFilters, 300),
     []
   );
   ```

3. **Memoize Filter Computations**
   ```typescript
   const filteredData = useMemo(() => {
     return data.filter(item => {
       if (filters.division && item.division !== filters.division) return false;
       if (filters.district && item.district !== filters.district) return false;
       return true;
     });
   }, [data, filters.division, filters.district]);
   ```

## Security Considerations

1. **Never Store Sensitive Data in Filters**
   - Filters are stored in localStorage (client-side)
   - Don't include passwords, tokens, or PII

2. **Validate on Backend**
   - Always validate filter parameters on the backend
   - Don't trust client-side filter values

3. **Sanitize User Input**
   - If filters include user-entered text, sanitize it
   - Prevent XSS attacks

## Best Practices

1. ✅ Always use `setFilters` to update state
2. ✅ Reset dependent filters when parent changes
3. ✅ Use TypeScript types for type safety
4. ✅ Test filter isolation between roles
5. ✅ Document custom filter behavior
6. ❌ Don't directly mutate filter state
7. ❌ Don't store complex objects in filters
8. ❌ Don't bypass the FilterContext for storage

## Future Enhancements

Potential improvements to consider:

1. **Filter Presets**
   ```typescript
   const presets = {
     'Last Month': { startDate: '...', endDate: '...' },
     'This Quarter': { startDate: '...', endDate: '...' }
   };
   ```

2. **Filter History**
   - Track filter change history
   - Allow undo/redo

3. **Shared Filters**
   - Allow sharing filter configurations via URL
   - Export/import filter settings

4. **Filter Templates**
   - Save custom filter combinations
   - Quick apply saved filters

## Getting Help

- Check `FILTER_ISOLATION_FIX.md` for implementation details
- See `TESTING_GUIDE.md` for testing scenarios
- Review `FILTER_FIX_SUMMARY.md` for overview

---

**Last Updated:** December 17, 2025
**Version:** 2.0 (with role-based isolation)


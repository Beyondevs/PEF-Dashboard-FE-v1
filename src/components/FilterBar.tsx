import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useFilters } from '@/contexts/FilterContext';
import { divisions, districts, tehsils, schools } from '@/lib/mockData';

export const FilterBar = () => {
  const { filters, setFilters, resetFilters } = useFilters();

  const filteredDistricts = filters.division
    ? districts.filter(d => d.divisionId === filters.division)
    : districts;

  const filteredTehsils = filters.district
    ? tehsils.filter(t => t.districtId === filters.district)
    : tehsils;

  const filteredSchools = filters.tehsil
    ? schools.filter(s => s.tehsilId === filters.tehsil)
    : filters.district
    ? schools.filter(s => s.districtId === filters.district)
    : schools;

  return (
    <div className="bg-card border-b p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm font-medium text-foreground">Filters:</div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Province:</span>
          <div className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium">Punjab</div>
        </div>

        <Select
          value={filters.division}
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            division: value,
            district: undefined,
            tehsil: undefined,
            school: undefined,
          }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent>
            {divisions.map(div => (
              <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.district}
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            district: value,
            tehsil: undefined,
            school: undefined,
          }))}
          disabled={!filters.division}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            {filteredDistricts.map(dist => (
              <SelectItem key={dist.id} value={dist.id}>{dist.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.tehsil}
          onValueChange={(value) => setFilters(prev => ({ 
            ...prev, 
            tehsil: value,
            school: undefined,
          }))}
          disabled={!filters.district}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tehsil" />
          </SelectTrigger>
          <SelectContent>
            {filteredTehsils.map(teh => (
              <SelectItem key={teh.id} value={teh.id}>{teh.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.school}
          onValueChange={(value) => setFilters(prev => ({ ...prev, school: value }))}
          disabled={!filters.tehsil && !filters.district}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="School" />
          </SelectTrigger>
          <SelectContent>
            {filteredSchools.slice(0, 50).map(school => (
              <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange.from && filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, 'PP')} - {format(filters.dateRange.to, 'PP')}
                </>
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { from: range.from, to: range.to } 
                  }));
                }
              }}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

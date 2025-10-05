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
    <div className="bg-card border-b p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <div className="text-xs md:text-sm font-medium text-foreground shrink-0">Filters:</div>
        
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs md:text-sm text-muted-foreground">Province:</span>
          <div className="px-2 md:px-3 py-1 md:py-1.5 bg-muted rounded-md text-xs md:text-sm font-medium">Punjab</div>
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
          <SelectTrigger className="w-[140px] md:w-[180px] text-xs md:text-sm">
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent className="z-50">
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
          <SelectTrigger className="w-[140px] md:w-[180px] text-xs md:text-sm">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent className="z-50">
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
          <SelectTrigger className="w-[140px] md:w-[180px] text-xs md:text-sm">
            <SelectValue placeholder="Tehsil" />
          </SelectTrigger>
          <SelectContent className="z-50">
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
          <SelectTrigger className="w-[180px] md:w-[250px] text-xs md:text-sm">
            <SelectValue placeholder="School" />
          </SelectTrigger>
          <SelectContent className="z-50">
            {filteredSchools.slice(0, 50).map(school => (
              <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[180px] md:w-[240px] justify-start text-left font-normal text-xs md:text-sm")}>
              <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
              {filters.dateRange.from && filters.dateRange.to ? (
                <>
                  <span className="hidden md:inline">
                    {format(filters.dateRange.from, 'PP')} - {format(filters.dateRange.to, 'PP')}
                  </span>
                  <span className="md:hidden">
                    {format(filters.dateRange.from, 'P')} - {format(filters.dateRange.to, 'P')}
                  </span>
                </>
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
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

        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs md:text-sm shrink-0">
          <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Reset Filters</span>
          <span className="sm:hidden">Reset</span>
        </Button>
      </div>
    </div>
  );
};

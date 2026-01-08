import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { RotateCcw } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSessions, getDivisions, getDistricts, getTehsils, getSchools } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/date';
import { useState, useEffect } from 'react';
import type { Session, Division, District, Tehsil, School } from '@/types';
import { useLocation } from 'react-router-dom';

export const FilterBar = () => {
  const { filters, setFilters, resetFilters, isDivisionLocked } = useFilters();
  const { role, divisionName } = useAuth();
  const location = useLocation();
  const isTrainer = role === 'trainer';
  const isClient = role === 'client';
  const isDivisionRole = role === 'division_role';
  const disableDateFilters =
    location.pathname === '/speaking-assessments' || location.pathname === '/speaking-assessments/';

  // Helper functions for date parsing
  const parseISODate = (value?: string) => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return undefined;
    return new Date(year, month - 1, day);
  };

  const getTodayISO = () => format(new Date(), 'yyyy-MM-dd');

  const formatDateToISO = (date: Date | undefined) => (date ? format(date, 'yyyy-MM-dd') : undefined);
  
  // State for geography data
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [tehsils, setTehsils] = useState<Tehsil[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Loading states
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingTehsils, setIsLoadingTehsils] = useState(false);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Fetch divisions on mount
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setIsLoadingDivisions(true);
        const response = await getDivisions();
        setDivisions(response.data || []);
      } catch (error) {
        console.error('Failed to fetch divisions:', error);
        setDivisions([]);
      } finally {
        setIsLoadingDivisions(false);
      }
    };

    fetchDivisions();
  }, []);

  // On Speaking Assessments page, date filters should be disabled for all roles.
  // Also clear any persisted start/end dates so the page cannot be silently filtered.
  useEffect(() => {
    if (!disableDateFilters) return;
    if (!filters.startDate && !filters.endDate) return;
    setFilters((prev) => ({ ...prev, startDate: undefined, endDate: undefined }));
  }, [disableDateFilters, filters.startDate, filters.endDate, setFilters]);

  // Fetch districts when division changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!filters.division) {
        setDistricts([]);
        return;
      }

      try {
        setIsLoadingDistricts(true);
        const response = await getDistricts(filters.division);
        setDistricts(response.data || []);
      } catch (error) {
        console.error('Failed to fetch districts:', error);
        setDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [filters.division]);

  // Fetch tehsils when district changes
  useEffect(() => {
    const fetchTehsils = async () => {
      if (!filters.district) {
        setTehsils([]);
        return;
      }

      try {
        setIsLoadingTehsils(true);
        const response = await getTehsils(filters.district);
        setTehsils(response.data || []);
      } catch (error) {
        console.error('Failed to fetch tehsils:', error);
        setTehsils([]);
      } finally {
        setIsLoadingTehsils(false);
      }
    };

    fetchTehsils();
  }, [filters.district]);

  // Fetch schools when tehsil or district changes
  useEffect(() => {
    const fetchSchools = async () => {
      if (!filters.tehsil && !filters.district) {
        setSchools([]);
        return;
      }

      try {
        setIsLoadingSchools(true);
        const params: Record<string, string | number> = {
          page: 1,
          pageSize: 1000, // Get many schools for dropdown
        };

        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.tehsil) params.tehsilId = filters.tehsil;

        const response = await getSchools(params);
        setSchools(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        setSchools([]);
      } finally {
        setIsLoadingSchools(false);
      }
    };

    fetchSchools();
  }, [filters.division, filters.district, filters.tehsil]);

  // Fetch sessions based on current filters
  useEffect(() => {
    const fetchSessions = async () => {
      if (!isTrainer && !filters.school) {
        setSessions([]);
        setIsLoadingSessions(false);
        return;
      }

      try {
        setIsLoadingSessions(true);
        const params: Record<string, string | number> = {
          page: 1,
          pageSize: 1000, // Get many sessions to populate dropdown
        };

        // For trainers, skip geography filters (backend automatically filters by trainerId)
        if (!isTrainer) {
        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.tehsil) params.tehsilId = filters.tehsil;
        if (filters.school) params.schoolId = filters.school;
        } else {
          // For trainers, show sessions from 1 Oct 2025 to current date
          const current = new Date();
          const fromDate = new Date('2025-10-01T00:00:00.000Z');
          const toDate = new Date(
            current.getFullYear(),
            current.getMonth(),
            current.getDate(),
            23,
            59,
            59,
            999
          );
          params.from = fromDate.toISOString();
          params.to = toDate.toISOString();
        }

        const response = await getSessions(params);
        setSessions(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        setSessions([]);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [isTrainer, filters.division, filters.district, filters.tehsil, filters.school]);

  

  return (
    <div className="bg-card border-b p-2 sm:p-3 md:p-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3">
        <div className="text-xs sm:text-sm font-medium text-foreground shrink-0 w-full sm:w-auto">Filters:</div>
        
        {!isTrainer && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs md:text-sm text-muted-foreground">Province:</span>
          <div className="px-2 md:px-3 py-1 md:py-1.5 bg-muted rounded-md text-xs md:text-sm font-medium">Punjab</div>
        </div>
        )}

        {!isTrainer && (
          isDivisionLocked ? (
            // For division_role users, show locked division as a badge
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs md:text-sm text-muted-foreground">Division:</span>
              <div className="px-2 md:px-3 py-1 md:py-1.5 bg-primary/10 border border-primary/20 rounded-md text-xs md:text-sm font-medium text-primary">
                {divisionName || 'Your Division'}
              </div>
            </div>
          ) : (
        <Select
          value={filters.division ?? ''}
          onValueChange={(value) => {
            if (value === "clear") {
              setFilters(prev => ({ 
                ...prev, 
                division: undefined,
                district: undefined,
                tehsil: undefined,
                school: undefined,
                sessionId: undefined,
              }));
            } else {
              setFilters(prev => ({ 
                ...prev, 
                division: value,
                district: undefined,
                tehsil: undefined,
                school: undefined,
                sessionId: undefined,
              }));
            }
          }}
          disabled={isLoadingDivisions}
        >
          <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] text-xs md:text-sm">
            <SelectValue placeholder={isLoadingDivisions ? "Loading..." : "Division"} />
          </SelectTrigger>
          <SelectContent className="z-50">
            {filters.division && (
              <SelectItem value="clear" className="text-muted-foreground italic">
                Clear selection
              </SelectItem>
            )}
            {divisions.length === 0 && !isLoadingDivisions ? (
              <SelectItem value="none" disabled>No divisions available</SelectItem>
            ) : (
              divisions.map(div => (
                <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
          )
        )}

        {!isTrainer && (
        <Select
          value={filters.district ?? ''}
          onValueChange={(value) => {
            if (value === "clear") {
              setFilters(prev => ({ 
                ...prev, 
                district: undefined,
                tehsil: undefined,
                school: undefined,
                sessionId: undefined,
              }));
            } else {
              setFilters(prev => ({ 
                ...prev, 
                district: value,
                tehsil: undefined,
                school: undefined,
                sessionId: undefined,
              }));
            }
          }}
          disabled={!filters.division || isLoadingDistricts}
        >
          <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] text-xs md:text-sm">
            <SelectValue placeholder={isLoadingDistricts ? "Loading..." : "District"} />
          </SelectTrigger>
          <SelectContent className="z-50">
            {filters.district && (
              <SelectItem value="clear" className="text-muted-foreground italic">
                Clear selection
              </SelectItem>
            )}
            {districts.length === 0 && !isLoadingDistricts ? (
              <SelectItem value="none" disabled>
                {filters.division ? "No districts available" : "Select division first"}
              </SelectItem>
            ) : (
              districts.map(dist => (
                <SelectItem key={dist.id} value={dist.id}>{dist.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        )}

        {!isTrainer && (
        <Select
          value={filters.tehsil ?? ''}
          onValueChange={(value) => {
            if (value === "clear") {
              setFilters(prev => ({ 
                ...prev, 
                tehsil: undefined,
                school: undefined,
                sessionId: undefined,
              }));
            } else {
              setFilters(prev => ({ 
                ...prev, 
                tehsil: value,
                school: undefined,
                sessionId: undefined,
              }));
            }
          }}
          disabled={!filters.district || isLoadingTehsils}
        >
          <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] text-xs md:text-sm">
            <SelectValue placeholder={isLoadingTehsils ? "Loading..." : "Tehsil"} />
          </SelectTrigger>
          <SelectContent className="z-50">
            {filters.tehsil && (
              <SelectItem value="clear" className="text-muted-foreground italic">
                Clear selection
              </SelectItem>
            )}
            {tehsils.length === 0 && !isLoadingTehsils ? (
              <SelectItem value="none" disabled>
                {filters.district ? "No tehsils available" : "Select district first"}
              </SelectItem>
            ) : (
              tehsils.map(teh => (
                <SelectItem key={teh.id} value={teh.id}>{teh.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        )}

        {!isTrainer && (
        <Select
          value={filters.school ?? ''}
          onValueChange={(value) => {
            if (value === "clear") {
              setFilters(prev => ({ 
                ...prev, 
                school: undefined,
                sessionId: undefined,
              }));
            } else {
              setFilters(prev => ({ 
                ...prev, 
                school: value,
                sessionId: undefined,
              }));
            }
          }}
          disabled={(!filters.tehsil && !filters.district) || isLoadingSchools}
        >
          <SelectTrigger className="w-full sm:w-[180px] md:w-[250px] text-xs md:text-sm">
            <SelectValue placeholder={isLoadingSchools ? "Loading..." : "School"} />
          </SelectTrigger>
          <SelectContent className="z-50">
            {filters.school && (
              <SelectItem value="clear" className="text-muted-foreground italic">
                Clear selection
              </SelectItem>
            )}
            {schools.length === 0 && !isLoadingSchools ? (
              <SelectItem value="none" disabled>
                {filters.district || filters.tehsil ? "No schools available" : "Select district or tehsil first"}
              </SelectItem>
            ) : (
              schools.slice(0, 100).map(school => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name} ({school.emisCode})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        )}

        <Select
          value={filters.sessionId ?? ''}
          onValueChange={(value) => {
            if (value === "clear") {
              setFilters(prev => ({ ...prev, sessionId: undefined }));
            } else {
              setFilters(prev => ({ ...prev, sessionId: value }));
            }
          }}
          disabled={isTrainer ? isLoadingSessions : isLoadingSessions || !filters.school}
        >
          <SelectTrigger className="w-full sm:w-[180px] md:w-[240px] text-xs md:text-sm">
            <SelectValue
              placeholder={
                isTrainer
                  ? isLoadingSessions ? "Loading sessions..." : "Session"
                  : !filters.school
                    ? "Select school first"
                    : isLoadingSessions
                      ? "Loading sessions..."
                      : "Session"
              }
            />
          </SelectTrigger>
          <SelectContent className="z-50">
            {filters.sessionId && (
              <SelectItem value="clear" className="text-muted-foreground italic">
                Clear selection
              </SelectItem>
            )}
            {sessions.length === 0 && !isLoadingSessions ? (
              <SelectItem value="none" disabled>No sessions available</SelectItem>
            ) : (
              sessions.map(session => (
                <SelectItem key={session.id} value={session.id}>
                  {session.title} ({formatDateDDMMYYYY(session.date)})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {!disableDateFilters && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs md:text-sm text-muted-foreground">From:</span>
          <DatePicker
            date={parseISODate(filters.startDate)}
            onDateChange={(date) => {
              const dateStr = formatDateToISO(date);
              setFilters(prev => ({ ...prev, startDate: dateStr }));
            }}
            placeholder="Start date"
          />
        </div>
        )}

        {!disableDateFilters && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs md:text-sm text-muted-foreground">To:</span>
          <DatePicker
            date={parseISODate(filters.endDate)}
            onDateChange={(date) => {
              const dateStr = formatDateToISO(date);
              setFilters(prev => ({ ...prev, endDate: dateStr }));
            }}
            placeholder="End date"
          />
        </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetFilters();
            if (!isTrainer) {
              setSessions([]);
            }
            setIsLoadingSessions(false);
          }}
          className="text-xs md:text-sm shrink-0 w-full sm:w-auto"
        >
          <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Reset Filters</span>
          <span className="sm:hidden">Reset</span>
        </Button>
      </div>
    </div>
  );
};

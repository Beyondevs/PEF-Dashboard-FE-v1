import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, ChevronLeft, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { getMonthlyAttendanceCalendar, exportMonthlyAttendanceCalendar } from '@/lib/api';
import { useFilters } from '@/contexts/FilterContext';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from '@/components/PaginationControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PersonAttendance {
  id: string;
  name: string;
  rollNo?: string;
  cnic?: string;
  school: { name: string; emisCode: string };
  attendance: Record<string, 'P' | 'A' | 'H' | 'NS' | null>;
}

interface MonthlyAttendanceData {
  persons: PersonAttendance[];
  personType: 'student' | 'teacher';
  month: number;
  year: number;
  totalDays: number;
  holidays: string[];
}

const MonthlyAttendanceCalendar = () => {
  const { filters } = useFilters();
  const [data, setData] = useState<MonthlyAttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [personType, setPersonType] = useState<'student' | 'teacher'>('student');
  
  // Get current month/year or use state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Helper function to pad numbers with leading zeros
  const pad2 = (n: number) => String(n).padStart(2, '0');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {
        month: String(selectedMonth),
        year: String(selectedYear),
        personType,
      };

      // Apply geography filters
      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await getMonthlyAttendanceCalendar(params);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch monthly attendance calendar:', error);
      toast.error('Failed to load monthly attendance calendar');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear, personType, filters.division, filters.district, filters.tehsil, filters.school, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {
        month: String(selectedMonth),
        year: String(selectedYear),
        personType,
      };

      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const blob = await exportMonthlyAttendanceCalendar(params);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly-attendance-calendar-${personType}-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Monthly attendance calendar exported successfully');
    } catch (error) {
      console.error('Failed to export monthly attendance calendar:', error);
      toast.error('Failed to export monthly attendance calendar');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getDayStatus = (dateKey: string, attendance: Record<string, 'P' | 'A' | 'H' | 'NS' | null>, holidays: string[]): 'P' | 'A' | 'H' | 'NS' | null => {
    // Status is already determined in backend, just return it
    return attendance[dateKey] || null;
  };

  const getCellClassName = (status: 'P' | 'A' | 'H' | 'NS' | null): string => {
    const baseClass = 'text-center text-xs font-medium py-2 px-1 min-w-[40px]';
    switch (status) {
      case 'P':
        return `${baseClass} bg-white text-black border`;
      case 'A':
        return `${baseClass} bg-red-100 text-red-800 border border-red-200`;
      case 'H':
        return `${baseClass} bg-green-100 text-green-800 border border-green-200`;
      case 'NS':
        return `${baseClass} bg-yellow-50 text-yellow-700 border border-yellow-200`;
      default:
        return `${baseClass} bg-gray-100 text-gray-500 border border-gray-200`;
    }
  };

  const getCellText = (status: 'P' | 'A' | 'H' | 'NS' | null): string => {
    switch (status) {
      case 'P':
        return 'P';
      case 'A':
        return 'A';
      case 'H':
        return 'H';
      case 'NS':
        return 'NS';
      default:
        return '';
    }
  };

  // Generate array of days for the month
  const daysInMonth = useMemo(() => {
    if (!data) return [];
    const days: number[] = [];
    for (let day = 1; day <= data.totalDays; day++) {
      days.push(day);
    }
    return days;
  }, [data]);

  // Filter persons based on search
  const filteredPersons = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.persons;
    const query = searchQuery.toLowerCase();
    return data.persons.filter(
      (person) =>
        person.name.toLowerCase().includes(query) ||
        (person.rollNo && person.rollNo.toLowerCase().includes(query)) ||
        (person.cnic && person.cnic.toLowerCase().includes(query)) ||
        person.school.name.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // Pagination
  const {
    items: paginatedPersons,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(filteredPersons, { initialPageSize: 100 });

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Monthly Attendance Calendar</h1>
            <p className="text-muted-foreground">View student attendance in calendar format</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monthly Attendance Calendar</h1>
          <p className="text-muted-foreground">View student and teacher attendance in calendar format</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isLoading}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Month/Year Selector and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-center min-w-[200px]">
                  <div className="text-lg font-semibold">
                    {monthNames[selectedMonth - 1]} {selectedYear}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
                disabled={isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="w-full sm:w-auto">
              <Input
                placeholder={`Search by ${personType} name, ${personType === 'student' ? 'roll no' : 'CNIC'}, or school...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[300px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Student/Teacher */}
      <Tabs value={personType} onValueChange={(value) => {
        setPersonType(value as 'student' | 'teacher');
        setPage(1); // Reset to first page when switching tabs
      }}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="student">Students</TabsTrigger>
          <TabsTrigger value="teacher">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="mt-4">
          {/* Calendar Table */}
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          ) : data && data.personType === 'student' ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {totalItems} Student{totalItems !== 1 ? 's' : ''} - {monthNames[selectedMonth - 1]} {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredPersons.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No students found for the selected filters and month.
                  </div>
                ) : (
                  <>
                    <TooltipProvider>
                      <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky left-0 z-10 bg-background min-w-[40px]">S. No</TableHead>
                            <TableHead className="sticky left-[40px] z-10 bg-background min-w-[120px]">EMIS Code</TableHead>
                            <TableHead className="sticky left-[160px] z-10 bg-background min-w-[200px]">School Name</TableHead>
                            <TableHead className="sticky left-[360px] z-10 bg-background min-w-[200px]">Student Name</TableHead>
                            <TableHead className="sticky left-[560px] z-10 bg-background min-w-[120px]">Roll No</TableHead>
                        {daysInMonth.map((day) => {
                          const date = new Date(selectedYear, selectedMonth - 1, day);
                          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
                          return (
                            <TableHead
                              key={day}
                              className="text-center min-w-[40px] bg-muted/50"
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold">{day}</span>
                                <span className="text-[10px] text-muted-foreground">{dayOfWeek}</span>
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                        <TableBody>
                          {paginatedPersons.map((person, index) => (
                            <TableRow key={person.id}>
                              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                                {startIndex + index + 1}
                              </TableCell>
                              <TableCell className="sticky left-[40px] z-10 bg-background">
                                {person.school.emisCode || '-'}
                              </TableCell>
                              <TableCell className="sticky left-[160px] z-10 bg-background">
                                {person.school.name}
                              </TableCell>
                              <TableCell className="sticky left-[360px] z-10 bg-background font-medium">
                                {person.name}
                              </TableCell>
                              <TableCell className="sticky left-[560px] z-10 bg-background">
                                {person.rollNo || '-'}
                              </TableCell>
                              {daysInMonth.map((day) => {
                                const dateKey = `${selectedYear}-${pad2(selectedMonth)}-${pad2(day)}`;
                                const status = getDayStatus(dateKey, person.attendance, data.holidays);
                                
                                if (status === 'NS') {
                                  return (
                                    <TableCell
                                      key={day}
                                      className={getCellClassName(status)}
                                    >
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="block w-full">{getCellText(status)}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>This student has no session on this day</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TableCell>
                                  );
                                }
                                
                                return (
                                  <TableCell
                                    key={day}
                                    className={getCellClassName(status)}
                                  >
                                    {getCellText(status)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                    </TooltipProvider>
                    {totalPages > 1 && (
                      <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        pageInfo={
                          totalItems > 0
                            ? `Showing ${startIndex + 1}-${endIndex} of ${totalItems} students`
                            : undefined
                        }
                        className="mt-6"
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No data available. Please select a month and year.
            </div>
          )}
        </TabsContent>

        <TabsContent value="teacher" className="mt-4">
          {/* Calendar Table */}
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          ) : data && data.personType === 'teacher' ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {totalItems} Teacher{totalItems !== 1 ? 's' : ''} - {monthNames[selectedMonth - 1]} {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredPersons.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No teachers found for the selected filters and month.
                  </div>
                ) : (
                  <>
                    <TooltipProvider>
                      <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky left-0 z-10 bg-background min-w-[40px]">S. No</TableHead>
                            <TableHead className="sticky left-[40px] z-10 bg-background min-w-[120px]">EMIS Code</TableHead>
                            <TableHead className="sticky left-[160px] z-10 bg-background min-w-[200px]">School Name</TableHead>
                            <TableHead className="sticky left-[360px] z-10 bg-background min-w-[200px]">Teacher Name</TableHead>
                            <TableHead className="sticky left-[560px] z-10 bg-background min-w-[150px]">CNIC</TableHead>
                            {daysInMonth.map((day) => {
                              const date = new Date(selectedYear, selectedMonth - 1, day);
                              const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
                              return (
                                <TableHead
                                  key={day}
                                  className="text-center min-w-[40px] bg-muted/50"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs font-semibold">{day}</span>
                                    <span className="text-[10px] text-muted-foreground">{dayOfWeek}</span>
                                  </div>
                                </TableHead>
                              );
                            })}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPersons.map((person, index) => (
                            <TableRow key={person.id}>
                              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                                {startIndex + index + 1}
                              </TableCell>
                              <TableCell className="sticky left-[40px] z-10 bg-background">
                                {person.school.emisCode || '-'}
                              </TableCell>
                              <TableCell className="sticky left-[160px] z-10 bg-background">
                                {person.school.name}
                              </TableCell>
                              <TableCell className="sticky left-[360px] z-10 bg-background font-medium">
                                {person.name}
                              </TableCell>
                              <TableCell className="sticky left-[560px] z-10 bg-background">
                                {person.cnic || '-'}
                              </TableCell>
                              {daysInMonth.map((day) => {
                                const dateKey = `${selectedYear}-${pad2(selectedMonth)}-${pad2(day)}`;
                                const status = getDayStatus(dateKey, person.attendance, data.holidays);
                                
                                if (status === 'NS') {
                                  return (
                                    <TableCell
                                      key={day}
                                      className={getCellClassName(status)}
                                    >
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="block w-full">{getCellText(status)}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>This teacher has no session on this day</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TableCell>
                                  );
                                }
                                
                                return (
                                  <TableCell
                                    key={day}
                                    className={getCellClassName(status)}
                                  >
                                    {getCellText(status)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                    </TooltipProvider>
                    {totalPages > 1 && (
                      <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        pageInfo={
                          totalItems > 0
                            ? `Showing ${startIndex + 1}-${endIndex} of ${totalItems} teachers`
                            : undefined
                        }
                        className="mt-6"
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No data available. Please select a month and year.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center text-xs font-medium">
                P
              </div>
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 border border-red-200 rounded flex items-center justify-center text-xs font-medium text-red-800">
                A
              </div>
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 border border-green-200 rounded flex items-center justify-center text-xs font-medium text-green-800">
                H
              </div>
              <span className="text-sm">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-center text-xs font-medium text-yellow-700">
                NS
              </div>
              <span className="text-sm">No Session</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs font-medium text-gray-500">
                -
              </div>
              <span className="text-sm">Not Marked</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyAttendanceCalendar;


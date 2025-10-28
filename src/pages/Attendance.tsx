import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Download, Save } from 'lucide-react';
import { attendance, sessions, teachers, students } from '@/lib/mockData';
import { toast } from 'sonner';
import { FilterBar } from '@/components/FilterBar';
import { useFilters } from '@/contexts/FilterContext';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { getAttendanceList, toggleAttendance } from '@/lib/api';

const Attendance = () => {
  const { filters } = useFilters();
  const [editMode, setEditMode] = useState(false);
  const [attendanceChanges, setAttendanceChanges] = useState<Record<string, boolean>>({});
  
  // API data state
  const [apiTeacherAttendance, setApiTeacherAttendance] = useState<any[]>([]);
  const [apiStudentAttendance, setApiStudentAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  // Fetch attendance from API
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setIsLoading(true);
        setApiError(false);
        
        // Transform filters to API format
        const baseFilters: any = {
          page: currentPage,
          pageSize,
        };
        
        // Add date range if present
        if (filters.dateRange) {
          baseFilters.from = filters.dateRange.from.toISOString().split('T')[0];
          baseFilters.to = filters.dateRange.to.toISOString().split('T')[0];
        }
        
        // Add other filters
        if (filters.division) baseFilters.divisionId = filters.division;
        if (filters.district) baseFilters.districtId = filters.district;
        if (filters.tehsil) baseFilters.tehsilId = filters.tehsil;
        if (filters.school) baseFilters.schoolId = filters.school;
        
        // Fetch both teacher and student attendance in parallel
        const [teacherResponse, studentResponse] = await Promise.all([
          getAttendanceList({ ...baseFilters, personType: 'teacher' }),
          getAttendanceList({ ...baseFilters, personType: 'student' })
        ]);
        
        setApiTeacherAttendance(teacherResponse.data.data || []);
        setApiStudentAttendance(studentResponse.data.data || []);
        
        // Debug logging
        console.log('Teacher attendance data:', teacherResponse.data);
        console.log('Student attendance data:', studentResponse.data);
        
        // Use student response for pagination info (they should be the same)
        setTotalPages(Math.ceil((studentResponse.data.total || 0) / pageSize));
        setTotalItems((teacherResponse.data.total || 0) + (studentResponse.data.total || 0));
        
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
        setApiError(true);
        setApiTeacherAttendance([]);
        setApiStudentAttendance([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [currentPage, filters]);

  const handleExport = () => {
    toast.success('Export generated successfully');
  };

  const handleSaveChanges = async () => {
    // No bulk endpoint without sessionId; toggles already persisted per-record.
    toast.success(`Saved ${Object.keys(attendanceChanges).length} change(s)`);
    setAttendanceChanges({});
    setEditMode(false);
    
    // Refresh data
    const baseFilters: any = {
      page: currentPage,
      pageSize,
    };
    
    if (filters.dateRange) {
      baseFilters.from = filters.dateRange.from.toISOString().split('T')[0];
      baseFilters.to = filters.dateRange.to.toISOString().split('T')[0];
    }
    if (filters.division) baseFilters.divisionId = filters.division;
    if (filters.district) baseFilters.districtId = filters.district;
    if (filters.tehsil) baseFilters.tehsilId = filters.tehsil;
    if (filters.school) baseFilters.schoolId = filters.school;
    
    try {
      const [teacherResponse, studentResponse] = await Promise.all([
        getAttendanceList({ ...baseFilters, personType: 'teacher' }),
        getAttendanceList({ ...baseFilters, personType: 'student' })
      ]);
      setApiTeacherAttendance(teacherResponse.data.data || []);
      setApiStudentAttendance(studentResponse.data.data || []);
    } catch (e) {
      // Ignore refresh error to avoid UX interruption
    }
  };

  const handleToggleAttendance = async (recordId: string, currentStatus: boolean) => {
    try {
      await toggleAttendance(recordId);
      setAttendanceChanges(prev => ({
        ...prev,
        [recordId]: !currentStatus,
      }));
    } catch (error) {
      console.error('Failed to toggle attendance:', error);
      toast.error('Failed to update attendance. Please try again.');
    }
  };

  const getAttendanceStatus = (recordId: string, originalStatus: boolean) => {
    return attendanceChanges[recordId] !== undefined ? attendanceChanges[recordId] : originalStatus;
  };

  const teacherAttendance = apiTeacherAttendance;
  const studentAttendance = apiStudentAttendance;

  const {
    items: paginatedTeacherAttendance,
    page: teacherPage,
    setPage: setTeacherPage,
    totalPages: teacherTotalPages,
    startIndex: teacherStart,
    endIndex: teacherEnd,
    totalItems: teacherTotal,
  } = usePagination(teacherAttendance, { initialPageSize: 10 });

  const {
    items: paginatedStudentAttendance,
    page: studentPage,
    setPage: setStudentPage,
    totalPages: studentTotalPages,
    startIndex: studentStart,
    endIndex: studentEnd,
    totalItems: studentTotal,
  } = usePagination(studentAttendance, { initialPageSize: 10 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground">View and manage attendance records</p>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">View and manage attendance records</p>
          
        </div>
        <div className="flex gap-2">
          <Button 
            variant={editMode ? 'default' : 'outline'}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Cancel Edit' : 'Edit Mode'}
          </Button>
          {editMode && Object.keys(attendanceChanges).length > 0 && (
            <Button onClick={handleSaveChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes ({Object.keys(attendanceChanges).length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <FilterBar />

      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teachers">Teacher Attendance</TabsTrigger>
          <TabsTrigger value="students">Student Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {editMode && <TableHead>Toggle</TableHead>}
                    <TableHead>Marked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTeacherAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={editMode ? 6 : 5} className="text-center text-muted-foreground py-8">
                        {isLoading ? 'Loading teacher attendance...' : 'No teacher attendance records found for the selected filters.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTeacherAttendance.map(att => {
                      const currentStatus = getAttendanceStatus(att.id, att.present);
                      const hasChanges = attendanceChanges[att.id] !== undefined;
                      
                      return (
                        <TableRow key={att.id} className={hasChanges ? 'bg-muted/50' : ''}>
                          <TableCell className="font-medium">{att.personName}</TableCell>
                          <TableCell>{att.session?.title}</TableCell>
                          <TableCell>{new Date(att.session?.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={currentStatus ? 'default' : 'destructive'}>
                              {currentStatus ? 'Present' : 'Absent'}
                            </Badge>
                          </TableCell>
                          {editMode && (
                            <TableCell>
                              <Switch
                                checked={currentStatus}
                                onCheckedChange={() => handleToggleAttendance(att.id, att.present)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(att.markedAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>

              <PaginationControls
                currentPage={teacherPage}
                totalPages={teacherTotalPages}
                onPageChange={setTeacherPage}
                pageInfo={
                  teacherTotal > 0
                    ? `Showing ${teacherStart}-${teacherEnd} of ${teacherTotal} records`
                    : undefined
                }
                className="mt-6"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {editMode && <TableHead>Toggle</TableHead>}
                    <TableHead>Marked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudentAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={editMode ? 7 : 6} className="text-center text-muted-foreground py-8">
                        {isLoading ? 'Loading student attendance...' : 'No student attendance records found for the selected filters.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudentAttendance.map(att => {
                      const currentStatus = getAttendanceStatus(att.id, att.present);
                      const hasChanges = attendanceChanges[att.id] !== undefined;
                      
                      return (
                        <TableRow key={att.id} className={hasChanges ? 'bg-muted/50' : ''}>
                          <TableCell className="font-medium">{att.personName}</TableCell>
                          <TableCell>Grade {att.personGrade || 'N/A'}</TableCell>
                          <TableCell>{att.session?.title}</TableCell>
                          <TableCell>{new Date(att.session?.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={currentStatus ? 'default' : 'destructive'}>
                              {currentStatus ? 'Present' : 'Absent'}
                            </Badge>
                          </TableCell>
                          {editMode && (
                            <TableCell>
                              <Switch
                                checked={currentStatus}
                                onCheckedChange={() => handleToggleAttendance(att.id, att.present)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(att.markedAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>

              <PaginationControls
                currentPage={studentPage}
                totalPages={studentTotalPages}
                onPageChange={setStudentPage}
                pageInfo={
                  studentTotal > 0
                    ? `Showing ${studentStart}-${studentEnd} of ${studentTotal} records`
                    : undefined
                }
                className="mt-6"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;

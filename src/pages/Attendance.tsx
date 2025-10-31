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
import { Download, Save, Calendar as CalendarIcon, Clock, UserCheck, UserX } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCard } from '@/components/MobileCard';
import { attendance, sessions, teachers, students } from '@/lib/mockData';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { getAttendanceList, toggleAttendance } from '@/lib/api';

const Attendance = () => {
  const { filters } = useFilters();
  const isMobile = useIsMobile();
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
        
        // Add session filter if present
        if (filters.sessionId) {
          baseFilters.sessionId = filters.sessionId;
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
    
    if (filters.sessionId) {
      baseFilters.sessionId = filters.sessionId;
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Attendance</h1>
            <p className="text-sm sm:text-base text-muted-foreground">View and manage attendance records</p>
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Attendance</h1>
          <p className="text-sm sm:text-base text-muted-foreground">View and manage attendance records</p>
          
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={editMode ? 'default' : 'outline'}
            onClick={() => setEditMode(!editMode)}
            className="flex-1 sm:flex-initial"
          >
            <span className="hidden sm:inline">{editMode ? 'Cancel Edit' : 'Edit Mode'}</span>
            <span className="sm:hidden">{editMode ? 'Cancel' : 'Edit'}</span>
          </Button>
          {editMode && Object.keys(attendanceChanges).length > 0 && (
            <Button onClick={handleSaveChanges} className="flex-1 sm:flex-initial">
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Save Changes ({Object.keys(attendanceChanges).length})</span>
              <span className="sm:hidden">Save ({Object.keys(attendanceChanges).length})</span>
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-initial">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teachers" className="text-sm sm:text-base">
            <span className="hidden sm:inline">Teacher Attendance</span>
            <span className="sm:hidden">Teachers</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="text-sm sm:text-base">
            <span className="hidden sm:inline">Student Attendance</span>
            <span className="sm:hidden">Students</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Teacher Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-3">
                  {paginatedTeacherAttendance.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {isLoading ? 'Loading teacher attendance...' : 'No teacher attendance records found for the selected filters.'}
                    </div>
                  ) : (
                    paginatedTeacherAttendance.map(att => {
                      const currentStatus = getAttendanceStatus(att.id, att.present);
                      const hasChanges = attendanceChanges[att.id] !== undefined;
                      
                      return (
                        <MobileCard
                          key={att.id}
                          title={att.personName}
                          subtitle={att.session?.title}
                          badges={[
                            { label: currentStatus ? 'Present' : 'Absent', variant: currentStatus ? 'default' : 'destructive' }
                          ]}
                          metadata={[
                            {
                              label: "Date",
                              value: new Date(att.session?.date).toLocaleDateString(),
                              icon: <CalendarIcon className="h-3 w-3" />
                            },
                            {
                              label: "Marked At",
                              value: new Date(att.markedAt).toLocaleString(),
                              icon: <Clock className="h-3 w-3" />
                            }
                          ]}
                          actions={editMode && (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-medium">Mark Attendance:</span>
                              <Switch
                                checked={currentStatus}
                                onCheckedChange={() => handleToggleAttendance(att.id, att.present)}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          )}
                          className={hasChanges ? 'bg-muted/50 border-primary' : ''}
                        />
                      );
                    })
                  )}
                </div>
              ) : (
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
              )}

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
              <CardTitle className="text-base sm:text-lg">Student Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-3">
                  {paginatedStudentAttendance.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {isLoading ? 'Loading student attendance...' : 'No student attendance records found for the selected filters.'}
                    </div>
                  ) : (
                    paginatedStudentAttendance.map(att => {
                      const currentStatus = getAttendanceStatus(att.id, att.present);
                      const hasChanges = attendanceChanges[att.id] !== undefined;
                      
                      return (
                        <MobileCard
                          key={att.id}
                          title={att.personName}
                          subtitle={att.session?.title}
                          badges={[
                            { label: `Grade ${att.gradeLevel || 'N/A'}`, variant: "secondary" },
                            { label: currentStatus ? 'Present' : 'Absent', variant: currentStatus ? 'default' : 'destructive' }
                          ]}
                          metadata={[
                            {
                              label: "Date",
                              value: new Date(att.session?.date).toLocaleDateString(),
                              icon: <CalendarIcon className="h-3 w-3" />
                            },
                            {
                              label: "Marked At",
                              value: new Date(att.markedAt).toLocaleString(),
                              icon: <Clock className="h-3 w-3" />
                            }
                          ]}
                          actions={editMode && (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-medium">Mark Attendance:</span>
                              <Switch
                                checked={currentStatus}
                                onCheckedChange={() => handleToggleAttendance(att.id, att.present)}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          )}
                          className={hasChanges ? 'bg-muted/50 border-primary' : ''}
                        />
                      );
                    })
                  )}
                </div>
              ) : (
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
              )}

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

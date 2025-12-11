import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Save, Calendar as CalendarIcon, FileText, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCard } from '@/components/MobileCard';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';
import PaginationControls from '@/components/PaginationControls';
import { useAuth } from '@/contexts/AuthContext';
import { ExportButton } from '@/components/data-transfer/ExportButton';
import { ImportButton } from '@/components/data-transfer/ImportButton';
import {
  getAttendanceList,
  toggleAttendance,
  bulkUpsertAttendance,
  getSessionAttendance,
  exportAttendance,
  importAttendanceCSV,
  downloadAttendanceTemplate,
} from '@/lib/api';

const Attendance = () => {
  const { filters } = useFilters();
  const { canMarkAttendance, isAdmin, role } = useAuth();
  const isMobile = useIsMobile();
  const [editMode, setEditMode] = useState(false);
  const [attendanceChanges, setAttendanceChanges] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('teachers');
  
  // API data state
  const [apiTeacherAttendance, setApiTeacherAttendance] = useState<any[]>([]);
  const [apiStudentAttendance, setApiStudentAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  
  // Pagination state - separate for teachers and students
  const [teacherPage, setTeacherPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [teacherTotalPages, setTeacherTotalPages] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [teacherTotalItems, setTeacherTotalItems] = useState(0);
  const [studentTotalItems, setStudentTotalItems] = useState(0);
  const pageSize = 100;
  const hasManagePermissions = canMarkAttendance();
  const showDataTransferButtons = isAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');

  // Track previous filter values to detect changes and reset pagination
  const prevFiltersRef = useRef({
    sessionId: filters.sessionId,
    division: filters.division,
    district: filters.district,
    tehsil: filters.tehsil,
    school: filters.school,
    startDate: filters.startDate,
    endDate: filters.endDate,
    activeSearchTerm: activeSearchTerm,
  });

  const SYSTEM_NOT_MARKED = 'system:not-marked';

  const isRecordPresent = (record?: { present?: boolean; markedBy?: string }) => {
    if (!record) return true;
    if (record.markedBy === SYSTEM_NOT_MARKED) return true;
    if (typeof record.present === 'boolean') {
      return record.present;
    }
    return true;
  };

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm.trim());
    setTeacherPage(1);
    setStudentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const fetchAttendance = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(false);

      // Check if filters have changed - if so, reset to page 1
      const prevFilters = prevFiltersRef.current;
      const filtersChanged = 
        prevFilters.sessionId !== filters.sessionId ||
        prevFilters.division !== filters.division ||
        prevFilters.district !== filters.district ||
        prevFilters.tehsil !== filters.tehsil ||
        prevFilters.school !== filters.school ||
        prevFilters.startDate !== filters.startDate ||
        prevFilters.endDate !== filters.endDate ||
        prevFilters.activeSearchTerm !== activeSearchTerm;

      // Determine effective pages: use page 1 if filters changed
      const effectiveTeacherPage = filtersChanged ? 1 : teacherPage;
      const effectiveStudentPage = filtersChanged ? 1 : studentPage;

      // Update the ref to track current filter values
      if (filtersChanged) {
        prevFiltersRef.current = {
          sessionId: filters.sessionId,
          division: filters.division,
          district: filters.district,
          tehsil: filters.tehsil,
          school: filters.school,
          startDate: filters.startDate,
          endDate: filters.endDate,
          activeSearchTerm: activeSearchTerm,
        };
        // Also update state to keep UI in sync
        if (teacherPage !== 1) setTeacherPage(1);
        if (studentPage !== 1) setStudentPage(1);
      }

      const teacherFilters: any = {
        page: effectiveTeacherPage,
        pageSize,
        personType: 'teacher',
      };

      const studentFilters: any = {
        page: effectiveStudentPage,
        pageSize,
        personType: 'student',
      };

      if (filters.sessionId) {
        teacherFilters.sessionId = filters.sessionId;
        studentFilters.sessionId = filters.sessionId;
      }

      if (filters.division) {
        teacherFilters.divisionId = filters.division;
        studentFilters.divisionId = filters.division;
      }
      if (filters.district) {
        teacherFilters.districtId = filters.district;
        studentFilters.districtId = filters.district;
      }
      if (filters.tehsil) {
        teacherFilters.tehsilId = filters.tehsil;
        studentFilters.tehsilId = filters.tehsil;
      }
      if (filters.school) {
        teacherFilters.schoolId = filters.school;
        studentFilters.schoolId = filters.school;
      }

      if (filters.startDate) {
        teacherFilters.from = filters.startDate;
        studentFilters.from = filters.startDate;
      }
      if (filters.endDate) {
        teacherFilters.to = filters.endDate;
        studentFilters.to = filters.endDate;
      }

      if (activeSearchTerm) {
        teacherFilters.search = activeSearchTerm;
        studentFilters.search = activeSearchTerm;
      }

      const [teacherResponse, studentResponse] = await Promise.all([
        getAttendanceList(teacherFilters),
        getAttendanceList(studentFilters),
      ]);

      setApiTeacherAttendance(teacherResponse.data.data || []);
      setApiStudentAttendance(studentResponse.data.data || []);

      if (teacherResponse.data.totalPages !== undefined) {
        setTeacherTotalPages(teacherResponse.data.totalPages);
      } else if (teacherResponse.data.total !== undefined) {
        setTeacherTotalPages(Math.ceil(teacherResponse.data.total / pageSize));
      }
      setTeacherTotalItems(teacherResponse.data.totalItems || teacherResponse.data.total || 0);

      if (studentResponse.data.totalPages !== undefined) {
        setStudentTotalPages(studentResponse.data.totalPages);
      } else if (studentResponse.data.total !== undefined) {
        setStudentTotalPages(Math.ceil(studentResponse.data.total / pageSize));
      }
      setStudentTotalItems(studentResponse.data.totalItems || studentResponse.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setApiError(true);
      setApiTeacherAttendance([]);
      setApiStudentAttendance([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, teacherPage, studentPage, pageSize, activeSearchTerm]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const buildExportParams = () => {
    const params: Record<string, string> = {};
    if (filters.sessionId) params.sessionId = filters.sessionId;
    if (filters.division) params.divisionId = filters.division;
    if (filters.district) params.districtId = filters.district;
    if (filters.tehsil) params.tehsilId = filters.tehsil;
    if (filters.school) params.schoolId = filters.school;
    if (filters.startDate) params.from = filters.startDate;
    if (filters.endDate) params.to = filters.endDate;
    params.personType = activeTab === 'teachers' ? 'teacher' : 'student';
    if (activeSearchTerm) params.search = activeSearchTerm;
    return params;
  };

  const handleSaveChanges = async () => {
    const changes = Object.keys(attendanceChanges);
    if (changes.length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      setIsLoading(true);
      
      // Combine all attendance records to find originals
      const allAttendance = [...apiTeacherAttendance, ...apiStudentAttendance];
      const attendanceMap = new Map(allAttendance.map(att => [att.id, att]));
      
      // If we have a sessionId filter, fetch full session attendance so we send all records (not just current page)
      if (filters.sessionId) {
        // Load complete session attendance (all pages)
        const sessionAttendance = await getSessionAttendance(filters.sessionId);
        const { teachers = [], students = [] } = sessionAttendance.data || {};

        const fullAttendancePayload: {
          teachers?: Array<{ teacherId: string; present: boolean }>;
          students?: Array<{ studentId: string; present: boolean }>;
        } = {};

        // Build teacher payload with applied changes
        const teacherRecords = teachers.map((t: any) => {
          const att = t.attendance;
          const attId = att?.id;
          const originalPresent = isRecordPresent(att);
          const present =
            attId && attendanceChanges[attId] !== undefined
              ? attendanceChanges[attId]
              : originalPresent;
          return { teacherId: t.id, present };
        });
        if (teacherRecords.length > 0) {
          fullAttendancePayload.teachers = teacherRecords;
        }

        // Build student payload with applied changes
        const studentRecords = students.map((s: any) => {
          const att = s.attendance;
          const attId = att?.id;
          const originalPresent = isRecordPresent(att);
          const present =
            attId && attendanceChanges[attId] !== undefined
              ? attendanceChanges[attId]
              : originalPresent;
          return { studentId: s.id, present };
        });
        if (studentRecords.length > 0) {
          fullAttendancePayload.students = studentRecords;
        }

        // Use bulk upsert with full payload so pagination doesn't drop changes
        await bulkUpsertAttendance(filters.sessionId, fullAttendancePayload);
        
        toast.success(`Successfully saved attendance for ${changes.length} record(s)`);
        setAttendanceChanges({});
        setEditMode(false);
        await fetchAttendance();
        return;
      }
      
      // Fallback: If no sessionId, use individual toggles (for cross-session views)
      // Filter changes: only toggle records where desired value differs from original
      const changesToSave = changes.filter(recordId => {
        const originalRecord = attendanceMap.get(recordId);
        if (!originalRecord) {
          console.warn(`Original record not found for ${recordId}`);
          return false;
        }
        const desiredValue = attendanceChanges[recordId];
        const originalValue = isRecordPresent(originalRecord);
        // Only toggle if desired value is different from original
        return desiredValue !== originalValue;
      });

      if (changesToSave.length === 0) {
        toast.info('No actual changes to save (all values match original)');
        setAttendanceChanges({});
        setEditMode(false);
        setIsLoading(false);
        return;
      }
      
      // Batch API calls for records that need to be toggled
      const savePromises = changesToSave.map(recordId => 
        toggleAttendance(recordId).catch(error => {
          console.error(`Failed to save attendance for record ${recordId}:`, error);
          return { error: true, recordId };
        })
      );

      const results = await Promise.all(savePromises);
      
      // Check for errors
      const errors = results.filter(r => r && (r as any).error);
      const successCount = results.length - errors.length;

      if (errors.length > 0) {
        toast.error(`Failed to save ${errors.length} of ${changesToSave.length} changes. Please try again.`);
        // Don't clear changes if there were errors
        return;
      }

      // All changes saved successfully
      toast.success(`Successfully saved ${successCount} change(s)`);
      setAttendanceChanges({});
      setEditMode(false);
      await fetchAttendance();
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAttendance = (recordId: string, currentStatus: boolean) => {
    // Only update local state - no API call
    // Changes will be saved when "Save Changes" button is clicked
    setAttendanceChanges(prev => ({
      ...prev,
      [recordId]: !currentStatus,
    }));
  };

  const handleCancelEdit = () => {
    // Discard all unsaved changes and reset to last saved state
    setAttendanceChanges({});
    setEditMode(false);
    fetchAttendance();
  };

  const getAttendanceStatus = (recordId: string, originalStatus: boolean) => {
    return attendanceChanges[recordId] !== undefined ? attendanceChanges[recordId] : originalStatus;
  };

  // Calculate display indices for pagination info
  const teacherStart = teacherTotalItems > 0 ? (teacherPage - 1) * pageSize + 1 : 0;
  const teacherEnd = Math.min(teacherPage * pageSize, teacherTotalItems);
  
  const studentStart = studentTotalItems > 0 ? (studentPage - 1) * pageSize + 1 : 0;
  const studentEnd = Math.min(studentPage * pageSize, studentTotalItems);

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
        <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
          <div className="relative w-full sm:w-64 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Search by name, CNIC, or roll number..."
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} size="default" className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {showDataTransferButtons && (
            <>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const blob = await downloadAttendanceTemplate();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'attendance-template.csv';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Failed to download attendance template:', error);
                    toast.error('Failed to download template');
                  }
                }}
                className="flex-1 sm:flex-initial"
              >
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Template</span>
                <span className="sm:hidden">Template</span>
              </Button>
              {role === 'admin' && (
                <ImportButton
                  label="Import"
                  importFn={async (file) => {
                    const response = await importAttendanceCSV(file);
                    return response.data as any;
                  }}
                  onSuccess={() => fetchAttendance()}
                />
              )}
              <ExportButton
                label="Export"
                exportFn={async () => {
                  const params = buildExportParams();
                  return exportAttendance(params);
                }}
                filename={activeTab === 'teachers' ? 'attendance-teachers.csv' : 'attendance-students.csv'}
              />
            </>
          )}
          {hasManagePermissions && (
            <>
              <Button
                variant={editMode ? 'default' : 'outline'}
                onClick={editMode ? handleCancelEdit : () => setEditMode(true)}
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
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                  {apiTeacherAttendance.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {isLoading ? 'Loading teacher attendance...' : 'No teacher attendance records found for the selected filters.'}
                    </div>
                  ) : (
                    apiTeacherAttendance.map(att => {
                      const originalStatus = isRecordPresent(att);
                      const currentStatus = getAttendanceStatus(att.id, originalStatus);
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
                              label: "CNIC",
                              value: att.personCNIC || '-',
                            },
                            {
                              label: "Date",
                              value: new Date(att.session?.date).toLocaleDateString(),
                              icon: <CalendarIcon className="h-3 w-3" />
                            }
                          ]}
                          actions={editMode && (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-medium">Mark Attendance:</span>
                              <Switch
                                checked={currentStatus}
                                onCheckedChange={() => handleToggleAttendance(att.id, currentStatus)}
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
                    <TableHead>CNIC</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {editMode && <TableHead>Toggle</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiTeacherAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={editMode ? 6 : 5} className="text-center text-muted-foreground py-8">
                        {isLoading ? 'Loading teacher attendance...' : 'No teacher attendance records found for the selected filters.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiTeacherAttendance.map(att => {
                      const originalStatus = isRecordPresent(att);
                      const currentStatus = getAttendanceStatus(att.id, originalStatus);
                      const hasChanges = attendanceChanges[att.id] !== undefined;
                      
                      return (
                        <TableRow key={att.id} className={hasChanges ? 'bg-muted/50' : ''}>
                          <TableCell className="font-medium">{att.personName}</TableCell>
                          <TableCell className="text-muted-foreground">{att.personCNIC || '-'}</TableCell>
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
                                onCheckedChange={() => handleToggleAttendance(att.id, currentStatus)}
                              />
                            </TableCell>
                          )}
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
                  teacherTotalItems > 0
                    ? `Showing ${teacherStart}-${teacherEnd} of ${teacherTotalItems.toLocaleString()} records`
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
                  {apiStudentAttendance.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {isLoading ? 'Loading student attendance...' : 'No student attendance records found for the selected filters.'}
                    </div>
                  ) : (
                    apiStudentAttendance.map(att => {
                      const originalStatus = isRecordPresent(att);
                      const currentStatus = getAttendanceStatus(att.id, originalStatus);
                      const hasChanges = attendanceChanges[att.id] !== undefined;
                      const rollNumber = att.personRollNumber ?? att.rollNumber ?? 'N/A';
                      
                      return (
                        <MobileCard
                          key={att.id}
                          title={att.personName}
                          subtitle={att.session?.title}
                          badges={[
                            { label: `Roll ${rollNumber}`, variant: 'outline' },
                            { label: `Grade ${att.personGrade ?? att.gradeLevel ?? 'N/A'}`, variant: 'secondary' },
                            { label: currentStatus ? 'Present' : 'Absent', variant: currentStatus ? 'default' : 'destructive' }
                          ]}
                          metadata={[
                            {
                              label: "Date",
                              value: new Date(att.session?.date).toLocaleDateString(),
                              icon: <CalendarIcon className="h-3 w-3" />
                            },
                            {
                              label: 'Roll Number',
                              value: rollNumber,
                              icon: <FileText className="h-3 w-3" />
                            }
                          ]}
                          actions={editMode && (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-medium">Mark Attendance:</span>
                              <Switch
                                checked={currentStatus}
                                onCheckedChange={() => handleToggleAttendance(att.id, currentStatus)}
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
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {editMode && <TableHead>Toggle</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiStudentAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={editMode ? 6 : 5} className="text-center text-muted-foreground py-8">
                        {isLoading ? 'Loading student attendance...' : 'No student attendance records found for the selected filters.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiStudentAttendance.map(att => {
                      const originalStatus = isRecordPresent(att);
                      const currentStatus = getAttendanceStatus(att.id, originalStatus);
                      const hasChanges = attendanceChanges[att.id] !== undefined;
                      const rollNumber = att.personRollNumber ?? att.rollNumber ?? '—';
                      
                      return (
                        <TableRow key={att.id} className={hasChanges ? 'bg-muted/50' : ''}>
                          <TableCell className="font-medium">{att.personName}</TableCell>
                          <TableCell className="font-mono">{rollNumber}</TableCell>
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
                                onCheckedChange={() => handleToggleAttendance(att.id, currentStatus)}
                              />
                            </TableCell>
                          )}
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
                  studentTotalItems > 0
                    ? `Showing ${studentStart}-${studentEnd} of ${studentTotalItems.toLocaleString()} records`
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

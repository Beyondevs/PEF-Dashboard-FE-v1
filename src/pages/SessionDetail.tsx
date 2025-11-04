import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PaginationControls from '@/components/PaginationControls';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Users,
  UserCheck,
  Calendar,
  Clock,
  School,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Save,
} from 'lucide-react';
import { sessions, schools, trainers, teachers, students, attendance, assessments } from '@/lib/mockData';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { usePagination } from '@/hooks/usePagination';
import { getSessionById, getSessionAttendance, bulkUpsertAttendance } from '@/lib/api';
import type { Teacher, Student } from '@/types';

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, isAdmin, canMarkAttendance } = useAuth();
  
  const [localAttendance, setLocalAttendance] = useState(attendance);
  const [localAssessments, setLocalAssessments] = useState(assessments);
  const [localSessions, setLocalSessions] = useState(sessions);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'Teacher' | 'Student'>('Teacher');
  const [modalAttendance, setModalAttendance] = useState<Record<string, boolean>>({});
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessmentScores, setAssessmentScores] = useState<Record<string, number>>({});
  
  // API session data
  const [apiSession, setApiSession] = useState<any>(null);
  const [apiAttendance, setApiAttendance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Fetch session data from API
  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setSessionError(null);
        const response = await getSessionById(id);
        setApiSession(response.data);
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setSessionError('Failed to load session details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  // Fetch attendance data from API
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!id) return;
      
      try {
        setIsAttendanceLoading(true);
        const response = await getSessionAttendance(id);
        setApiAttendance(response.data);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
        // Don't show error, just use empty attendance
        setApiAttendance(null);
      } finally {
        setIsAttendanceLoading(false);
      }
    };

    if (apiSession) {
      fetchAttendance();
    }
  }, [id, apiSession]);

  const session = useMemo(() => apiSession || localSessions.find(s => s.id === id), [apiSession, id, localSessions]);
  const school = useMemo(() => session?.school || schools.find(s => s.id === session?.schoolId), [session]);
  const trainer = useMemo(() => session?.trainer || trainers.find(t => t.id === session?.trainerId), [session]);

  // Check if session date is today (for trainer restrictions)
  // Uses date-only comparison (ignoring time) to ensure it works for entire current day
  const isSessionToday = useMemo(() => {
    if (!session?.date) return false;
    const sessionDate = new Date(session.date);
    const today = new Date();
    
    // Normalize both dates to midnight (start of day) for accurate date-only comparison
    const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return sessionDateOnly.getTime() === todayDateOnly.getTime();
  }, [session?.date]);

  // Check if trainer can mark attendance (trainers can only mark for today's sessions)
  // For today's sessions, trainers can mark attendance multiple times throughout the day
  const canTrainerMarkAttendance = useMemo(() => {
    if (role === 'admin') return true;
    if (role === 'trainer') {
      // Trainers can mark attendance multiple times for today's sessions
      // Only restrict future/past dates, not current date
      return isSessionToday;
    }
    return false;
  }, [role, isSessionToday]);

  const sessionTeachers = useMemo<Teacher[]>(() => {
    if (!session) {
      return [];
    }
    // Use API data if available, otherwise fall back to mock data
    if (session.sessionTeachers) {
      return session.sessionTeachers.map(st => ({
        id: st.teacher.id,
        name: st.teacher.name,
        cnic: st.teacher.cnic,
        phone: st.teacher.phone,
        email: st.teacher.email,
        schoolId: st.teacher.schoolId,
        rollNo: st.teacher.rollNo || '',
      }));
    }
    return teachers.filter(t => t.schoolId === session.schoolId);
  }, [session]);

  const sessionStudents = useMemo<Student[]>(() => {
    if (!session) {
      return [];
    }
    // Use API data if available, otherwise fall back to mock data
    if (session.sessionStudents) {
      return session.sessionStudents.map(ss => ({
        id: ss.student.id,
        name: ss.student.name,
        gender: ss.student.gender,
        grade: ss.student.grade,
        schoolId: ss.student.schoolId,
        rollNo: ss.student.rollNo,
      }));
    }
    return students.filter(s => s.schoolId === session.schoolId);
  }, [session]);

  const sessionAttendance = useMemo(() => {
    if (!session) return [];
    
    // Use API attendance data if available
    if (apiAttendance) {
      const attendanceList: any[] = [];
      
      // Add teacher attendance
      if (apiAttendance.teachers) {
        apiAttendance.teachers.forEach((teacher: any) => {
          if (teacher.attendance) {
            attendanceList.push({
              id: teacher.attendance.id,
              sessionId: session.id,
              personType: 'Teacher' as const,
              personId: teacher.id,
              present: teacher.attendance.present,
              markedBy: teacher.attendance.markedBy,
              timestamp: teacher.attendance.markedAt,
            });
          }
        });
      }
      
      // Add student attendance
      if (apiAttendance.students) {
        apiAttendance.students.forEach((student: any) => {
          if (student.attendance) {
            attendanceList.push({
              id: student.attendance.id,
              sessionId: session.id,
              personType: 'Student' as const,
              personId: student.id,
              present: student.attendance.present,
              markedBy: student.attendance.markedBy,
              timestamp: student.attendance.markedAt,
            });
          }
        });
      }
      
      return attendanceList;
    }
    
    // Fallback to session attendances if available
    if (session.attendances) {
      return session.attendances.map(att => ({
        id: att.id,
        sessionId: att.sessionId,
        personType: att.personType as 'Teacher' | 'Student',
        personId: att.personId,
        present: att.present,
        markedBy: att.markedBy,
        timestamp: att.markedAt,
      }));
    }
    
    // Final fallback to local mock data
    return localAttendance.filter(a => a.sessionId === session.id);
  }, [session, apiAttendance, localAttendance]);

  const sessionAssessments = useMemo(() => {
    if (!session) return [];
    // Use API data if available, otherwise fall back to mock data
    if (session.assessments) {
      return session.assessments.map(ass => ({
        id: ass.id,
        sessionId: ass.sessionId,
        studentId: ass.studentId,
        scoredBy: ass.scoredBy,
        maxScore: ass.maxScore,
        score: ass.score,
        timestamp: ass.recordedAt,
      }));
    }
    return localAssessments.filter(a => a.sessionId === session.id);
  }, [session, localAssessments]);

  const {
    items: paginatedSessionTeachers,
    page: teacherPage,
    setPage: setTeacherPage,
    totalPages: teacherTotalPages,
    startIndex: teacherStart,
    endIndex: teacherEnd,
    totalItems: teacherTotal,
  } = usePagination(sessionTeachers, { initialPageSize: 10 });

  const {
    items: paginatedSessionStudents,
    page: studentPage,
    setPage: setStudentPage,
    totalPages: studentTotalPages,
    startIndex: studentStart,
    endIndex: studentEnd,
    totalItems: studentTotal,
  } = usePagination(sessionStudents, { initialPageSize: 10 });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading session details...</p>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Session Not Found</h2>
        <p className="text-muted-foreground">{sessionError || 'The requested session could not be found.'}</p>
        <Button onClick={() => navigate('/sessions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sessions
        </Button>
      </div>
    );
  }
  
  const teacherAttendance = sessionAttendance.filter(a => a.personType === 'Teacher');
  const studentAttendance = sessionAttendance.filter(a => a.personType === 'Student');
  
  const teachersPresent = teacherAttendance.filter(a => a.present).length;
  const studentsPresent = studentAttendance.filter(a => a.present).length;

  const avgAssessmentScore = sessionAssessments.length > 0
    ? (sessionAssessments.reduce((sum, a) => sum + a.score, 0) / sessionAssessments.length).toFixed(1)
    : 'N/A';

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      Planned: 'outline',
      Ongoing: 'default',
      Completed: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const toggleAttendance = (personId: string, personType: 'Teacher' | 'Student') => {
    // Update modal attendance state for immediate UI feedback
    const key = `${personType}-${personId}`;
    setModalAttendance(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    
    // Also update local state for table switches
    setLocalAttendance(prev => {
      const existing = prev.find(a => a.sessionId === session.id && a.personId === personId && a.personType === personType);
      
      if (existing) {
        return prev.map(a =>
          a.id === existing.id ? { ...a, present: !a.present } : a
        );
      } else {
        const newAttendance = {
          id: `att_${personType[0]}_${session.id}_${personId}`,
          sessionId: session.id,
          personType,
          personId,
          present: true,
          markedBy: session.trainerId,
          timestamp: new Date().toISOString(),
        };
        return [...prev, newAttendance];
      }
    });
  };

  // Initialize modal attendance when opening the modal
  const handleOpenAttendanceModal = (type: 'Teacher' | 'Student') => {
    // Prevent trainers from opening modal for non-today sessions
    if (!canTrainerMarkAttendance && role === 'trainer') {
      toast.error('Trainers can only mark attendance for sessions scheduled on the current date');
      return;
    }
    
    setAttendanceType(type);
    const initialAttendance: Record<string, boolean> = {};
    
    if (type === 'Teacher') {
      sessionTeachers.forEach(teacher => {
        const att = getAttendanceForPerson(teacher.id, 'Teacher');
        const key = `Teacher-${teacher.id}`;
        initialAttendance[key] = att?.present ?? false;
      });
    } else {
      sessionStudents.forEach(student => {
        const att = getAttendanceForPerson(student.id, 'Student');
        const key = `Student-${student.id}`;
        initialAttendance[key] = att?.present ?? false;
      });
    }
    
    setModalAttendance(initialAttendance);
    setIsAttendanceModalOpen(true);
  };

  const getModalAttendance = (personId: string, personType: 'Teacher' | 'Student') => {
    const key = `${personType}-${personId}`;
    // If modal attendance has been modified, use that, otherwise fall back to actual attendance
    if (key in modalAttendance) {
      return modalAttendance[key];
    }
    const att = getAttendanceForPerson(personId, personType);
    return att?.present ?? false;
  };

  const handleSaveAttendance = async () => {
    if (!id || !session) {
      toast.error('Session ID not found');
      return;
    }

    try {
      setIsAttendanceLoading(true);
      
      // Prepare attendance data based on type using modal attendance state
      const attendanceData: {
        teachers?: Array<{ teacherId: string; present: boolean }>;
        students?: Array<{ studentId: string; present: boolean }>;
      } = {};

      if (attendanceType === 'Teacher') {
        attendanceData.teachers = sessionTeachers.map(teacher => {
          const key = `Teacher-${teacher.id}`;
          return {
            teacherId: teacher.id,
            present: modalAttendance[key] ?? false,
          };
        });
      } else {
        attendanceData.students = sessionStudents.map(student => {
          const key = `Student-${student.id}`;
          return {
            studentId: student.id,
            present: modalAttendance[key] ?? false,
          };
        });
      }

      // Save to API
      await bulkUpsertAttendance(id, attendanceData);
      
      // Refresh attendance data
      const response = await getSessionAttendance(id);
      setApiAttendance(response.data);
      
      // Clear modal attendance state
      setModalAttendance({});
      
      toast.success(`${attendanceType} attendance saved successfully`);
      setIsAttendanceModalOpen(false);
    } catch (error: any) {
      console.error('Failed to save attendance:', error);
      toast.error(error?.response?.data?.message || `Failed to save ${attendanceType.toLowerCase()} attendance`);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const handleOpenAssessments = () => {
    const scores: Record<string, number> = {};
    sessionStudents.forEach(student => {
      const assessment = sessionAssessments.find(a => a.studentId === student.id);
      scores[student.id] = assessment?.score || 0;
    });
    setAssessmentScores(scores);
    setIsAssessmentModalOpen(true);
  };

  const handleSaveAssessments = () => {
    const updatedAssessments = [...localAssessments];
    
    sessionStudents.forEach(student => {
      const score = assessmentScores[student.id] || 0;
      const existingIndex = updatedAssessments.findIndex(
        a => a.sessionId === session.id && a.studentId === student.id
      );
      
      if (existingIndex >= 0) {
        updatedAssessments[existingIndex] = {
          ...updatedAssessments[existingIndex],
          score,
          timestamp: new Date().toISOString(),
        };
      } else {
        updatedAssessments.push({
          id: `assess_${session.id}_${student.id}`,
          sessionId: session.id,
          studentId: student.id,
          scoredBy: session.trainerId,
          maxScore: 10,
          score,
          timestamp: new Date().toISOString(),
        });
      }
    });
    
    setLocalAssessments(updatedAssessments);
    toast.success('Assessments saved successfully');
    setIsAssessmentModalOpen(false);
  };

  const handleCompleteSession = () => {
    setLocalSessions(prev =>
      prev.map(s => s.id === session.id ? { ...s, status: 'Completed' as const } : s)
    );
    toast.success('Session marked as completed');
  };

  const getAttendanceForPerson = (personId: string, personType: 'Teacher' | 'Student') => {
    return sessionAttendance.find(
      a => a.personId === personId && a.personType === personType
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/sessions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{session.title}</h1>
            <p className="text-muted-foreground">{school?.name}</p>
          </div>
          {getStatusBadge(session.status)}
        </div>
        {session.status !== 'Completed' && isAdmin() && (
          <Button onClick={handleCompleteSession}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Session
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teachers">Teachers ({sessionTeachers.length})</TabsTrigger>
          <TabsTrigger value="students">Students ({sessionStudents.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {teachersPresent}/{sessionTeachers.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {sessionTeachers.length > 0 ? ((teachersPresent / sessionTeachers.length) * 100).toFixed(0) : 0}% present
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {studentsPresent}/{sessionStudents.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {sessionStudents.length > 0 ? ((studentsPresent / sessionStudents.length) * 100).toFixed(0) : 0}% present
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Assessment</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {avgAssessmentScore}
                  {avgAssessmentScore !== 'N/A' && '/10'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {sessionAssessments.length} assessments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-4">2h</div>
                <p className="text-xs text-muted-foreground">
                  {session.startTime} - {session.endTime}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Session Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {session.startTime} - {session.endTime}
                    </p>
                  </div>
                </div>
                 <div className="flex items-center gap-3">
                   <School className="h-5 w-5 text-muted-foreground" />
                   <div>
                     <p className="text-sm font-medium">School</p>
                     <p className="text-sm text-muted-foreground">{school?.name}</p>
                     {school?.address && (
                       <p className="text-xs text-muted-foreground mt-1">{school.address}</p>
                     )}
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <UserCheck className="h-5 w-5 text-muted-foreground" />
                   <div>
                     <p className="text-sm font-medium">Trainer</p>
                     <p className="text-sm text-muted-foreground">{trainer?.name}</p>
                     {trainer?.email && (
                       <p className="text-xs text-muted-foreground mt-1">{trainer.email}</p>
                     )}
                   </div>
                 </div>
                 {school?.emisCode && (
                   <div className="flex items-center gap-3">
                     <div className="h-5 w-5 text-muted-foreground">📋</div>
                     <div>
                       <p className="text-sm font-medium">EMIS Code</p>
                       <p className="text-sm text-muted-foreground">{school.emisCode}</p>
                     </div>
                   </div>
                 )}
                 {school?.division && school?.district && school?.tehsil && (
                   <div className="flex items-center gap-3">
                     <div className="h-5 w-5 text-muted-foreground">📍</div>
                     <div>
                       <p className="text-sm font-medium">Location</p>
                       <p className="text-sm text-muted-foreground">
                         {school.tehsil.name}, {school.district.name}, {school.division.name}
                       </p>
                     </div>
                   </div>
                 )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Course Name</p>
                  <Badge variant="outline">{session.courseName}</Badge>
                </div>
                {session.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{session.notes}</p>
                  </div>
                )}
                <div className="pt-4 space-y-2">
                  {canMarkAttendance() && session.status !== 'Completed' && (
                    <TooltipProvider>
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-full">
                              <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => handleOpenAttendanceModal('Teacher')}
                                disabled={!canTrainerMarkAttendance}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Mark Teacher Attendance
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!canTrainerMarkAttendance && role === 'trainer' && (
                            <TooltipContent>
                              <p>Trainers can only mark attendance for sessions scheduled on the current date</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-full">
                              <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => handleOpenAttendanceModal('Student')}
                                disabled={!canTrainerMarkAttendance}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Mark Student Attendance
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!canTrainerMarkAttendance && role === 'trainer' && (
                            <TooltipContent>
                              <p>Trainers can only mark attendance for sessions scheduled on the current date</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </>
                    </TooltipProvider>
                  )}
                  {isAdmin() && session.status !== 'Completed' && (
                    <Button
                      className="w-full"
                      onClick={handleOpenAssessments}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Enter Assessments
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Teacher Attendance</CardTitle>
                {canMarkAttendance() && session.status !== 'Completed' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            onClick={() => handleOpenAttendanceModal('Teacher')}
                            disabled={!canTrainerMarkAttendance}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Mark Attendance
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTrainerMarkAttendance && role === 'trainer' && (
                        <TooltipContent>
                          <p>Trainers can only mark attendance for sessions scheduled on the current date</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>CNIC</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      {canMarkAttendance() && session.status !== 'Completed' && (
                        <TableHead>Action</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSessionTeachers.map(teacher => {
                      const att = getAttendanceForPerson(teacher.id, 'Teacher');
                      return (
                        <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell className="font-mono text-sm">{teacher.cnic}</TableCell>
                        <TableCell>{teacher.phone}</TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>
                          {att?.present ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Present
                            </Badge>
                          ) : att?.present === false ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Absent
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Marked</Badge>
                          )}
                        </TableCell>
                        {canMarkAttendance() && session.status !== 'Completed' && (
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Switch
                                      checked={att?.present || false}
                                      onCheckedChange={() => toggleAttendance(teacher.id, 'Teacher')}
                                      disabled={!canTrainerMarkAttendance}
                                    />
                                  </span>
                                </TooltipTrigger>
                                {!canTrainerMarkAttendance && role === 'trainer' && (
                                  <TooltipContent>
                                    <p>Trainers can only mark attendance for sessions scheduled on the current date</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={teacherPage}
                totalPages={teacherTotalPages}
                onPageChange={setTeacherPage}
                pageInfo={
                  teacherTotal > 0
                    ? `Showing ${teacherStart}-${teacherEnd} of ${teacherTotal} teachers`
                    : undefined
                }
                className="mt-6"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Student Attendance</CardTitle>
                {canMarkAttendance() && session.status !== 'Completed' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            onClick={() => handleOpenAttendanceModal('Student')}
                            disabled={!canTrainerMarkAttendance}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Mark Attendance
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canTrainerMarkAttendance && role === 'trainer' && (
                        <TooltipContent>
                          <p>Trainers can only mark attendance for sessions scheduled on the current date</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      {canMarkAttendance() && session.status !== 'Completed' && (
                        <TableHead>Action</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSessionStudents.map(student => {
                      const att = getAttendanceForPerson(student.id, 'Student');
                      return (
                        <TableRow key={student.id}>
                        <TableCell className="font-mono">{student.rollNo}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="capitalize">{student.gender}</TableCell>
                        <TableCell>Grade {student.grade}</TableCell>
                        <TableCell>
                          {att?.present ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Present
                            </Badge>
                          ) : att?.present === false ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Absent
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Marked</Badge>
                          )}
                        </TableCell>
                        {canMarkAttendance() && session.status !== 'Completed' && (
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Switch
                                      checked={att?.present || false}
                                      onCheckedChange={() => toggleAttendance(student.id, 'Student')}
                                      disabled={!canTrainerMarkAttendance}
                                    />
                                  </span>
                                </TooltipTrigger>
                                {!canTrainerMarkAttendance && role === 'trainer' && (
                                  <TooltipContent>
                                    <p>Trainers can only mark attendance for sessions scheduled on the current date</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={studentPage}
                totalPages={studentTotalPages}
                onPageChange={setStudentPage}
                pageInfo={
                  studentTotal > 0
                    ? `Showing ${studentStart}-${studentEnd} of ${studentTotal} students`
                    : undefined
                }
                className="mt-6"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendance Marking Modal (Full Screen) */}
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark {attendanceType} Attendance</DialogTitle>
            <DialogDescription>
              Check the boxes to mark {attendanceType.toLowerCase()}s as present
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              {attendanceType === 'Teacher'
                ? sessionTeachers.map(teacher => {
                    const isPresent = getModalAttendance(teacher.id, 'Teacher');
                    return (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isPresent}
                            onCheckedChange={() => toggleAttendance(teacher.id, 'Teacher')}
                            id={`teacher-${teacher.id}`}
                          />
                          <label
                            htmlFor={`teacher-${teacher.id}`}
                            className="cursor-pointer flex-1"
                          >
                            <p className="font-medium">
                              {teacher.name || 'Unknown Teacher'}{teacher.cnic ? `_${teacher.cnic}` : ''}
                            </p>
                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                          </label>
                        </div>
                        <Badge variant={isPresent ? 'default' : 'outline'}>
                          {isPresent ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                    );
                  })
                : sessionStudents.map(student => {
                    const isPresent = getModalAttendance(student.id, 'Student');
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={isPresent}
                            onCheckedChange={() => toggleAttendance(student.id, 'Student')}
                            id={`student-${student.id}`}
                          />
                          <label
                            htmlFor={`student-${student.id}`}
                            className="cursor-pointer flex-1"
                          >
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Roll No: {student.rollNo} • Grade {student.grade}
                            </p>
                          </label>
                        </div>
                        <Badge variant={isPresent ? 'default' : 'outline'}>
                          {isPresent ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                    );
                  })}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAttendanceModalOpen(false);
                  setModalAttendance({});
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAttendance} disabled={isAttendanceLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isAttendanceLoading ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessments Entry Modal */}
      <Dialog open={isAssessmentModalOpen} onOpenChange={setIsAssessmentModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Student Assessments</DialogTitle>
            <DialogDescription>
              Enter scores (0-10) for each student
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Score (0-10)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSessionStudents.map(student => {
                    const studentAtt = getAttendanceForPerson(student.id, 'Student');
                    const isPresent = studentAtt?.present;
                    
                    return (
                      <TableRow key={student.id} className={!isPresent ? 'opacity-50' : ''}>
                      <TableCell className="font-mono">{student.rollNo}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>Grade {student.grade}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={assessmentScores[student.id] || 0}
                          onChange={e =>
                            setAssessmentScores(prev => ({
                              ...prev,
                              [student.id]: Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)),
                            }))
                          }
                          className="w-24 ml-auto"
                          disabled={!isPresent}
                        />
                      </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              currentPage={studentPage}
              totalPages={studentTotalPages}
              onPageChange={setStudentPage}
              pageInfo={
                studentTotal > 0
                  ? `Showing ${studentStart}-${studentEnd} of ${studentTotal} students`
                  : undefined
              }
            />
            
            <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-4">
              <Button variant="outline" onClick={() => setIsAssessmentModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAssessments}>
                <Save className="h-4 w-4 mr-2" />
                Save Assessments
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionDetail;

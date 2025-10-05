import { useState, useMemo } from 'react';
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

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const [localAttendance, setLocalAttendance] = useState(attendance);
  const [localAssessments, setLocalAssessments] = useState(assessments);
  const [localSessions, setLocalSessions] = useState(sessions);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'Teacher' | 'Student'>('Teacher');
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessmentScores, setAssessmentScores] = useState<Record<string, number>>({});

  const session = useMemo(() => localSessions.find(s => s.id === id), [id, localSessions]);
  const school = useMemo(() => schools.find(s => s.id === session?.schoolId), [session]);
  const trainer = useMemo(() => trainers.find(t => t.id === session?.trainerId), [session]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h2 className="text-2xl font-bold">Session Not Found</h2>
        <Button onClick={() => navigate('/sessions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sessions
        </Button>
      </div>
    );
  }

  const sessionAttendance = localAttendance.filter(a => a.sessionId === session.id);
  const sessionAssessments = localAssessments.filter(a => a.sessionId === session.id);
  
  const teacherAttendance = sessionAttendance.filter(a => a.personType === 'Teacher');
  const studentAttendance = sessionAttendance.filter(a => a.personType === 'Student');
  
  const teachersPresent = teacherAttendance.filter(a => a.present).length;
  const studentsPresent = studentAttendance.filter(a => a.present).length;

  const sessionTeachers = teachers.filter(t => t.schoolId === session.schoolId).slice(0, session.expectedTeachers);
  const sessionStudents = students.filter(s => s.schoolId === session.schoolId).slice(0, session.expectedStudents);

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

  const handleSaveAttendance = () => {
    toast.success(`${attendanceType} attendance saved successfully`);
    setIsAttendanceModalOpen(false);
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
    return localAttendance.find(
      a => a.sessionId === session.id && a.personId === personId && a.personType === personType
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
        {session.status !== 'Completed' && role === 'trainer' && (
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
                  {teachersPresent}/{session.expectedTeachers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((teachersPresent / session.expectedTeachers) * 100).toFixed(0)}% present
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
                  {studentsPresent}/{session.expectedStudents}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((studentsPresent / session.expectedStudents) * 100).toFixed(0)}% present
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
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Trainer</p>
                    <p className="text-sm text-muted-foreground">{trainer?.name}</p>
                  </div>
                </div>
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
                  {role === 'trainer' && session.status !== 'Completed' && (
                    <>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          setAttendanceType('Teacher');
                          setIsAttendanceModalOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Mark Teacher Attendance
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => {
                          setAttendanceType('Student');
                          setIsAttendanceModalOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Mark Student Attendance
                      </Button>
                      <Button
                        className="w-full"
                        onClick={handleOpenAssessments}
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Enter Assessments
                      </Button>
                    </>
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
                {role === 'trainer' && session.status !== 'Completed' && (
                  <Button
                    onClick={() => {
                      setAttendanceType('Teacher');
                      setIsAttendanceModalOpen(true);
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>CNIC</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    {role === 'trainer' && session.status !== 'Completed' && (
                      <TableHead>Action</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionTeachers.map(teacher => {
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
                        {role === 'trainer' && session.status !== 'Completed' && (
                          <TableCell>
                            <Switch
                              checked={att?.present || false}
                              onCheckedChange={() => toggleAttendance(teacher.id, 'Teacher')}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Student Attendance</CardTitle>
                {role === 'trainer' && session.status !== 'Completed' && (
                  <Button
                    onClick={() => {
                      setAttendanceType('Student');
                      setIsAttendanceModalOpen(true);
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    {role === 'trainer' && session.status !== 'Completed' && (
                      <TableHead>Action</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionStudents.map(student => {
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
                        {role === 'trainer' && session.status !== 'Completed' && (
                          <TableCell>
                            <Switch
                              checked={att?.present || false}
                              onCheckedChange={() => toggleAttendance(student.id, 'Student')}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
                    const att = getAttendanceForPerson(teacher.id, 'Teacher');
                    return (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={att?.present || false}
                            onCheckedChange={() => toggleAttendance(teacher.id, 'Teacher')}
                            id={`teacher-${teacher.id}`}
                          />
                          <label
                            htmlFor={`teacher-${teacher.id}`}
                            className="cursor-pointer"
                          >
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                          </label>
                        </div>
                        <Badge variant={att?.present ? 'default' : 'outline'}>
                          {att?.present ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                    );
                  })
                : sessionStudents.map(student => {
                    const att = getAttendanceForPerson(student.id, 'Student');
                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={att?.present || false}
                            onCheckedChange={() => toggleAttendance(student.id, 'Student')}
                            id={`student-${student.id}`}
                          />
                          <label
                            htmlFor={`student-${student.id}`}
                            className="cursor-pointer"
                          >
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Roll No: {student.rollNo} • Grade {student.grade}
                            </p>
                          </label>
                        </div>
                        <Badge variant={att?.present ? 'default' : 'outline'}>
                          {att?.present ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                    );
                  })}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-4">
              <Button variant="outline" onClick={() => setIsAttendanceModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAttendance}>
                <Save className="h-4 w-4 mr-2" />
                Save Attendance
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
                {sessionStudents.map(student => {
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

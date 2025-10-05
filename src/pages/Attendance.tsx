import { useState } from 'react';
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

const Attendance = () => {
  const { filters } = useFilters();
  const [editMode, setEditMode] = useState(false);
  const [attendanceChanges, setAttendanceChanges] = useState<Record<string, boolean>>({});

  const handleExport = () => {
    toast.success('Export generated successfully');
  };

  const handleSaveChanges = () => {
    toast.success(`Attendance updated for ${Object.keys(attendanceChanges).length} records`);
    setAttendanceChanges({});
    setEditMode(false);
  };

  const toggleAttendance = (recordId: string, currentStatus: boolean) => {
    setAttendanceChanges(prev => ({
      ...prev,
      [recordId]: !currentStatus,
    }));
  };

  const getAttendanceStatus = (recordId: string, originalStatus: boolean) => {
    return attendanceChanges[recordId] !== undefined ? attendanceChanges[recordId] : originalStatus;
  };

  const teacherAttendance = attendance.filter(a => a.personType === 'Teacher').slice(0, 50);
  const studentAttendance = attendance.filter(a => a.personType === 'Student').slice(0, 50);

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
                  {teacherAttendance.map(att => {
                    const teacher = teachers.find(t => t.id === att.personId);
                    const session = sessions.find(s => s.id === att.sessionId);
                    const currentStatus = getAttendanceStatus(att.id, att.present);
                    const hasChanges = attendanceChanges[att.id] !== undefined;
                    
                    return (
                      <TableRow key={att.id} className={hasChanges ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">{teacher?.name}</TableCell>
                        <TableCell>{session?.title}</TableCell>
                        <TableCell>{session?.date}</TableCell>
                        <TableCell>
                          <Badge variant={currentStatus ? 'default' : 'destructive'}>
                            {currentStatus ? 'Present' : 'Absent'}
                          </Badge>
                        </TableCell>
                        {editMode && (
                          <TableCell>
                            <Switch
                              checked={currentStatus}
                              onCheckedChange={() => toggleAttendance(att.id, att.present)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(att.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {studentAttendance.map(att => {
                    const student = students.find(s => s.id === att.personId);
                    const session = sessions.find(s => s.id === att.sessionId);
                    const currentStatus = getAttendanceStatus(att.id, att.present);
                    const hasChanges = attendanceChanges[att.id] !== undefined;
                    
                    return (
                      <TableRow key={att.id} className={hasChanges ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">{student?.name}</TableCell>
                        <TableCell>Grade {student?.grade}</TableCell>
                        <TableCell>{session?.title}</TableCell>
                        <TableCell>{session?.date}</TableCell>
                        <TableCell>
                          <Badge variant={currentStatus ? 'default' : 'destructive'}>
                            {currentStatus ? 'Present' : 'Absent'}
                          </Badge>
                        </TableCell>
                        {editMode && (
                          <TableCell>
                            <Switch
                              checked={currentStatus}
                              onCheckedChange={() => toggleAttendance(att.id, att.present)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(att.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, MapPin, Users, TrendingUp } from 'lucide-react';
import { sessions, schools, attendance, divisions, districts, tehsils } from '@/lib/mockData';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';

const TodayReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date === today);
  const ongoingSessions = todaySessions.filter(s => s.status === 'Ongoing');
  const completedSessions = todaySessions.filter(s => s.status === 'Completed');
  
  const todayAttendance = attendance.filter(a => {
    const session = sessions.find(s => s.id === a.sessionId);
    return session?.date === today;
  });

  const teachersPresent = todayAttendance.filter(a => a.personType === 'Teacher' && a.present).length;
  const studentsPresent = todayAttendance.filter(a => a.personType === 'Student' && a.present).length;

  const handleExport = () => {
    toast.success("Today's report exported successfully");
  };

  const getLocationInfo = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    if (!school) return { division: '-', district: '-', tehsil: '-' };
    
    const division = divisions.find(d => d.id === school.divisionId);
    const district = districts.find(d => d.id === school.districtId);
    const tehsil = tehsils.find(t => t.id === school.tehsilId);
    
    return {
      division: division?.name || '-',
      district: district?.name || '-',
      tehsil: tehsil?.name || '-',
    };
  };

  const {
    items: paginatedSessions,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(todaySessions, { initialPageSize: 10 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Today's Activity Report</h1>
          <p className="text-muted-foreground">Real-time snapshot of ongoing sessions and attendance - {new Date().toLocaleDateString()}</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySessions.length}</div>
            <p className="text-xs text-muted-foreground">
              {ongoingSessions.length} ongoing, {completedSessions.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(todaySessions.map(s => s.schoolId)).size}
            </div>
            <p className="text-xs text-muted-foreground">Schools with sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers Present</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachersPresent}</div>
            <p className="text-xs text-muted-foreground">Across all sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Present</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsPresent}</div>
            <p className="text-xs text-muted-foreground">Total attendance today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Tehsil</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.map(session => {
                  const school = schools.find(s => s.id === session.schoolId);
                  const location = getLocationInfo(session.schoolId);
                  const sessionAttendance = todayAttendance.filter(a => a.sessionId === session.id);
                  const present = sessionAttendance.filter(a => a.present).length;
                  const total = sessionAttendance.length;

                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{school?.name}</TableCell>
                    <TableCell>{location.division}</TableCell>
                    <TableCell>{location.district}</TableCell>
                    <TableCell>{location.tehsil}</TableCell>
                    <TableCell className="text-sm">
                      {session.startTime} - {session.endTime}
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.status === 'Ongoing' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </TableCell>
                      <TableCell className="text-right font-medium">
                        {present}/{total}
                      </TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageInfo={
              totalItems > 0
                ? `Showing ${startIndex}-${endIndex} of ${totalItems} sessions`
                : undefined
            }
            className="mt-6"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TodayReport;

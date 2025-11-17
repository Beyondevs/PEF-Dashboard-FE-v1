import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, MapPin, Users, TrendingUp, Loader2 } from 'lucide-react';
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
import { useEffect, useState, useCallback } from 'react';
import { getTodayActivityReport } from '@/lib/api';
import { useFilters } from '@/contexts/FilterContext';

interface SessionData {
  id: string;
  title: string | null;
  courseName: string | null;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  status: string | null;
  school: {
    id: string;
    name: string;
    emisCode: string | null;
  };
  division: {
    id?: string;
    name?: string;
  };
  district: {
    id?: string;
    name?: string;
  };
  tehsil: {
    id?: string;
    name?: string;
  };
  attendance: {
    teachersPresent: number;
    teachersTotal: number;
    studentsPresent: number;
    studentsTotal: number;
  };
}

interface TodayActivityData {
  date: string;
  summary: {
    totalSessions: number;
    ongoingSessions: number;
    completedSessions: number;
    activeSchools: number;
    teachersPresent: number;
    teachersTotal: number;
    studentsPresent: number;
    studentsTotal: number;
  };
  sessions: SessionData[];
}

const TodayReport = () => {
  const { filters } = useFilters();
  const [todayData, setTodayData] = useState<TodayActivityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  const handleExport = () => {
    toast.success("Today's report exported successfully");
  };

  const fetchTodayActivity = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {
        date: today,
      };

      // Apply geography filters
      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;

      const response = await getTodayActivityReport(params);
      setTodayData(response.data);
    } catch (error) {
      console.error('Failed to fetch today activity:', error);
      toast.error("Failed to load today's activity report");
    } finally {
      setIsLoading(false);
    }
  }, [today, filters.division, filters.district, filters.tehsil, filters.school]);

  useEffect(() => {
    fetchTodayActivity();
  }, [fetchTodayActivity]);

  const {
    items: paginatedSessions,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(todayData?.sessions || [], { initialPageSize: 10 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Today's Activity Report</h1>
            <p className="text-muted-foreground">Real-time snapshot of ongoing sessions and attendance - {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const summary = todayData?.summary || {
    totalSessions: 0,
    ongoingSessions: 0,
    completedSessions: 0,
    activeSchools: 0,
    teachersPresent: 0,
    teachersTotal: 0,
    studentsPresent: 0,
    studentsTotal: 0,
  };

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
            <div className="text-2xl font-bold">{summary.totalSessions}</div>
            {/* <p className="text-xs text-muted-foreground">
              {summary.ongoingSessions} ongoing, {summary.completedSessions} completed
            </p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeSchools}</div>
            {/* <p className="text-xs text-muted-foreground">Schools with sessions</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers Present</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.teachersPresent}</div>
            {/* <p className="text-xs text-muted-foreground">
              Out of {summary.teachersTotal} total
            </p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Present</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.studentsPresent}</div>
            {/* <p className="text-xs text-muted-foreground">
              Out of {summary.studentsTotal} total
            </p> */}
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
                  <TableHead className="text-right">Teacher Attendance</TableHead>
                  <TableHead className="text-right">Student Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No sessions scheduled for today
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSessions.map(session => {
                    const teacherAttendance = `${session.attendance.teachersPresent}/${session.attendance.teachersTotal}`;
                    const studentAttendance = `${session.attendance.studentsPresent}/${session.attendance.studentsTotal}`;

                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.title || session.courseName || 'Untitled Session'}</TableCell>
                        <TableCell className="max-w-xs truncate">{session.school?.name}</TableCell>
                        <TableCell>{session.division?.name || '-'}</TableCell>
                        <TableCell>{session.district?.name || '-'}</TableCell>
                        <TableCell>{session.tehsil?.name || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {session.startTime} - {session.endTime}
                        </TableCell>
                        <TableCell>
                          <Badge variant={session.status === 'Ongoing' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {teacherAttendance}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {studentAttendance}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
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

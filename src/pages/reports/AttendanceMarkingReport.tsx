import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Calendar } from 'lucide-react';
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
import { getAttendanceMarkingStatus, exportAttendanceMarkingCSV } from '@/lib/api';
import { useFilters } from '@/contexts/FilterContext';
import { useNavigate } from 'react-router-dom';

interface SessionData {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  trainer: {
    id: string;
    name: string;
    email: string;
  };
  school: {
    id: string;
    name: string;
    emisCode: string | null;
    division: string | null;
    district: string | null;
    tehsil: string | null;
  };
  attendanceStatus: {
    hasAttendance: boolean;
    markedCount: number;
    totalExpected: number;
    teacherCount: number;
    studentCount: number;
  };
}

interface AttendanceMarkingData {
  summary: {
    totalSessions: number;
    markedSessions: number;
    unmarkedSessions: number;
    markingRate: number;
  };
  markedSessions: SessionData[];
  unmarkedSessions: SessionData[];
}

const AttendanceMarkingReport = () => {
  const { filters, setFilters } = useFilters();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<AttendanceMarkingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'marked' | 'unmarked'>('unmarked');
  
  // Local date filter state (separate from global filters for this page)
  const [dateFrom, setDateFrom] = useState(filters.startDate || '');
  const [dateTo, setDateTo] = useState(filters.endDate || '');

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      
      // Apply geography filters
      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;
      
      // Apply date filters
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const blob = await exportAttendanceMarkingCSV(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateRange = dateFrom && dateTo ? `-${dateFrom}-to-${dateTo}` : dateFrom ? `-from-${dateFrom}` : '';
      link.download = `attendance-marking-status${dateRange}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Attendance marking report exported successfully');
    } catch (error) {
      console.error('Failed to export attendance marking report:', error);
      toast.error('Failed to export attendance marking report');
    }
  };

  const fetchReportData = useCallback(async (applyDateFilters = false, customDateFrom?: string, customDateTo?: string) => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};

      // Apply geography filters
      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;
      
      // Apply date filters only when explicitly requested (via Apply button)
      if (applyDateFilters) {
        const fromDate = customDateFrom !== undefined ? customDateFrom : dateFrom;
        const toDate = customDateTo !== undefined ? customDateTo : dateTo;
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
      }

      const response = await getAttendanceMarkingStatus(params);
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance marking status:', error);
      toast.error('Failed to load attendance marking status report');
    } finally {
      setIsLoading(false);
    }
  }, [filters.division, filters.district, filters.tehsil, filters.school, dateFrom, dateTo]);

  // Initial load without date filters
  useEffect(() => {
    fetchReportData(false);
  }, [filters.division, filters.district, filters.tehsil, filters.school]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      Completed: 'default',
      Ongoing: 'destructive',
      Draft: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const displaySessions = activeTab === 'marked' 
    ? reportData?.markedSessions || []
    : activeTab === 'unmarked'
    ? reportData?.unmarkedSessions || []
    : [...(reportData?.markedSessions || []), ...(reportData?.unmarkedSessions || [])];

  const {
    items: paginatedSessions,
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(displaySessions, { initialPageSize: 20 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const handleDateFilterChange = async () => {
    // Update global filters with date range
    setFilters(prev => ({
      ...prev,
      startDate: dateFrom || prev.startDate,
      endDate: dateTo || prev.endDate,
    }));
    // Trigger refetch with date filters applied
    await fetchReportData(true);
  };

  const handleResetDateFilter = async () => {
    const today = new Date().toISOString().split('T')[0];
    setDateFrom('');
    setDateTo('');
    setFilters(prev => ({
      ...prev,
      startDate: today,
      endDate: today,
    }));
    // Trigger refetch without date filters (pass empty strings to clear)
    await fetchReportData(false, '', '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Marking Status Report</h1>
            <p className="text-muted-foreground">
              View which sessions have attendance marked and which are still pending
            </p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDateFilterChange} className="flex-1 sm:flex-initial">
                Apply Filter
              </Button>
              {(dateFrom || dateTo) && (
                <Button onClick={handleResetDateFilter} variant="outline">
                  Reset
                </Button>
              )}
            </div>
          </div>
          {(dateFrom || dateTo) && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing sessions from{' '}
              <span className="font-medium">
                {dateFrom ? new Date(dateFrom).toLocaleDateString() : 'beginning'}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {dateTo ? new Date(dateTo).toLocaleDateString() : 'end'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Marked Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reportData.summary.markedSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.summary.totalSessions > 0
                ? Math.round((reportData.summary.markedSessions / reportData.summary.totalSessions) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unmarked Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{reportData.summary.unmarkedSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.summary.totalSessions > 0
                ? Math.round((reportData.summary.unmarkedSessions / reportData.summary.totalSessions) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Marking Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.summary.markingRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
          className="rounded-b-none"
        >
          All Sessions ({reportData.summary.totalSessions})
        </Button>
        <Button
          variant={activeTab === 'marked' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('marked')}
          className="rounded-b-none"
        >
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
          Marked ({reportData.summary.markedSessions})
        </Button>
        <Button
          variant={activeTab === 'unmarked' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('unmarked')}
          className="rounded-b-none"
        >
          <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
          Unmarked ({reportData.summary.unmarkedSessions})
        </Button>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'marked' && 'Marked Sessions'}
            {activeTab === 'unmarked' && 'Unmarked Sessions'}
            {activeTab === 'all' && 'All Sessions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sessions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Trainer</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.title}</TableCell>
                        <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {session.startTime} - {session.endTime}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{session.trainer.name}</div>
                            <div className="text-xs text-muted-foreground">{session.trainer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{session.school.name}</div>
                            {session.school.emisCode && (
                              <div className="text-xs text-muted-foreground">
                                EMIS: {session.school.emisCode}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {session.school.division && <div>{session.school.division}</div>}
                            {session.school.district && (
                              <div className="text-muted-foreground">{session.school.district}</div>
                            )}
                            {session.school.tehsil && (
                              <div className="text-muted-foreground">{session.school.tehsil}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>
                          {session.attendanceStatus.hasAttendance ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm">
                                {session.attendanceStatus.markedCount}/{session.attendanceStatus.totalExpected}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Not Marked</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/sessions/${session.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageInfo={
                  totalItems > 0
                    ? `Showing ${startIndex}-${endIndex} of ${totalItems} sessions`
                    : undefined
                }
                className="mt-6"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceMarkingReport;



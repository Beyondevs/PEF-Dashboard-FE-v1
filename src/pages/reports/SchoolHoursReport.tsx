import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, ArrowLeft } from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolHoursReport, exportSchoolHoursCSV } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

type SchoolRow = {
  schoolId: string;
  schoolName: string;
  emisCode: string | null;
  division: string | null;
  district: string | null;
  tehsil: string | null;
  sessionCount: number;
  days: number;
  totalHours: number;
  avgHoursPerDay: number;
};

type DailyRow = {
  date: string;
  schoolId: string;
  schoolName: string;
  emisCode: string | null;
  division: string | null;
  district: string | null;
  tehsil: string | null;
  sessionCount: number;
  hours: number;
};

type SchoolHoursReportData = {
  summary: {
    from: string;
    to: string;
    totalSchools: number;
    totalSessions: number;
    totalHours: number;
  };
  schools: SchoolRow[];
  daily: DailyRow[];
};

const SchoolHoursReport = () => {
  const { filters } = useFilters();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState<SchoolHoursReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'schools' | 'daily'>('schools');

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (filters.division) params.divisionId = filters.division;
    if (filters.district) params.districtId = filters.district;
    if (filters.tehsil) params.tehsilId = filters.tehsil;
    if (filters.school) params.schoolId = filters.school;
    if (filters.startDate) params.from = filters.startDate;
    if (filters.endDate) params.to = filters.endDate;
    return params;
  }, [filters]);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getSchoolHoursReport(buildParams());
      setReportData(response.data);
    } catch (e) {
      console.error('Failed to fetch school hours report:', e);
      toast.error('Failed to load school hours report');
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportSchoolHoursCSV(buildParams());
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const dateRange =
        filters.startDate && filters.endDate
          ? `-${filters.startDate}-to-${filters.endDate}`
          : filters.startDate
          ? `-from-${filters.startDate}`
          : '';
      link.download = `school-hours${dateRange}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('School hours report exported successfully');
    } catch (e) {
      console.error('Failed to export school hours report:', e);
      toast.error('Failed to export school hours report');
    } finally {
      setIsExporting(false);
    }
  };

  const schools = reportData?.schools || [];
  const daily = reportData?.daily || [];

  const {
    items: paginatedSchools,
    page: schoolPage,
    setPage: setSchoolPage,
    totalPages: schoolTotalPages,
    startIndex: schoolStart,
    endIndex: schoolEnd,
    totalItems: schoolTotalItems,
  } = usePagination(schools, { initialPageSize: 20 });

  const {
    items: paginatedDaily,
    page: dailyPage,
    setPage: setDailyPage,
    totalPages: dailyTotalPages,
    startIndex: dailyStart,
    endIndex: dailyEnd,
    totalItems: dailyTotalItems,
  } = usePagination(daily, { initialPageSize: 20 });

  // Reset pagination when switching tabs
  useEffect(() => {
    setSchoolPage(1);
    setDailyPage(1);
  }, [activeTab, setSchoolPage, setDailyPage]);

  const summary = useMemo(
    () =>
      reportData?.summary || {
        from: '',
        to: '',
        totalSchools: 0,
        totalSessions: 0,
        totalHours: 0,
      },
    [reportData],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">School Hours Report</h1>
            <p className="text-muted-foreground">
              Daily training hours and consolidated total hours per school
            </p>
          </div>
        </div>

        {role !== 'bnu' && (
          <Button onClick={handleExport} variant="outline" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exporting…' : 'Export'}
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalHours.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {summary.from} to {summary.to}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSchools.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSessions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Default Range</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If no date filter is selected, the report defaults to the last 30 days.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="schools">By School (Totals)</TabsTrigger>
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="schools" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">School Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                      <TableHead className="text-right">Total Hours</TableHead>
                      <TableHead className="text-right">Avg Hours/Day</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSchools.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No data for selected filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSchools.map((s) => (
                        <TableRow key={s.schoolId}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{s.schoolName}</span>
                              <span className="text-xs text-muted-foreground">{s.emisCode || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {[s.tehsil, s.district, s.division].filter(Boolean).join(', ') || '-'}
                          </TableCell>
                          <TableCell className="text-right">{s.sessionCount}</TableCell>
                          <TableCell className="text-right">{s.days}</TableCell>
                          <TableCell className="text-right">{s.totalHours}</TableCell>
                          <TableCell className="text-right">{s.avgHoursPerDay}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={schoolPage}
                totalPages={schoolTotalPages}
                onPageChange={setSchoolPage}
                pageInfo={
                  schoolTotalItems > 0
                    ? `Showing ${schoolStart}-${schoolEnd} of ${schoolTotalItems.toLocaleString()} schools`
                    : undefined
                }
                className="mt-6"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDaily.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No data for selected filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedDaily.map((d) => (
                        <TableRow key={`${d.date}-${d.schoolId}`}>
                          <TableCell className="font-medium">{d.date}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{d.schoolName}</span>
                              <span className="text-xs text-muted-foreground">{d.emisCode || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {[d.tehsil, d.district, d.division].filter(Boolean).join(', ') || '-'}
                          </TableCell>
                          <TableCell className="text-right">{d.sessionCount}</TableCell>
                          <TableCell className="text-right">{d.hours}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={dailyPage}
                totalPages={dailyTotalPages}
                onPageChange={setDailyPage}
                pageInfo={
                  dailyTotalItems > 0
                    ? `Showing ${dailyStart}-${dailyEnd} of ${dailyTotalItems.toLocaleString()} rows`
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

export default SchoolHoursReport;



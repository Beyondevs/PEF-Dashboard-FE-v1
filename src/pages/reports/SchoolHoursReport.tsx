import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';
import { getSchoolHoursSchoolsList, exportSchoolHoursSchoolsListCSV } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

type SchoolListRow = {
  schoolId: string;
  schoolName: string;
  emisCode: string | null;
  division: string | null;
  district: string | null;
  tehsil: string | null;
  totalHours: number;
  totalDays: number;
  presentPeopleCount: number;
  presentTeacherCount?: number;
  presentStudentCount?: number;
};

type SchoolListData = {
  summary: {
    from: string;
    to: string;
    totalSchools: number;
  };
  schools: SchoolListRow[];
};

function formatHoursAsHHhMMm(hours: number): string {
  if (!Number.isFinite(hours)) return '00h 00m';
  const mins = Math.max(0, Math.round(hours * 60));
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${String(hh).padStart(2, '0')}h ${String(mm).padStart(2, '0')}m`;
}

const SchoolHoursReport = () => {
  const { filters } = useFilters();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState<SchoolListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
      const response = await getSchoolHoursSchoolsList(buildParams());
      setReportData(response.data);
    } catch (e) {
      const err = e as any;
      const status = err?.response?.status || err?.response?.statusCode;
      const message = err?.message || 'Failed to load school hours report';
      console.error('Failed to fetch school hours report:', { status, message, err });
      toast.error(status ? `Failed to load school hours report (HTTP ${status})` : message);
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const params = buildParams();
      const blob = await exportSchoolHoursSchoolsListCSV(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateRange =
        params.from && params.to
          ? `-${params.from}-to-${params.to}`
          : params.from
          ? `-from-${params.from}`
          : '';
      link.download = `school-hours-schools-list${dateRange}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('School hours report exported successfully');
    } catch (error) {
      console.error('Failed to export school hours report:', error);
      toast.error('Failed to export school hours report');
    } finally {
      setIsExporting(false);
    }
  }, [buildParams]);

  const summary = useMemo(
    () =>
      reportData?.summary || {
        from: '',
        to: '',
        totalSchools: 0,
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

  const schools = reportData?.schools || [];

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">School Hours Report</h1>
            <p className="text-muted-foreground">
              School-wise summary (Total Hours + Present People). Click Detail to view month-wise grid.
            </p>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button onClick={handleExport} variant="outline" disabled={isExporting || schools.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={fetchReport} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4 print:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Period</CardTitle>
          </CardHeader>
          <CardContent>
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
        <div className="hidden md:block" />
        <div className="hidden md:block" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Schools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Total Days</TableHead>
                  <TableHead className="text-right">Present People</TableHead>
                  <TableHead className="text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No schools found for selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  schools.map((s) => (
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
                      <TableCell className="text-right whitespace-nowrap">{formatHoursAsHHhMMm(s.totalHours)}</TableCell>
                      <TableCell className="text-right">{s.totalDays}</TableCell>
                      <TableCell className="text-right">
                        {s.presentPeopleCount}
                        {(s.presentTeacherCount !== undefined || s.presentStudentCount !== undefined) && (
                          <div className="text-xs text-muted-foreground">
                            T:{s.presentTeacherCount ?? 0} / S:{s.presentStudentCount ?? 0}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/reports/school-hours/${s.schoolId}`)}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolHoursReport;



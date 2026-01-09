import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';
import { exportSchoolHoursConsolidatedCSV, getSchoolHoursConsolidatedReport } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type ConsolidatedRow = {
  personId: string;
  name: string;
  role: 'Teacher' | 'Student';
  days: Record<number, '' | 'P' | 'A'>;
  presentDays: number;
  totalHours: number;
};

type ConsolidatedMonth = {
  monthKey: string;
  label: string;
  dayDurationsMinutes: Record<number, number>;
  rows: ConsolidatedRow[];
};

type ConsolidatedSchool = {
  schoolId: string;
  schoolName: string;
  emisCode: string | null;
  division: string | null;
  district: string | null;
  tehsil: string | null;
  months: ConsolidatedMonth[];
};

type ConsolidatedReportData = {
  summary: {
    from: string;
    to: string;
    months: Array<{ key: string; label: string }>;
    totalSchools: number;
    totalPeople: number;
  };
  schools: ConsolidatedSchool[];
  studentSummary: Array<{ studentId: string; name: string; totalHours: number }>;
};

const SchoolHoursSchoolDetail = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { filters } = useFilters();
  const { role } = useAuth();

  const [reportData, setReportData] = useState<ConsolidatedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (filters.division) params.divisionId = filters.division;
    if (filters.district) params.districtId = filters.district;
    if (filters.tehsil) params.tehsilId = filters.tehsil;
    if (filters.startDate) params.from = filters.startDate;
    if (filters.endDate) params.to = filters.endDate;
    if (schoolId) params.schoolId = schoolId;
    return params;
  }, [filters, schoolId]);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getSchoolHoursConsolidatedReport(buildParams());
      setReportData(response.data);
    } catch (e) {
      const err = e as any;
      const status = err?.response?.status || err?.response?.statusCode;
      const message = err?.message || 'Failed to load school hours detail';
      console.error('Failed to fetch school hours detail:', { status, message, err });
      toast.error(status ? `Failed to load school hours detail (HTTP ${status})` : message);
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async () => {
    if (!schoolId) return;
    setIsExporting(true);
    try {
      const params = buildParams();
      const blob = await exportSchoolHoursConsolidatedCSV(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const dateRange =
        filters.startDate && filters.endDate
          ? `-${filters.startDate}-to-${filters.endDate}`
          : filters.startDate
          ? `-from-${filters.startDate}`
          : '';
      link.download = `school-hours-${schoolId}${dateRange}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Exported consolidated school hours');
    } catch (e) {
      console.error('Failed to export consolidated school hours:', e);
      toast.error('Failed to export consolidated school hours');
    } finally {
      setIsExporting(false);
    }
  };

  const school = reportData?.schools?.[0];
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports/school-hours')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to School List
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No data for this school and selected filters.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports/school-hours')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to School List
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{school.schoolName}</h1>
            <p className="text-muted-foreground">
              {[school.tehsil, school.district, school.division].filter(Boolean).join(', ') || '-'} ·{' '}
              {school.emisCode || '-'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {role !== 'bnu' && (
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? 'Exporting…' : 'Export'}
            </Button>
          )}
          <Button variant="outline" onClick={fetchReport}>
            Refresh
          </Button>
        </div>
      </div>

      {school.months.map((m) => (
        <Card key={m.monthKey}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{m.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Role</TableHead>
                    <TableHead className="w-[220px]">Name</TableHead>
                    <TableHead className="w-[90px] text-right">Days</TableHead>
                    <TableHead className="w-[110px] text-right">Hours</TableHead>
                    {days.map((d) => (
                      <TableHead key={d} className="w-[32px] text-center p-1">
                        {d}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead colSpan={4} className="text-xs text-muted-foreground">
                      Session duration (hours) per day
                    </TableHead>
                    {days.map((d) => {
                      const mins = m.dayDurationsMinutes?.[d] || 0;
                      const hrs = mins ? Math.round((mins / 60) * 100) / 100 : 0;
                      return (
                        <TableHead key={`dur-${d}`} className="text-[10px] text-center p-1 text-muted-foreground">
                          {hrs ? hrs : ''}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4 + days.length} className="text-center text-muted-foreground py-6">
                        No attendance records for this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    m.rows.map((r) => (
                      <TableRow key={`${m.monthKey}-${r.role}-${r.personId}`}>
                        <TableCell className="text-xs">{r.role}</TableCell>
                        <TableCell className="text-xs font-medium">{r.name}</TableCell>
                        <TableCell className="text-xs text-right">{r.presentDays}</TableCell>
                        <TableCell className="text-xs text-right">{r.totalHours}</TableCell>
                        {days.map((d) => {
                          const v = r.days?.[d] || '';
                          const minsForDay = m.dayDurationsMinutes?.[d] || 0;
                          const isNoSessionDay = minsForDay === 0;
                          const cls =
                            v === 'P'
                              ? 'bg-green-50 text-green-700'
                              : v === 'A'
                              ? 'bg-red-50 text-red-700'
                              : '';
                          return (
                            <TableCell key={`${r.personId}-${d}`} className={`text-[10px] text-center p-1 ${cls}`}>
                              {isNoSessionDay ? 'NS' : v === 'P' ? 'P' : v === 'A' ? 'A' : ''}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SchoolHoursSchoolDetail;


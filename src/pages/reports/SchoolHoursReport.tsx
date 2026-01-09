import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, ArrowLeft, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSchoolHoursConsolidatedReport } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

type ConsolidatedRow = {
  personId: string;
  name: string;
  role: 'Teacher' | 'Student';
  days: Record<number, '' | 'P' | 'A'>;
  presentDays: number;
  totalHours: number;
};

type ConsolidatedMonth = {
  monthKey: string; // YYYY-MM
  label: string; // e.g. Oct 2025
  dayDurationsMinutes: Record<number, number>; // 1..31
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

const SchoolHoursReport = () => {
  const { filters } = useFilters();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState<ConsolidatedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const response = await getSchoolHoursConsolidatedReport(buildParams());
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

  const handlePrint = () => {
    window.print();
  };

  const summary = useMemo(
    () =>
      reportData?.summary || {
        from: '',
        to: '',
        months: [],
        totalSchools: 0,
        totalPeople: 0,
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

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const schools = reportData?.schools || [];
  const studentSummary = reportData?.studentSummary || [];

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
              Consolidated attendance + hours (School-wise, merged Teachers + Students)
            </p>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {role !== 'bnu' && (
            <Button onClick={fetchReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
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
            <p className="text-xs text-muted-foreground">
              Months: {summary.months.map((m) => m.label).join(' → ')}
            </p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total People</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPeople.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hours Rule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hours are calculated per day (no duplicates): if a person is present in any session that day, it counts as 1 active day × that day’s session duration.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* School-wise printable sections */}
      <div className="space-y-8 print:space-y-6">
        {schools.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No data for selected filters.
            </CardContent>
          </Card>
        ) : (
          schools.map((s, idx) => (
            <div
              key={s.schoolId}
              style={idx === 0 ? undefined : ({ breakBefore: 'page' } as any)}
              className="space-y-4"
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {s.schoolName} <span className="text-muted-foreground font-normal">({s.emisCode || '-'})</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {[s.tehsil, s.district, s.division].filter(Boolean).join(', ') || '—'}
                  </p>
                </CardHeader>
              </Card>

              {s.months.map((m) => (
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
                                  const cls =
                                    v === 'P'
                                      ? 'bg-green-50 text-green-700'
                                      : v === 'A'
                                      ? 'bg-red-50 text-red-700'
                                      : '';
                                  return (
                                    <TableCell key={`${r.personId}-${d}`} className={`text-[10px] text-center p-1 ${cls}`}>
                                      {v === 'P' ? 'P' : v === 'A' ? 'A' : ''}
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
          ))
        )}
      </div>

      {/* Student-wise consolidated hours summary */}
      <Card style={{ breakBefore: 'page' } as any}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Student Summary (Consolidated Hours)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total consolidated hours per student for the selected period.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      No student data for selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  studentSummary.map((s) => (
                    <TableRow key={s.studentId}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">{s.totalHours}</TableCell>
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



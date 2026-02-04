import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Printer, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';
import {
  exportSchoolHoursConsolidatedCSV,
  exportSchoolHoursConsolidatedAllSchoolsZip,
  getSchoolHoursConsolidatedReport,
  getSchoolHoursSchoolsList,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type ConsolidatedRow = {
  personId: string;
  name: string;
  role: 'Teacher' | 'Student';
  rollNoOrCnic?: string;
  days: Record<number, '' | 'P' | 'A' | 'NM'>;
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

type SchoolListRow = {
  schoolId: string;
  schoolName: string;
  emisCode: string | null;
};

function safeFilenamePart(input: string) {
  // Windows/macOS safe-ish filename (avoid reserved chars)
  return input
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

function formatMinutesAsHHMM(mins: number): string {
  const m = Math.max(0, Math.round(mins || 0));
  if (!m) return '';
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatHoursAsHHMM(hours: number): string {
  if (!Number.isFinite(hours)) return '00:00';
  const mins = Math.max(0, Math.round(hours * 60));
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Default date range when no filter is applied: Oct 2025 through Feb 2026 (incl. February). */
function getDefaultSchoolHoursRange(): { from: string; to: string } {
  const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const lastDayFeb2026 = isLeap(2026) ? 29 : 28;
  return {
    from: '2025-10-01',
    to: `2026-02-${String(lastDayFeb2026).padStart(2, '0')}`,
  };
}

const SchoolHoursSchoolDetail = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { filters } = useFilters();
  const { role } = useAuth();

  const [reportData, setReportData] = useState<ConsolidatedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isExportAllDialogOpen, setIsExportAllDialogOpen] = useState(false);
  const [exportAllSchools, setExportAllSchools] = useState<SchoolListRow[] | null>(null);
  const [isLoadingExportAllSchools, setIsLoadingExportAllSchools] = useState(false);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (filters.division) params.divisionId = filters.division;
    if (filters.district) params.districtId = filters.district;
    if (filters.tehsil) params.tehsilId = filters.tehsil;
    const defaultRange = getDefaultSchoolHoursRange();
    params.from = filters.startDate || defaultRange.from;
    params.to = filters.endDate || defaultRange.to;
    if (schoolId) params.schoolId = schoolId;
    return params;
  }, [filters, schoolId]);

  const buildListParams = useCallback(() => {
    // same filters as detail, but WITHOUT schoolId, so we get all matching schools
    const params: Record<string, string> = {};
    if (filters.division) params.divisionId = filters.division;
    if (filters.district) params.districtId = filters.district;
    if (filters.tehsil) params.tehsilId = filters.tehsil;
    const defaultRange = getDefaultSchoolHoursRange();
    params.from = filters.startDate || defaultRange.from;
    params.to = filters.endDate || defaultRange.to;
    return params;
  }, [filters]);

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

  useEffect(() => {
    if (!isExportAllDialogOpen) return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoadingExportAllSchools(true);
        const listRes = await getSchoolHoursSchoolsList(buildListParams());
        const schools: SchoolListRow[] = Array.isArray(listRes?.data?.schools) ? listRes.data.schools : [];
        if (!cancelled) setExportAllSchools(schools);
      } catch (e) {
        console.error('Failed to load schools list for export-all modal:', e);
        if (!cancelled) setExportAllSchools([]);
      } finally {
        if (!cancelled) setIsLoadingExportAllSchools(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isExportAllDialogOpen, buildListParams]);

  const handleExport = async () => {
    if (!schoolId) return;
    setIsExporting(true);
    try {
      const params = buildParams();
      const blob = await exportSchoolHoursConsolidatedCSV(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const namePart = safeFilenamePart(reportData?.schools?.[0]?.schoolName || `school-${schoolId}`);
      const emisPart = safeFilenamePart(reportData?.schools?.[0]?.emisCode || schoolId);
      link.download = `${namePart}_${emisPart}.csv`;

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

  const handleExportAllSchoolsZip = async () => {
    if (role === 'bnu') return;
    if (isExportingAll) return;

    setIsExportingAll(true);
    try {
      const schools = exportAllSchools ?? [];
      const count = schools.length;
      if (count === 0) {
        toast.error('No schools found for selected filters');
        return;
      }

      toast.message(`Generating ZIP for ${count} schools… (this may take a while)`);

      const zipBlob = await exportSchoolHoursConsolidatedAllSchoolsZip(buildListParams());
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `school-hours-all-schools.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ZIP for ${count} schools`);
    } catch (e) {
      console.error('Failed to export all schools:', e);
      toast.error('Failed to export all schools ZIP');
    } finally {
      setIsExportingAll(false);
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
            <>
              <Button variant="outline" onClick={handleExport} disabled={isExporting || isExportingAll}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? 'Exporting…' : 'Export'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsExportAllDialogOpen(true)}
                disabled={isExporting || isExportingAll}
              >
                {isExportingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExportingAll ? 'Exporting ZIP…' : 'Export All Schools (ZIP)'}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={fetchReport}>
            Refresh
          </Button>
        </div>
      </div>

      <AlertDialog open={isExportAllDialogOpen} onOpenChange={setIsExportAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export All Schools (ZIP)</AlertDialogTitle>
            <AlertDialogDescription>
              This will download <b>one ZIP file</b> that contains <b>one CSV per school</b> (month-wise) for the current
              filters.
              <br />
              <br />
              {isLoadingExportAllSchools ? (
                <span>Calculating number of schools…</span>
              ) : (
                <span>
                  Total schools to export: <b>{exportAllSchools?.length ?? 0}</b>
                </span>
              )}
              <br />
              <br />
              If there are many schools, this may take some time to generate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExportingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleExportAllSchoolsZip();
                setIsExportAllDialogOpen(false);
              }}
              disabled={isExportingAll || isLoadingExportAllSchools || (exportAllSchools?.length ?? 0) === 0}
            >
              {isExportingAll ? 'Exporting…' : 'Download ZIP'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    <TableHead className="w-[140px]">RollNo/CNIC</TableHead>
                    <TableHead className="w-[90px] text-right">Days</TableHead>
                    <TableHead className="w-[110px] text-right">Hours (HH:MM)</TableHead>
                    {days.map((d) => (
                      <TableHead key={d} className="w-[32px] text-center p-1">
                        {d}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead colSpan={5} className="text-xs text-muted-foreground">
                      Session duration (HH:MM) per day
                    </TableHead>
                    {days.map((d) => {
                      const mins = m.dayDurationsMinutes?.[d] || 0;
                      return (
                        <TableHead
                          key={`dur-${d}`}
                          className="text-[9px] text-center p-1 text-muted-foreground whitespace-nowrap"
                        >
                          {formatMinutesAsHHMM(mins)}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5 + days.length} className="text-center text-muted-foreground py-6">
                        No attendance records for this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    m.rows.map((r) => (
                      <TableRow key={`${m.monthKey}-${r.role}-${r.personId}`}>
                        <TableCell className="text-xs">{r.role}</TableCell>
                        <TableCell className="text-xs font-medium">{r.name}</TableCell>
                        <TableCell className="text-xs">{r.rollNoOrCnic || '-'}</TableCell>
                        <TableCell className="text-xs text-right">{r.presentDays}</TableCell>
                        <TableCell className="text-xs text-right whitespace-nowrap">
                          {formatHoursAsHHMM(r.totalHours)}
                        </TableCell>
                        {days.map((d) => {
                          const v = r.days?.[d] || '';
                          const minsForDay = m.dayDurationsMinutes?.[d] || 0;
                          const isNoSessionDay = minsForDay === 0;
                          const cls =
                            v === 'P'
                              ? 'bg-green-50 text-green-700'
                              : v === 'A'
                              ? 'bg-red-50 text-red-700'
                              : v === 'NM'
                              ? 'bg-amber-50 text-amber-800'
                              : '';
                          return (
                            <TableCell key={`${r.personId}-${d}`} className={`text-[10px] text-center p-1 ${cls}`}>
                              {isNoSessionDay ? 'NS' : v === 'P' ? 'P' : v === 'A' ? 'A' : v === 'NM' ? 'NM' : ''}
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


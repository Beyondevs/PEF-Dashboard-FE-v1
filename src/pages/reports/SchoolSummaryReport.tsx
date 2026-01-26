import { useEffect, useState, useCallback } from 'react';
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
  getSchoolSummaryReport,
  exportSchoolSummaryCSV,
  exportSchoolSummaryAllSchoolsZip,
  getSchoolHoursSchoolsList,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type StudentSummary = {
  studentId: string;
  name: string;
  rollNumber: string | null;
  className?: string;
  totalDays: number;
  sessionsAttended: number;
  totalHours: number;
};

type TeacherSummary = {
  teacherId: string;
  name: string;
  cnic: string | null;
};

type ClassSummary = {
  className: string;
  students: StudentSummary[];
};

type GradeSummary = {
  grade: number;
  classes: ClassSummary[];
};

type MonthSummary = {
  monthKey: string;
  label: string;
  grades: GradeSummary[];
  teachers: TeacherSummary[];
};

type SchoolSummaryData = {
  schoolId: string;
  schoolName: string;
  emisCode: string | null;
  division: string | null;
  district: string | null;
  tehsil: string | null;
  months: MonthSummary[];
};

type SummaryReportData = {
  summary: {
    from: string;
    to: string;
    months: Array<{ key: string; label: string }>;
  };
  schools: SchoolSummaryData[];
};

type SchoolListRow = {
  schoolId: string;
  schoolName: string;
  emisCode: string | null;
};

function safeFilenamePart(input: string) {
  return input
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

function formatHoursAsHHMM(hours: number): string {
  if (!Number.isFinite(hours)) return '00:00';
  const mins = Math.max(0, Math.round(hours * 60));
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const SchoolSummaryReport = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { filters } = useFilters();
  const { role } = useAuth();

  const [reportData, setReportData] = useState<SummaryReportData | null>(null);
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
    if (filters.startDate) params.from = filters.startDate;
    if (filters.endDate) params.to = filters.endDate;
    if (schoolId) params.schoolId = schoolId;
    return params;
  }, [filters, schoolId]);

  const buildListParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (filters.division) params.divisionId = filters.division;
    if (filters.district) params.districtId = filters.district;
    if (filters.tehsil) params.tehsilId = filters.tehsil;
    if (filters.startDate) params.from = filters.startDate;
    if (filters.endDate) params.to = filters.endDate;
    return params;
  }, [filters]);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getSchoolSummaryReport(buildParams());
      setReportData(response.data);
    } catch (e) {
      const err = e as any;
      const status = err?.response?.status || err?.response?.statusCode;
      const message = err?.message || 'Failed to load school summary report';
      console.error('Failed to fetch school summary report:', { status, message, err });
      toast.error(status ? `Failed to load school summary report (HTTP ${status})` : message);
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
      const blob = await exportSchoolSummaryCSV(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const namePart = safeFilenamePart(reportData?.schools?.[0]?.schoolName || `school-${schoolId}`);
      const emisPart = safeFilenamePart(reportData?.schools?.[0]?.emisCode || schoolId);
      link.download = `${namePart}_${emisPart}_summary.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Exported school summary report');
    } catch (e) {
      console.error('Failed to export school summary report:', e);
      toast.error('Failed to export school summary report');
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

      const zipBlob = await exportSchoolSummaryAllSchoolsZip(buildListParams());
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `school-summary-all-schools.zip`;
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

  // Sort grades: 10th Grade first, then 9th Grade, then others
  const sortGrades = (grades: GradeSummary[]) => {
    return [...grades].sort((a, b) => {
      if (a.grade === 10) return -1;
      if (b.grade === 10) return 1;
      if (a.grade === 9) return -1;
      if (b.grade === 9) return 1;
      return b.grade - a.grade;
    });
  };

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
                {isExportingAll ? 'Exporting ZIP…' : 'Export All Schools'}
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
            <AlertDialogTitle>Export All Schools</AlertDialogTitle>
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

      {school.months.map((month) => {
        const sortedGrades = sortGrades(month.grades);
        const grade10 = sortedGrades.find((g) => g.grade === 10);
        const grade9 = sortedGrades.find((g) => g.grade === 9);
        const otherGrades = sortedGrades.filter((g) => g.grade !== 10 && g.grade !== 9);

        return (
          <Card key={month.monthKey}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{month.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 10th Grade Section */}
              {grade10 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">10th Grade</h3>
                  {grade10.classes.map((classData) => (
                    <div key={classData.className} className="mb-6">
                      <h4 className="text-md font-medium mb-2 text-muted-foreground">
                        Class: {classData.className}
                      </h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Roll Number</TableHead>
                              <TableHead className="text-right">Total Days</TableHead>
                              <TableHead className="text-right">Sessions Attended</TableHead>
                              <TableHead className="text-right">Total Hours</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classData.students.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                  No students found for this class.
                                </TableCell>
                              </TableRow>
                            ) : (
                              classData.students.map((student) => (
                                <TableRow key={student.studentId}>
                                  <TableCell className="font-medium">{student.name}</TableCell>
                                  <TableCell>{student.rollNumber || '-'}</TableCell>
                                  <TableCell className="text-right">{student.totalDays}</TableCell>
                                  <TableCell className="text-right">{student.sessionsAttended}</TableCell>
                                  <TableCell className="text-right whitespace-nowrap">
                                    {formatHoursAsHHMM(student.totalHours)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 9th Grade Section */}
              {grade9 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">9th Grade</h3>
                  {grade9.classes.map((classData) => (
                    <div key={classData.className} className="mb-6">
                      <h4 className="text-md font-medium mb-2 text-muted-foreground">
                        Class: {classData.className}
                      </h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Roll Number</TableHead>
                              <TableHead className="text-right">Total Days</TableHead>
                              <TableHead className="text-right">Sessions Attended</TableHead>
                              <TableHead className="text-right">Total Hours</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classData.students.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                  No students found for this class.
                                </TableCell>
                              </TableRow>
                            ) : (
                              classData.students.map((student) => (
                                <TableRow key={student.studentId}>
                                  <TableCell className="font-medium">{student.name}</TableCell>
                                  <TableCell>{student.rollNumber || '-'}</TableCell>
                                  <TableCell className="text-right">{student.totalDays}</TableCell>
                                  <TableCell className="text-right">{student.sessionsAttended}</TableCell>
                                  <TableCell className="text-right whitespace-nowrap">
                                    {formatHoursAsHHMM(student.totalHours)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Other Grades (if any) */}
              {otherGrades.length > 0 &&
                otherGrades.map((grade) => (
                  <div key={grade.grade}>
                    <h3 className="text-lg font-semibold mb-4">Grade {grade.grade}</h3>
                    {grade.classes.map((classData) => (
                      <div key={classData.className} className="mb-6">
                        <h4 className="text-md font-medium mb-2 text-muted-foreground">
                          Class: {classData.className}
                        </h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Roll Number</TableHead>
                                <TableHead className="text-right">Total Days</TableHead>
                                <TableHead className="text-right">Sessions Attended</TableHead>
                                <TableHead className="text-right">Total Hours</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {classData.students.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                    No students found for this class.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                classData.students.map((student) => (
                                  <TableRow key={student.studentId}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>{student.rollNumber || '-'}</TableCell>
                                    <TableCell className="text-right">{student.totalDays}</TableCell>
                                    <TableCell className="text-right">{student.sessionsAttended}</TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                      {formatHoursAsHHMM(student.totalHours)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {/* Teachers Section */}
              {month.teachers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Teachers</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>CNIC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {month.teachers.map((teacher) => (
                          <TableRow key={teacher.teacherId}>
                            <TableCell className="font-medium">{teacher.name}</TableCell>
                            <TableCell>{teacher.cnic || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SchoolSummaryReport;

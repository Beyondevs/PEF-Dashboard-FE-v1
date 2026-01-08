import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  User,
  GraduationCap,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ExportButton } from '@/components/data-transfer/ExportButton';
import {
  getStudentSpeakingAssessmentReport,
  getTeacherSpeakingAssessmentReport,
} from '@/lib/api';

function toCsvBlob(rows: Record<string, any>[], columns: string[]): Blob {
  const header = columns.join(',');
  const body = rows.map((r) =>
    columns
      .map((c) => {
        const v = String(r[c] ?? '');
        return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
      })
      .join(','),
  );
  const csv = [header, ...body].join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

const SpeakingAssessmentReports = () => {
  const { filters } = useFilters();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  
  const [studentReport, setStudentReport] = useState<any>(null);
  const [teacherReport, setTeacherReport] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  const buildFilters = () => {
    const apiFilters: Record<string, string | number> = {};
    if (filters.division) apiFilters.divisionId = filters.division;
    if (filters.district) apiFilters.districtId = filters.district;
    if (filters.school) apiFilters.schoolId = filters.school;
    if (filters.startDate) apiFilters.from = filters.startDate;
    if (filters.endDate) apiFilters.to = filters.endDate;
    return apiFilters;
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'students') {
        const response = await getStudentSpeakingAssessmentReport(buildFilters());
        setStudentReport(response.data);
      } else {
        const response = await getTeacherSpeakingAssessmentReport(buildFilters());
        setTeacherReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, filters]);

  const currentReport = activeTab === 'students' ? studentReport : teacherReport;
  const maxScore = activeTab === 'students' ? 60 : 70;
  const canExport = role === 'admin' || role === 'client' || role === 'division_role';

  const getProgressPercentage = (score: number) => {
    return ((score / maxScore) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/speaking-assessments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Speaking Assessment Reports</h1>
            <p className="text-muted-foreground">Analyze assessment results across phases</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/speaking-assessments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Speaking Assessment Reports</h1>
            <p className="text-muted-foreground">Analyze assessment results across phases</p>
          </div>
        </div>

        {canExport && (
          <div className="flex items-center justify-end">
            <ExportButton
              label="Export CSV"
              filename={`speaking_assessment_report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`}
              exportFn={async () => {
                const report = currentReport;
                const rows: Array<{ metric: string; value: string | number }> = [
                  { metric: 'reportType', value: activeTab },
                  { metric: 'generatedAt', value: new Date().toISOString() },
                  { metric: 'maxScore', value: maxScore },
                  { metric: 'filter_divisionId', value: filters.division || '' },
                  { metric: 'filter_districtId', value: filters.district || '' },
                  { metric: 'filter_schoolId', value: filters.school || '' },
                  { metric: 'filter_from', value: filters.startDate || '' },
                  { metric: 'filter_to', value: filters.endDate || '' },
                ];

                if (report) {
                  rows.push(
                    { metric: 'totalAssessments', value: report.totalAssessments ?? 0 },
                    { metric: 'status_pending', value: report.statusBreakdown?.pending ?? 0 },
                    { metric: 'status_pre_completed', value: report.statusBreakdown?.pre_completed ?? 0 },
                    { metric: 'status_mid_completed', value: report.statusBreakdown?.mid_completed ?? 0 },
                    { metric: 'status_completed', value: report.statusBreakdown?.completed ?? 0 },
                    { metric: 'average_pre', value: report.averageScores?.pre ?? 0 },
                    { metric: 'average_mid', value: report.averageScores?.mid ?? 0 },
                    { metric: 'average_post', value: report.averageScores?.post ?? 0 },
                  );
                }

                return toCsvBlob(rows, ['metric', 'value']);
              }}
            />
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'students' | 'teachers')} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="students" className="gap-2">
            <User className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Teachers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          {studentReport && (
            <>
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{studentReport.totalAssessments}</div>
                    <p className="text-xs text-muted-foreground">Student assessment records</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">{studentReport.statusBreakdown?.pending || 0}</div>
                    <p className="text-xs text-muted-foreground">Not yet started</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {studentReport.summary?.inProgress ??
                        Math.max(
                          0,
                          (studentReport.totalAssessments || 0) -
                            (studentReport.statusBreakdown?.pending || 0) -
                            (studentReport.statusBreakdown?.completed || 0),
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">Pre or Mid completed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{studentReport.statusBreakdown?.completed || 0}</div>
                    <p className="text-xs text-muted-foreground">All phases done</p>
                  </CardContent>
                </Card>
              </div>

              {/* Average Scores by Phase */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Average Scores by Phase
                  </CardTitle>
                  <CardDescription>Average total scores for each assessment phase</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Pre-Assessment</span>
                        <span className="text-sm font-bold">{studentReport.averageScores?.pre || 0} / {maxScore}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor(getProgressPercentage(studentReport.averageScores?.pre || 0))} transition-all`}
                          style={{ width: `${getProgressPercentage(studentReport.averageScores?.pre || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Mid-Assessment</span>
                        <span className="text-sm font-bold">{studentReport.averageScores?.mid || 0} / {maxScore}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor(getProgressPercentage(studentReport.averageScores?.mid || 0))} transition-all`}
                          style={{ width: `${getProgressPercentage(studentReport.averageScores?.mid || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Post-Assessment</span>
                        <span className="text-sm font-bold">{studentReport.averageScores?.post || 0} / {maxScore}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor(getProgressPercentage(studentReport.averageScores?.post || 0))} transition-all`}
                          style={{ width: `${getProgressPercentage(studentReport.averageScores?.post || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Status Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of assessments by completion status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-600">{studentReport.statusBreakdown?.pending || 0}</div>
                      <div className="text-sm text-gray-500 mt-1">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{studentReport.statusBreakdown?.pre_completed || 0}</div>
                      <div className="text-sm text-blue-500 mt-1">Pre Done</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-600">{studentReport.statusBreakdown?.mid_completed || 0}</div>
                      <div className="text-sm text-yellow-500 mt-1">Mid Done</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{studentReport.statusBreakdown?.completed || 0}</div>
                      <div className="text-sm text-green-500 mt-1">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6">
          {teacherReport && (
            <>
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teacherReport.totalAssessments}</div>
                    <p className="text-xs text-muted-foreground">Teacher assessment records</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">{teacherReport.statusBreakdown?.pending || 0}</div>
                    <p className="text-xs text-muted-foreground">Not yet started</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {teacherReport.summary?.inProgress ??
                        Math.max(
                          0,
                          (teacherReport.totalAssessments || 0) -
                            (teacherReport.statusBreakdown?.pending || 0) -
                            (teacherReport.statusBreakdown?.completed || 0),
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">Pre or Mid completed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{teacherReport.statusBreakdown?.completed || 0}</div>
                    <p className="text-xs text-muted-foreground">All phases done</p>
                  </CardContent>
                </Card>
              </div>

              {/* Average Scores by Phase */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Average Scores by Phase
                  </CardTitle>
                  <CardDescription>Average total scores for each assessment phase</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Pre-Assessment</span>
                        <span className="text-sm font-bold">{teacherReport.averageScores?.pre || 0} / 70</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor((teacherReport.averageScores?.pre || 0) / 70 * 100)} transition-all`}
                          style={{ width: `${(teacherReport.averageScores?.pre || 0) / 70 * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Mid-Assessment</span>
                        <span className="text-sm font-bold">{teacherReport.averageScores?.mid || 0} / 70</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor((teacherReport.averageScores?.mid || 0) / 70 * 100)} transition-all`}
                          style={{ width: `${(teacherReport.averageScores?.mid || 0) / 70 * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Post-Assessment</span>
                        <span className="text-sm font-bold">{teacherReport.averageScores?.post || 0} / 70</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColor((teacherReport.averageScores?.post || 0) / 70 * 100)} transition-all`}
                          style={{ width: `${(teacherReport.averageScores?.post || 0) / 70 * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Status Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of assessments by completion status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-600">{teacherReport.statusBreakdown?.pending || 0}</div>
                      <div className="text-sm text-gray-500 mt-1">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{teacherReport.statusBreakdown?.pre_completed || 0}</div>
                      <div className="text-sm text-blue-500 mt-1">Pre Done</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-600">{teacherReport.statusBreakdown?.mid_completed || 0}</div>
                      <div className="text-sm text-yellow-500 mt-1">Mid Done</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{teacherReport.statusBreakdown?.completed || 0}</div>
                      <div className="text-sm text-green-500 mt-1">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpeakingAssessmentReports;

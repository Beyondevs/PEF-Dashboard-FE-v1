import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Users, GraduationCap, TrendingUp, Award } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherLeaderboard, getStudentLeaderboard, getSchoolRankings, getSchoolStarStats } from '@/lib/api';

interface TeacherLeaderboardItem {
  rank: number;
  teacher: {
    id: string;
    name: string;
    schoolId: string;
    school: string;
    district: string;
    division: string;
    starred?: boolean;
  };
  assessmentId: string;
  status: string;
  scores: {
    pre: number;
    mid: number;
    post: number;
    latest: number;
    latestPercentage: number;
    average: number;
    maxPossible: number;
  };
  improvement: {
    points: number;
    percentage: number;
  };
  phasesCompleted: number;
}

interface StudentLeaderboardItem {
  rank: number;
  student: {
    id: string;
    name: string;
    rollNo: string | null;
    grade: string | null;
    schoolId: string;
    school: string;
    district: string;
    division: string;
    starred?: boolean;
  };
  assessmentId: string;
  status: string;
  scores: {
    pre: number;
    mid: number;
    post: number;
    latest: number;
    latestPercentage: number;
    average: number;
    maxPossible: number;
  };
  improvement: {
    points: number;
    percentage: number;
  };
  phasesCompleted: number;
}

interface Summary {
  totalTeachers?: number;
  totalStudents?: number;
  totalStarPerformers?: number;
  averageLatestScore: number;
  averageImprovement: number;
  completedAllPhases: number;
  maxPossibleScore: number;
}

const Leaderboard = () => {
  const { filters } = useFilters();
  const { role } = useAuth();
  const showStarColumn = role === 'admin';
  const showSchoolTab = role === 'admin' || role === 'division_role' || role === 'trainer';
  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'schools'>('teachers');
  const [teacherData, setTeacherData] = useState<TeacherLeaderboardItem[]>([]);
  const [studentData, setStudentData] = useState<StudentLeaderboardItem[]>([]);
  const [schoolData, setSchoolData] = useState<any[]>([]); // Will hold aggregated school rows
  const [schoolRows, setSchoolRows] = useState<any[]>([]);
  const schoolPagination = usePagination(schoolRows, { initialPageSize: 10 });
  const [teacherSummary, setTeacherSummary] = useState<Summary | null>(null);
  const [studentSummary, setStudentSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard data from API
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        
        const filterParams: Record<string, string | number> = {};
        if (filters.division) filterParams.divisionId = filters.division;
        if (filters.district) filterParams.districtId = filters.district;
        if (filters.tehsil) filterParams.tehsilId = filters.tehsil;
        if (filters.school) filterParams.schoolId = filters.school;

        // Teachers & students: top 50. Schools: no limit (show all).
        const teacherStudentParams = { ...filterParams, topN: 50 };
        const schoolParams = { ...filterParams, topN: 9999 };

        // Fetch teacher & student leaderboards and school star stats in parallel
        const [teacherResponse, studentResponse, schoolStarsResponse] = await Promise.all([
          getTeacherLeaderboard(teacherStudentParams),
          getStudentLeaderboard(teacherStudentParams),
          getSchoolStarStats(schoolParams),
        ]);

        setTeacherData(teacherResponse.data?.leaderboard || []);
        setTeacherSummary(teacherResponse.data?.summary || null);
        setStudentData(studentResponse.data?.leaderboard || []);
        setStudentSummary(studentResponse.data?.summary || null);
        // Use backend-provided school star stats if available
        const schoolRankings = schoolStarsResponse.data?.rankings || [];
        // Map to rows expected by frontend
        const mapped = schoolRankings.map((r: any) => ({
          id: r.school?.id,
          name: r.school?.name,
          emisCode: r.school?.emisCode,
          district: r.school?.district || null,
          tehsil: r.school?.tehsil || null,
          division: r.school?.division || null,
          totalTeachers: r.metrics?.totalTeachers ?? 0,
          teachersWithStars: r.metrics?.teachersWithStars ?? 0,
          teachersStarsPct: r.metrics?.teachersStarsPct ?? 0,
          totalStudents: r.metrics?.totalStudents ?? 0,
          studentsWithStars: r.metrics?.studentsWithStars ?? 0,
          studentsStarsPct: r.metrics?.studentsStarsPct ?? 0,
          overallStarsPct: r.metrics?.overallStarsPct ?? 0,
          rank: r.rank,
          badge: r.rank <= 10 ? 'Top 10' : '',
        }));
        setSchoolRows(mapped);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setTeacherData([]);
        setStudentData([]);
        setSchoolData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [filters.division, filters.district, filters.tehsil, filters.school]);
  // schoolRows are loaded from backend via getSchoolStarStats in fetchLeaderboard

  const teacherPagination = usePagination(teacherData, { initialPageSize: 10 });
  const studentPagination = usePagination(studentData, { initialPageSize: 10 });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 10) return <Badge className="bg-green-500 hover:bg-green-600">Top 10</Badge>;
    if (rank <= 25) return <Badge variant="outline" className="border-blue-500 text-blue-500">Top 25</Badge>;
    return <Badge variant="secondary">Top 50</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'mid_completed':
        return <Badge className="bg-blue-500">Post Done</Badge>;
      case 'pre_completed':
        return <Badge className="bg-yellow-500">Pre Done</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatTeacherDataForCSV = (data: TeacherLeaderboardItem[]) => {
    const header = [
      'Rank', 'Teacher', 'School', 'District', 'Division', 'Pre %', 'Post %', 
      'Improvement', 'Improvement %', 'Phases Completed', 'Status'
    ].join(',');

    const rows = data.map(item => {
      const escape = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const maxPossible = item.scores?.maxPossible ?? 70;
      const prePct = maxPossible > 0 ? (((item.scores?.pre ?? 0) / maxPossible) * 100).toFixed(1) : '0.0';
      const postPct = maxPossible > 0 ? (((item.scores?.mid ?? 0) / maxPossible) * 100).toFixed(1) : '0.0';
      return [
        item.rank,
        escape(item.teacher?.name),
        escape(item.teacher?.school),
        escape(item.teacher?.district),
        escape(item.teacher?.division),
        prePct,
        postPct,
        item.improvement?.points || 0,
        item.improvement?.percentage?.toFixed(1) || 0,
        item.phasesCompleted || 0,
        escape(item.status),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  };

  const formatStudentDataForCSV = (data: StudentLeaderboardItem[]) => {
    const header = [
      'Rank', 'Student', 'Roll No', 'Grade', 'School', 'District', 'Division', 'Pre %', 'Post %', 
      'Improvement', 'Improvement %', 'Phases Completed', 'Status'
    ].join(',');

    const rows = data.map(item => {
      const escape = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const maxPossible = item.scores?.maxPossible ?? 60;
      const prePct = maxPossible > 0 ? (((item.scores?.pre ?? 0) / maxPossible) * 100).toFixed(1) : '0.0';
      const postPct = maxPossible > 0 ? (((item.scores?.mid ?? 0) / maxPossible) * 100).toFixed(1) : '0.0';
      return [
        item.rank,
        escape(item.student?.name),
        escape(item.student?.rollNo),
        escape(item.student?.grade),
        escape(item.student?.school),
        escape(item.student?.district),
        escape(item.student?.division),
        prePct,
        postPct,
        item.improvement?.points || 0,
        item.improvement?.percentage?.toFixed(1) || 0,
        item.phasesCompleted || 0,
        escape(item.status),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  };

  const handleExport = () => {
    let csvContent = '';
    if (activeTab === 'teachers') {
      if (teacherData.length === 0) { alert('No data to export.'); return; }
      csvContent = formatTeacherDataForCSV(teacherData as TeacherLeaderboardItem[]);
    } else if (activeTab === 'students') {
      if (studentData.length === 0) { alert('No data to export.'); return; }
      csvContent = formatStudentDataForCSV(studentData as StudentLeaderboardItem[]);
    } else { // schools
      if (schoolRows.length === 0) { alert('No data to export.'); return; }
      csvContent = formatSchoolDataForCSV(schoolRows);
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_speaking_leaderboard.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSchoolDataForCSV = (data: any[]) => {
    const header = [
      'Rank','School','EMIS Code','District','Tehsil','Total Teachers','Teachers with Stars','Teachers Stars %',
      'Total Students','Students with Stars','Students Stars %','Overall Stars %','Badge'
    ].join(',');

    const rows = data.map(d => {
      const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      return [
        d.rank,
        escape(d.name),
        escape(d.emisCode),
        escape(d.district),
        escape(d.tehsil),
        d.totalTeachers ?? 0,
        d.teachersWithStars ?? 0,
        (d.teachersStarsPct != null ? d.teachersStarsPct.toFixed(1) : '0.0'),
        d.totalStudents ?? 0,
        d.studentsWithStars ?? 0,
        (d.studentsStarsPct != null ? d.studentsStarsPct.toFixed(1) : '0.0'),
        (d.overallStarsPct != null ? d.overallStarsPct.toFixed(1) : '0.0'),
        escape(d.badge),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  };

  const SummaryCards = ({ summary, type }: { summary: Summary | null; type: 'teachers' | 'students' }) => {
    if (!summary) return null;
    
    const total = type === 'teachers' ? summary.totalTeachers : summary.totalStudents;
    const label = type === 'teachers' ? 'teachers' : 'students';
    
    return (
      <TooltipProvider delayDuration={300}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center gap-3">
                    {type === 'teachers' ? <Users className="h-6 w-6 text-blue-500 shrink-0" /> : <GraduationCap className="h-6 w-6 text-purple-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Total {type === 'teachers' ? 'Teachers' : 'Students'}</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5">{total ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">With at least one assessment phase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Count of {label} who have completed at least the Pre-assessment. Use filters above to narrow by location or school.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center gap-3">
                    <Star className="h-6 w-6 text-amber-500 fill-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Total Star Performers</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5">{summary.totalStarPerformers ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Marked as star performers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Number of {label} in this leaderboard who are marked as star performers (starred).</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="transition-shadow hover:shadow-md border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/20 dark:to-background dark:border-amber-800/30">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">% Star Performers</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5 text-amber-700 dark:text-amber-400">
                        {(total && total > 0)
                          ? (((summary.totalStarPerformers ?? 0) / total) * 100).toFixed(1)
                          : '0.0'}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">of total with assessment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Percentage of {label} in this leaderboard who are marked as star performers (star performers ÷ total).</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-yellow-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5">{summary.averageLatestScore?.toFixed(1) ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">out of {summary.maxPossibleScore} (latest phase)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Average of the latest completed phase score (Pre or Post) across all {label}. Higher is better.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-green-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Avg Improvement</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5">{summary.averageImprovement?.toFixed(1) ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">points from Pre to latest phase</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Average gain in score from Pre-assessment to the latest completed phase. Positive = progress.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6 text-green-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">All Phases Done</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5">{summary.completedAllPhases ?? 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Pre + Post completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Number of {label} who have completed both phases (Pre and Post). Full progression tracked.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  };

  const TeacherTable = () => (
    <>
      <SummaryCards summary={teacherSummary} type="teachers" />
      {teacherPagination.items.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[4.5rem] font-semibold">Rank</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">Teacher</TableHead>
                  <TableHead className="min-w-[160px] font-semibold">School</TableHead>
                  {showStarColumn && (
                    <TableHead className="w-14 text-center font-semibold" title="Starred (admin only)">
                      <Star className="h-4 w-4 inline text-amber-500 fill-amber-500" />
                    </TableHead>
                  )}
                  <TableHead className="min-w-[100px] font-semibold">District</TableHead>
                  <TableHead className="text-center w-20 font-semibold tabular-nums">Pre</TableHead>
                  <TableHead className="text-center w-20 font-semibold tabular-nums">Post</TableHead>
                  <TableHead className="text-right w-24 font-semibold tabular-nums">Improvement</TableHead>
                  <TableHead className="min-w-[100px] font-semibold">Status</TableHead>
                  <TableHead className="min-w-[80px] font-semibold">Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherPagination.items.map((item, index) => {
                  const maxPossible = item.scores?.maxPossible ?? 70;
                  const prePct = maxPossible > 0 ? (((item.scores?.pre ?? 0) / maxPossible) * 100).toFixed(1) : '0.0';
                  const postPct = maxPossible > 0 ? (((item.scores?.mid ?? 0) / maxPossible) * 100).toFixed(1) : '0.0';
                  return (
                  <TableRow
                    key={item.teacher?.id || index}
                    className={`transition-colors hover:bg-muted/40 ${item.rank <= 3 ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  >
                    <TableCell className="font-bold tabular-nums align-middle py-4">
                      <span className="flex items-center gap-2">
                        {getRankIcon(item.rank)}
                        <span className={item.rank <= 3 ? 'text-base' : ''}>{item.rank}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground py-4">{item.teacher?.name || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground py-4" title={item.teacher?.school || undefined}>{item.teacher?.school || 'N/A'}</TableCell>
                    {showStarColumn && (
                      <TableCell className="text-center py-4">
                        {item.teacher?.starred ? (
                          <span title="Starred"><Star className="h-4 w-4 text-amber-500 fill-amber-500 inline" /></span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground py-4">{item.teacher?.district || 'N/A'}</TableCell>
                    <TableCell className="text-center tabular-nums py-4 font-medium">{prePct}%</TableCell>
                    <TableCell className={`text-center tabular-nums py-4 ${(item.scores?.mid ?? 0) > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{postPct}%</TableCell>
                    <TableCell className="text-right py-4">
                      <span className={`font-semibold tabular-nums ${item.improvement?.points > 0 ? 'text-green-600' : item.improvement?.points < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {item.improvement?.points > 0 ? '+' : ''}{item.improvement?.points ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="py-4">{getRankBadge(item.rank)}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={teacherPagination.page}
            totalPages={teacherPagination.totalPages}
            onPageChange={teacherPagination.setPage}
            pageInfo={
              teacherPagination.totalItems > 0
                ? `Showing ${teacherPagination.startIndex}-${teacherPagination.endIndex} of ${teacherPagination.totalItems} teachers`
                : undefined
            }
            className="mt-6"
          />
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No teacher data</h3>
          <p className="text-muted-foreground">
            No teachers found with speaking assessments
          </p>
        </div>
      )}
    </>
  );

  const StudentTable = () => (
    <>
      <SummaryCards summary={studentSummary} type="students" />
      {studentPagination.items.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[4.5rem] font-semibold">Rank</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">Student</TableHead>
                  <TableHead className="min-w-[90px] font-semibold">Roll No</TableHead>
                  <TableHead className="min-w-[160px] font-semibold">School</TableHead>
                  {showStarColumn && (
                    <TableHead className="w-14 text-center font-semibold" title="Starred (admin only)">
                      <Star className="h-4 w-4 inline text-amber-500 fill-amber-500" />
                    </TableHead>
                  )}
                  <TableHead className="min-w-[100px] font-semibold">District</TableHead>
                  <TableHead className="text-center w-20 font-semibold tabular-nums">Pre</TableHead>
                  <TableHead className="text-center w-20 font-semibold tabular-nums">Post</TableHead>
                  <TableHead className="text-right w-24 font-semibold tabular-nums">Improvement</TableHead>
                  <TableHead className="min-w-[100px] font-semibold">Status</TableHead>
                  <TableHead className="min-w-[80px] font-semibold">Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentPagination.items.map((item, index) => {
                  const maxPossible = item.scores?.maxPossible ?? 60;
                  const prePct = maxPossible > 0 ? (((item.scores?.pre ?? 0) / maxPossible) * 100).toFixed(1) : '0.0';
                  const postPct = maxPossible > 0 ? (((item.scores?.mid ?? 0) / maxPossible) * 100).toFixed(1) : '0.0';
                  return (
                  <TableRow
                    key={item.student?.id || index}
                    className={`transition-colors hover:bg-muted/40 ${item.rank <= 3 ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  >
                    <TableCell className="font-bold tabular-nums align-middle py-4">
                      <span className="flex items-center gap-2">
                        {getRankIcon(item.rank)}
                        <span className={item.rank <= 3 ? 'text-base' : ''}>{item.rank}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground py-4">{item.student?.name || 'N/A'}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground py-4">{item.student?.rollNo || '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground py-4" title={item.student?.school || undefined}>{item.student?.school || 'N/A'}</TableCell>
                    {showStarColumn && (
                      <TableCell className="text-center py-4">
                        {item.student?.starred ? (
                          <span title="Starred"><Star className="h-4 w-4 text-amber-500 fill-amber-500 inline" /></span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground py-4">{item.student?.district || 'N/A'}</TableCell>
                    <TableCell className="text-center tabular-nums py-4 font-medium">{prePct}%</TableCell>
                    <TableCell className={`text-center tabular-nums py-4 ${(item.scores?.mid ?? 0) > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{postPct}%</TableCell>
                    <TableCell className="text-right py-4">
                      <span className={`font-semibold tabular-nums ${item.improvement?.points > 0 ? 'text-green-600' : item.improvement?.points < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {item.improvement?.points > 0 ? '+' : ''}{item.improvement?.points ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="py-4">{getRankBadge(item.rank)}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={studentPagination.page}
            totalPages={studentPagination.totalPages}
            onPageChange={studentPagination.setPage}
            pageInfo={
              studentPagination.totalItems > 0
                ? `Showing ${studentPagination.startIndex}-${studentPagination.endIndex} of ${studentPagination.totalItems} students`
                : undefined
            }
            className="mt-6"
          />
        </>
      ) : (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No student data</h3>
          <p className="text-muted-foreground">
            No students found with speaking assessments
          </p>
        </div>
      )}
    </>
  );

  const SchoolTable = () => (
    <>
      {schoolPagination.items.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[4.5rem] font-semibold">Rank</TableHead>
                  <TableHead className="min-w-[220px] font-semibold">School</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">District</TableHead>
                  <TableHead className="min-w-[120px] font-semibold">Tehsil</TableHead>
                  <TableHead className="text-right w-28 font-semibold tabular-nums">Total Teachers</TableHead>
                  <TableHead className="text-right w-28 font-semibold tabular-nums">Teachers w/ Stars</TableHead>
                  <TableHead className="text-right w-28 font-semibold tabular-nums">Teachers %</TableHead>
                  <TableHead className="text-right w-28 font-semibold tabular-nums">Total Students</TableHead>
                  <TableHead className="text-right w-28 font-semibold tabular-nums">Students w/ Stars</TableHead>
                  <TableHead className="text-right w-28 font-semibold tabular-nums">Students %</TableHead>
                  <TableHead className="text-right w-28 font-semibold tabular-nums">Overall %</TableHead>
                  <TableHead className="min-w-[80px] font-semibold">Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schoolPagination.items.map((item: any, index: number) => (
                  <TableRow key={item.id || index} className={`transition-colors hover:bg-muted/40 ${item.rank <= 3 ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                    <TableCell className="font-bold tabular-nums align-middle py-4">
                      <span className="flex items-center gap-2">
                        {getRankIcon(item.rank)}
                        <span className={item.rank <= 3 ? 'text-base' : ''}>{item.rank}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground py-4">{item.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground py-4">{item.district || '—'}</TableCell>
                    <TableCell className="text-muted-foreground py-4">{item.tehsil || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums py-4">{item.totalTeachers ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums py-4">{item.teachersWithStars ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums py-4">{(item.teachersStarsPct != null ? item.teachersStarsPct.toFixed(1) : '0.0')}%</TableCell>
                    <TableCell className="text-right tabular-nums py-4">{item.totalStudents ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums py-4">{item.studentsWithStars ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums py-4">{(item.studentsStarsPct != null ? item.studentsStarsPct.toFixed(1) : '0.0')}%</TableCell>
                    <TableCell className="text-right tabular-nums py-4"><span className="font-bold text-primary">{(item.overallStarsPct != null ? item.overallStarsPct.toFixed(1) : '0.0')}%</span></TableCell>
                    <TableCell className="py-4">{item.badge ? <Badge className="bg-green-500">{item.badge}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={schoolPagination.page}
            totalPages={schoolPagination.totalPages}
            onPageChange={schoolPagination.setPage}
            pageInfo={
              schoolPagination.totalItems > 0
                ? `Showing ${schoolPagination.startIndex}-${schoolPagination.endIndex} of ${schoolPagination.totalItems} schools`
                : undefined
            }
            className="mt-6"
          />
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No school data</h3>
          <p className="text-muted-foreground">No schools found with speaking assessments</p>
        </div>
      )}
    </>
  );
  const hasActiveFilters = !!(filters.division || filters.district || filters.school);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-grow min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Speaking Assessment Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Top 50 performers based on speaking assessment scores</p>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" aria-hidden />
              Results filtered by location or school. Use the filters above to change or reset.
            </p>
          )}
        </div>
        <Button onClick={handleExport} variant="outline" className="shrink-0 self-start sm:self-center">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Leaderboard Rankings</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Ranked by latest score % then improvement. Pre → Post shows progression.</p>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'teachers' | 'students' | 'schools')}>
            <TabsList className="mb-6 w-full sm:w-auto">
                <TabsTrigger value="teachers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teachers ({teacherData.length})
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Students ({studentData.length})
                </TabsTrigger>
                {showSchoolTab && (
                  <TabsTrigger value="schools" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    School-wise ({schoolRows.length})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="teachers">
                <TeacherTable />
              </TabsContent>

              <TabsContent value="students">
                <StudentTable />
              </TabsContent>
              
              {showSchoolTab && (
                <TabsContent value="schools">
                  <SchoolTable />
                </TabsContent>
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">About Speaking Assessment Scores</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">How scores and rankings are calculated for program stakeholders</p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-0.5">Teachers</p>
            <p>Scored on 14 criteria (max 70 points per phase): Fluency, Sentences, Accuracy, Pronunciation, Vocabulary, Confidence, Asking, Answering, Classroom Instructions, Feedback, Engaging Students, Professional Interaction, Passion, Role Model.</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-0.5">Students</p>
            <p>Scored on 12 criteria (max 60 points per phase): Fluency, Complete Sentences, Accuracy, Pronunciation, Vocabulary, Confidence, Asking Questions, Answering Questions, Sharing Info, Describing, Feelings, Audience.</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-0.5">Phases</p>
            <p>Pre-Assessment (baseline) → Post-Assessment (final evaluation). Completion status in the table shows how far each person has progressed.</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-0.5">Ranking</p>
            <p>Based on latest completed phase score percentage, then by improvement points. Higher latest % and positive improvement indicate stronger performance.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;

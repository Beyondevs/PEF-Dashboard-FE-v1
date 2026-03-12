import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft, Users, Star, TrendingUp, TrendingDown, Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getPrePostAssessmentReport } from '@/lib/api';

// ─── Mobile hook ──────────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const onResize = useCallback(() => setIsMobile(window.innerWidth < 640), []);
  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [onResize]);
  return isMobile;
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface KpiGroup {
  totalActiveAssessed: number;
  totalStarPerformers: number;
  starPercent: number;
  preAvgPercent: number;
  postAvgPercent: number;
}

interface DivisionEntry {
  division: string;
  divisionId: string;
  count: number;
  preAvgPercent: number;
  postAvgPercent: number;
  improvement: number;
}

interface GenderEntry {
  count: number;
  preAvgPercent: number;
  postAvgPercent: number;
  improvement: number;
  byDivision: Array<{ division: string; divisionId: string; count: number; preAvgPercent: number; postAvgPercent: number }>;
}

interface SkillEntry {
  skill: string;
  prePercent: number;
  postPercent: number;
  improvement: number;
}

interface StarEntry {
  division: string;
  divisionId: string;
  totalStudents?: number;
  totalTeachers?: number;
  starPerformers: number;
  starPercent: number;
}

interface ProgressRow {
  skill: string;
  overallPre: number;
  overallPost: number;
  divisions: Record<string, { pre: number; post: number }>;
}

interface ReportData {
  kpi: { students: KpiGroup; teachers: KpiGroup };
  divisionPerformance: { students: DivisionEntry[]; teachers: DivisionEntry[] };
  genderAnalysis: { female: GenderEntry; male: GenderEntry };
  skillShift: { students: SkillEntry[]; teachers: SkillEntry[] };
  starPerformers: { students: StarEntry[]; teachers: StarEntry[] };
  progressTables: {
    students: { overall: ProgressRow[]; female: ProgressRow[]; male: ProgressRow[] };
    teachers:  { overall: ProgressRow[] };
  };
  meta: {
    generatedAt: string;
    studentMaxScore: number;
    teacherMaxScore: number;
    studentStarThreshold: number;
    teacherStarThreshold: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) => `${v.toFixed(1)}%`;

const ImprovementBadge = ({ value }: { value: number }) => (
  <Badge className={value >= 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'}>
    {value >= 0 ? '+' : ''}{value.toFixed(1)}%
  </Badge>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-lg bg-muted" />
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-2">
      <div className="h-64 rounded-lg bg-muted" />
      <div className="h-64 rounded-lg bg-muted" />
    </div>
    <div className="h-80 rounded-lg bg-muted" />
    <div className="h-64 rounded-lg bg-muted" />
  </div>
);

// ─── Widget 1: KPI Hero ───────────────────────────────────────────────────────
const KpiSection = ({ data }: { data: ReportData }) => {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const kpi = data.kpi[tab];

  const cards = [
    {
      label: 'Total Active Assessed',
      value: kpi.totalActiveAssessed.toLocaleString(),
      icon: Users,
      color: 'text-primary',
      bg: 'bg-blue-50',
    },
    {
      label: 'Star Performers',
      value: `${kpi.totalStarPerformers.toLocaleString()} (${kpi.starPercent}%)`,
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Pre-Assessment Avg',
      value: fmt(kpi.preAvgPercent),
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
    {
      label: 'Post-Assessment Avg',
      value: fmt(kpi.postAvgPercent),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Programme Overview</CardTitle>
            <CardDescription>Key performance indicators for completed assessments</CardDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className={`rounded-lg p-3 sm:p-4 ${c.bg}`}>
              <c.icon className={`h-5 w-5 mb-2 ${c.color}`} />
              <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight break-words">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 2: Division-wise Performance ──────────────────────────────────────
const DivisionPerformanceSection = ({ data }: { data: ReportData }) => {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const isMobile = useIsMobile();
  const rows = data.divisionPerformance[tab];

  const chartData = rows.map((r) => ({
    division: isMobile && r.division.length > 8 ? r.division.substring(0, 7) + '…' : r.division,
    'Pre (%)': r.preAvgPercent,
    'Post (%)': r.postAvgPercent,
  }));

  // On mobile: fixed 520px so all 6 divisions always render; desktop: responsive
  const chartMinWidth = 520;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Division-wise Performance</CardTitle>
            <CardDescription>Pre vs Post assessment scores across all 6 divisions</CardDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <div style={{ minWidth: chartMinWidth }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="division" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} width={42} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Bar dataKey="Pre (%)"  fill="hsl(217 91% 35%)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Post (%)" fill="hsl(142 76% 36%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 3: Gender-Based Analysis ─────────────────────────────────────────
const GenderAnalysisSection = ({ data }: { data: ReportData }) => {
  const { female, male } = data.genderAnalysis;

  const GenderCard = ({
    label, entry, accent,
  }: { label: string; entry: GenderEntry; accent: string }) => (
    <Card className={`border-l-4 ${accent}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label} Students</CardTitle>
        <p className="text-sm text-muted-foreground">{entry.count.toLocaleString()} assessed</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pre-Assessment Avg</span>
          <span className="font-semibold">{fmt(entry.preAvgPercent)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Post-Assessment Avg</span>
          <span className="font-semibold text-emerald-700">{fmt(entry.postAvgPercent)}</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-muted-foreground">Overall Improvement</span>
          <ImprovementBadge value={entry.improvement} />
        </div>
        {entry.byDivision.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">By Division (Post %)</p>
            <div className="space-y-1">
              {entry.byDivision.map((d) => (
                <div key={d.divisionId} className="flex justify-between text-xs gap-2">
                  <span className="text-muted-foreground truncate">{d.division}</span>
                  <span className="font-medium shrink-0">{fmt(d.postAvgPercent)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Gender-Based Analysis</CardTitle>
        <CardDescription>Pre & Post score comparison by gender (students only)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <GenderCard label="Female" entry={female} accent="border-l-pink-500" />
          <GenderCard label="Male"   entry={male}   accent="border-l-blue-500" />
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 4: Skill-wise Shift ───────────────────────────────────────────────
const SkillShiftSection = ({ data }: { data: ReportData }) => {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const isMobile = useIsMobile();
  const skills = data.skillShift[tab];

  // On mobile: shorten labels to fit; on desktop: full labels
  const chartData = skills.map((s) => ({
    skill: isMobile
      ? (s.skill.length > 18 ? `${s.skill.substring(0, 16)}…` : s.skill)
      : s.skill,
    'Pre (%)':  s.prePercent,
    'Post (%)': s.postPercent,
  }));

  const yAxisWidth  = isMobile ? 130 : 210;
  const labelMaxLen = isMobile ? 18 : 28;
  const rowHeight   = isMobile ? 30 : 36;
  // minimum chart width so bars always get enough space on mobile
  const minChartWidth = isMobile ? 320 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Skill-wise Improvement</CardTitle>
            <CardDescription>Pre vs Post scores across all assessed skill competencies</CardDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="students">Students (12)</TabsTrigger>
              <TabsTrigger value="teachers">Teachers (14)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <div style={minChartWidth ? { minWidth: minChartWidth } : undefined}>
            <ResponsiveContainer width="100%" height={skills.length * rowHeight + 40}>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 5, right: isMobile ? 24 : 40, left: 4, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: isMobile ? 10 : 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="skill"
                  width={yAxisWidth}
                  tick={{ fontSize: isMobile ? 10 : 11 }}
                  tickFormatter={(v: string) => v.length > labelMaxLen ? `${v.substring(0, labelMaxLen - 1)}…` : v}
                />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Bar dataKey="Pre (%)"  fill="hsl(217 91% 35%)" radius={[0, 3, 3, 0]} />
                <Bar dataKey="Post (%)" fill="hsl(142 76% 36%)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 5: Star Performers Table ─────────────────────────────────────────
const StarPerformersSection = ({ data }: { data: ReportData }) => {
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const rows = data.starPerformers[tab];

  const totalCount = rows.reduce((s, r) => s + (r.totalStudents ?? r.totalTeachers ?? 0), 0);
  const totalStar  = rows.reduce((s, r) => s + r.starPerformers, 0);
  const totalPct   = totalCount ? ((totalStar / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Star Performers
            </CardTitle>
            <CardDescription>
              Threshold: average ≥ 3.0 "Good" per skill (60% of max). {tab === 'students' ? 'Max 60pts' : 'Max 70pts'}.
            </CardDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <Table className="min-w-[340px]">
            <TableHeader>
              <TableRow>
                <TableHead>Division</TableHead>
                <TableHead className="text-right">
                  <span className="hidden sm:inline">{tab === 'students' ? 'Total Students' : 'Total Teachers'}</span>
                  <span className="sm:hidden">Total</span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="hidden sm:inline">Star Performers</span>
                  <span className="sm:hidden">Stars</span>
                </TableHead>
                <TableHead className="text-right">Star %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.divisionId}>
                  <TableCell className="font-medium text-xs sm:text-sm">{r.division}</TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">{(r.totalStudents ?? r.totalTeachers ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">{r.starPerformers.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <ImprovementBadge value={r.starPercent} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableBody>
              <TableRow className="border-t-2 font-semibold bg-muted/40">
                <TableCell className="text-xs sm:text-sm">Total</TableCell>
                <TableCell className="text-right text-xs sm:text-sm">{totalCount.toLocaleString()}</TableCell>
                <TableCell className="text-right text-xs sm:text-sm">{totalStar.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <ImprovementBadge value={parseFloat(totalPct)} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Widget 6: Assessment-wise Progress Tables ────────────────────────────────
const ProgressTablesSection = ({ data }: { data: ReportData }) => {
  const [entityTab, setEntityTab]  = useState<'students' | 'teachers'>('students');
  const [genderTab, setGenderTab]  = useState<'overall' | 'female' | 'male'>('overall');

  const handleEntityChange = (v: string) => {
    setEntityTab(v as any);
    if (v === 'teachers') setGenderTab('overall');
  };

  const rows: ProgressRow[] = entityTab === 'students'
    ? data.progressTables.students[genderTab]
    : data.progressTables.teachers.overall;

  // Collect all division names from first row (if available)
  const divisions = rows.length > 0 ? Object.keys(rows[0].divisions) : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Assessment-wise Progress</CardTitle>
            <CardDescription>Skill-level Pre → Post percentage shift by division</CardDescription>
          </div>
          <Tabs value={entityTab} onValueChange={handleEntityChange}>
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {entityTab === 'students' && (
          <Tabs value={genderTab} onValueChange={(v) => setGenderTab(v as any)} className="mt-2">
            <TabsList>
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="female">Female</TabsTrigger>
              <TabsTrigger value="male">Male</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No completed assessment data available.</p>
        ) : (
          <Table className="min-w-[900px] text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Skill</TableHead>
                <TableHead className="text-center" colSpan={2}>Overall</TableHead>
                {divisions.map((d) => (
                  <TableHead key={d} className="text-center" colSpan={2}>{d}</TableHead>
                ))}
              </TableRow>
              <TableRow className="text-[11px]">
                <TableHead />
                <TableHead className="text-center text-blue-700">Pre</TableHead>
                <TableHead className="text-center text-emerald-700">Post</TableHead>
                {divisions.map((d) => (
                  <>
                    <TableHead key={`${d}-pre`}  className="text-center text-blue-700">Pre</TableHead>
                    <TableHead key={`${d}-post`} className="text-center text-emerald-700">Post</TableHead>
                  </>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.skill}>
                  <TableCell className="font-medium">{row.skill}</TableCell>
                  <TableCell className="text-center text-blue-700">{fmt(row.overallPre)}</TableCell>
                  <TableCell className="text-center text-emerald-700 font-semibold">{fmt(row.overallPost)}</TableCell>
                  {divisions.map((d) => (
                    <>
                      <TableCell key={`${d}-pre`}  className="text-center text-blue-700">{fmt(row.divisions[d]?.pre ?? 0)}</TableCell>
                      <TableCell key={`${d}-post`} className="text-center text-emerald-700">{fmt(row.divisions[d]?.post ?? 0)}</TableCell>
                    </>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PrePostAssessmentReport = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const res = await getPrePostAssessmentReport();
        setReport(res.data);
      } catch (err) {
        console.error('Failed to load Pre & Post Assessment Report', err);
        toast.error('Failed to load report. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/reports/pre-post-assessment')} className="mt-1 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pre & Post Assessment Final Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive analysis of student and teacher spoken English assessment outcomes across all divisions of Punjab.
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : !report ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No report data available. Ensure assessments have been completed.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/reports')}>
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <KpiSection data={report} />
          <DivisionPerformanceSection data={report} />
          <GenderAnalysisSection data={report} />
          <SkillShiftSection data={report} />
          <StarPerformersSection data={report} />
          <ProgressTablesSection data={report} />

          {/* Meta footer */}
          <p className="text-xs text-muted-foreground text-right">
            Report generated: {new Date(report.meta.generatedAt).toLocaleString()} ·
            Star threshold: ≥{report.meta.studentStarThreshold}/{report.meta.studentMaxScore} (students),
            ≥{report.meta.teacherStarThreshold}/{report.meta.teacherMaxScore} (teachers)
          </p>
        </div>
      )}
    </div>
  );
};

export default PrePostAssessmentReport;

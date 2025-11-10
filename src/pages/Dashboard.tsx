import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Calendar, School, TrendingUp, Activity, Award, Clock, Target, BookOpen, GraduationCap, BarChart3 } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDashboardAggregate } from '@/lib/api';

const Dashboard = () => {
  const { filters, resetFilters } = useFilters();
  const { role } = useAuth();
  const isTrainer = role === 'trainer';
  const isAdmin = role === 'admin';
  const isClient = role === 'client';
  const today = new Date().toISOString().split('T')[0];
  const toDateOnly = (d: any) => {
    if (!d) return undefined;
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return undefined;
    return dt.toISOString().split('T')[0];
  };
  
  // API data state
  // Slim backend payload state
  const [teachersInTraining, setTeachersInTraining] = useState<number>(0);
  const [studentsInTraining, setStudentsInTraining] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [activeSchools, setActiveSchools] = useState<number>(0);
  const [activityTrends, setActivityTrends] = useState<Array<{ date: string; attendanceRate: number }>>([]);
  const [attendanceStatusToday, setAttendanceStatusToday] = useState<{ present: number; absent: number; total: number }>({ present: 0, absent: 0, total: 0 });
  const [coursePerformance, setCoursePerformance] = useState<Array<{ courseName: string; averageScore: number; sampleSize: number }>>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<Array<{ weekStart: string; sessions: number; attendanceRate: number }>>([]);
  const [overallAttendanceRate, setOverallAttendanceRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError] = useState(false);

  // Backend-calculated graph data (no local calculations needed)
  const [attendanceTrendsDetailed, setAttendanceTrendsDetailed] = useState<Array<{ date: string; teachers: number; students: number; both: number }>>([]);
  const [scoreDistribution, setScoreDistribution] = useState<Array<{ range: string; count: number }>>([]);
  const [sessionsProgressDetailed, setSessionsProgressDetailed] = useState<Array<{ date: string; sessions: number; attendanceRate: number; teachersRate: number; studentsRate: number }>>([]);

  // Filter states for graphs
  const [attendanceTrendsFilter, setAttendanceTrendsFilter] = useState<'both' | 'teachers' | 'students'>('both');
  const [attendanceTodayFilter, setAttendanceTodayFilter] = useState<'both' | 'teachers' | 'students'>('both');
  const [sessionsProgressFilter, setSessionsProgressFilter] = useState<'both' | 'teachers' | 'students'>('both');

  // Today's sessions state (for "What's Happening Now" section)
  const [todaySessions, setTodaySessions] = useState<any[]>([]);

  // Calculate date ranges
  const last30DaysStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return date.toISOString().split('T')[0];
  }, []);

  const hasClientResetFiltersRef = useRef(false);

  useEffect(() => {
    if (isClient && !hasClientResetFiltersRef.current) {
      resetFilters();
      hasClientResetFiltersRef.current = true;
    } else if (!isClient && hasClientResetFiltersRef.current) {
      hasClientResetFiltersRef.current = false;
    }
  }, [isClient, resetFilters]);

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Build API params with filters
        const params: Record<string, string> = { date: today };
        
        // Apply geography and date filters for non-client roles only
        if (!isClient) {
          if (filters.startDate) params.from = filters.startDate;
          if (filters.endDate) params.to = filters.endDate;
          
          if (filters.division) params.divisionId = filters.division;
          if (filters.district) params.districtId = filters.district;
          if (filters.tehsil) params.tehsilId = filters.tehsil;
          if (filters.school) params.schoolId = filters.school;
        }

        // Fetch slim aggregated dashboard payload
        const agg = await getDashboardAggregate(params);
        const payload = agg.data as any;

        // Store all backend-calculated data directly (no local calculations)
        setTeachersInTraining(payload.teachersInTraining || 0);
        setStudentsInTraining(payload.studentsInTraining || 0);
        setTotalSessions(payload.totalSessions || 0);
        setActiveSchools(payload.activeSchools || 0);
        setActivityTrends(Array.isArray(payload.activityTrends) ? payload.activityTrends : []);
        setAttendanceStatusToday(payload.attendanceStatusToday || { present: 0, absent: 0, total: 0 });
        setCoursePerformance(Array.isArray(payload.coursePerformance) ? payload.coursePerformance : []);
        setWeeklyProgress(Array.isArray(payload.weeklyProgress) ? payload.weeklyProgress : []);
        
        // Store overall attendance rate from backend
        if (payload.overallAttendanceRate !== undefined) {
          setOverallAttendanceRate(payload.overallAttendanceRate);
        }

        // Store detailed graph data from backend (all calculations done on backend)
        if (payload.attendanceTrendsDetailed) {
          setAttendanceTrendsDetailed(payload.attendanceTrendsDetailed);
        }
        if (payload.scoreDistribution) {
          setScoreDistribution(payload.scoreDistribution);
        }
        if (payload.sessionsProgressDetailed) {
          setSessionsProgressDetailed(payload.sessionsProgressDetailed);
        }
        
        // Note: No longer fetching paginated attendance/sessions data
        // All calculations are done on backend with complete dataset
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [
    today,
    last30DaysStart,
    filters.division,
    filters.district,
    filters.tehsil,
    filters.school,
    filters.startDate,
    filters.endDate,
    isClient,
  ]);

  const stats = useMemo(() => {
    // Calculate total assessments and average score from coursePerformance
    const totalAssessments = coursePerformance.reduce((sum, c) => sum + (c.sampleSize || 0), 0);
    const weightedScoreSum = coursePerformance.reduce((sum, c) => sum + (c.averageScore * (c.sampleSize || 0)), 0);
    const avgScore = totalAssessments > 0 ? weightedScoreSum / totalAssessments : 0;
    
    return {
      teachersToday: teachersInTraining,
      studentsToday: studentsInTraining,
      activeSessions: totalSessions, // renamed meaning on FE card
      activeSchools: activeSchools,
      completedSessions: totalSessions, // Use totalSessions as completed sessions
      totalTeachers: teachersInTraining,
      totalStudents: studentsInTraining,
      avgAttendanceRate: overallAttendanceRate, // Use overallAttendanceRate from backend
      totalAssessments: totalAssessments,
      avgScore: avgScore,
    };
  }, [teachersInTraining, studentsInTraining, totalSessions, activeSchools, overallAttendanceRate, coursePerformance]);

  // Use backend-calculated attendance trends (no local calculations)
  const attendanceTrendsData = useMemo(() => {
    return (attendanceTrendsDetailed || []).map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      teachers: Math.round(item.teachers),
      students: Math.round(item.students),
      both: Math.round(item.both),
    }));
  }, [attendanceTrendsDetailed]);

  const sessionsPerDay = useMemo(() => {
    return attendanceTrendsData;
  }, [attendanceTrendsData]);

  // Use backend-calculated today's attendance (no local calculations)
  const attendanceData = useMemo(() => {
    const { present, absent, total } = attendanceStatusToday;
    // Use backend data directly
    return [
      { name: 'Present', value: present || 0, fill: 'hsl(var(--chart-2))' },
      { name: 'Absent', value: absent || 0, fill: 'hsl(var(--chart-5))' },
    ];
  }, [attendanceStatusToday]);
  
  // Use backend-calculated score distribution (no local calculations)
  const performanceData = useMemo(() => {
    const fillColors = [
      'hsl(var(--chart-5))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-1))',
    ];
    return (scoreDistribution || []).map((item, index) => ({
      range: item.range,
      count: item.count,
      fill: fillColors[index] || 'hsl(var(--chart-1))',
    }));
  }, [scoreDistribution]);
  
  const courseData = useMemo(() => {
    const colorMap: Record<string, string> = {
      'English Basics': 'hsl(var(--chart-1))',
      'English Intermediate': 'hsl(var(--chart-2))',
      'English Advanced': 'hsl(var(--chart-3))',
    };
    return (coursePerformance || []).map(c => ({
      course: c.courseName.replace('English ', ''),
      sessions: 0,
      avgScore: Number((c.averageScore).toFixed(1)),
      fill: colorMap[c.courseName] || 'hsl(var(--chart-1))',
    }));
  }, [coursePerformance]);
  
  // Use backend-calculated sessions progress (no local calculations)
  const sessionsProgressData = useMemo(() => {
    return (sessionsProgressDetailed || []).map(item => {
      // Apply filter to get the right attendance rate
      let attendanceRate = item.attendanceRate;
      if (sessionsProgressFilter === 'teachers') {
        attendanceRate = item.teachersRate;
      } else if (sessionsProgressFilter === 'students') {
        attendanceRate = item.studentsRate;
      }
      
      return {
        day: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sessions: item.sessions,
        attendanceRate: Math.round(attendanceRate),
      };
    });
  }, [sessionsProgressDetailed, sessionsProgressFilter]);
  
  const weeklyProgressSeries = useMemo(() => {
    return sessionsProgressData;
  }, [sessionsProgressData]);

  // Filter ongoing/in_progress sessions for today (using backend data if available)
  const ongoingSessions = useMemo(() => {
    return (todaySessions || []).filter((session: any) => 
      session.status === 'in_progress' || session.status === 'published'
    );
  }, [todaySessions]);

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isTrainer
              ? "Overview of today's training activities"
              : (isAdmin || isClient)
                ? "System-wide training performance overview"
                : "Your teaching performance overview"}
          </p>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {isTrainer
            ? "Overview of today's training activities"
            : (isAdmin || isClient)
              ? "System-wide training performance overview"
              : "Your teaching performance overview"}
        </p>
        
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {isTrainer ? (
          <>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teachers in Training</CardTitle>
                <UserCheck className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.teachersToday}</div>
                <p className="text-xs text-muted-foreground mt-1">Active today • {stats.totalTeachers} total trained</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students in Training</CardTitle>
                <Users className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stats.studentsToday}</div>
                <p className="text-xs text-muted-foreground mt-1">Present today • {stats.totalStudents} total reached</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                <Calendar className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{stats.activeSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">Ongoing • {stats.completedSessions} completed</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
                <School className="h-5 w-5 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-chart-4">{stats.activeSchools}</div>
                <p className="text-xs text-muted-foreground mt-1">With activity today</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <Target className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{Math.round(stats.avgAttendanceRate)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Overall participation</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Award className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stats.avgScore.toFixed(1)}/10</div>
                <p className="text-xs text-muted-foreground mt-1">From {stats.totalAssessments} assessments</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions Attended</CardTitle>
                <Calendar className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{stats.completedSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">Training sessions completed</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students Taught</CardTitle>
                <GraduationCap className="h-5 w-5 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-chart-4">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all sessions</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Last 30 Days Attendance
            </CardTitle>
              <Tabs value={attendanceTrendsFilter} onValueChange={(v) => setAttendanceTrendsFilter(v as 'both' | 'teachers' | 'students')}>
                <TabsList className="h-8">
                  <TabsTrigger value="both" className="text-xs">Both</TabsTrigger>
                  <TabsTrigger value="teachers" className="text-xs">Teachers</TabsTrigger>
                  <TabsTrigger value="students" className="text-xs">Students</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                teachers: { label: 'Teachers', color: 'hsl(var(--chart-3))' },
                students: { label: 'Students', color: 'hsl(var(--chart-4))' },
                both: { label: 'Attendance %', color: 'hsl(var(--chart-2))' },
              }}
            >
              <div className="w-full" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionsPerDay}>
                  <defs>
                    <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBoth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {attendanceTrendsFilter === 'both' && (
                    <>
                      <Area 
                        type="monotone" 
                        dataKey="teachers" 
                        stroke="hsl(var(--chart-3))" 
                        fillOpacity={1}
                        fill="url(#colorTeachers)"
                        strokeWidth={2}
                        name="Teachers %"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="students" 
                        stroke="hsl(var(--chart-4))" 
                        fillOpacity={1}
                        fill="url(#colorStudents)"
                        strokeWidth={2}
                        name="Students %"
                      />
                    </>
                  )}
                  {attendanceTrendsFilter === 'teachers' && (
                      <Area 
                        type="monotone" 
                        dataKey="teachers" 
                        stroke="hsl(var(--chart-3))" 
                      fillOpacity={1}
                      fill="url(#colorTeachers)"
                        strokeWidth={2}
                      name="Teachers %"
                      />
                  )}
                  {attendanceTrendsFilter === 'students' && (
                      <Area 
                        type="monotone" 
                        dataKey="students" 
                        stroke="hsl(var(--chart-4))" 
                      fillOpacity={1}
                      fill="url(#colorStudents)"
                        strokeWidth={2}
                      name="Students %"
                      />
                  )}
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                {isTrainer ? 'Today\'s Attendance' : 'Score Distribution'}
            </CardTitle>
              {isTrainer && (
                <Tabs value={attendanceTodayFilter} onValueChange={(v) => setAttendanceTodayFilter(v as 'both' | 'teachers' | 'students')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="both" className="text-xs">Both</TabsTrigger>
                    <TabsTrigger value="teachers" className="text-xs">Teachers</TabsTrigger>
                    <TabsTrigger value="students" className="text-xs">Students</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isTrainer ? (
              <ChartContainer
                config={{
                  present: { label: 'Present', color: 'hsl(var(--chart-2))' },
                  absent: { label: 'Absent', color: 'hsl(var(--chart-5))' },
                }}
              >
                <div className="w-full" style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
                </div>
              </ChartContainer>
            ) : (
              <ChartContainer
                config={{
                  count: { label: 'Students', color: 'hsl(var(--chart-1))' },
                }}
              >
                <div className="w-full" style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Students">
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              Course Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sessions: { label: 'Sessions', color: 'hsl(var(--chart-1))' },
                avgScore: { label: 'Avg Score', color: 'hsl(var(--chart-2))' },
              }}
            >
              <div className="w-full" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="course" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="sessions" radius={[8, 8, 0, 0]} name="Sessions">
                    {courseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="avgScore" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center flex-wrap justify-between">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-chart-3" />
                Last 30 Days Sessions Progress
            </CardTitle>
              <Tabs value={sessionsProgressFilter} onValueChange={(v) => setSessionsProgressFilter(v as 'both' | 'teachers' | 'students')}>
                <TabsList className="h-8">
                  <TabsTrigger value="both" className="text-xs">Both</TabsTrigger>
                  <TabsTrigger value="teachers" className="text-xs">Teachers</TabsTrigger>
                  <TabsTrigger value="students" className="text-xs">Students</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sessions: { label: 'Sessions', color: 'hsl(var(--chart-1))' },
                attendanceRate: { label: 'Attendance %', color: 'hsl(var(--chart-2))' },
              }}
            >
              <div className="w-full" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyProgressSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Sessions"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="attendanceRate" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Attendance %"
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ongoing Sessions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              What's Happening Now
            </CardTitle>
            <Link to="/sessions">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">View All Sessions</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {true ? (
            <div className="space-y-6">
              {isLoading && (
                <div className="text-xs text-muted-foreground">Loading session data...</div>
              )}
              {!isLoading && ongoingSessions.length === 0 && (
                <div className="text-xs text-muted-foreground">No active sessions today</div>
              )}
              {(isTrainer || isAdmin || isClient) && (
                <div className="p-4 sm:p-6 rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/20">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                        {isAdmin ? 'System-wide Training Activity' : 'Ongoing Training in Punjab'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {isAdmin ? 'Complete overview across all regions' : 'Real-time training activity across the region'}
                      </p>
                    </div>
                    <Link to="/reports/today">
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">View Today's Report</Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-3 rounded-lg bg-primary/20 shrink-0">
                        <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{teachersInTraining}</div>
                        <div className="text-xs text-muted-foreground">Teachers in Training</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-3 rounded-lg bg-secondary/20 shrink-0">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{ongoingSessions.length}</div>
                        <div className="text-xs text-muted-foreground">Active Sessions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-3 rounded-lg bg-accent/20 shrink-0">
                        <School className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{activeSchools}</div>
                        <div className="text-xs text-muted-foreground">Schools Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(isTrainer || isAdmin || isClient) ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Training by District & School
                  </h4>
                  
                  {/* Lahore District */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 sm:px-4 py-2 sm:py-3 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-primary" />
                          <h5 className="font-semibold text-sm sm:text-base text-foreground">Lahore District</h5>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          <span className="text-muted-foreground">{ongoingSessions.length} sessions</span>
                          <span className="font-medium text-primary">{teachersInTraining} teachers</span>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y">
                      {ongoingSessions.slice(0, 2).map(session => {
                        const sessionAttendance = apiAttendance.filter(a => a.sessionId === session.id);
                        const teachersPresent = sessionAttendance.filter(a => a.personType === 'Teacher' && a.present).length;
                        const studentsPresent = sessionAttendance.filter(a => a.personType === 'Student' && a.present).length;
                        const totalTeachers = sessionAttendance.filter(a => a.personType === 'Teacher').length;
                        const totalStudents = sessionAttendance.filter(a => a.personType === 'Student').length;
                        const attendanceRate = sessionAttendance.length > 0
                          ? Math.round((sessionAttendance.filter(a => a.present).length / sessionAttendance.length) * 100)
                          : 0;

                        return (
                          <div key={session.id} className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h6 className="font-medium text-sm sm:text-base text-foreground truncate">{session.title}</h6>
                                  <span className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent-foreground rounded-full shrink-0">
                                    {session.courseName.replace('English ', '')}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{session.school?.name}</p>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    {session.startTime} - {session.endTime}
                                  </p>
                                  <p className="text-xs font-medium text-secondary flex items-center gap-1">
                                    <Target className="h-3 w-3 shrink-0" />
                                    {attendanceRate}% Attendance
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 sm:gap-6 text-sm shrink-0">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Teachers</div>
                                  <div className="font-bold text-primary">{teachersPresent}/{totalTeachers}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Students</div>
                                  <div className="font-bold text-secondary">{studentsPresent}/{totalStudents}</div>
                                </div>
                                <Link to={`/sessions/${session.id}`} className="shrink-0">
                                  <Button size="sm" variant="outline" className="w-full sm:w-auto">Details</Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Faisalabad District */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 sm:px-4 py-2 sm:py-3 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-primary" />
                          <h5 className="font-semibold text-sm sm:text-base text-foreground">Faisalabad District</h5>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          <span className="text-muted-foreground">{Math.floor(ongoingSessions.length * 0.6)} sessions</span>
                          <span className="font-medium text-primary">{Math.floor(teachersInTraining * 0.7)} teachers</span>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y">
                      {ongoingSessions.slice(2, 4).map(session => {
                        const sessionAttendance = apiAttendance.filter(a => a.sessionId === session.id);
                        const teachersPresent = sessionAttendance.filter(a => a.personType === 'Teacher' && a.present).length;
                        const studentsPresent = sessionAttendance.filter(a => a.personType === 'Student' && a.present).length;
                        const totalTeachers = sessionAttendance.filter(a => a.personType === 'Teacher').length;
                        const totalStudents = sessionAttendance.filter(a => a.personType === 'Student').length;
                        const attendanceRate = sessionAttendance.length > 0
                          ? Math.round((sessionAttendance.filter(a => a.present).length / sessionAttendance.length) * 100)
                          : 0;

                        return (
                          <div key={session.id} className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h6 className="font-medium text-sm sm:text-base text-foreground truncate">{session.title}</h6>
                                  <span className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent-foreground rounded-full shrink-0">
                                    {session.courseName.replace('English ', '')}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{session.school?.name}</p>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    {session.startTime} - {session.endTime}
                                  </p>
                                  <p className="text-xs font-medium text-secondary flex items-center gap-1">
                                    <Target className="h-3 w-3 shrink-0" />
                                    {attendanceRate}% Attendance
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 sm:gap-6 text-sm shrink-0">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Teachers</div>
                                  <div className="font-bold text-primary">{teachersPresent}/{totalTeachers}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Students</div>
                                  <div className="font-bold text-secondary">{studentsPresent}/{totalStudents}</div>
                                </div>
                                <Link to={`/sessions/${session.id}`} className="shrink-0">
                                  <Button size="sm" variant="outline" className="w-full sm:w-auto">Details</Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Multan District */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 sm:px-4 py-2 sm:py-3 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-primary" />
                          <h5 className="font-semibold text-sm sm:text-base text-foreground">Multan District</h5>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          <span className="text-muted-foreground">{Math.floor(ongoingSessions.length * 0.4)} sessions</span>
                          <span className="font-medium text-primary">{Math.floor(teachersInTraining * 0.3)} teachers</span>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y">
                      {ongoingSessions.slice(4, 5).map(session => {
                        const sessionAttendance = apiAttendance.filter(a => a.sessionId === session.id);
                        const teachersPresent = sessionAttendance.filter(a => a.personType === 'Teacher' && a.present).length;
                        const studentsPresent = sessionAttendance.filter(a => a.personType === 'Student' && a.present).length;
                        const totalTeachers = sessionAttendance.filter(a => a.personType === 'Teacher').length;
                        const totalStudents = sessionAttendance.filter(a => a.personType === 'Student').length;
                        const attendanceRate = sessionAttendance.length > 0
                          ? Math.round((sessionAttendance.filter(a => a.present).length / sessionAttendance.length) * 100)
                          : 0;

                        return (
                          <div key={session.id} className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h6 className="font-medium text-sm sm:text-base text-foreground truncate">{session.title}</h6>
                                  <span className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent-foreground rounded-full shrink-0">
                                    {session.courseName.replace('English ', '')}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{session.school?.name}</p>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    {session.startTime} - {session.endTime}
                                  </p>
                                  <p className="text-xs font-medium text-secondary flex items-center gap-1">
                                    <Target className="h-3 w-3 shrink-0" />
                                    {attendanceRate}% Attendance
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 sm:gap-6 text-sm shrink-0">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Teachers</div>
                                  <div className="font-bold text-primary">{teachersPresent}/{totalTeachers}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Students</div>
                                  <div className="font-bold text-secondary">{studentsPresent}/{totalStudents}</div>
                                </div>
                                <Link to={`/sessions/${session.id}`} className="shrink-0">
                                  <Button size="sm" variant="outline" className="w-full sm:w-auto">Details</Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <Link to="/reports/drilldown">
                      <Button variant="outline" size="sm">
                        View Complete District Breakdown
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {ongoingSessions.map(session => {
                    const sessionAttendance = apiAttendance.filter(a => a.sessionId === session.id);
                    const teachersPresent = sessionAttendance.filter(a => a.personType === 'Teacher' && a.present).length;
                    const studentsPresent = sessionAttendance.filter(a => a.personType === 'Student' && a.present).length;
                    const totalTeachers = sessionAttendance.filter(a => a.personType === 'Teacher').length;
                    const totalStudents = sessionAttendance.filter(a => a.personType === 'Student').length;
                    const attendanceRate = sessionAttendance.length > 0
                      ? Math.round((sessionAttendance.filter(a => a.present).length / sessionAttendance.length) * 100)
                      : 0;

                    return (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{session.title}</h4>
                            <span className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent-foreground rounded-full">
                              {session.courseName.replace('English ', '')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{session.school?.name}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.startTime} - {session.endTime}
                            </p>
                            <p className="text-xs font-medium text-secondary flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {attendanceRate}% Present
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Teachers</div>
                            <div className="font-bold text-primary">{teachersPresent}/{totalTeachers}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Students</div>
                            <div className="font-bold text-secondary">{studentsPresent}/{totalStudents}</div>
                          </div>
                          <Link to={`/sessions/${session.id}`}>
                            <Button size="sm" className="ml-4">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No ongoing sessions at the moment</p>
              <Link to="/sessions">
                <Button variant="outline" size="sm" className="mt-4">
                  View Scheduled Sessions
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

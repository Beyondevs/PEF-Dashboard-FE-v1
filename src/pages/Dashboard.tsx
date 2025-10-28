import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Calendar, School, TrendingUp, Activity, Award, Clock, Target, BookOpen, GraduationCap, BarChart3 } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getDashboardAggregate } from '@/lib/api';

const Dashboard = () => {
  const { filters } = useFilters();
  const { role } = useAuth();
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
  const [isLoading, setIsLoading] = useState(true);
  const [apiError] = useState(false);

  // Back-compat placeholders (FE now uses slim metrics only)
  const apiSessions: any[] = [];
  const apiAttendance: any[] = [];
  const apiAssessments: any[] = [];

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        

        // Fetch slim aggregated dashboard payload
        const agg = await getDashboardAggregate({ date: today });
        const payload = agg.data as any;

        setTeachersInTraining(payload.teachersInTraining || 0);
        setStudentsInTraining(payload.studentsInTraining || 0);
        setTotalSessions(payload.totalSessions || 0);
        setActiveSchools(payload.activeSchools || 0);
        setActivityTrends(Array.isArray(payload.activityTrends) ? payload.activityTrends : []);
        setAttendanceStatusToday(payload.attendanceStatusToday || { present: 0, absent: 0, total: 0 });
        setCoursePerformance(Array.isArray(payload.coursePerformance) ? payload.coursePerformance : []);
        setWeeklyProgress(Array.isArray(payload.weeklyProgress) ? payload.weeklyProgress : []);
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [today]);

  const stats = useMemo(() => {
    return {
      teachersToday: teachersInTraining,
      studentsToday: studentsInTraining,
      activeSessions: totalSessions, // renamed meaning on FE card
      activeSchools: activeSchools,
      completedSessions: 0,
      totalTeachers: teachersInTraining,
      totalStudents: studentsInTraining,
      avgAttendanceRate: 0,
      totalAssessments: 0,
      avgScore: 0,
    };
  }, [teachersInTraining, studentsInTraining, totalSessions, activeSchools]);

  const sessionsPerDay = useMemo(() => {
    return activityTrends.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: 0,
      attendance: Math.round(d.attendanceRate),
      teachers: 0,
      students: 0,
    }));
  }, [activityTrends]);

  const attendanceData = useMemo(() => {
    const presentRaw = attendanceStatusToday.present || 0;
    const absentRaw = attendanceStatusToday.absent || 0;
    const total = presentRaw + absentRaw;
    const present = total > 0 ? presentRaw : 120; // fallback to keep chart visible
    const absent = total > 0 ? absentRaw : 30;
    return [
      { name: 'Present', value: present, fill: 'hsl(var(--chart-2))' },
      { name: 'Absent', value: absent, fill: 'hsl(var(--chart-5))' },
    ];
  }, [attendanceStatusToday]);
  
  const performanceData = useMemo(() => {
    // Approximate score distribution from coursePerformance sample sizes and averages
    const scoreRanges = [
      { range: '0-4', count: 0, fill: 'hsl(var(--chart-5))' },
      { range: '5-6', count: 0, fill: 'hsl(var(--chart-3))' },
      { range: '7-8', count: 0, fill: 'hsl(var(--chart-2))' },
      { range: '9-10', count: 0, fill: 'hsl(var(--chart-1))' },
    ];
    (coursePerformance || []).forEach(c => {
      const avg = c.averageScore;
      const weight = Math.max(1, c.sampleSize || 0);
      if (avg < 5) scoreRanges[0].count += weight;
      else if (avg < 7) scoreRanges[1].count += weight;
      else if (avg < 9) scoreRanges[2].count += weight;
      else scoreRanges[3].count += weight;
    });
    return scoreRanges;
  }, [coursePerformance]);
  
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
  
  const weeklyProgressSeries = useMemo(() => {
    return (weeklyProgress || []).map(w => ({
      day: new Date(w.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed: w.sessions,
      score: Math.round((w.attendanceRate / 10) * 10) / 10, // scale to 0-10 axis used in chart
    }));
  }, [weeklyProgress]);

  const ongoingSessions: any[] = [];

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {role === 'trainer' ? "Overview of today's training activities" : "Your teaching performance overview"}
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
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {role === 'trainer' ? "Overview of today's training activities" : "Your teaching performance overview"}
        </p>
        
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {role === 'trainer' ? (
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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {role === 'trainer' ? 'Activity Trends (Last 30 Days)' : 'Your Progress (Last 30 Days)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sessions: { label: 'Sessions', color: 'hsl(var(--chart-1))' },
                attendance: { label: 'Attendance %', color: 'hsl(var(--chart-2))' },
                teachers: { label: 'Teachers', color: 'hsl(var(--chart-3))' },
                students: { label: 'Students', color: 'hsl(var(--chart-4))' },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={sessionsPerDay}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
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
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {role === 'trainer' ? (
                    <>
                      <Area 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="hsl(var(--chart-1))" 
                        fillOpacity={1}
                        fill="url(#colorSessions)"
                        strokeWidth={2}
                        name="Sessions"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke="hsl(var(--chart-2))" 
                        fillOpacity={1}
                        fill="url(#colorAttendance)"
                        strokeWidth={2}
                        name="Attendance %"
                      />
                    </>
                  ) : (
                    <>
                      <Area 
                        type="monotone" 
                        dataKey="teachers" 
                        stroke="hsl(var(--chart-3))" 
                        fill="hsl(var(--chart-3))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                        name="Teachers"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="students" 
                        stroke="hsl(var(--chart-4))" 
                        fill="hsl(var(--chart-4))"
                        fillOpacity={0.2}
                        strokeWidth={2}
                        name="Students"
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-secondary" />
              {role === 'trainer' ? 'Attendance Status Today' : 'Score Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {role === 'trainer' ? (
              <ChartContainer
                config={{
                  present: { label: 'Present', color: 'hsl(var(--chart-2))' },
                  absent: { label: 'Absent', color: 'hsl(var(--chart-5))' },
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
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
              </ChartContainer>
            ) : (
              <ChartContainer
                config={{
                  count: { label: 'Students', color: 'hsl(var(--chart-1))' },
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
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
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
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
              <ResponsiveContainer width="100%" height={300}>
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
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-chart-3" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: { label: 'Completed', color: 'hsl(var(--chart-1))' },
                score: { label: 'Avg Score', color: 'hsl(var(--chart-2))' },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyProgressSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 10]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Completed"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="Avg Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ongoing Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              What's Happening Now
            </CardTitle>
            <Link to="/sessions">
              <Button variant="outline" size="sm">View All Sessions</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {true ? (
            <div className="space-y-6">
              {ongoingSessions.length === 0 && (
                <div className="text-xs text-muted-foreground">Showing mock data</div>
              )}
              {role === 'trainer' && (
                <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">Ongoing Training in Punjab</h3>
                      <p className="text-sm text-muted-foreground">Real-time training activity across the region</p>
                    </div>
                    <Link to="/reports/today">
                      <Button size="sm" variant="outline">View Today's Report</Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-6 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/20">
                        <UserCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">500</div>
                        <div className="text-xs text-muted-foreground">Teachers in Training</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-secondary/20">
                        <Calendar className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">30</div>
                        <div className="text-xs text-muted-foreground">Active Sessions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-accent/20">
                        <School className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">12</div>
                        <div className="text-xs text-muted-foreground">Districts Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {role === 'trainer' ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Training by District & School
                  </h4>
                  
                  {/* Lahore District */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-primary" />
                          <h5 className="font-semibold text-foreground">Lahore District</h5>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">8 sessions</span>
                          <span className="font-medium text-primary">165 teachers</span>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y">
                      {ongoingSessions.slice(0, 2).map(session => {
                        const sessionAttendance = apiAttendance.filter(a => a.sessionId === session.id);
                        const teachersPresent = sessionAttendance.filter(a => a.personType === 'Teacher' && a.present).length;
                        const studentsPresent = sessionAttendance.filter(a => a.personType === 'Student' && a.present).length;
                        const attendanceRate = sessionAttendance.length > 0
                          ? Math.round((sessionAttendance.filter(a => a.present).length / sessionAttendance.length) * 100)
                          : 0;

                        return (
                          <div key={session.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h6 className="font-medium text-foreground">{session.title}</h6>
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
                                    {attendanceRate}% Attendance
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-sm ml-4">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Teachers</div>
                                  <div className="font-bold text-primary">{teachersPresent}/{session.expectedTeachers}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Students</div>
                                  <div className="font-bold text-secondary">{studentsPresent}/{session.expectedStudents}</div>
                                </div>
                                <Link to={`/sessions/${session.id}`}>
                                  <Button size="sm" variant="outline">Details</Button>
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
                    <div className="bg-muted/50 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-primary" />
                          <h5 className="font-semibold text-foreground">Faisalabad District</h5>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">6 sessions</span>
                          <span className="font-medium text-primary">132 teachers</span>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y">
                      {ongoingSessions.slice(2, 4).map(session => {
                        const sessionAttendance = apiAttendance.filter(a => a.sessionId === session.id);
                        const teachersPresent = sessionAttendance.filter(a => a.personType === 'Teacher' && a.present).length;
                        const studentsPresent = sessionAttendance.filter(a => a.personType === 'Student' && a.present).length;
                        const attendanceRate = sessionAttendance.length > 0
                          ? Math.round((sessionAttendance.filter(a => a.present).length / sessionAttendance.length) * 100)
                          : 0;

                        return (
                          <div key={session.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h6 className="font-medium text-foreground">{session.title}</h6>
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
                                    {attendanceRate}% Attendance
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-sm ml-4">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Teachers</div>
                                  <div className="font-bold text-primary">{teachersPresent}/{session.expectedTeachers}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Students</div>
                                  <div className="font-bold text-secondary">{studentsPresent}/{session.expectedStudents}</div>
                                </div>
                                <Link to={`/sessions/${session.id}`}>
                                  <Button size="sm" variant="outline">Details</Button>
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
                    <div className="bg-muted/50 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-primary" />
                          <h5 className="font-semibold text-foreground">Multan District</h5>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">5 sessions</span>
                          <span className="font-medium text-primary">98 teachers</span>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y">
                      {ongoingSessions.slice(4, 5).map(session => {
                        const sessionAttendance = apiAttendance.filter(a => a.sessionId === session.id);
                        const teachersPresent = sessionAttendance.filter(a => a.personType === 'Teacher' && a.present).length;
                        const studentsPresent = sessionAttendance.filter(a => a.personType === 'Student' && a.present).length;
                        const attendanceRate = sessionAttendance.length > 0
                          ? Math.round((sessionAttendance.filter(a => a.present).length / sessionAttendance.length) * 100)
                          : 0;

                        return (
                          <div key={session.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h6 className="font-medium text-foreground">{session.title}</h6>
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
                                    {attendanceRate}% Attendance
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-sm ml-4">
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Teachers</div>
                                  <div className="font-bold text-primary">{teachersPresent}/{session.expectedTeachers}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Students</div>
                                  <div className="font-bold text-secondary">{studentsPresent}/{session.expectedStudents}</div>
                                </div>
                                <Link to={`/sessions/${session.id}`}>
                                  <Button size="sm" variant="outline">Details</Button>
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
                            <div className="font-bold text-primary">{teachersPresent}/{session.expectedTeachers}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Students</div>
                            <div className="font-bold text-secondary">{studentsPresent}/{session.expectedStudents}</div>
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

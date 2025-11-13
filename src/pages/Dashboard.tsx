import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Calendar, School, TrendingUp, Activity, Award, Clock, Target, BookOpen, GraduationCap, BarChart3 } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getActiveTeachersStats,
  getActiveStudentsStats,
  getSessionsStats,
  getActiveSchoolsStats,
  getAttendanceRateStats,
  getAttendanceTrendsChart,
  getTodayAttendanceChart,
  getWeekdayDistributionChart,
  getSessionsProgressChart,
  getTodaySessions,
  getTodayDistrictSummaries,
} from '@/lib/api';

type DashboardTodaySession = {
  id: string;
  title?: string | null;
  courseName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: string | null;
  school?: {
    id?: string | null;
    name?: string | null;
    divisionId?: string | null;
    divisionName?: string | null;
    districtId?: string | null;
    districtName?: string | null;
    tehsilId?: string | null;
    tehsilName?: string | null;
  } | null;
  attendance?: {
    teachersPresent?: number;
    teachersTotal?: number;
    studentsPresent?: number;
    studentsTotal?: number;
  } | null;
};

type DashboardDistrictSnapshot = {
  districtId?: string | null;
  districtName: string;
  sessions: number;
  totalSessions: number;
  teachersEnrolled: number;
  teachersPresent: number;
  studentsEnrolled: number;
  studentsPresent: number;
  schools: number;
};

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
  const [teachersTaught, setTeachersTaught] = useState<number>(0);
  const [studentsTaught, setStudentsTaught] = useState<number>(0);
  const [teachersEnrolled, setTeachersEnrolled] = useState<number>(0);
  const [studentsEnrolled, setStudentsEnrolled] = useState<number>(0);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [activeSchools, setActiveSchools] = useState<number>(0);
  const [activityTrends, setActivityTrends] = useState<Array<{ date: string; attendanceRate: number }>>([]);
  const [attendanceStatusToday, setAttendanceStatusToday] = useState<{ present: number; absent: number; total: number }>({ present: 0, absent: 0, total: 0 });
  const [overallAttendanceRate, setOverallAttendanceRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError] = useState(false);

  // Backend-calculated graph data (no local calculations needed)
  const [attendanceTrendsDetailed, setAttendanceTrendsDetailed] = useState<Array<{ date: string; teachers: number; students: number; both: number }>>([]);
  const [weekdaySessionsDistribution, setWeekdaySessionsDistribution] = useState<Array<{ day: string; sessions: number }>>([]);
  const [sessionsProgressDetailed, setSessionsProgressDetailed] = useState<Array<{ date: string; sessions: number; attendanceRate: number; teachersRate: number; studentsRate: number }>>([]);

  // Filter states for graphs
  const [attendanceTrendsFilter, setAttendanceTrendsFilter] = useState<'both' | 'teachers' | 'students'>('both');
  const [attendanceTodayFilter, setAttendanceTodayFilter] = useState<'both' | 'teachers' | 'students'>('both');
  const [sessionsProgressFilter, setSessionsProgressFilter] = useState<'both' | 'teachers' | 'students'>('both');

  // Today's sessions state (for "What's Happening Now" section)
  const [todaySessions, setTodaySessions] = useState<DashboardTodaySession[]>([]);
  const [districtSnapshots, setDistrictSnapshots] = useState<DashboardDistrictSnapshot[]>([]);

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

  // Fetch data from API - using parallel calls to individual endpoints
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Build API params with geography filters
        const params: Record<string, string> = {};
        
        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.tehsil) params.tehsilId = filters.tehsil;
        if (filters.school) params.schoolId = filters.school;

        // Fetch all data in parallel using individual endpoints
        const [
          teachersData,
          studentsData,
          sessionsData,
          schoolsData,
          attendanceRateData,
          attendanceTrendsData,
          todayAttendanceData,
          weekdayDistributionData,
          sessionsProgressData,
          todaySessionsData,
          districtSummariesData,
        ] = await Promise.all([
          getActiveTeachersStats(params),
          getActiveStudentsStats(params),
          getSessionsStats(params),
          getActiveSchoolsStats(params),
          getAttendanceRateStats(params),
          getAttendanceTrendsChart(params),
          isTrainer ? getTodayAttendanceChart(params) : Promise.resolve(null),
          !isTrainer ? getWeekdayDistributionChart(params) : Promise.resolve(null),
          getSessionsProgressChart(params),
          getTodaySessions(params),
          getTodayDistrictSummaries(params),
        ]);

        // Update state with individual responses
        setTeachersTaught(teachersData.data.taught);
        setTeachersEnrolled(teachersData.data.active);
        setStudentsTaught(studentsData.data.taught);
        setStudentsEnrolled(studentsData.data.active);
        setTotalSessions(sessionsData.data.total);
        setActiveSchools(schoolsData.data.active);
        setOverallAttendanceRate(attendanceRateData.data.rate);
        
        // Set attendance trends
        setAttendanceTrendsDetailed(attendanceTrendsData.data.data || []);
        
        // Set today's attendance (for trainers) or weekday distribution (for non-trainers)
        if (isTrainer && todayAttendanceData) {
          setAttendanceStatusToday({
            present: todayAttendanceData.data.present,
            absent: todayAttendanceData.data.absent,
            total: todayAttendanceData.data.total,
          });
        } else {
          setAttendanceStatusToday({ present: 0, absent: 0, total: 0 });
        }
        
        if (!isTrainer && weekdayDistributionData) {
          const canonicalLabels = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const incoming = weekdayDistributionData.data.data || [];
          const map: Record<string, number> = {};
          for (const item of incoming) {
            if (item && typeof item.day === 'string') {
              map[item.day] = Number(item.sessions) || 0;
            }
          }
          const normalized = canonicalLabels.map(day => ({ day, sessions: map[day] ?? 0 }));
          setWeekdaySessionsDistribution(normalized);
        } else if (isTrainer) {
          setWeekdaySessionsDistribution([
            { day: 'Monday', sessions: 0 },
            { day: 'Tuesday', sessions: 0 },
            { day: 'Wednesday', sessions: 0 },
            { day: 'Thursday', sessions: 0 },
            { day: 'Friday', sessions: 0 },
            { day: 'Saturday', sessions: 0 },
          ]);
        }
        
        // Set sessions progress data
        setSessionsProgressDetailed(sessionsProgressData.data.data || []);
        
        // Set today's sessions and district summaries
        setTodaySessions(todaySessionsData.data.data || []);
        setDistrictSnapshots(districtSummariesData.data.data || []);
        
        // Activity trends is derived from attendance trends (for backward compatibility)
        const activityTrendsFromAttendance = (attendanceTrendsData.data.data || []).map(item => ({
          date: item.date,
          attendanceRate: item.both,
        }));
        setActivityTrends(activityTrendsFromAttendance);
        
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
    isClient,
    isTrainer,
  ]);

  const stats = useMemo(() => {
    return {
      teachersToday: teachersTaught,
      studentsToday: studentsTaught,
      activeSessions: totalSessions,
      activeSchools,
      completedSessions: totalSessions,
      teachersEnrolled,
      studentsEnrolled,
      avgAttendanceRate: overallAttendanceRate,
      teacherTaught: teachersTaught,
      studentTaught: studentsTaught,
    };
  }, [
    teachersTaught,
    studentsTaught,
    totalSessions,
    activeSchools,
    overallAttendanceRate,
    teachersEnrolled,
    studentsEnrolled,
  ]);

  const formatTime = (time?: string | null) => {
    if (!time) return '--';
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      return time;
    }
    const parsed = new Date(time);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return time;
  };

  const topDistricts = useMemo(() => districtSnapshots.slice(0, 3), [districtSnapshots]);

  const ongoingSessions = useMemo<DashboardTodaySession[]>(() => {
    return (todaySessions ?? []).filter(
      session => session?.status === 'in_progress' || session?.status === 'published'
    );
  }, [todaySessions]);

  const activeSessionsCount = useMemo(() => {
    if (ongoingSessions.length > 0) {
      return ongoingSessions.length;
    }
    if (todaySessions?.length) {
      return todaySessions.length;
    }
    return 0;
  }, [ongoingSessions, todaySessions]);

  const activeSessionsByDistrict = useMemo(() => {
    const map: Record<string, DashboardTodaySession[]> = {};
    ongoingSessions.forEach(session => {
      const districtName = session.school?.districtName ?? 'Unknown District';
      if (!map[districtName]) {
        map[districtName] = [];
      }
      map[districtName].push(session);
    });
    return map;
  }, [ongoingSessions]);

  const allSessionsByDistrict = useMemo(() => {
    const map: Record<string, DashboardTodaySession[]> = {};
    todaySessions.forEach(session => {
      const districtName = session.school?.districtName ?? 'Unknown District';
      if (!map[districtName]) {
        map[districtName] = [];
      }
      map[districtName].push(session);
    });
    return map;
  }, [todaySessions]);

  const getSessionAttendance = (session: DashboardTodaySession) => {
    const teachersPresent = session.attendance?.teachersPresent ?? 0;
    const teachersTotal = session.attendance?.teachersTotal ?? 0;
    const studentsPresent = session.attendance?.studentsPresent ?? 0;
    const studentsTotal = session.attendance?.studentsTotal ?? 0;
    const total = teachersTotal + studentsTotal;
    const attended = teachersPresent + studentsPresent;
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;
    return {
      teachersPresent,
      teachersTotal,
      studentsPresent,
      studentsTotal,
      attendanceRate,
    };
  };

  const totalTeachersEnrolledToday = useMemo(
    () => districtSnapshots.reduce((sum, snapshot) => sum + (snapshot.teachersEnrolled ?? 0), 0),
    [districtSnapshots]
  );

  const totalSchoolsActiveToday = useMemo(() => {
    const schoolIds = new Set<string>();
    todaySessions.forEach(session => {
      const schoolId = session.school?.id;
      if (schoolId) {
        schoolIds.add(schoolId);
      }
    });
    return schoolIds.size;
  }, [todaySessions]);

  const teachersEnrolledDisplay = totalTeachersEnrolledToday > 0 ? totalTeachersEnrolledToday : teachersEnrolled;
  const schoolsActiveDisplay = totalSchoolsActiveToday > 0 ? totalSchoolsActiveToday : activeSchools;

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
  const weekdayDistributionData = useMemo(() => {
    const fillColors = [
      'hsl(var(--chart-5))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-1))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
      'hsl(var(--chart-3))',
    ];
    return (weekdaySessionsDistribution || []).map((item, index) => ({
      day: item.day,
      sessions: item.sessions,
      fill: fillColors[index % fillColors.length],
    }));
  }, [weekdaySessionsDistribution]);
  
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
                <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
                <UserCheck className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.teachersEnrolled}</div>
                <p className="text-xs text-muted-foreground mt-1">Active today • {stats.teacherTaught} taught</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stats.studentsEnrolled}</div>
                <p className="text-xs text-muted-foreground mt-1">Present today • {stats.studentTaught} taught</p>
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
                <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
                <Award className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stats.teacherTaught}</div>
                
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
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <GraduationCap className="h-5 w-5 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-chart-4">{stats.studentsEnrolled}</div>
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
                {isTrainer ? 'Today\'s Attendance' : 'Weekday Sessions Distribution'}
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
                  sessions: { label: 'Sessions', color: 'hsl(var(--chart-1))' },
                }}
              >
                <div className="w-full" style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sessions" radius={[8, 8, 0, 0]} name="Sessions">
                      {weekdayDistributionData.map((entry, index) => (
                        <Cell key={`weekday-cell-${index}`} fill={entry.fill} />
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
      <div className="grid gap-3 md:gap-4 grid-cols-1">
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
          <div className="space-y-6">
              {isLoading && (
                <div className="text-xs text-muted-foreground">Loading session data...</div>
              )}
              {!isLoading && activeSessionsCount === 0 && (
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
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.teachersEnrolled}</div>
                        <div className="text-xs text-muted-foreground">Active Teachers</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-3 rounded-lg bg-secondary/20 shrink-0">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{activeSessionsCount}</div>
                        <div className="text-xs text-muted-foreground">Active Sessions</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-3 rounded-lg bg-accent/20 shrink-0">
                        <School className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-foreground">{schoolsActiveDisplay}</div>
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

                  {topDistricts.length > 0 ? (
                    topDistricts.map(summary => {
                      const districtKey = summary.districtName;
                      const activeList = activeSessionsByDistrict[districtKey] ?? [];
                      const fallbackList = allSessionsByDistrict[districtKey] ?? [];
                      const districtSessions = activeList.length > 0 ? activeList : fallbackList;
                      const sessionsToRender = districtSessions.slice(0, 2);
                      const sessionsCount = summary.sessions > 0 ? summary.sessions : summary.totalSessions;
                      const sessionsLabel = `${sessionsCount} ${sessionsCount === 1 ? 'session' : 'sessions'}`;

                      return (
                        <div key={summary.districtId ?? summary.districtName} className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 px-3 sm:px-4 py-2 sm:py-3 border-b">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                              <div className="flex items-center gap-2">
                                <School className="h-4 w-4 text-primary" />
                                <h5 className="font-semibold text-sm sm:text-base text-foreground">{summary.districtName}</h5>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                <span className="text-muted-foreground">{sessionsLabel}</span>
                                <span className="font-medium text-primary">{summary.teachersEnrolled} teachers</span>
                              </div>
                            </div>
                          </div>
                          <div className="divide-y">
                            {sessionsToRender.length > 0 ? (
                              sessionsToRender.map(session => {
                                const { teachersPresent, teachersTotal, studentsPresent, studentsTotal, attendanceRate } = getSessionAttendance(session);
                                const totalTeachers = teachersTotal;
                                const totalStudents = studentsTotal;
                                return (
                                  <div key={session.id ?? `${summary.districtName}-${session.title}`} className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                          <h6 className="font-medium text-sm sm:text-base text-foreground truncate">{session.title ?? 'Untitled Session'}</h6>
                                          {session.courseName && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent-foreground rounded-full shrink-0">
                                              {session.courseName.replace('English ', '')}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{session.school?.name ?? 'Unknown School'}</p>
                                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3 shrink-0" />
                                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
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
                                        {session.id && (
                                          <Link to={`/sessions/${session.id}`} className="shrink-0">
                                            <Button size="sm" variant="outline" className="w-full sm:w-auto">Details</Button>
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-3 sm:p-4 text-xs text-muted-foreground">
                                No sessions to display for this district today.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No district-level activity recorded today.
                    </div>
                  )}

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
                  {(ongoingSessions.length > 0 ? ongoingSessions : todaySessions).map(session => {
                    const { teachersPresent, teachersTotal, studentsPresent, studentsTotal, attendanceRate } = getSessionAttendance(session);
                    const totalTeachers = teachersTotal;
                    const totalStudents = studentsTotal;
                    const fallbackKey = `${session.title ?? 'session'}-${session.startTime ?? 'na'}-${session.endTime ?? 'na'}`;

                    return (
                      <div key={session.id ?? fallbackKey} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all hover:shadow-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{session.title ?? 'Untitled Session'}</h4>
                            {session.courseName && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent-foreground rounded-full">
                                {session.courseName.replace('English ', '')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{session.school?.name ?? 'Unknown School'}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(session.startTime)} - {formatTime(session.endTime)}
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
                          {session.id && (
                            <Link to={`/sessions/${session.id}`}>
                              <Button size="sm" className="ml-4">
                                View Details
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

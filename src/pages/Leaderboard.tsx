import { useState, useEffect } from 'react';
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
import { Trophy, Medal, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherLeaderboard, getStudentLeaderboard } from '@/lib/api';

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
  averageLatestScore: number;
  averageImprovement: number;
  completedAllPhases: number;
  maxPossibleScore: number;
}

const Leaderboard = () => {
  const { filters } = useFilters();
  const { role } = useAuth();
  const showStarColumn = role === 'admin';
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers');
  const [teacherData, setTeacherData] = useState<TeacherLeaderboardItem[]>([]);
  const [studentData, setStudentData] = useState<StudentLeaderboardItem[]>([]);
  const [teacherSummary, setTeacherSummary] = useState<Summary | null>(null);
  const [studentSummary, setStudentSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard data from API
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        
        const params: Record<string, string | number> = {
          topN: 50,
        };

        // Add filter params
        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.school) params.schoolId = filters.school;

        const [teacherResponse, studentResponse] = await Promise.all([
          getTeacherLeaderboard(params),
          getStudentLeaderboard(params),
        ]);

        setTeacherData(teacherResponse.data?.leaderboard || []);
        setTeacherSummary(teacherResponse.data?.summary || null);
        setStudentData(studentResponse.data?.leaderboard || []);
        setStudentSummary(studentResponse.data?.summary || null);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setTeacherData([]);
        setStudentData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [filters.division, filters.district, filters.school]);

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
        return <Badge className="bg-blue-500">Mid Done</Badge>;
      case 'pre_completed':
        return <Badge className="bg-yellow-500">Pre Done</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatTeacherDataForCSV = (data: TeacherLeaderboardItem[]) => {
    const header = [
      'Rank', 'Teacher', 'School', 'District', 'Division', 'Pre Score', 'Mid Score', 'Post Score', 
      'Latest Score', 'Latest %', 'Improvement', 'Improvement %', 'Phases Completed', 'Status'
    ].join(',');

    const rows = data.map(item => {
      const escape = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      return [
        item.rank,
        escape(item.teacher?.name),
        escape(item.teacher?.school),
        escape(item.teacher?.district),
        escape(item.teacher?.division),
        item.scores?.pre || 0,
        item.scores?.mid || 0,
        item.scores?.post || 0,
        item.scores?.latest || 0,
        item.scores?.latestPercentage?.toFixed(1) || 0,
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
      'Rank', 'Student', 'Roll No', 'Grade', 'School', 'District', 'Division', 'Pre Score', 'Mid Score', 'Post Score', 
      'Latest Score', 'Latest %', 'Improvement', 'Improvement %', 'Phases Completed', 'Status'
    ].join(',');

    const rows = data.map(item => {
      const escape = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      return [
        item.rank,
        escape(item.student?.name),
        escape(item.student?.rollNo),
        escape(item.student?.grade),
        escape(item.student?.school),
        escape(item.student?.district),
        escape(item.student?.division),
        item.scores?.pre || 0,
        item.scores?.mid || 0,
        item.scores?.post || 0,
        item.scores?.latest || 0,
        item.scores?.latestPercentage?.toFixed(1) || 0,
        item.improvement?.points || 0,
        item.improvement?.percentage?.toFixed(1) || 0,
        item.phasesCompleted || 0,
        escape(item.status),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  };

  const handleExport = () => {
    const data = activeTab === 'teachers' ? teacherData : studentData;
    if (data.length === 0) {
      alert('No data to export.');
      return;
    }

    const csvContent = activeTab === 'teachers' 
      ? formatTeacherDataForCSV(data as TeacherLeaderboardItem[])
      : formatStudentDataForCSV(data as StudentLeaderboardItem[]);
    
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

  const SummaryCards = ({ summary, type }: { summary: Summary | null; type: 'teachers' | 'students' }) => {
    if (!summary) return null;
    
    const total = type === 'teachers' ? summary.totalTeachers : summary.totalStudents;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {type === 'teachers' ? <Users className="h-5 w-5 text-blue-500" /> : <GraduationCap className="h-5 w-5 text-purple-500" />}
              <div>
                <p className="text-sm text-muted-foreground">Total {type === 'teachers' ? 'Teachers' : 'Students'}</p>
                <p className="text-2xl font-bold">{total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">{summary.averageLatestScore?.toFixed(1) || 0}</p>
                <p className="text-xs text-muted-foreground">out of {summary.maxPossibleScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Improvement</p>
                <p className="text-2xl font-bold">{summary.averageImprovement?.toFixed(1) || 0}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">All Phases Done</p>
                <p className="text-2xl font-bold">{summary.completedAllPhases || 0}</p>
                <p className="text-xs text-muted-foreground">{type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const TeacherTable = () => (
    <>
      <SummaryCards summary={teacherSummary} type="teachers" />
      {teacherPagination.items.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>School</TableHead>
                  {showStarColumn && (
                    <TableHead className="w-14 text-center" title="Starred (admin only)">
                      <Star className="h-4 w-4 inline text-amber-500 fill-amber-500" />
                    </TableHead>
                  )}
                  <TableHead>District</TableHead>
                  <TableHead className="text-center">Pre</TableHead>
                  <TableHead className="text-center">Mid</TableHead>
                  <TableHead className="text-center">Post</TableHead>
                  <TableHead className="text-right">Latest %</TableHead>
                  <TableHead className="text-right">Improvement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherPagination.items.map((item, index) => (
                  <TableRow key={item.teacher?.id || index} className={item.rank <= 3 ? 'bg-muted/30' : ''}>
                    <TableCell className="font-bold flex items-center gap-2">
                      {getRankIcon(item.rank)}
                      {item.rank}
                    </TableCell>
                    <TableCell className="font-medium">{item.teacher?.name || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.teacher?.school || 'N/A'}</TableCell>
                    {showStarColumn && (
                      <TableCell className="text-center">
                        {item.teacher?.starred ? (
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500 inline" title="Starred" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>{item.teacher?.district || 'N/A'}</TableCell>
                    <TableCell className="text-center">{item.scores?.pre || 0}</TableCell>
                    <TableCell className="text-center">{item.scores?.mid || 0}</TableCell>
                    <TableCell className="text-center">{item.scores?.post || 0}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {item.scores?.latestPercentage?.toFixed(1) || 0}%
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={item.improvement?.points > 0 ? 'text-green-600' : item.improvement?.points < 0 ? 'text-red-600' : ''}>
                        {item.improvement?.points > 0 ? '+' : ''}{item.improvement?.points || 0}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{getRankBadge(item.rank)}</TableCell>
                  </TableRow>
                ))}
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>School</TableHead>
                  {showStarColumn && (
                    <TableHead className="w-14 text-center" title="Starred (admin only)">
                      <Star className="h-4 w-4 inline text-amber-500 fill-amber-500" />
                    </TableHead>
                  )}
                  <TableHead>District</TableHead>
                  <TableHead className="text-center">Pre</TableHead>
                  <TableHead className="text-center">Mid</TableHead>
                  <TableHead className="text-center">Post</TableHead>
                  <TableHead className="text-right">Latest %</TableHead>
                  <TableHead className="text-right">Improvement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentPagination.items.map((item, index) => (
                  <TableRow key={item.student?.id || index} className={item.rank <= 3 ? 'bg-muted/30' : ''}>
                    <TableCell className="font-bold flex items-center gap-2">
                      {getRankIcon(item.rank)}
                      {item.rank}
                    </TableCell>
                    <TableCell className="font-medium">{item.student?.name || 'N/A'}</TableCell>
                    <TableCell>{item.student?.rollNo || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.student?.school || 'N/A'}</TableCell>
                    {showStarColumn && (
                      <TableCell className="text-center">
                        {item.student?.starred ? (
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500 inline" title="Starred" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>{item.student?.district || 'N/A'}</TableCell>
                    <TableCell className="text-center">{item.scores?.pre || 0}</TableCell>
                    <TableCell className="text-center">{item.scores?.mid || 0}</TableCell>
                    <TableCell className="text-center">{item.scores?.post || 0}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {item.scores?.latestPercentage?.toFixed(1) || 0}%
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={item.improvement?.points > 0 ? 'text-green-600' : item.improvement?.points < 0 ? 'text-red-600' : ''}>
                        {item.improvement?.points > 0 ? '+' : ''}{item.improvement?.points || 0}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{getRankBadge(item.rank)}</TableCell>
                  </TableRow>
                ))}
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center"> 
        <div className="flex-grow">
          <h1 className="text-3xl font-bold text-foreground">Speaking Assessment Leaderboard</h1>
          <p className="text-muted-foreground">Top 50 performers based on speaking assessment scores</p>
        </div>
        
        <Button onClick={handleExport} variant="outline" className="shrink-0">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Leaderboard Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'teachers' | 'students')}>
              <TabsList className="mb-6">
                <TabsTrigger value="teachers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teachers ({teacherData.length})
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Students ({studentData.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="teachers">
                <TeacherTable />
              </TabsContent>

              <TabsContent value="students">
                <StudentTable />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Speaking Assessment Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Teachers:</strong> Scored on 14 criteria (max 70 points per phase) - Fluency, Sentences, Accuracy, Pronunciation, Vocabulary, Confidence, Asking, Answering, Classroom Instructions, Feedback, Engaging Students, Professional Interaction, Passion, Role Model</p>
          <p><strong>Students:</strong> Scored on 12 criteria (max 60 points per phase) - Fluency, Complete Sentences, Accuracy, Pronunciation, Vocabulary, Confidence, Asking Questions, Answering Questions, Sharing Info, Describing, Feelings, Audience</p>
          <p><strong>Phases:</strong> Pre-Assessment (baseline), Mid-Assessment (progress check), Post-Assessment (final evaluation)</p>
          <p><strong>Ranking:</strong> Based on latest completed phase score percentage, then by improvement points</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;

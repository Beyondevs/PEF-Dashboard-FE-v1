import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { teacherKPIs, teachers, schools } from '@/lib/mockData';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';

const Leaderboard = () => {
  const [attendanceWeight, setAttendanceWeight] = useState([70]);
  
  const assessmentWeight = 100 - attendanceWeight[0];

  const leaderboardTeachers = useMemo(() => {
    const attendanceFactor = attendanceWeight[0];
    const assessmentFactor = 100 - attendanceFactor;

    return [...teacherKPIs]
      .map(kpi => {
        const compositeScore = (attendanceFactor / 100) * kpi.attendanceRate + (assessmentFactor / 100) * kpi.avgStudentScore;
        return { ...kpi, compositeScore };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, 50);
  }, [attendanceWeight]);

  const {
    items: paginatedTeachers,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(leaderboardTeachers, { initialPageSize: 10 });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-accent" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (rank === 3) return <Award className="h-5 w-5 text-chart-4" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 10) return <Badge className="bg-secondary">Top 10</Badge>;
    if (rank <= 25) return <Badge variant="outline">Top 25</Badge>;
    return <Badge variant="secondary">Top 50</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Teacher Leaderboard</h1>
        <p className="text-muted-foreground">Top 50 performing teachers based on attendance and student scores</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Composite Score Weights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Attendance Weight</Label>
              <span className="text-sm font-medium">{attendanceWeight[0]}%</span>
            </div>
            <Slider
              value={attendanceWeight}
              onValueChange={setAttendanceWeight}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          <div className="flex justify-between">
            <div>
              <Label>Student Score Weight</Label>
            </div>
            <span className="text-sm font-medium">{assessmentWeight}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Adjust the weights to see how different factors affect teacher rankings. 
            Formula: Composite Score = (Attendance% × {attendanceWeight[0]}%) + (Avg Student Score% × {assessmentWeight}%)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 50 Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead className="text-right">Attendance %</TableHead>
                  <TableHead className="text-right">Avg Score %</TableHead>
                  <TableHead className="text-right">Composite</TableHead>
                  <TableHead>Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTeachers.map((kpi, index) => {
                  const teacher = teachers.find(t => t.id === kpi.teacherId);
                  const school = schools.find(s => s.id === teacher?.schoolId);
                  const rank = startIndex > 0 ? startIndex + index : index + 1;

                  return (
                    <TableRow key={kpi.teacherId} className={rank <= 3 ? 'bg-muted/30' : ''}>
                      <TableCell className="font-bold flex items-center gap-2">
                        {getRankIcon(rank)}
                        {rank}
                      </TableCell>
                      <TableCell className="font-medium">{teacher?.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{school?.name}</TableCell>
                      <TableCell>{school?.districtId}</TableCell>
                      <TableCell className="text-right">{kpi.attendanceRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{kpi.avgStudentScore.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {kpi.compositeScore.toFixed(1)}%
                      </TableCell>
                      <TableCell>{getRankBadge(rank)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageInfo={
              totalItems > 0
                ? `Showing ${startIndex}-${endIndex} of ${totalItems} teachers`
                : undefined
            }
            className="mt-6"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;

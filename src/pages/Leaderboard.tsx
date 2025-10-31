import { useState, useEffect } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { useFilters } from '@/contexts/FilterContext';
import { getTeacherLeaderboard } from '@/lib/api';

const Leaderboard = () => {
  const { filters } = useFilters();
  const [attendanceWeight, setAttendanceWeight] = useState([70]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const assessmentWeight = 100 - attendanceWeight[0];

  // Fetch leaderboard data from API
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        
        const params: Record<string, string | number> = {
          attendanceWeight: attendanceWeight[0] / 100,
          assessmentWeight: assessmentWeight / 100,
          topN: 50,
        };

        // Add filter params
        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.school) params.schoolId = filters.school;

        const response = await getTeacherLeaderboard(params);
        setLeaderboardData(response.data || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [attendanceWeight, assessmentWeight, filters.division, filters.district, filters.school]);

  const {
    items: paginatedTeachers,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(leaderboardData, { initialPageSize: 10 });

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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : paginatedTeachers.length > 0 ? (
            <>
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
                    {paginatedTeachers.map((item, index) => {
                      const rank = item.rank || (startIndex > 0 ? startIndex + index : index + 1);
                      const teacher = item.teacher;
                      const metrics = item.metrics;

                      return (
                        <TableRow key={teacher?.id || index} className={rank <= 3 ? 'bg-muted/30' : ''}>
                          <TableCell className="font-bold flex items-center gap-2">
                            {getRankIcon(rank)}
                            {rank}
                          </TableCell>
                          <TableCell className="font-medium">{teacher?.name || 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate">{teacher?.school?.name || 'N/A'}</TableCell>
                          <TableCell>{teacher?.school?.district?.name || 'N/A'}</TableCell>
                          <TableCell className="text-right">{metrics?.attendanceRate?.toFixed(1) || 0}%</TableCell>
                          <TableCell className="text-right">{metrics?.avgStudentScore?.toFixed(1) || 0}%</TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {metrics?.compositeScore?.toFixed(1) || 0}%
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
            </>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No leaderboard data</h3>
              <p className="text-muted-foreground">
                No teachers found with the current filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;

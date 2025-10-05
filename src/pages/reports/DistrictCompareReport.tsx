import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { districts, schools, sessions, attendance, assessments } from '@/lib/mockData';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const DistrictCompareReport = () => {
  const handleExport = () => {
    toast.success('District comparison report exported successfully');
  };

  const calculateDistrictMetrics = (districtId: string) => {
    const districtSchools = schools.filter(s => s.districtId === districtId);
    const districtSessions = sessions.filter(s => {
      return districtSchools.some(school => school.id === s.schoolId);
    });

    const districtAttendance = attendance.filter(a => {
      const session = sessions.find(s => s.id === a.sessionId);
      return session && districtSchools.some(school => school.id === session.schoolId);
    });

    const districtAssessments = assessments.filter(a => {
      const session = sessions.find(s => s.id === a.sessionId);
      return session && districtSchools.some(school => school.id === session.schoolId);
    });

    const attendanceRate = districtAttendance.length > 0
      ? (districtAttendance.filter(a => a.present).length / districtAttendance.length) * 100
      : 0;

    const avgScore = districtAssessments.length > 0
      ? districtAssessments.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / districtAssessments.length
      : 0;

    return {
      schools: districtSchools.length,
      sessions: districtSessions.length,
      attendanceRate,
      avgScore,
      totalAttendance: districtAttendance.length,
      totalAssessments: districtAssessments.length,
    };
  };

  const districtData = districts.map(district => ({
    ...district,
    metrics: calculateDistrictMetrics(district.id),
  })).sort((a, b) => b.metrics.avgScore - a.metrics.avgScore);

  const avgAttendanceRate = districtData.reduce((sum, d) => sum + d.metrics.attendanceRate, 0) / districtData.length;
  const avgScoreAll = districtData.reduce((sum, d) => sum + d.metrics.avgScore, 0) / districtData.length;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-primary">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-secondary">🥈 2nd</Badge>;
    if (rank === 3) return <Badge variant="outline">🥉 3rd</Badge>;
    return <Badge variant="secondary">{rank}th</Badge>;
  };

  const getPerformanceIndicator = (value: number, average: number) => {
    if (value > average) {
      return <TrendingUp className="h-4 w-4 text-secondary inline ml-1" />;
    }
    return <TrendingDown className="h-4 w-4 text-destructive inline ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">District Comparison Report</h1>
          <p className="text-muted-foreground">Compare performance metrics across all districts in Punjab</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Districts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{districts.length}</div>
            <p className="text-xs text-muted-foreground">Across Punjab province</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Province-wide average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Assessment Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScoreAll.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Province-wide average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>District Rankings & Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-right">Schools</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Attendance Rate</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead className="text-right">Total Participants</TableHead>
                <TableHead className="text-right">Assessments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {districtData.map((district, index) => (
                <TableRow key={district.id}>
                  <TableCell>{getRankBadge(index + 1)}</TableCell>
                  <TableCell className="font-medium">{district.name}</TableCell>
                  <TableCell className="text-right">{district.metrics.schools}</TableCell>
                  <TableCell className="text-right">{district.metrics.sessions}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold">{district.metrics.attendanceRate.toFixed(1)}%</span>
                    {getPerformanceIndicator(district.metrics.attendanceRate, avgAttendanceRate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-primary">{district.metrics.avgScore.toFixed(1)}%</span>
                    {getPerformanceIndicator(district.metrics.avgScore, avgScoreAll)}
                  </TableCell>
                  <TableCell className="text-right">{district.metrics.totalAttendance}</TableCell>
                  <TableCell className="text-right">{district.metrics.totalAssessments}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Performers (by Score)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {districtData.slice(0, 5).map((district, index) => (
                <div key={district.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRankBadge(index + 1)}
                    <span className="font-medium">{district.name}</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {district.metrics.avgScore.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Districts Needing Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {districtData.slice(-5).reverse().map((district) => (
                <div key={district.id} className="flex items-center justify-between p-3 border rounded-lg border-destructive/20">
                  <div>
                    <div className="font-medium">{district.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {district.metrics.sessions} sessions conducted
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-destructive">
                      {district.metrics.avgScore.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">avg score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DistrictCompareReport;

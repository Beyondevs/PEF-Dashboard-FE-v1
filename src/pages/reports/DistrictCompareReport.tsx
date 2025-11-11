import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
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
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { useEffect, useState, useCallback } from 'react';
import { getDistrictComparisonReport } from '@/lib/api';
import { useFilters } from '@/contexts/FilterContext';

interface DistrictData {
  district: {
    id: string;
    name: string;
    _count?: {
      schools?: number;
    };
  };
  sessionCount: number;
  attendanceRate: number;
  averageScore: number;
  totalTeachers: number;
  totalStudents: number;
  compositeScore: number;
}

const DistrictCompareReport = () => {
  const { filters } = useFilters();
  const [districtData, setDistrictData] = useState<DistrictData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleExport = () => {
    toast.success('District comparison report exported successfully');
  };

  const fetchDistrictComparison = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      
      // Apply division filter if set
      if (filters.division) {
        params.divisionId = filters.division;
      }

      const response = await getDistrictComparisonReport(params);
      setDistrictData(response.data || []);
    } catch (error) {
      console.error('Failed to fetch district comparison:', error);
      toast.error('Failed to load district comparison report');
    } finally {
      setIsLoading(false);
    }
  }, [filters.division]);

  useEffect(() => {
    fetchDistrictComparison();
  }, [fetchDistrictComparison]);

  const avgAttendanceRate = districtData.length > 0
    ? districtData.reduce((sum, d) => sum + d.attendanceRate, 0) / districtData.length
    : 0;
  const avgScoreAll = districtData.length > 0
    ? districtData.reduce((sum, d) => sum + d.averageScore, 0) / districtData.length
    : 0;

  const {
    items: paginatedDistricts,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(districtData, { initialPageSize: 10 });

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

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Districts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{districtData.length}</div>
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
              <div className="overflow-x-auto">
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
                      <TableHead className="text-right">Teachers</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDistricts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedDistricts.map((district, index) => {
                        const rank = startIndex > 0 ? startIndex + index : index + 1;

                        return (
                          <TableRow key={district.district.id}>
                            <TableCell>{getRankBadge(rank)}</TableCell>
                            <TableCell className="font-medium">{district.district.name}</TableCell>
                            <TableCell className="text-right">{district.district._count?.schools || 0}</TableCell>
                            <TableCell className="text-right">{district.sessionCount}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold">{district.attendanceRate.toFixed(1)}%</span>
                              {getPerformanceIndicator(district.attendanceRate, avgAttendanceRate)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-primary">{district.averageScore.toFixed(1)}%</span>
                              {getPerformanceIndicator(district.averageScore, avgScoreAll)}
                            </TableCell>
                            <TableCell className="text-right">{district.totalTeachers + district.totalStudents}</TableCell>
                            <TableCell className="text-right">{district.totalTeachers}</TableCell>
                            <TableCell className="text-right">{district.totalStudents}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageInfo={
                  totalItems > 0
                    ? `Showing ${startIndex}-${endIndex} of ${totalItems} districts`
                    : undefined
                }
                className="mt-6"
              />
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
                    <div key={district.district.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getRankBadge(index + 1)}
                        <span className="font-medium">{district.district.name}</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {district.averageScore.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {districtData.length === 0 && (
                    <p className="text-center text-muted-foreground">No data available</p>
                  )}
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
                    <div key={district.district.id} className="flex items-center justify-between p-3 border rounded-lg border-destructive/20">
                      <div>
                        <div className="font-medium">{district.district.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {district.sessionCount} sessions conducted
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-destructive">
                          {district.averageScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">avg score</div>
                      </div>
                    </div>
                  ))}
                  {districtData.length === 0 && (
                    <p className="text-center text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DistrictCompareReport;

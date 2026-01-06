import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/usePagination';
import PaginationControls from '@/components/PaginationControls';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDrilldownReport, exportDrilldownCSV } from '@/lib/api';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';

type DrillLevel = 'province' | 'division' | 'district' | 'tehsil' | 'school';

interface DrillState {
  level: DrillLevel;
  divisionId?: string;
  districtId?: string;
  tehsilId?: string;
}

interface DrillItem {
  id: string;
  name: string;
  emisCode?: string;
  sessionCount?: number;
  attendanceRate?: number;
  avgScore?: number;
  _count?: {
    schools?: number;
    districts?: number;
    tehsils?: number;
    sessions?: number;
  };
}

const DrilldownReport = () => {
  const { filters } = useFilters();
  const { role } = useAuth();
  const [drillState, setDrillState] = useState<DrillState>({ level: 'province' });
  const [divisions, setDivisions] = useState<DrillItem[]>([]);
  const [districts, setDistricts] = useState<DrillItem[]>([]);
  const [tehsils, setTehsils] = useState<DrillItem[]>([]);
  const [schools, setSchools] = useState<DrillItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    items: paginatedDivisions,
    page: divisionPage,
    setPage: setDivisionPage,
    totalPages: divisionTotalPages,
    startIndex: divisionStart,
    endIndex: divisionEnd,
    totalItems: divisionTotal,
  } = usePagination(divisions, { initialPageSize: 10 });

  const {
    items: paginatedDistricts,
    page: districtPage,
    setPage: setDistrictPage,
    totalPages: districtTotalPages,
    startIndex: districtStart,
    endIndex: districtEnd,
    totalItems: districtTotal,
  } = usePagination(districts, { initialPageSize: 10 });

  const {
    items: paginatedTehsils,
    page: tehsilPage,
    setPage: setTehsilPage,
    totalPages: tehsilTotalPages,
    startIndex: tehsilStart,
    endIndex: tehsilEnd,
    totalItems: tehsilTotal,
  } = usePagination(tehsils, { initialPageSize: 10 });

  const {
    items: paginatedSchools,
    page: schoolPage,
    setPage: setSchoolPage,
    totalPages: schoolTotalPages,
    startIndex: schoolStart,
    endIndex: schoolEnd,
    totalItems: schoolTotal,
  } = usePagination(schools, { initialPageSize: 10 });

  const fetchDrilldownData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (drillState.level === 'province') {
        const response = await getDrilldownReport({ level: 'division' });
        setDivisions(response.data.items || []);
      } else if (drillState.level === 'division' && drillState.divisionId) {
        const response = await getDrilldownReport({ level: 'district', parentId: drillState.divisionId });
        setDistricts(response.data.items || []);
      } else if (drillState.level === 'district' && drillState.districtId) {
        const response = await getDrilldownReport({ level: 'tehsil', parentId: drillState.districtId });
        setTehsils(response.data.items || []);
      } else if (drillState.level === 'tehsil' && drillState.tehsilId) {
        const response = await getDrilldownReport({ level: 'school', parentId: drillState.tehsilId });
        setSchools(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch drilldown data:', error);
      toast.error('Failed to load drilldown report');
    } finally {
      setIsLoading(false);
    }
  }, [drillState]);

  useEffect(() => {
    fetchDrilldownData();
  }, [fetchDrilldownData]);

  useEffect(() => {
    setDistrictPage(1);
  }, [drillState.divisionId, setDistrictPage]);

  useEffect(() => {
    setTehsilPage(1);
  }, [drillState.districtId, setTehsilPage]);

  useEffect(() => {
    setSchoolPage(1);
  }, [drillState.tehsilId, setSchoolPage]);

  const handleExport = async () => {
    try {
      // Map 'province' level to 'division' since backend doesn't support 'province'
      const exportLevel = drillState.level === 'province' ? 'division' : drillState.level;
      
      const params: Record<string, string> = {
        level: exportLevel,
      };
      
      // Set parentId based on current drill state
      if (drillState.tehsilId) {
        params.parentId = drillState.tehsilId;
      } else if (drillState.districtId) {
        params.parentId = drillState.districtId;
      } else if (drillState.divisionId) {
        params.parentId = drillState.divisionId;
      }
      // If level is 'province', no parentId is needed (shows all divisions)

      const blob = await exportDrilldownCSV(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `drilldown-report-${drillState.level}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    toast.success('Drill-down report exported successfully');
    } catch (error) {
      console.error('Failed to export drilldown report:', error);
      toast.error('Failed to export drilldown report');
    }
  };

  const calculateProvinceMetrics = () => {
    if (divisions.length === 0) return { schools: 0, sessions: 0, attendanceRate: 0, avgScore: 0 };
    
    const totalSessions = divisions.reduce((sum, div) => sum + (div.sessionCount || 0), 0);
    const totalAttendance = divisions.reduce((sum, div) => sum + (div.attendanceRate || 0), 0);
    const totalScore = divisions.reduce((sum, div) => sum + (div.avgScore || 0), 0);
    const totalSchools = divisions.reduce((sum, div) => sum + (div._count?.schools || 0), 0);
    
    return {
      schools: totalSchools,
      sessions: totalSessions,
      attendanceRate: divisions.length > 0 ? (totalAttendance / divisions.length).toFixed(1) : '0.0',
      avgScore: divisions.length > 0 ? (totalScore / divisions.length).toFixed(1) : '0.0',
    };
  };

  const calculateDivisionMetrics = () => {
    if (districts.length === 0) return { schools: 0, sessions: 0, attendanceRate: 0, avgScore: 0 };
    
    const totalSessions = districts.reduce((sum, dist) => sum + (dist.sessionCount || 0), 0);
    const totalAttendance = districts.reduce((sum, dist) => sum + (dist.attendanceRate || 0), 0);
    const totalScore = districts.reduce((sum, dist) => sum + (dist.avgScore || 0), 0);
    const totalSchools = districts.reduce((sum, dist) => sum + (dist._count?.schools || 0), 0);
    
    return {
      schools: totalSchools,
      sessions: totalSessions,
      attendanceRate: districts.length > 0 ? (totalAttendance / districts.length).toFixed(1) : '0.0',
      avgScore: districts.length > 0 ? (totalScore / districts.length).toFixed(1) : '0.0',
    };
  };

  const calculateDistrictMetrics = () => {
    if (tehsils.length === 0) return { schools: 0, sessions: 0, attendanceRate: 0, avgScore: 0 };
    
    const totalSessions = tehsils.reduce((sum, teh) => sum + (teh.sessionCount || 0), 0);
    const totalAttendance = tehsils.reduce((sum, teh) => sum + (teh.attendanceRate || 0), 0);
    const totalScore = tehsils.reduce((sum, teh) => sum + (teh.avgScore || 0), 0);
    const totalSchools = tehsils.reduce((sum, teh) => sum + (teh._count?.schools || 0), 0);
    
    return {
      schools: totalSchools,
      sessions: totalSessions,
      attendanceRate: tehsils.length > 0 ? (totalAttendance / tehsils.length).toFixed(1) : '0.0',
      avgScore: tehsils.length > 0 ? (totalScore / tehsils.length).toFixed(1) : '0.0',
    };
  };

  const calculateTehsilMetrics = () => {
    if (schools.length === 0) return { schools: 0, sessions: 0, attendanceRate: 0, avgScore: 0 };
    
    const totalSessions = schools.reduce((sum, sch) => sum + (sch.sessionCount || 0), 0);
    const totalAttendance = schools.reduce((sum, sch) => sum + (sch.attendanceRate || 0), 0);
    const totalScore = schools.reduce((sum, sch) => sum + (sch.avgScore || 0), 0);
    
    return {
      schools: schools.length,
      sessions: totalSessions,
      attendanceRate: schools.length > 0 ? (totalAttendance / schools.length).toFixed(1) : '0.0',
      avgScore: schools.length > 0 ? (totalScore / schools.length).toFixed(1) : '0.0',
    };
  };

  const renderProvinceLevel = () => {
    const metrics = calculateProvinceMetrics();
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Punjab Province Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold">{divisions.length}</div>
                <p className="text-sm text-muted-foreground">Divisions</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.schools}</div>
                <p className="text-sm text-muted-foreground">Schools</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.attendanceRate}%</div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.avgScore}%</div>
                <p className="text-sm text-muted-foreground">Avg Assessment Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Divisions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Division Name</TableHead>
                        <TableHead className="text-right">Districts</TableHead>
                        <TableHead className="text-right">Schools</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Attendance Rate</TableHead>
                        <TableHead className="text-right">Avg Score</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDivisions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDivisions.map(division => (
                          <TableRow key={division.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">{division.name}</TableCell>
                            <TableCell className="text-right">{division._count?.districts || 0}</TableCell>
                            <TableCell className="text-right">{division._count?.schools || 0}</TableCell>
                            <TableCell className="text-right">{division.sessionCount || 0}</TableCell>
                            <TableCell className="text-right">{division.attendanceRate || 0}%</TableCell>
                            <TableCell className="text-right">{division.avgScore || 0}%</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDrillState({ level: 'division', divisionId: division.id })}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  currentPage={divisionPage}
                  totalPages={divisionTotalPages}
                  onPageChange={setDivisionPage}
                  pageInfo={
                    divisionTotal > 0
                      ? `Showing ${divisionStart}-${divisionEnd} of ${divisionTotal} divisions`
                      : undefined
                  }
                  className="mt-6"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDivisionLevel = () => {
    const division = divisions.find(d => d.id === drillState.divisionId);
    const metrics = calculateDivisionMetrics();

    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setDrillState({ level: 'province' })}>
          ← Back to Province
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{division?.name} Division</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold">{districts.length}</div>
                <p className="text-sm text-muted-foreground">Districts</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.schools}</div>
                <p className="text-sm text-muted-foreground">Schools</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.attendanceRate}%</div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.avgScore}%</div>
                <p className="text-sm text-muted-foreground">Avg Assessment Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Districts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>District Name</TableHead>
                        <TableHead className="text-right">Tehsils</TableHead>
                        <TableHead className="text-right">Schools</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Attendance Rate</TableHead>
                        <TableHead className="text-right">Avg Score</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDistricts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedDistricts.map(district => (
                          <TableRow key={district.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">{district.name}</TableCell>
                            <TableCell className="text-right">{district._count?.tehsils || 0}</TableCell>
                            <TableCell className="text-right">{district._count?.schools || 0}</TableCell>
                            <TableCell className="text-right">{district.sessionCount || 0}</TableCell>
                            <TableCell className="text-right">{district.attendanceRate || 0}%</TableCell>
                            <TableCell className="text-right">{district.avgScore || 0}%</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDrillState({ 
                                  level: 'district', 
                                  divisionId: drillState.divisionId,
                                  districtId: district.id 
                                })}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  currentPage={districtPage}
                  totalPages={districtTotalPages}
                  onPageChange={setDistrictPage}
                  pageInfo={
                    districtTotal > 0
                      ? `Showing ${districtStart}-${districtEnd} of ${districtTotal} districts`
                      : undefined
                  }
                  className="mt-6"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDistrictLevel = () => {
    const district = districts.find(d => d.id === drillState.districtId);
    const metrics = calculateDistrictMetrics();

    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setDrillState({ 
            level: 'division', 
            divisionId: drillState.divisionId 
          })}
        >
          ← Back to Division
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{district?.name} District</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold">{tehsils.length}</div>
                <p className="text-sm text-muted-foreground">Tehsils</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.schools}</div>
                <p className="text-sm text-muted-foreground">Schools</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.attendanceRate}%</div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.avgScore}%</div>
                <p className="text-sm text-muted-foreground">Avg Assessment Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tehsils</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tehsil Name</TableHead>
                        <TableHead className="text-right">Schools</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Attendance Rate</TableHead>
                        <TableHead className="text-right">Avg Score</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTehsils.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedTehsils.map(tehsil => (
                          <TableRow key={tehsil.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">{tehsil.name}</TableCell>
                            <TableCell className="text-right">{tehsil._count?.schools || 0}</TableCell>
                            <TableCell className="text-right">{tehsil.sessionCount || 0}</TableCell>
                            <TableCell className="text-right">{tehsil.attendanceRate || 0}%</TableCell>
                            <TableCell className="text-right">{tehsil.avgScore || 0}%</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDrillState({ 
                                  level: 'tehsil',
                                  divisionId: drillState.divisionId,
                                  districtId: drillState.districtId,
                                  tehsilId: tehsil.id 
                                })}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  currentPage={tehsilPage}
                  totalPages={tehsilTotalPages}
                  onPageChange={setTehsilPage}
                  pageInfo={
                    tehsilTotal > 0
                      ? `Showing ${tehsilStart}-${tehsilEnd} of ${tehsilTotal} tehsils`
                      : undefined
                  }
                  className="mt-6"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTehsilLevel = () => {
    const tehsil = tehsils.find(t => t.id === drillState.tehsilId);
    const metrics = calculateTehsilMetrics();

    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setDrillState({ 
            level: 'district',
            divisionId: drillState.divisionId,
            districtId: drillState.districtId 
          })}
        >
          ← Back to District
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{tehsil?.name} Tehsil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-2xl font-bold">{schools.length}</div>
                <p className="text-sm text-muted-foreground">Schools</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.sessions}</div>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.attendanceRate}%</div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{metrics.avgScore}%</div>
                <p className="text-sm text-muted-foreground">Avg Assessment Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schools</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>School Name</TableHead>
                        <TableHead>EMIS Code</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Attendance Rate</TableHead>
                        <TableHead className="text-right">Avg Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSchools.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedSchools.map(school => (
                          <TableRow key={school.id}>
                            <TableCell className="font-medium max-w-xs truncate">{school.name}</TableCell>
                            <TableCell>{school.emisCode}</TableCell>
                            <TableCell className="text-right">{school.sessionCount || 0}</TableCell>
                            <TableCell className="text-right">{school.attendanceRate || 0}%</TableCell>
                            <TableCell className="text-right">{school.avgScore || 0}%</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  currentPage={schoolPage}
                  totalPages={schoolTotalPages}
                  onPageChange={setSchoolPage}
                  pageInfo={
                    schoolTotal > 0
                      ? `Showing ${schoolStart}-${schoolEnd} of ${schoolTotal} schools`
                      : undefined
                  }
                  className="mt-6"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hierarchical Drill-Down Report</h1>
          <p className="text-muted-foreground">Province → Division → District → Tehsil → School performance metrics</p>
        </div>
        {role !== 'bnu' && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      {drillState.level === 'province' && renderProvinceLevel()}
      {drillState.level === 'division' && renderDivisionLevel()}
      {drillState.level === 'district' && renderDistrictLevel()}
      {drillState.level === 'tehsil' && renderTehsilLevel()}
    </div>
  );
};

export default DrilldownReport;

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ChevronRight, ChevronDown } from 'lucide-react';
import { divisions, districts, tehsils, schools, sessions, attendance, assessments, students } from '@/lib/mockData';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type DrillLevel = 'province' | 'division' | 'district' | 'tehsil' | 'school';

interface DrillState {
  level: DrillLevel;
  divisionId?: string;
  districtId?: string;
  tehsilId?: string;
}

const DrilldownReport = () => {
  const [drillState, setDrillState] = useState<DrillState>({ level: 'province' });

  const handleExport = () => {
    toast.success('Drill-down report exported successfully');
  };

  const calculateMetrics = (scopeFilter: (schoolId: string) => boolean) => {
    const scopedSchools = schools.filter(s => scopeFilter(s.id));
    const scopedSessions = sessions.filter(s => scopeFilter(s.schoolId));
    
    const allAttendance = attendance.filter(a => {
      const session = sessions.find(s => s.id === a.sessionId);
      return session && scopeFilter(session.schoolId);
    });
    
    const allAssessments = assessments.filter(a => {
      const session = sessions.find(s => s.id === a.sessionId);
      return session && scopeFilter(session.schoolId);
    });

    const attendanceRate = allAttendance.length > 0
      ? (allAttendance.filter(a => a.present).length / allAttendance.length) * 100
      : 0;

    const avgScore = allAssessments.length > 0
      ? allAssessments.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / allAssessments.length
      : 0;

    return {
      schools: scopedSchools.length,
      sessions: scopedSessions.length,
      attendanceRate: attendanceRate.toFixed(1),
      avgScore: avgScore.toFixed(1),
    };
  };

  const renderProvinceLevel = () => {
    const metrics = calculateMetrics(() => true);
    
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
                {divisions.map(division => {
                  const divDistricts = districts.filter(d => d.divisionId === division.id);
                  const metrics = calculateMetrics(schoolId => {
                    const school = schools.find(s => s.id === schoolId);
                    return school?.divisionId === division.id;
                  });

                  return (
                    <TableRow key={division.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{division.name}</TableCell>
                      <TableCell className="text-right">{divDistricts.length}</TableCell>
                      <TableCell className="text-right">{metrics.schools}</TableCell>
                      <TableCell className="text-right">{metrics.sessions}</TableCell>
                      <TableCell className="text-right">{metrics.attendanceRate}%</TableCell>
                      <TableCell className="text-right">{metrics.avgScore}%</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDivisionLevel = () => {
    const division = divisions.find(d => d.id === drillState.divisionId);
    const divDistricts = districts.filter(d => d.divisionId === drillState.divisionId);
    const metrics = calculateMetrics(schoolId => {
      const school = schools.find(s => s.id === schoolId);
      return school?.divisionId === drillState.divisionId;
    });

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
                <div className="text-2xl font-bold">{divDistricts.length}</div>
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
                {divDistricts.map(district => {
                  const distTehsils = tehsils.filter(t => t.districtId === district.id);
                  const metrics = calculateMetrics(schoolId => {
                    const school = schools.find(s => s.id === schoolId);
                    return school?.districtId === district.id;
                  });

                  return (
                    <TableRow key={district.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{district.name}</TableCell>
                      <TableCell className="text-right">{distTehsils.length}</TableCell>
                      <TableCell className="text-right">{metrics.schools}</TableCell>
                      <TableCell className="text-right">{metrics.sessions}</TableCell>
                      <TableCell className="text-right">{metrics.attendanceRate}%</TableCell>
                      <TableCell className="text-right">{metrics.avgScore}%</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDistrictLevel = () => {
    const district = districts.find(d => d.id === drillState.districtId);
    const distTehsils = tehsils.filter(t => t.districtId === drillState.districtId);
    const metrics = calculateMetrics(schoolId => {
      const school = schools.find(s => s.id === schoolId);
      return school?.districtId === drillState.districtId;
    });

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
                <div className="text-2xl font-bold">{distTehsils.length}</div>
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
                {distTehsils.map(tehsil => {
                  const metrics = calculateMetrics(schoolId => {
                    const school = schools.find(s => s.id === schoolId);
                    return school?.tehsilId === tehsil.id;
                  });

                  return (
                    <TableRow key={tehsil.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{tehsil.name}</TableCell>
                      <TableCell className="text-right">{metrics.schools}</TableCell>
                      <TableCell className="text-right">{metrics.sessions}</TableCell>
                      <TableCell className="text-right">{metrics.attendanceRate}%</TableCell>
                      <TableCell className="text-right">{metrics.avgScore}%</TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTehsilLevel = () => {
    const tehsil = tehsils.find(t => t.id === drillState.tehsilId);
    const tehsilSchools = schools.filter(s => s.tehsilId === drillState.tehsilId);
    const metrics = calculateMetrics(schoolId => {
      const school = schools.find(s => s.id === schoolId);
      return school?.tehsilId === drillState.tehsilId;
    });

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
                <div className="text-2xl font-bold">{tehsilSchools.length}</div>
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
                {tehsilSchools.slice(0, 50).map(school => {
                  const metrics = calculateMetrics(schoolId => schoolId === school.id);

                  return (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium max-w-xs truncate">{school.name}</TableCell>
                      <TableCell>{school.emisCode}</TableCell>
                      <TableCell className="text-right">{metrics.sessions}</TableCell>
                      <TableCell className="text-right">{metrics.attendanceRate}%</TableCell>
                      <TableCell className="text-right">{metrics.avgScore}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {drillState.level === 'province' && renderProvinceLevel()}
      {drillState.level === 'division' && renderDivisionLevel()}
      {drillState.level === 'district' && renderDistrictLevel()}
      {drillState.level === 'tehsil' && renderTehsilLevel()}
    </div>
  );
};

export default DrilldownReport;

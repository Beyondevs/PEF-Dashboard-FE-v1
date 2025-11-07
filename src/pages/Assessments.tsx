import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Save, Plus } from 'lucide-react';
import { assessments, sessions, students } from '@/lib/mockData';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilters } from '@/contexts/FilterContext';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { getAssessments, bulkUpsertAssessments, updateAssessment, getSessions, getTeacherLeaderboard } from '@/lib/api';

const Assessments = () => {
  const { filters } = useFilters();
  const [scoreChanges, setScoreChanges] = useState<Record<string, number>>({});
  const [newEntries, setNewEntries] = useState<Array<{ studentId: string; sessionId: string; score: number; maxScore: number }>>([]);
  const [quickEntryScores, setQuickEntryScores] = useState<Record<string, number>>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
  // API data state
  const [apiAssessments, setApiAssessments] = useState<any[]>([]);
  const [apiSessions, setApiSessions] = useState<any[]>([]);
  const [teacherPerformance, setTeacherPerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const pageSize = 20;

  // Fetch assessments from API
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        setApiError(false);
        
        // Transform filters to API format
        const apiFilters: any = {
          page: currentPage,
          pageSize,
        };
        
        // Add session filter if present
        if (filters.sessionId) {
          apiFilters.sessionId = filters.sessionId;
        }
        
        // Add other filters
        if (filters.division) apiFilters.divisionId = filters.division;
        if (filters.district) apiFilters.districtId = filters.district;
        if (filters.tehsil) apiFilters.tehsilId = filters.tehsil;
        if (filters.school) apiFilters.schoolId = filters.school;
        
        const response = await getAssessments(apiFilters);
        
        setApiAssessments(response.data.data || []);
        setTotalPages((response.data as any).totalPages || Math.ceil((response.data.total || 0) / pageSize));
        setTotalItems(response.data.total || 0);
        
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
        setApiError(true);
        setApiAssessments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, [currentPage, filters]);

  // Fetch teacher performance data
  useEffect(() => {
    const fetchTeacherPerformance = async () => {
      try {
        const params: Record<string, string | number> = {
          topN: 1000, // Get a large number
        };
        
        // Add geography filters if selected
        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.school) params.schoolId = filters.school;
        
        const response = await getTeacherLeaderboard(params);
        setTeacherPerformance(response.data || []);
      } catch (error) {
        console.error('Failed to fetch teacher performance:', error);
        setTeacherPerformance([]);
      }
    };

    if (activeTab === 'teachers') {
      fetchTeacherPerformance();
    }
  }, [activeTab, filters.division, filters.district, filters.school]);

  // Fetch sessions for the selector
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const params: Record<string, string | number> = {
          page: 1,
          pageSize: 1000, // Get a large number of sessions for the selector
        };
        
        // Add geography filters if selected
        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.tehsil) params.tehsilId = filters.tehsil;
        if (filters.school) params.schoolId = filters.school;
        
        const response = await getSessions(params);
        setApiSessions(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        setApiSessions([]);
      }
    };

    fetchSessions();
  }, [filters]);

  const visibleAssessments = useMemo(() => {
    const dataset = apiError ? assessments : apiAssessments;
    return dataset.filter((a: any) => {
      const subjectType = a.subjectType?.toString().toLowerCase();
      return !subjectType || subjectType === 'student';
    });
  }, [apiAssessments, apiError]);

  const {
    items: paginatedAssessments,
    startIndex,
    endIndex,
  } = usePagination(visibleAssessments, { 
    initialPageSize: pageSize
  });

  const handleExport = () => {
    toast.success('Export generated successfully');
  };

  const handleSaveChanges = async () => {
    try {
      const totalChanges = Object.keys(scoreChanges).length + newEntries.length;
      
      if (totalChanges === 0) {
        toast.info('No changes to save');
        return;
      }

      // Update existing assessments
      const updatePromises = Object.entries(scoreChanges).map(([assessmentId, newScore]) =>
        updateAssessment(assessmentId, { score: newScore })
      );

      // Create new assessments (if any)
      const createPromises = newEntries.map(entry => {
        const data = { assessments: [{ studentId: entry.studentId, score: entry.score, maxScore: entry.maxScore }] };
        console.log('Sending new entry data:', data);
        return bulkUpsertAssessments(entry.sessionId, data);
      });

      // Execute all updates
      await Promise.all([...updatePromises, ...createPromises]);

      toast.success(`Assessment scores updated for ${totalChanges} records`);
      setScoreChanges({});
      setNewEntries([]);
      
      // Refresh the data
      const response = await getAssessments({
        page: currentPage,
        pageSize,
        ...(filters.sessionId && { sessionId: filters.sessionId }),
        ...(filters.division && { divisionId: filters.division }),
        ...(filters.district && { districtId: filters.district }),
        ...(filters.tehsil && { tehsilId: filters.tehsil }),
        ...(filters.school && { schoolId: filters.school }),
      });
      
      setApiAssessments(response.data.data || []);
      setTotalPages((response.data as any).totalPages || Math.ceil((response.data.total || 0) / pageSize));
      setTotalItems(response.data.total || 0);
      
    } catch (error) {
      console.error('Failed to save assessment changes:', error);
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const updateScore = (assessmentId: string, newScore: number) => {
    setScoreChanges(prev => ({
      ...prev,
      [assessmentId]: newScore,
    }));
  };

  const getScore = (assessmentId: string, originalScore: number) => {
    return scoreChanges[assessmentId] !== undefined ? scoreChanges[assessmentId] : originalScore;
  };

  const getScoreBadge = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return <Badge className="bg-secondary">Excellent</Badge>;
    if (percentage >= 60) return <Badge variant="default">Good</Badge>;
    if (percentage >= 40) return <Badge variant="outline">Average</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const handleQuickEntryScoreChange = (studentId: string, score: number) => {
    setQuickEntryScores(prev => ({
      ...prev,
      [studentId]: score,
    }));
  };

  const handleQuickEntrySave = async () => {
    if (!selectedSessionId) {
      toast.error('Please select a session first');
      return;
    }

    const entries = Object.entries(quickEntryScores)
      .filter(([_, score]) => score > 0)
      .map(([studentId, score]) => ({
        studentId,
        score,
        maxScore: 10, // Default max score, can be made configurable
      }));

    if (entries.length === 0) {
      toast.error('Please enter at least one score');
      return;
    }

    try {
      console.log('Sending quick entry data:', { assessments: entries });
      await bulkUpsertAssessments(selectedSessionId, { assessments: entries });
      toast.success(`Added ${entries.length} assessment scores`);
      setQuickEntryScores({});
      
      // Refresh the data
      const response = await getAssessments({
        page: currentPage,
        pageSize,
        ...(filters.sessionId && { sessionId: filters.sessionId }),
        ...(filters.division && { divisionId: filters.division }),
        ...(filters.district && { districtId: filters.district }),
        ...(filters.tehsil && { tehsilId: filters.tehsil }),
        ...(filters.school && { schoolId: filters.school }),
      });
      
      setApiAssessments(response.data.data || []);
      setTotalPages((response.data as any).totalPages || Math.ceil((response.data.total || 0) / pageSize));
      setTotalItems(response.data.total || 0);
      
    } catch (error) {
      console.error('Failed to save quick entry scores:', error);
      toast.error('Failed to save scores. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Student Assessments</h1>
            <p className="text-muted-foreground">View and manage student assessment scores</p>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
          <p className="text-muted-foreground">View and manage student assessments and teacher performance</p>
          
        </div>
        <div className="flex gap-2">
          {activeTab === 'students' && (
            <>
              {(Object.keys(scoreChanges).length > 0 || newEntries.length > 0) && (
                <Button onClick={handleSaveChanges}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes ({Object.keys(scoreChanges).length + newEntries.length})
                </Button>
              )}
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="students" value={activeTab} onValueChange={(v) => setActiveTab(v as 'students' | 'teachers')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Tabs defaultValue="view" className="space-y-4">
            <TabsList>
              <TabsTrigger value="view">View Assessments</TabsTrigger>
              <TabsTrigger value="edit">Edit Scores</TabsTrigger>
              <TabsTrigger value="entry">Quick Entry</TabsTrigger>
            </TabsList>

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Max Score</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssessments.map(assessment => {
                      // Use data from API response instead of mock data
                      const student = assessment.student;
                      const session = assessment.session;
                      const percentage = ((assessment.score / assessment.maxScore) * 100).toFixed(1);

                      return (
                        <TableRow key={assessment.id}>
                          <TableCell className="font-medium">{student?.name || 'N/A'}</TableCell>
                          <TableCell>{session?.title || 'N/A'}</TableCell>
                          <TableCell>{session?.date ? new Date(session.date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="text-right font-semibold">{assessment.score}</TableCell>
                          <TableCell className="text-right">{assessment.maxScore}</TableCell>
                          <TableCell className="text-right text-primary font-semibold">
                            {percentage}%
                          </TableCell>
                          <TableCell>{getScoreBadge(assessment.score, assessment.maxScore)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageInfo={
                  totalItems > 0
                    ? `Showing ${startIndex}-${endIndex} of ${totalItems} assessments`
                    : undefined
                }
                className="mt-6"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Assessment Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Edit Score</TableHead>
                      <TableHead className="text-right">Max Score</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssessments.map(assessment => {
                      // Use data from API response instead of mock data
                      const student = assessment.student;
                      const session = assessment.session;
                      const currentScore = getScore(assessment.id, assessment.score);
                      const hasChanges = scoreChanges[assessment.id] !== undefined;
                      const percentage = ((currentScore / assessment.maxScore) * 100).toFixed(1);

                      return (
                        <TableRow key={assessment.id} className={hasChanges ? 'bg-muted/50' : ''}>
                          <TableCell className="font-medium">{student?.name || 'N/A'}</TableCell>
                          <TableCell>{session?.title || 'N/A'}</TableCell>
                          <TableCell>{session?.date ? new Date(session.date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <Input
                                type="number"
                                min="0"
                                max={assessment.maxScore}
                                value={currentScore}
                                onChange={(e) => updateScore(assessment.id, parseFloat(e.target.value) || 0)}
                                className="w-20 text-right"
                                step="0.01"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{assessment.maxScore}</TableCell>
                          <TableCell className="text-right text-primary font-semibold">
                            {percentage}%
                          </TableCell>
                          <TableCell>{getScoreBadge(currentScore, assessment.maxScore)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageInfo={
                  totalItems > 0
                    ? `Showing ${startIndex}-${endIndex} of ${totalItems} assessments`
                    : undefined
                }
                className="mt-6"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entry">
          <Card>
            <CardHeader>
              <CardTitle>Quick Entry Grid</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Enter assessment scores (0-10) for students. The "Last Assessment" badge shows the most recent score for each student.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiSessions.length === 0 ? (
                      <SelectItem value="" disabled>No sessions available</SelectItem>
                    ) : (
                      apiSessions.map(session => (
                        <SelectItem key={session?.id} value={session?.id || ''}>
                          {session?.title} - {session?.date ? new Date(session.date).toLocaleDateString() : 'No date'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleQuickEntrySave}
                  disabled={!selectedSessionId || Object.keys(quickEntryScores).length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Scores ({Object.keys(quickEntryScores).length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {apiAssessments
                    .map(assessment => assessment.student)
                    .filter((student, index, self) => 
                      student && self.findIndex(s => s?.id === student.id) === index
                    )
                    .slice(0, 12)
                    .map(student => {
                      // Find the most recent assessment score for this student
                      const studentAssessment = apiAssessments
                        .filter(assessment => assessment.student?.id === student?.id)
                        .sort((a, b) => new Date(b.recordedAt || b.createdAt).getTime() - new Date(a.recordedAt || a.createdAt).getTime())[0];
                      
                      const lastScore = studentAssessment?.score;
                      const hasExistingScore = lastScore !== undefined && lastScore !== null;
                      
                      return (
                        <div key={student?.id} className="border rounded-lg p-4 space-y-3">
                          <div>
                            <div className="font-medium">{student?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Grade {student?.grade}
                            </div>
                            {hasExistingScore && (
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Last Assessment: {lastScore}/10
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder={hasExistingScore ? `Update from ${lastScore}` : "Enter Score"}
                              className="flex-1"
                              min="0"
                              max="10"
                              step="0.01"
                              value={quickEntryScores[student?.id || ''] || ''}
                              onChange={(e) => handleQuickEntryScoreChange(student?.id || '', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Performance Metrics</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                View teacher performance based on attendance and student assessment scores
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead className="text-right">Attendance Rate</TableHead>
                      <TableHead className="text-right">Avg Student Score</TableHead>
                      <TableHead className="text-right">Composite Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherPerformance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {isLoading ? 'Loading teacher performance data...' : 'No teacher performance data available'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      teacherPerformance.map((item: any) => (
                        <TableRow key={item.teacher?.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">#{item.rank}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.teacher?.name || 'N/A'}</TableCell>
                          <TableCell>{item.teacher?.school || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold">{item.metrics?.attendanceRate?.toFixed(1) || 0}%</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold">{(item.metrics?.avgStudentScore || 0).toFixed(1)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={
                                item.metrics?.compositeScore >= 70 ? "default" :
                                item.metrics?.compositeScore >= 50 ? "secondary" : "outline"
                              }
                              className="font-semibold"
                            >
                              {(item.metrics?.compositeScore || 0).toFixed(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {teacherPerformance.length > 0 && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Showing {teacherPerformance.length} teachers
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assessments;

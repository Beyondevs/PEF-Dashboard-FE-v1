import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Download, Save, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useFilters } from '@/contexts/FilterContext';
import PaginationControls from '@/components/PaginationControls';
import { 
  getAssessments, 
  bulkUpsertStudentAssessments, 
  bulkUpsertTeacherAssessments, 
  updateAssessment 
} from '@/lib/api';

const Assessments = () => {
  const { filters } = useFilters();
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [editMode, setEditMode] = useState(false);
  
  // Student assessments state
  const [studentAssessments, setStudentAssessments] = useState<any[]>([]);
  const [studentChanges, setStudentChanges] = useState<Record<string, number>>({});
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotalItems, setStudentTotalItems] = useState(0);
  
  // Teacher assessments state
  const [teacherAssessments, setTeacherAssessments] = useState<any[]>([]);
  const [teacherChanges, setTeacherChanges] = useState<Record<string, number>>({});
  const [teacherPage, setTeacherPage] = useState(1);
  const [teacherTotalPages, setTeacherTotalPages] = useState(1);
  const [teacherTotalItems, setTeacherTotalItems] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 20;

  const buildFilters = (pageNumber: number, subjectType: 'student' | 'teacher') => {
    const apiFilters: Record<string, string | number> = {
      page: pageNumber,
      pageSize,
      subjectType,
    };

    if (filters.sessionId) apiFilters.sessionId = filters.sessionId;
    if (filters.division) apiFilters.divisionId = filters.division;
    if (filters.district) apiFilters.districtId = filters.district;
    if (filters.tehsil) apiFilters.tehsilId = filters.tehsil;
    if (filters.school) apiFilters.schoolId = filters.school;

    return apiFilters;
  };

  // Fetch student assessments
  useEffect(() => {
    const fetchStudentAssessments = async () => {
      try {
        setIsLoading(true);

        const response = await getAssessments(buildFilters(studentPage, 'student'));
        const { data, totalItems, totalPages } = response.data;

        const computedTotalItems = totalItems ?? data?.length ?? 0;
        const computedTotalPages = totalPages ?? (computedTotalItems > 0 ? Math.ceil(computedTotalItems / pageSize) : 1);

        setStudentAssessments(data ?? []);
        setStudentTotalItems(computedTotalItems);
        setStudentTotalPages(computedTotalPages);
      } catch (error) {
        console.error('Failed to fetch student assessments:', error);
        setStudentAssessments([]);
        toast.error('Failed to load student assessments');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'students') {
      fetchStudentAssessments();
    }
  }, [studentPage, filters, activeTab]);

  // Fetch teacher assessments
  useEffect(() => {
    const fetchTeacherAssessments = async () => {
      try {
        setIsLoading(true);

        const response = await getAssessments(buildFilters(teacherPage, 'teacher'));
        const { data, totalItems, totalPages } = response.data;

        const computedTotalItems = totalItems ?? data?.length ?? 0;
        const computedTotalPages = totalPages ?? (computedTotalItems > 0 ? Math.ceil(computedTotalItems / pageSize) : 1);

        setTeacherAssessments(data ?? []);
        setTeacherTotalItems(computedTotalItems);
        setTeacherTotalPages(computedTotalPages);
      } catch (error) {
        console.error('Failed to fetch teacher assessments:', error);
        setTeacherAssessments([]);
        toast.error('Failed to load teacher assessments');
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'teachers') {
      fetchTeacherAssessments();
    }
  }, [teacherPage, filters, activeTab]);

  const handleStudentScoreChange = (assessmentId: string, value: string) => {
    const score = parseFloat(value);
    if (!isNaN(score)) {
      setStudentChanges((prev) => ({ ...prev, [assessmentId]: score }));
    } else {
      const { [assessmentId]: _, ...rest } = studentChanges;
      setStudentChanges(rest);
    }
  };

  const handleTeacherScoreChange = (assessmentId: string, value: string) => {
    const score = parseFloat(value);
    if (!isNaN(score)) {
      setTeacherChanges((prev) => ({ ...prev, [assessmentId]: score }));
    } else {
      const { [assessmentId]: _, ...rest } = teacherChanges;
      setTeacherChanges(rest);
    }
  };

  const handleSaveStudentChanges = async () => {
    if (Object.keys(studentChanges).length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      await Promise.all(
        Object.entries(studentChanges).map(([assessmentId, score]) => {
          const assessment = studentAssessments.find((a) => a.id === assessmentId);
          if (!assessment) return Promise.resolve();
          
          return updateAssessment(assessmentId, {
            score,
            maxScore: assessment.maxScore,
          });
        })
      );

      toast.success('Student assessments updated successfully');
      setStudentChanges({});
      setEditMode(false);
      
      // Refresh data
      const apiFilters: any = {
        page: studentPage,
        pageSize,
        subjectType: 'student',
      };
      if (filters.sessionId) apiFilters.sessionId = filters.sessionId;
      if (filters.division) apiFilters.divisionId = filters.division;
      if (filters.district) apiFilters.districtId = filters.district;
      if (filters.tehsil) apiFilters.tehsilId = filters.tehsil;
      if (filters.school) apiFilters.schoolId = filters.school;
      
      const response = await getAssessments(apiFilters);
      setStudentAssessments(response.data.data || []);
    } catch (error) {
      console.error('Failed to save student assessments:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleSaveTeacherChanges = async () => {
    if (Object.keys(teacherChanges).length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      await Promise.all(
        Object.entries(teacherChanges).map(([assessmentId, score]) => {
          const assessment = teacherAssessments.find((a) => a.id === assessmentId);
          if (!assessment) return Promise.resolve();
          
          return updateAssessment(assessmentId, {
            score,
            maxScore: assessment.maxScore,
          });
        })
      );

      toast.success('Teacher assessments updated successfully');
      setTeacherChanges({});
      setEditMode(false);
      
      // Refresh data
      const apiFilters: any = {
        page: teacherPage,
        pageSize,
        subjectType: 'teacher',
      };
      if (filters.sessionId) apiFilters.sessionId = filters.sessionId;
      if (filters.division) apiFilters.divisionId = filters.division;
      if (filters.district) apiFilters.districtId = filters.district;
      if (filters.tehsil) apiFilters.tehsilId = filters.tehsil;
      if (filters.school) apiFilters.schoolId = filters.school;
      
      const response = await getAssessments(apiFilters);
      setTeacherAssessments(response.data.data || []);
    } catch (error) {
      console.error('Failed to save teacher assessments:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setStudentChanges({});
    setTeacherChanges({});
  };

  const handleExport = () => {
    const data = activeTab === 'students' ? studentAssessments : teacherAssessments;
    const csvContent = generateCSV(data, activeTab);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}-assessments-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${activeTab === 'students' ? 'Student' : 'Teacher'} assessments exported successfully`);
  };

  const generateCSV = (data: any[], type: 'students' | 'teachers') => {
    if (type === 'students') {
      const headers = ['Student', 'Session', 'Date', 'Score', 'Max Score', 'Percentage'];
      const rows = data.map((assessment) => [
        assessment.student?.name || 'N/A',
        assessment.session?.title || 'N/A',
        assessment.session?.date ? new Date(assessment.session.date).toLocaleDateString() : 'N/A',
        assessment.score,
        assessment.maxScore,
        ((assessment.score / assessment.maxScore) * 100).toFixed(1) + '%',
      ]);
      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    } else {
      const headers = ['Teacher', 'Session', 'Date', 'Score', 'Max Score', 'Percentage'];
      const rows = data.map((assessment) => [
        assessment.teacher?.name || 'N/A',
        assessment.session?.title || 'N/A',
        assessment.session?.date ? new Date(assessment.session.date).toLocaleDateString() : 'N/A',
        assessment.score,
        assessment.maxScore,
        ((assessment.score / assessment.maxScore) * 100).toFixed(1) + '%',
      ]);
      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }
  };

  const getScoreBadge = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (percentage >= 60) return <Badge className="bg-blue-500">Good</Badge>;
    if (percentage >= 40) return <Badge className="bg-yellow-500">Average</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
            <p className="text-muted-foreground">View and manage assessments</p>
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

  const studentStartIndex = (studentPage - 1) * pageSize + 1;
  const studentEndIndex = Math.min(studentPage * pageSize, studentTotalItems);
  
  const teacherStartIndex = (teacherPage - 1) * pageSize + 1;
  const teacherEndIndex = Math.min(teacherPage * pageSize, teacherTotalItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assessments</h1>
          <p className="text-muted-foreground">View and manage student and teacher assessments</p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button onClick={activeTab === 'students' ? handleSaveStudentChanges : handleSaveTeacherChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes ({activeTab === 'students' ? Object.keys(studentChanges).length : Object.keys(teacherChanges).length})
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'students' | 'teachers')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Assessment Records</CardTitle>
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
                    {studentAssessments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No student assessments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentAssessments.map((assessment) => {
                        const percentage = ((assessment.score / assessment.maxScore) * 100).toFixed(1);
                        const currentScore = studentChanges[assessment.id] ?? assessment.score;

                        return (
                          <TableRow key={assessment.id}>
                            <TableCell className="font-medium">{assessment.student?.name || 'N/A'}</TableCell>
                            <TableCell>{assessment.session?.title || 'N/A'}</TableCell>
                            <TableCell>
                              {assessment.session?.date ? new Date(assessment.session.date).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              {editMode ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max={assessment.maxScore}
                                  step="0.01"
                                  value={currentScore}
                                  onChange={(e) => handleStudentScoreChange(assessment.id, e.target.value)}
                                  className="w-20"
                                />
                              ) : (
                                <span className="font-semibold">{assessment.score}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{assessment.maxScore}</TableCell>
                            <TableCell className="text-right text-primary font-semibold">{percentage}%</TableCell>
                            <TableCell>{getScoreBadge(assessment.score, assessment.maxScore)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {studentTotalItems > 0 && (
                <PaginationControls
                  currentPage={studentPage}
                  totalPages={studentTotalPages}
                  onPageChange={setStudentPage}
                  pageInfo={`Showing ${studentStartIndex}-${studentEndIndex} of ${studentTotalItems} assessments`}
                  className="mt-6"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Assessment Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Max Score</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherAssessments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No teacher assessments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      teacherAssessments.map((assessment) => {
                        const percentage = ((assessment.score / assessment.maxScore) * 100).toFixed(1);
                        const currentScore = teacherChanges[assessment.id] ?? assessment.score;

                        return (
                          <TableRow key={assessment.id}>
                            <TableCell className="font-medium">{assessment.teacher?.name || 'N/A'}</TableCell>
                            <TableCell>{assessment.teacher?.school?.name || 'N/A'}</TableCell>
                            <TableCell>{assessment.session?.title || 'N/A'}</TableCell>
                            <TableCell>
                              {assessment.session?.date ? new Date(assessment.session.date).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              {editMode ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max={assessment.maxScore}
                                  step="0.01"
                                  value={currentScore}
                                  onChange={(e) => handleTeacherScoreChange(assessment.id, e.target.value)}
                                  className="w-20"
                                />
                              ) : (
                                <span className="font-semibold">{assessment.score}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{assessment.maxScore}</TableCell>
                            <TableCell className="text-right text-primary font-semibold">{percentage}%</TableCell>
                            <TableCell>{getScoreBadge(assessment.score, assessment.maxScore)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {teacherTotalItems > 0 && (
                <PaginationControls
                  currentPage={teacherPage}
                  totalPages={teacherTotalPages}
                  onPageChange={setTeacherPage}
                  pageInfo={`Showing ${teacherStartIndex}-${teacherEndIndex} of ${teacherTotalItems} assessments`}
                  className="mt-6"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assessments;

import { useState, useEffect, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  GraduationCap,
  Search,
  FileText,
  BarChart3,
  Calendar,
  School,
  Eye,
  ClipboardEdit,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import PaginationControls from '@/components/PaginationControls';
import {
  StudentSpeakingAssessmentForm,
  TeacherSpeakingAssessmentForm,
  StudentAssessmentDetail,
  TeacherAssessmentDetail,
} from '@/components/speaking-assessments';
import {
  getStudentSpeakingAssessments,
  getTeacherSpeakingAssessments,
  getStudentSpeakingAssessmentById,
  getTeacherSpeakingAssessmentById,
  type SpeakingAssessmentStatus,
} from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const SpeakingAssessments = () => {
  const { filters } = useFilters();
  const { role, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isAdminUser = isAdmin();
  const canFillAssessment = isAdminUser || role === 'trainer';

  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [selectedStatus, setSelectedStatus] = useState<SpeakingAssessmentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');

  // Form modals
  const [selectedStudentAssessment, setSelectedStudentAssessment] = useState<any>(null);
  const [selectedTeacherAssessment, setSelectedTeacherAssessment] = useState<any>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [showTeacherDetail, setShowTeacherDetail] = useState(false);
  const [editingPhase, setEditingPhase] = useState<'pre' | 'mid' | 'post' | null>(null);

  // Student assessments state
  const [studentAssessments, setStudentAssessments] = useState<any[]>([]);
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotalItems, setStudentTotalItems] = useState(0);

  // Teacher assessments state
  const [teacherAssessments, setTeacherAssessments] = useState<any[]>([]);
  const [teacherPage, setTeacherPage] = useState(1);
  const [teacherTotalPages, setTeacherTotalPages] = useState(1);
  const [teacherTotalItems, setTeacherTotalItems] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 100;

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm.trim());
    setStudentPage(1);
    setTeacherPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const fetchStudentAssessments = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiFilters: Record<string, string | number> = {
        page: studentPage,
        pageSize,
      };

      if (selectedStatus !== 'all') apiFilters.status = selectedStatus;
      if (filters.division) apiFilters.divisionId = filters.division;
      if (filters.district) apiFilters.districtId = filters.district;
      if (filters.school) apiFilters.schoolId = filters.school;
      if (filters.startDate) apiFilters.from = filters.startDate;
      if (filters.endDate) apiFilters.to = filters.endDate;
      if (activeSearchTerm) apiFilters.search = activeSearchTerm;

      const response = await getStudentSpeakingAssessments(apiFilters);
      const { data, totalItems, totalPages } = response.data;

      setStudentAssessments(data ?? []);
      setStudentTotalItems(totalItems ?? 0);
      setStudentTotalPages(totalPages ?? 1);
    } catch (error) {
      console.error('Failed to fetch student assessments:', error);
      setStudentAssessments([]);
      toast.error('Failed to load student assessments');
    } finally {
      setIsLoading(false);
    }
  }, [studentPage, pageSize, selectedStatus, filters.division, filters.district, filters.school, filters.startDate, filters.endDate, activeSearchTerm]);

  const fetchTeacherAssessments = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiFilters: Record<string, string | number> = {
        page: teacherPage,
        pageSize,
      };

      if (selectedStatus !== 'all') apiFilters.status = selectedStatus;
      if (filters.division) apiFilters.divisionId = filters.division;
      if (filters.district) apiFilters.districtId = filters.district;
      if (filters.school) apiFilters.schoolId = filters.school;
      if (filters.startDate) apiFilters.from = filters.startDate;
      if (filters.endDate) apiFilters.to = filters.endDate;
      if (activeSearchTerm) apiFilters.search = activeSearchTerm;

      const response = await getTeacherSpeakingAssessments(apiFilters);
      const { data, totalItems, totalPages } = response.data;

      setTeacherAssessments(data ?? []);
      setTeacherTotalItems(totalItems ?? 0);
      setTeacherTotalPages(totalPages ?? 1);
    } catch (error) {
      console.error('Failed to fetch teacher assessments:', error);
      setTeacherAssessments([]);
      toast.error('Failed to load teacher assessments');
    } finally {
      setIsLoading(false);
    }
  }, [teacherPage, pageSize, selectedStatus, filters.division, filters.district, filters.school, filters.startDate, filters.endDate, activeSearchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setStudentPage(1);
    setTeacherPage(1);
  }, [filters.division, filters.district, filters.school, filters.startDate, filters.endDate, selectedStatus]);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudentAssessments();
    }
  }, [activeTab, fetchStudentAssessments]);

  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeacherAssessments();
    }
  }, [activeTab, fetchTeacherAssessments]);

  const handleStudentFormSuccess = () => {
    setShowStudentForm(false);
    setSelectedStudentAssessment(null);
    setEditingPhase(null);
    fetchStudentAssessments();
    toast.success('Assessment phase saved successfully');
  };

  const handleTeacherFormSuccess = () => {
    setShowTeacherForm(false);
    setSelectedTeacherAssessment(null);
    setEditingPhase(null);
    fetchTeacherAssessments();
    toast.success('Assessment phase saved successfully');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case 'pre_completed':
        return (
          <Badge className="gap-1 bg-blue-500">
            <AlertCircle className="h-3 w-3" /> Pre Done
          </Badge>
        );
      case 'mid_completed':
        return (
          <Badge className="gap-1 bg-yellow-500">
            <AlertCircle className="h-3 w-3" /> Mid Done
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" /> Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNextPhaseLabel = (nextPhase: string | null) => {
    switch (nextPhase) {
      case 'pre':
        return 'Fill Pre';
      case 'mid':
        return 'Fill Mid';
      case 'post':
        return 'Fill Post';
      default:
        return null;
    }
  };

  const studentMaxScore = 60;
  const teacherMaxScore = 70;

  const studentStartIndex = (studentPage - 1) * pageSize + 1;
  const studentEndIndex = Math.min(studentPage * pageSize, studentTotalItems);

  const teacherStartIndex = (teacherPage - 1) * pageSize + 1;
  const teacherEndIndex = Math.min(teacherPage * pageSize, teacherTotalItems);

  // Handle student fill form click
  const handleStudentFillForm = (assessment: any) => {
    setSelectedStudentAssessment(assessment);
    setEditingPhase(null); // Not editing, filling next phase
    setShowStudentForm(true);
  };

  // Handle teacher fill form click
  const handleTeacherFillForm = (assessment: any) => {
    setSelectedTeacherAssessment(assessment);
    setEditingPhase(null); // Not editing, filling next phase
    setShowTeacherForm(true);
  };

  // Handle student view details click
  const handleStudentViewDetails = async (assessment: any) => {
    try {
      // Fetch full assessment details to get all phase-specific fields
      const response = await getStudentSpeakingAssessmentById(assessment.id);
      const fullAssessment = response.data;
      setSelectedStudentAssessment(fullAssessment);
      setShowStudentDetail(true);
    } catch (error) {
      console.error('Failed to fetch assessment details:', error);
      toast.error('Failed to load assessment details');
    }
  };

  // Handle teacher view details click
  const handleTeacherViewDetails = async (assessment: any) => {
    try {
      // Fetch full assessment details to get all phase-specific fields
      const response = await getTeacherSpeakingAssessmentById(assessment.id);
      const fullAssessment = response.data;
      setSelectedTeacherAssessment(fullAssessment);
      setShowTeacherDetail(true);
    } catch (error) {
      console.error('Failed to fetch assessment details:', error);
      toast.error('Failed to load assessment details');
    }
  };

  // Handle edit phase from detail view
  const handleStudentEditPhase = async (phase: 'pre' | 'mid' | 'post') => {
    setShowStudentDetail(false);
    setEditingPhase(phase);
    
    try {
      // Fetch full assessment details to get all phase data
      const response = await getStudentSpeakingAssessmentById(selectedStudentAssessment.id);
      const fullAssessment = response.data;
      setSelectedStudentAssessment(fullAssessment);
      setShowStudentForm(true);
    } catch (error) {
      console.error('Failed to fetch assessment details:', error);
      toast.error('Failed to load assessment details');
    }
  };

  const handleTeacherEditPhase = async (phase: 'pre' | 'mid' | 'post') => {
    setShowTeacherDetail(false);
    setEditingPhase(phase);
    
    try {
      // Fetch full assessment details to get all phase data
      const response = await getTeacherSpeakingAssessmentById(selectedTeacherAssessment.id);
      const fullAssessment = response.data;
      setSelectedTeacherAssessment(fullAssessment);
      setShowTeacherForm(true);
    } catch (error) {
      console.error('Failed to fetch assessment details:', error);
      toast.error('Failed to load assessment details');
    }
  };

  if (isLoading && studentAssessments.length === 0 && teacherAssessments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Speaking Assessments</h1>
            <p className="text-muted-foreground">Evaluate speaking skills for students and teachers</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Speaking Assessments</h1>
          <p className="text-muted-foreground">Evaluate speaking skills for students and teachers</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder={`Search ${activeTab}...`}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} size="default" className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Filter */}
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value as SpeakingAssessmentStatus | 'all');
              setStudentPage(1);
              setTeacherPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="pre_completed">Pre Completed</SelectItem>
              <SelectItem value="mid_completed">Mid Completed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Reports Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/speaking-assessments/reports')}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Reports
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'students' | 'teachers')} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="students" className="gap-2">
            <User className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Teachers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Speaking Assessment Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                {isLoading && activeTab === 'students' && studentAssessments.length > 0 && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading assessments...</p>
                    </div>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Pre</TableHead>
                      <TableHead className="text-center">Mid</TableHead>
                      <TableHead className="text-center">Post</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && activeTab === 'students' && studentAssessments.length === 0 ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skeleton-${i}`}>
                          <TableCell><div className="h-4 bg-muted rounded w-24 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-muted rounded w-32 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-muted rounded w-20 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-6 bg-muted rounded w-16 animate-pulse"></div></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted rounded w-12 mx-auto animate-pulse"></div></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted rounded w-12 mx-auto animate-pulse"></div></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted rounded w-12 mx-auto animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-muted rounded w-20 animate-pulse"></div></TableCell>
                          <TableCell className="text-right"><div className="h-8 bg-muted rounded w-16 ml-auto animate-pulse"></div></TableCell>
                        </TableRow>
                      ))
                    ) : studentAssessments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>No student speaking assessments found</p>
                          <p className="text-sm mt-2">Assessments are created automatically for session participants</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentAssessments.map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell className="font-medium">{assessment.studentName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <School className="h-3 w-3 text-muted-foreground" />
                              {assessment.schoolName || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>{assessment.district || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                          <TableCell className="text-center">
                            {assessment.preTotalScore > 0 ? (
                              <span className="font-semibold text-blue-600">{assessment.preTotalScore}/{studentMaxScore}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {assessment.midTotalScore > 0 ? (
                              <span className="font-semibold text-yellow-600">{assessment.midTotalScore}/{studentMaxScore}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {assessment.postTotalScore > 0 ? (
                              <span className="font-semibold text-green-600">{assessment.postTotalScore}/{studentMaxScore}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {assessment.createdAt
                                ? new Date(assessment.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {canFillAssessment && assessment.nextPhase && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStudentFillForm(assessment)}
                                  className="gap-1"
                                >
                                  <ClipboardEdit className="h-3 w-3" />
                                  {getNextPhaseLabel(assessment.nextPhase)}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStudentViewDetails(assessment)}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {studentTotalItems > 0 && (
                <div className={`mt-6 ${isLoading && activeTab === 'students' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <PaginationControls
                    currentPage={studentPage}
                    totalPages={studentTotalPages}
                    onPageChange={(page) => {
                      if (!isLoading || activeTab !== 'students') {
                        setStudentPage(page);
                      }
                    }}
                    pageInfo={`Showing ${studentStartIndex}-${studentEndIndex} of ${studentTotalItems} assessments`}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Teacher Speaking Assessment Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                {isLoading && activeTab === 'teachers' && teacherAssessments.length > 0 && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading assessments...</p>
                    </div>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Pre</TableHead>
                      <TableHead className="text-center">Mid</TableHead>
                      <TableHead className="text-center">Post</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && activeTab === 'teachers' && teacherAssessments.length === 0 ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skeleton-${i}`}>
                          <TableCell><div className="h-4 bg-muted rounded w-24 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-muted rounded w-32 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-muted rounded w-20 animate-pulse"></div></TableCell>
                          <TableCell><div className="h-6 bg-muted rounded w-16 animate-pulse"></div></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted rounded w-12 mx-auto animate-pulse"></div></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted rounded w-12 mx-auto animate-pulse"></div></TableCell>
                          <TableCell className="text-center"><div className="h-4 bg-muted rounded w-12 mx-auto animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-muted rounded w-20 animate-pulse"></div></TableCell>
                          <TableCell className="text-right"><div className="h-8 bg-muted rounded w-16 ml-auto animate-pulse"></div></TableCell>
                        </TableRow>
                      ))
                    ) : teacherAssessments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>No teacher speaking assessments found</p>
                          <p className="text-sm mt-2">Assessments are created automatically for session participants</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      teacherAssessments.map((assessment) => (
                        <TableRow key={assessment.id}>
                          <TableCell className="font-medium">{assessment.teacherName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <School className="h-3 w-3 text-muted-foreground" />
                              {assessment.schoolName || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>{assessment.district || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                          <TableCell className="text-center">
                            {assessment.preTotalScore > 0 ? (
                              <span className="font-semibold text-blue-600">{assessment.preTotalScore}/{teacherMaxScore}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {assessment.midTotalScore > 0 ? (
                              <span className="font-semibold text-yellow-600">{assessment.midTotalScore}/{teacherMaxScore}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {assessment.postTotalScore > 0 ? (
                              <span className="font-semibold text-green-600">{assessment.postTotalScore}/{teacherMaxScore}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {assessment.createdAt
                                ? new Date(assessment.createdAt).toLocaleDateString()
                                : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {canFillAssessment && assessment.nextPhase && (
                                <Button
                                  size="sm"
                                  onClick={() => handleTeacherFillForm(assessment)}
                                  className="gap-1"
                                >
                                  <ClipboardEdit className="h-3 w-3" />
                                  {getNextPhaseLabel(assessment.nextPhase)}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTeacherViewDetails(assessment)}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {teacherTotalItems > 0 && (
                <div className={`mt-6 ${isLoading && activeTab === 'teachers' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <PaginationControls
                    currentPage={teacherPage}
                    totalPages={teacherTotalPages}
                    onPageChange={(page) => {
                      if (!isLoading || activeTab !== 'teachers') {
                        setTeacherPage(page);
                      }
                    }}
                    pageInfo={`Showing ${teacherStartIndex}-${teacherEndIndex} of ${teacherTotalItems} assessments`}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Form Modal */}
      {showStudentForm && selectedStudentAssessment && (
        <StudentSpeakingAssessmentForm
          assessment={selectedStudentAssessment}
          phaseToFill={editingPhase || undefined}
          onClose={() => {
            setShowStudentForm(false);
            setSelectedStudentAssessment(null);
            setEditingPhase(null);
          }}
          onSuccess={handleStudentFormSuccess}
        />
      )}

      {/* Teacher Form Modal */}
      {showTeacherForm && selectedTeacherAssessment && (
        <TeacherSpeakingAssessmentForm
          assessment={selectedTeacherAssessment}
          phaseToFill={editingPhase || undefined}
          onClose={() => {
            setShowTeacherForm(false);
            setSelectedTeacherAssessment(null);
            setEditingPhase(null);
          }}
          onSuccess={handleTeacherFormSuccess}
        />
      )}

      {/* Student Detail Modal */}
      {showStudentDetail && selectedStudentAssessment && (
        <StudentAssessmentDetail
          assessment={selectedStudentAssessment}
          onClose={() => {
            setShowStudentDetail(false);
            setSelectedStudentAssessment(null);
          }}
          onEditPhase={handleStudentEditPhase}
        />
      )}

      {/* Teacher Detail Modal */}
      {showTeacherDetail && selectedTeacherAssessment && (
        <TeacherAssessmentDetail
          assessment={selectedTeacherAssessment}
          onClose={() => {
            setShowTeacherDetail(false);
            setSelectedTeacherAssessment(null);
          }}
          onEditPhase={handleTeacherEditPhase}
        />
      )}
    </div>
  );
};

export default SpeakingAssessments;

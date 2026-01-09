import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
import { Plus, Eye, Edit, Trash2, FileText, Search, Calendar as CalendarIcon, School as SchoolIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCard } from '@/components/MobileCard';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/contexts/FilterContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';
import { getSessions, createSession, updateSession, deleteSession, getSchools, getDivisions, getDistricts, getTehsils, getTrainers, exportSessionsCSV, importSessionsCSV, downloadSessionsTemplate } from '@/lib/api';
import { ExportButton } from '@/components/data-transfer/ExportButton';
import { ImportButton } from '@/components/data-transfer/ImportButton';
import { SearchTag } from '@/components/SearchTag';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sessions = () => {
  const { role, isAdmin, canEdit } = useAuth();
  const canManageSessions = () => role === 'admin';
  const canViewDataTransfer = () => role === 'admin' || role === 'division_role' || role === 'client';
  const { filters } = useFilters();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  
  // API data state
  const [apiSessions, setApiSessions] = useState<any[]>([]);
  const [apiSchools, setApiSchools] = useState<any[]>([]);
  const [apiTrainers, setApiTrainers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');

  // Track previous filter values to detect changes and reset pagination
  const prevFiltersRef = useRef({
    sessionId: filters.sessionId,
    division: filters.division,
    district: filters.district,
    tehsil: filters.tehsil,
    school: filters.school,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    schoolId: '',
    trainerId: '',
  });

  const [schoolSearchOpen, setSchoolSearchOpen] = useState(false);
  const [trainerSearchOpen, setTrainerSearchOpen] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(false);

      const prevFilters = prevFiltersRef.current;
      const filtersChanged = 
        prevFilters.sessionId !== filters.sessionId ||
        prevFilters.division !== filters.division ||
        prevFilters.district !== filters.district ||
        prevFilters.tehsil !== filters.tehsil ||
        prevFilters.school !== filters.school ||
        prevFilters.startDate !== filters.startDate ||
        prevFilters.endDate !== filters.endDate;

      const effectivePage = filtersChanged ? 1 : currentPage;

      if (filtersChanged) {
        prevFiltersRef.current = {
          sessionId: filters.sessionId,
          division: filters.division,
          district: filters.district,
          tehsil: filters.tehsil,
          school: filters.school,
          startDate: filters.startDate,
          endDate: filters.endDate,
        };
        if (currentPage !== 1) setCurrentPage(1);
      }

      const params: Record<string, string | number> = {
        page: effectivePage,
        pageSize,
      };

      if (filters.sessionId) params.sessionId = filters.sessionId;
      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;
      if (filters.startDate) params.from = filters.startDate;
      if (filters.endDate) params.to = filters.endDate;
      if (activeSearchTerm) params.search = activeSearchTerm;

      const response = await getSessions(params);
      setApiSessions(response.data.data || []);
      const total = (response.data as any).totalItems || (response.data as any).total || 0;
      const computedTotalPages = Math.max(1, Math.ceil(total / pageSize));
      setTotalItems(total);
      setTotalPages(computedTotalPages);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setApiError(true);
      setApiSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeSearchTerm, filters.sessionId, filters.division, filters.district, filters.tehsil, filters.school, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSearch = () => {
    const newSearchTerm = searchTerm.trim();
    if (newSearchTerm !== activeSearchTerm) {
      setActiveSearchTerm(newSearchTerm);
      setCurrentPage(1);
    }
    // Clear input after applying search so UX is driven by the applied filter chip
    setSearchTerm('');
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [schoolsResponse, trainersResponse] = await Promise.all([
          getSchools({ page: 1, pageSize: 1000 }),
          getTrainers({ page: 1, pageSize: 1000 })
        ]);
        setApiSchools(schoolsResponse.data.data || []);
        setApiTrainers(trainersResponse.data.data || []);
      } catch (error) {
        console.error('Failed to fetch form data:', error);
        setApiSchools([]);
        setApiTrainers([]);
      }
    };
    fetchFormData();
  }, []);

  const paginatedSessions = apiSessions;
  const startIndex = totalItems > 0 && currentPage > 0 ? ((currentPage - 1) * pageSize) + 1 : 0;
  const endIndex = totalItems > 0 && currentPage > 0 ? Math.min(currentPage * pageSize, totalItems) : 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      draft: 'outline',
      published: 'outline',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const formatDateForInput = (value: string | Date | null | undefined) => {
    if (!value) return '';
    const normalize = (date: Date) => {
      const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return adjusted.toISOString().split('T')[0];
    };
    if (value instanceof Date) return normalize(value);
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return normalize(parsed);
    const [datePart] = value.split('T');
    return datePart ?? value;
  };

  const getSchoolName = (schoolId: string) => {
    const school = apiSchools.find(s => s.id === schoolId);
    return school ? school.name : 'Select school';
  };

  const getTrainerName = (trainerId: string) => {
    const trainer = apiTrainers.find(t => t.id === trainerId);
    return trainer ? (trainer.trainerProfile?.name || trainer.email) : 'Select trainer';
  };

  const filteredTrainersForSelectedSchool = useMemo(() => {
    if (!formData.schoolId) return [];
    return apiTrainers.filter((trainer) =>
      Array.isArray(trainer?.trainerProfile?.assignedSchools) &&
      trainer.trainerProfile.assignedSchools.includes(formData.schoolId)
    );
  }, [apiTrainers, formData.schoolId]);

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadSessionsTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sessions-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
      toast.error('Failed to download template. Please try again.');
    }
  };

  const handleCreateSession = async () => {
    try {
      if (!formData.title || !formData.schoolId || !formData.trainerId || !formData.date || !formData.startTime) {
        toast.error('Please fill in all required fields');
        return;
      }
      const sessionData = {
        title: formData.title,
        courseName: 'Spoken English Programme' as const,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime || `${parseInt(formData.startTime.split(':')[0]) + 2}:00`,
        schoolId: formData.schoolId,
        trainerId: formData.trainerId,
      };
      await createSession(sessionData);
      toast.success('Session created successfully');
      setIsCreateOpen(false);
      setFormData({ title: '', date: '', startTime: '', endTime: '', schoolId: '', trainerId: '' });
      await fetchSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session. Please try again.');
    }
  };

  const handleEditSession = async () => {
    if (!editingSession) return;
    try {
      if (!formData.title || !formData.schoolId || !formData.trainerId || !formData.date || !formData.startTime) {
        toast.error('Please fill in all required fields');
        return;
      }
      const sessionData = {
        title: formData.title,
        courseName: 'Spoken English Programme' as const,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime || `${parseInt(formData.startTime.split(':')[0]) + 2}:00`,
        schoolId: formData.schoolId,
        trainerId: formData.trainerId,
      };
      await updateSession(editingSession.id, sessionData);
      toast.success('Session updated successfully');
      setIsEditOpen(false);
      setEditingSession(null);
      setFormData({ title: '', date: '', startTime: '', endTime: '', schoolId: '', trainerId: '' });
      await fetchSessions();
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session. Please try again.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;
    try {
      await deleteSession(sessionId);
      toast.success('Session deleted successfully');
      await fetchSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session. Please try again.');
    }
  };

  const openEditDialog = (session: any) => {
    setEditingSession(session);
    setFormData({
      title: session.title || '',
      date: formatDateForInput(session.date),
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      schoolId: session.schoolId || '',
      trainerId: session.trainerId || '',
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Training Sessions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and monitor all training sessions</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {canViewDataTransfer() && (
            <>
              {canManageSessions() && (
                <Button variant="default" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Session
                </Button>
              )}
              <Button variant="outline" onClick={handleDownloadTemplate} className="flex-1 sm:flex-initial">
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Template</span>
                <span className="sm:hidden">Template</span>
              </Button>
              {role === 'admin' && (
                <ImportButton
                  label="Import"
                  importFn={async (file) => {
                    const response = await importSessionsCSV(file);
                    return response.data as any;
                  }}
                  onSuccess={fetchSessions}
                />
              )}
            </>
          )}

          {(canViewDataTransfer() || role === 'trainer') && (
            <ExportButton
              label="Export"
              exportFn={async () => {
                const params: Record<string, string | number | boolean> = {};
                if (filters.division) params.divisionId = filters.division;
                if (filters.district) params.districtId = filters.district;
                if (filters.tehsil) params.tehsilId = filters.tehsil;
                if (filters.school) params.schoolId = filters.school;
                if (filters.startDate) params.from = filters.startDate;
                if (filters.endDate) params.to = filters.endDate;
                if (activeSearchTerm) params.search = activeSearchTerm;
                if (filters.sessionId) params.sessionId = filters.sessionId;

                // Use backend export endpoint so we export ALL sessions (not limited to 1000)
                return exportSessionsCSV(params);
              }}
              filename={filters.sessionId ? `session-${filters.sessionId}.csv` : 'sessions.csv'}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1 sm:max-w-sm flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-10"
              aria-label="Search sessions by title"
            />
          </div>
          <Button onClick={handleSearch} size="default" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {activeSearchTerm && (
        <SearchTag
          value={activeSearchTerm}
          onClear={() => {
            setActiveSearchTerm('');
            setSearchTerm('');
            setCurrentPage(1);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <div className="space-y-3">
              {paginatedSessions.map(session => {
                const school = apiSchools.find(s => s.id === session.schoolId);
                return (
                  <MobileCard
                    key={session.id}
                    title={session.title}
                    subtitle={school?.name}
                    badges={[
                      { label: session.courseName, variant: "secondary" },
                      { label: session.status, variant: session.status === 'completed' ? 'default' : session.status === 'in_progress' ? 'destructive' : 'outline' }
                    ]}
                    metadata={[
                      {
                        label: "Date",
                        value: new Date(session.date).toLocaleDateString(),
                        icon: <CalendarIcon className="h-3 w-3" />
                      },
                      {
                        label: "Time",
                        value: `${session.startTime} - ${session.endTime}`,
                        icon: <Clock className="h-3 w-3" />
                      }
                    ]}
                    actions={
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            {session.attendanceCount === 0 || session.attendanceCount === undefined ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-amber-600 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Attendance records not generated</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <CheckCircle2 className="h-4 w-4 text-green-600 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Attendance records exist</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TooltipProvider>
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/sessions/${session.id}`)} className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          {canManageSessions() && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openEditDialog(session)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteSession(session.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSessions.map(session => {
                    const school = apiSchools.find(s => s.id === session.schoolId);
                    return (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.title}</TableCell>
                        <TableCell>{session.courseName}</TableCell>
                        <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                        <TableCell>{session.startTime} - {session.endTime}</TableCell>
                        <TableCell className="max-w-xs truncate">{school?.name}</TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              {session.attendanceCount === 0 || session.attendanceCount === undefined ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertCircle className="h-4 w-4 text-amber-600 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Attendance records not generated</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <CheckCircle2 className="h-4 w-4 text-green-600 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Attendance records exist</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </TooltipProvider>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/sessions/${session.id}`)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {canManageSessions() && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => openEditDialog(session)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteSession(session.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageInfo={
              totalItems > 0
                ? `Showing ${startIndex}-${endIndex} of ${totalItems} sessions`
                : undefined
            }
            className="mt-6"
          />
        </CardContent>
      </Card>

      {/* Create Session Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>Fill in the details to create a new session</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input
                placeholder="Session title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>School</Label>
              <Popover open={schoolSearchOpen} onOpenChange={setSchoolSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={schoolSearchOpen}
                    className="w-full justify-between"
                  >
                    {formData.schoolId ? getSchoolName(formData.schoolId) : 'Select school...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search schools..." />
                    <CommandList>
                      <CommandEmpty>No school found.</CommandEmpty>
                      <CommandGroup>
                        {apiSchools.map((school) => (
                          <CommandItem
                            key={school.id}
                            value={`${school.name} ${school.emisCode || ''}`}
                            onSelect={() => {
                              setFormData({ ...formData, schoolId: school.id, trainerId: '' });
                              setTrainerSearchOpen(false);
                              setSchoolSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.schoolId === school.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{school.name}</span>
                              {school.emisCode && (
                                <span className="text-xs text-muted-foreground">EMIS: {school.emisCode}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Trainer</Label>
              <Popover open={trainerSearchOpen} onOpenChange={setTrainerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={trainerSearchOpen}
                    className="w-full justify-between"
                    disabled={!formData.schoolId}
                  >
                    {formData.trainerId ? getTrainerName(formData.trainerId) : 'Select trainer...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search trainers..." />
                    <CommandList>
                      <CommandEmpty>
                        {formData.schoolId ? 'No trainer linked to this school.' : 'Select a school first.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredTrainersForSelectedSchool.map((trainer) => (
                          <CommandItem
                            key={trainer.id}
                            value={trainer.trainerProfile?.name || trainer.email}
                            onSelect={() => {
                              setFormData({ ...formData, trainerId: trainer.id });
                              setTrainerSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.trainerId === trainer.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {trainer.trainerProfile?.name || trainer.email}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button className="w-full" onClick={handleCreateSession}>
              Create Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update the training-session details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Session Title</Label>
              <Input
                placeholder="Session title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>School</Label>
              <Popover open={schoolSearchOpen} onOpenChange={setSchoolSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={schoolSearchOpen}
                    className="w-full justify-between"
                  >
                    {formData.schoolId ? getSchoolName(formData.schoolId) : 'Select school...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search schools..." />
                    <CommandList>
                      <CommandEmpty>No school found.</CommandEmpty>
                      <CommandGroup>
                        {apiSchools.map((school) => (
                          <CommandItem
                            key={school.id}
                            value={`${school.name} ${school.emisCode || ''}`}
                            onSelect={() => {
                              setFormData({ ...formData, schoolId: school.id, trainerId: '' });
                              setTrainerSearchOpen(false);
                              setSchoolSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.schoolId === school.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{school.name}</span>
                              {school.emisCode && (
                                <span className="text-xs text-muted-foreground">EMIS: {school.emisCode}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Trainer</Label>
              <Popover open={trainerSearchOpen} onOpenChange={setTrainerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={trainerSearchOpen}
                    className="w-full justify-between"
                    disabled={!formData.schoolId}
                  >
                    {formData.trainerId ? getTrainerName(formData.trainerId) : 'Select trainer...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search trainers..." />
                    <CommandList>
                      <CommandEmpty>
                        {formData.schoolId ? 'No trainer linked to this school.' : 'Select a school first.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredTrainersForSelectedSchool.map((trainer) => (
                          <CommandItem
                            key={trainer.id}
                            value={trainer.trainerProfile?.name || trainer.email}
                            onSelect={() => {
                              setFormData({ ...formData, trainerId: trainer.id });
                              setTrainerSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.trainerId === trainer.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {trainer.trainerProfile?.name || trainer.email}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Button className="w-full" onClick={handleEditSession}>
              Update Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sessions;
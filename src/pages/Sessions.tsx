import { useState, useEffect } from 'react';
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
import { Plus, Eye, Edit, Trash2, Users, ClipboardCheck, Download, Calendar as CalendarIcon, School as SchoolIcon, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCard } from '@/components/MobileCard';
import { trainers } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/contexts/FilterContext';
import { Link, useNavigate } from 'react-router-dom';
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
import { getSessions, createSession, updateSession, deleteSession, getSchools, getDivisions, getDistricts, getTehsils, getTrainers } from '@/lib/api';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sessions = () => {
  const { role, isAdmin } = useAuth();
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

  // Fetch sessions from API
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        setApiError(false);
        
        const params: Record<string, string | number> = {
          page: currentPage,
          pageSize,
        };
        
        // Add geography filters if selected
        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.tehsil) params.tehsilId = filters.tehsil;
        if (filters.school) params.schoolId = filters.school;
        
        const response = await getSessions(params);
        
        setApiSessions(response.data.data || []);
        const totalItems = (response.data as any).totalItems || (response.data as any).total || 0;
        setTotalItems(totalItems);
        setTotalPages(Math.ceil(totalItems / pageSize));
        
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        setApiError(true);
        setApiSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [currentPage, filters.division, filters.district, filters.tehsil, filters.school]);

  // Fetch schools and trainers for create form
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // Load schools and trainers for better search experience
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

  // Use API pagination directly
  const paginatedSessions = apiSessions;
  const startIndex = totalItems > 0 ? ((currentPage - 1) * pageSize) + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      Planned: 'outline',
      Ongoing: 'default',
      Completed: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getSchoolName = (schoolId: string) => {
    const school = apiSchools.find(s => s.id === schoolId);
    return school ? school.name : 'Select school';
  };

  const getTrainerName = (trainerId: string) => {
    const trainer = apiTrainers.find(t => t.id === trainerId);
    return trainer ? (trainer.trainerProfile?.name || trainer.email) : 'Select trainer';
  };

  const handleExport = () => {
    toast.success('Export generated successfully');
  };

  const handleCreateSession = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.schoolId || !formData.trainerId || !formData.date || !formData.startTime) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Prepare the data for API
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
      
      // Reset form
      setFormData({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        schoolId: '',
        trainerId: '',
      });
      
      // Refresh sessions list
      const response = await getSessions({
        page: currentPage,
        pageSize,
      });
      setApiSessions(response.data.data || []);
      const totalItems = (response.data as any).totalItems || (response.data as any).total || 0;
      setTotalItems(totalItems);
      setTotalPages(Math.ceil(totalItems / pageSize));
      
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session. Please try again.');
    }
  };

  const handleEditSession = async () => {
    if (!editingSession) return;

    try {
      // Validate required fields
      if (!formData.title || !formData.schoolId || !formData.trainerId || !formData.date || !formData.startTime) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Prepare the data for API
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
      
      // Reset form
      setFormData({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        schoolId: '',
      });
      
      // Refresh sessions list
      const response = await getSessions({
        page: currentPage,
        pageSize,
      });
      setApiSessions(response.data.data || []);
      const totalItems = (response.data as any).totalItems || (response.data as any).total || 0;
      setTotalItems(totalItems);
      setTotalPages(Math.ceil(totalItems / pageSize));
      
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session. Please try again.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSession(sessionId);
      toast.success('Session deleted successfully');
      
      // Refresh sessions list
      const response = await getSessions({
        page: currentPage,
        pageSize,
      });
      setApiSessions(response.data.data || []);
      const totalItems = (response.data as any).totalItems || (response.data as any).total || 0;
      setTotalItems(totalItems);
      setTotalPages(Math.ceil(totalItems / pageSize));
      
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session. Please try again.');
    }
  };

  const openEditDialog = (session: any) => {
    setEditingSession(session);
    setFormData({
      title: session.title || '',
      date: session.date ? new Date(session.date).toISOString().split('T')[0] : '',
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      schoolId: session.schoolId || '',
      trainerId: session.trainerId || '',
    });
    setIsEditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Training Sessions</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage and monitor all training sessions</p>
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Training Sessions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and monitor all training sessions</p>
          
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-initial">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          {isAdmin() && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-initial">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create Session</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Session</DialogTitle>
                  <DialogDescription>
                    Schedule a new training session
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Session Title</Label>
                    <Input 
                      id="title" 
                      placeholder="Enter session title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input 
                        id="date" 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Start Time</Label>
                      <Input 
                        id="time" 
                        type="time" 
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input 
                      id="endTime" 
                      type="time" 
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school">School</Label>
                    <Popover open={schoolSearchOpen} onOpenChange={setSchoolSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={schoolSearchOpen}
                          className="w-full justify-between"
                        >
                          {formData.schoolId 
                            ? getSchoolName(formData.schoolId)
                            : "Select school..."}
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
                                  value={school.name}
                                  onSelect={() => {
                                    setFormData({...formData, schoolId: school.id});
                                    setSchoolSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.schoolId === school.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {school.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainer">Trainer</Label>
                    <Popover open={trainerSearchOpen} onOpenChange={setTrainerSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={trainerSearchOpen}
                          className="w-full justify-between"
                        >
                          {formData.trainerId 
                            ? getTrainerName(formData.trainerId)
                            : "Select trainer..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search trainers..." />
                          <CommandList>
                            <CommandEmpty>No trainer found.</CommandEmpty>
                            <CommandGroup>
                              {apiTrainers.map((trainer) => (
                                <CommandItem
                                  key={trainer.id}
                                  value={trainer.trainerProfile?.name || trainer.email}
                                  onSelect={() => {
                                    setFormData({...formData, trainerId: trainer.id});
                                    setTrainerSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.trainerId === trainer.id ? "opacity-100" : "opacity-0"
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
          )}
          {isAdmin() && (
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Session</DialogTitle>
                  <DialogDescription>
                    Update session details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Session Title</Label>
                    <Input 
                      id="edit-title" 
                      placeholder="Enter session title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-date">Date</Label>
                      <Input 
                        id="edit-date" 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-time">Start Time</Label>
                      <Input 
                        id="edit-time" 
                        type="time" 
                        value={formData.startTime}
                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endTime">End Time</Label>
                    <Input 
                      id="edit-endTime" 
                      type="time" 
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-school">School</Label>
                    <Popover open={schoolSearchOpen} onOpenChange={setSchoolSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={schoolSearchOpen}
                          className="w-full justify-between"
                        >
                          {formData.schoolId 
                            ? getSchoolName(formData.schoolId)
                            : "Select school..."}
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
                                  value={school.name}
                                  onSelect={() => {
                                    setFormData({...formData, schoolId: school.id});
                                    setSchoolSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.schoolId === school.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {school.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-trainer">Trainer</Label>
                    <Popover open={trainerSearchOpen} onOpenChange={setTrainerSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={trainerSearchOpen}
                          className="w-full justify-between"
                        >
                          {formData.trainerId 
                            ? getTrainerName(formData.trainerId)
                            : "Select trainer..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search trainers..." />
                          <CommandList>
                            <CommandEmpty>No trainer found.</CommandEmpty>
                            <CommandGroup>
                              {apiTrainers.map((trainer) => (
                                <CommandItem
                                  key={trainer.id}
                                  value={trainer.trainerProfile?.name || trainer.email}
                                  onSelect={() => {
                                    setFormData({...formData, trainerId: trainer.id});
                                    setTrainerSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.trainerId === trainer.id ? "opacity-100" : "opacity-0"
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
          )}
        </div>
      </div>

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
                      { label: session.status, variant: session.status === 'Completed' ? 'default' : session.status === 'Ongoing' ? 'destructive' : 'outline' }
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
                      <div className="flex gap-2 w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/sessions/${session.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {isAdmin() && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(session)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSession(session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/sessions/${session.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {isAdmin() && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(session)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSession(session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
    </div>
  );
};

export default Sessions;

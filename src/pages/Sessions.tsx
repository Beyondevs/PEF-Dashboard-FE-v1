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
import { Plus, Eye, Users, ClipboardCheck, Download } from 'lucide-react';
import { trainers } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
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
import { getSessions, createSession, getSchools, getDivisions, getDistricts, getTehsils } from '@/lib/api';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sessions = () => {
  const { role, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // API data state
  const [apiSessions, setApiSessions] = useState<any[]>([]);
  const [apiSchools, setApiSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    courseName: '',
    date: '',
    startTime: '',
    schoolId: '',
    expectedTeachers: 5,
    expectedStudents: 30,
  });

  const [schoolSearchOpen, setSchoolSearchOpen] = useState(false);

  // Fetch sessions from API
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        setApiError(false);
        
        const response = await getSessions({
          page: currentPage,
          pageSize,
        });
        
        setApiSessions(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.total || 0);
        
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        setApiError(true);
        setApiSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [currentPage]);

  // Fetch schools for create form
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        // Load more schools for better search experience
        const response = await getSchools({ page: 1, pageSize: 1000 });
        setApiSchools(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        setApiSchools([]);
      }
    };

    fetchSchools();
  }, []);

  const {
    items: paginatedSessions,
    startIndex,
    endIndex,
  } = usePagination(apiSessions, { 
    initialPageSize: pageSize,
    currentPage,
    totalPages,
    totalItems 
  });

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

  const handleExport = () => {
    toast.success('Export generated successfully');
  };

  const handleCreateSession = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.schoolId || !formData.date || !formData.startTime) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Prepare the data for API
      const sessionData = {
        title: formData.title,
        courseName: formData.courseName,
        date: formData.date,
        startTime: formData.startTime,
        schoolId: formData.schoolId,
        expectedTeachers: formData.expectedTeachers,
        expectedStudents: formData.expectedStudents,
      };

      await createSession(sessionData);
      toast.success('Session created successfully');
      setIsCreateOpen(false);
      
      // Reset form
      setFormData({
        title: '',
        courseName: '',
        date: '',
        startTime: '',
        schoolId: '',
        expectedTeachers: 5,
        expectedStudents: 30,
      });
      
      // Refresh sessions list
      const response = await getSessions({
        page: currentPage,
        pageSize,
      });
      setApiSessions(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || 0);
      
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Training Sessions</h1>
            <p className="text-muted-foreground">Manage and monitor all training sessions</p>
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
          <h1 className="text-3xl font-bold text-foreground">Training Sessions</h1>
          <p className="text-muted-foreground">Manage and monitor all training sessions</p>
          
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {isAdmin() && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
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
                  <div className="space-y-2">
                    <Label htmlFor="course">Course Name</Label>
                    <Select 
                      value={formData.courseName}
                      onValueChange={(value) => setFormData({...formData, courseName: value})}
                    >
                      <SelectTrigger id="course">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English Basics">English Basics</SelectItem>
                        <SelectItem value="English Intermediate">English Intermediate</SelectItem>
                        <SelectItem value="English Advanced">English Advanced</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teachers">Expected Teachers</Label>
                      <Input 
                        id="teachers" 
                        type="number" 
                        min="1" 
                        value={formData.expectedTeachers}
                        onChange={(e) => setFormData({...formData, expectedTeachers: parseInt(e.target.value) || 5})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="students">Expected Students</Label>
                      <Input 
                        id="students" 
                        type="number" 
                        min="1" 
                        value={formData.expectedStudents}
                        onChange={(e) => setFormData({...formData, expectedStudents: parseInt(e.target.value) || 30})}
                      />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCreateSession}>
                    Create Session
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
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
                <TableHead>Teachers</TableHead>
                <TableHead>Students</TableHead>
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
                    <TableCell>{session.expectedTeachers}</TableCell>
                    <TableCell>{session.expectedStudents}</TableCell>
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
                      </div>
                    </TableCell>
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

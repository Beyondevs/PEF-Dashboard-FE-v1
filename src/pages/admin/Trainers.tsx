import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    password: '',
    assignedSchools: [] as string[],
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const { canEdit, canDelete } = useAuth();
  const { toast } = useToast();

  // Fetch schools on component mount (with pagination to get all)
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        // Fetch all schools with pagination
        let allSchools: any[] = [];
        let page = 1;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
          const response = await api.getSchools({ page, pageSize });
          const schoolsData = response.data.data || [];
          allSchools = [...allSchools, ...schoolsData];
          hasMore = schoolsData.length === pageSize;
          page++;
        }

        setSchools(allSchools);
      } catch (error) {
        console.error('Failed to load schools', error);
      }
    };
    fetchSchools();
  }, []);

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchTrainers = useCallback(async (page = pagination.page) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { 
        page, 
        pageSize: pagination.pageSize
      };
      
      // Add search parameter if provided
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      
      const response = await api.getTrainers(params);
      setTrainers(response.data.data);
      setPagination(prev => ({
        ...prev,
        page: response.data.page,
        pageSize: response.data.pageSize,
        total: (response.data as any).totalItems || response.data.total
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load trainers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, pagination.pageSize]);

  // Fetch trainers when component mounts, search changes, or page changes
  useEffect(() => {
    fetchTrainers(pagination.page);
  }, [fetchTrainers, pagination.page]);

  const handleSave = async () => {
    try {
      if (editingTrainer) {
        await api.updateTrainer(editingTrainer.id, formData);
        toast({ title: 'Success', description: 'Trainer updated successfully' });
      } else {
        await api.createTrainer(formData);
        toast({ title: 'Success', description: 'Trainer created successfully' });
      }
      setIsDialogOpen(false);
      setEditingTrainer(null);
      setFormData({ name: '', email: '', phone: '', cnic: '', password: '', assignedSchools: [] });
      fetchTrainers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Operation failed',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trainer?')) return;
    try {
      await api.deleteTrainer(id);
      toast({ title: 'Success', description: 'Trainer deleted successfully' });
      fetchTrainers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete trainer',
        variant: 'destructive',
      });
    }
  };

  const handleSchoolToggle = (schoolId: string) => {
    setFormData(prev => {
      const current = prev.assignedSchools || [];
      if (current.includes(schoolId)) {
        return { ...prev, assignedSchools: current.filter(id => id !== schoolId) };
      } else {
        return { ...prev, assignedSchools: [...current, schoolId] };
      }
    });
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find((s: any) => s.id === schoolId);
    return school ? `${school.name} (${school.emisCode})` : schoolId;
  };

  const filteredSchools = schools.filter((school: any) => {
    if (!schoolSearchTerm.trim()) return true;
    const search = schoolSearchTerm.toLowerCase();
    return (
      school.name?.toLowerCase().includes(search) ||
      school.emisCode?.toLowerCase().includes(search)
    );
  });

  const openEditDialog = (trainer: any) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.trainerProfile?.name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      cnic: trainer.trainerProfile?.cnic || '',
      password: '',
      assignedSchools: trainer.trainerProfile?.assignedSchools || [],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTrainer(null);
    setSchoolSearchTerm('');
    setFormData({ name: '', email: '', phone: '', cnic: '', password: '', assignedSchools: [] });
    setIsDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Trainers Management</h1>
        <p className="text-muted-foreground mt-1">Manage trainer accounts and assignments</p>
      </div>

      <div className="flex justify-between flex-wrap items-center mb-6 sm:flex sm:nowrap">
        <div className="relative w-64 mt-2 sm:mt-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />


          
        </div>

        {canEdit() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-2 sm:mt-0" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Trainer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTrainer ? 'Edit Trainer' : 'Add New Trainer'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input 
                    placeholder="Enter name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    placeholder="Enter email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    placeholder="Enter phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>CNIC</Label>
                  <Input 
                    placeholder="Enter CNIC" 
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Assigned Schools</Label>
                  <div className="mb-2">
                    <Input
                      placeholder="Search schools by name or EMIS code..."
                      value={schoolSearchTerm}
                      onChange={(e) => setSchoolSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                    {schools.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Loading schools...</p>
                    ) : filteredSchools.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No schools found matching your search</p>
                    ) : (
                      filteredSchools.map((school: any) => (
                        <div key={school.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`school-${school.id}`}
                            checked={formData.assignedSchools.includes(school.id)}
                            onCheckedChange={() => handleSchoolToggle(school.id)}
                          />
                          <label
                            htmlFor={`school-${school.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <div className="flex flex-col">
                              <span>{school.name}</span>
                              <span className="text-xs text-muted-foreground">EMIS: {school.emisCode}</span>
                            </div>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.assignedSchools.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.assignedSchools.map((schoolId) => (
                        <Badge key={schoolId} variant="secondary">
                          {getSchoolName(schoolId)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Select one or more schools this trainer will be assigned to
                  </p>
                </div>
                {!editingTrainer && (
                  <div>
                    <Label>Password</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter password" 
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}
                <Button onClick={handleSave} className="w-full">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>CNIC</TableHead>
              <TableHead>Schools</TableHead>
              {(canEdit() || canDelete()) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : trainers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No trainers found</TableCell>
              </TableRow>
            ) : (
              trainers.map((trainer: any) => {
                const assignedSchools = trainer.trainerProfile?.assignedSchools || [];
                const schoolNames = assignedSchools
                  .map((schoolId: string) => {
                    const school = schools.find((s: any) => s.id === schoolId);
                    return school ? `${school.name} (${school.emisCode})` : schoolId;
                  })
                  .filter(Boolean);
                
                return (
                <TableRow key={trainer.id}>
                  <TableCell>{trainer.trainerProfile?.name || 'N/A'}</TableCell>
                  <TableCell>{trainer.email}</TableCell>
                  <TableCell>{trainer.phone || 'N/A'}</TableCell>
                  <TableCell>{trainer.trainerProfile?.cnic || 'N/A'}</TableCell>
                  <TableCell>
                    {schoolNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {schoolNames.map((name: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  {(canEdit() || canDelete()) && (
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(trainer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(trainer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between flex-wrap mt-4">
          <div className="text-sm text-muted-foreground mb-4">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} trainers
            {searchTerm && ` (filtered)`}
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, pagination.page - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


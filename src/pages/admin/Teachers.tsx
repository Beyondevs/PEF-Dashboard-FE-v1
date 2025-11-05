import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Mail, Phone as PhoneIcon, CreditCard, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCard } from '@/components/MobileCard';
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
import { useFilters } from '@/contexts/FilterContext';
import * as api from '@/lib/api';

export default function Teachers() {
  const isMobile = useIsMobile();
  const { filters } = useFilters();
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    schoolId: '',
    password: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const { canEdit, canDelete } = useAuth();
  const { toast } = useToast();

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch teachers when filters, search, or page changes
  useEffect(() => {
    fetchTeachers();
  }, [filters.division, filters.district, filters.tehsil, filters.school, debouncedSearchTerm, pagination.page]);

  useEffect(() => {
    fetchSchools();
  }, [filters.division, filters.district, filters.tehsil, filters.school]);

  const fetchTeachers = async (page = pagination.page) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { 
        page, 
        pageSize: pagination.pageSize
      };
      
      // Add geography filters if selected
      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;
      
      // Add search parameter if provided
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      
      const response = await api.getTeachers(params);
      setTeachers(response.data.data);
      setPagination(prev => ({
        ...prev,
        page: response.data.page,
        pageSize: response.data.pageSize,
        total: (response.data as any).totalItems || response.data.total
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load teachers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await api.getSchools({ page: 1, pageSize: 1000 });
      setSchools(response.data.data);
    } catch (error) {
      console.error('Failed to load schools', error);
    }
  };

  const handleSave = async () => {
    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, formData);
        toast({ title: 'Success', description: 'Teacher updated successfully' });
      } else {
        await api.createTeacher(formData);
        toast({ title: 'Success', description: 'Teacher created successfully' });
      }
      setIsDialogOpen(false);
      setEditingTeacher(null);
      setFormData({ name: '', email: '', phone: '', cnic: '', schoolId: '', password: '' });
      fetchTeachers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Operation failed',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.deleteTeacher(id);
      toast({ title: 'Success', description: 'Teacher deleted successfully' });
      fetchTeachers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete teacher',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (teacher: any) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.teacherProfile?.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      cnic: teacher.teacherProfile?.cnic || '',
      schoolId: teacher.teacherProfile?.schoolId || '',
      password: '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTeacher(null);
    setFormData({ name: '', email: '', phone: '', cnic: '', schoolId: '', password: '' });
    setIsDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Teachers Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage teacher accounts and school assignments</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {canEdit() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex-1 sm:flex-initial">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Teacher</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
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
                  <Label>School</Label>
                  <select 
                    className="w-full border rounded-md p-2"
                    value={formData.schoolId}
                    onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  >
                    <option value="">Select school</option>
                    {schools.map((school: any) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
                {!editingTeacher && (
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

      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No teachers found</div>
          ) : (
            filteredTeachers.map((teacher: any) => (
              <MobileCard
                key={teacher.id}
                title={teacher.teacherProfile?.name || 'N/A'}
                subtitle={teacher.teacherProfile?.school?.name || 'N/A'}
                metadata={[
                  { label: "Email", value: teacher.email, icon: <Mail className="h-3 w-3" /> },
                  { label: "Phone", value: teacher.phone || 'N/A', icon: <PhoneIcon className="h-3 w-3" /> },
                  { label: "CNIC", value: teacher.teacherProfile?.cnic || 'N/A', icon: <CreditCard className="h-3 w-3" /> },
                  { label: "School", value: teacher.teacherProfile?.school?.name || 'N/A', icon: <School className="h-3 w-3" /> }
                ]}
                actions={(canEdit() || canDelete()) && (
                  <div className="flex gap-2">
                    {canEdit() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(teacher)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    {canDelete() && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(teacher.id)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              />
            ))
          )}
        </div>
      ) : (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>CNIC</TableHead>
              <TableHead>School</TableHead>
              {(canEdit() || canDelete()) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No teachers found</TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher: any) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.teacherProfile?.name || 'N/A'}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.phone || 'N/A'}</TableCell>
                  <TableCell>{teacher.teacherProfile?.cnic || 'N/A'}</TableCell>
                  <TableCell>{teacher.teacherProfile?.school?.name || 'N/A'}</TableCell>
                  {(canEdit() || canDelete()) && (
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(teacher)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(teacher.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between flex-wrap mt-4">
          <div className="text-sm text-muted-foreground mb-4">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} teachers
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

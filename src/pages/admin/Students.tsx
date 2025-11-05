import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useFilters } from '@/contexts/FilterContext';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';

export default function Students() {
  const { filters } = useFilters();
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    grade: '',
    gender: 'male',
    schoolId: '',
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

  // Fetch students when filters, search, or page changes
  useEffect(() => {
    fetchStudents();
  }, [filters.division, filters.district, filters.tehsil, filters.school, debouncedSearchTerm, pagination.page]);

  useEffect(() => {
    fetchSchools();
  }, [filters.division, filters.district, filters.tehsil, filters.school]);

  const fetchStudents = async (page = pagination.page) => {
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
      
      const response = await api.getStudents(params);
      setStudents(response.data.data);
      setPagination(prev => ({
        ...prev,
        page: response.data.page,
        pageSize: response.data.pageSize,
        total: (response.data as any).totalItems || response.data.total
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load students',
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
      const payload = {
        ...formData,
        grade: parseInt(formData.grade),
      };
      
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, payload);
        toast({ title: 'Success', description: 'Student updated successfully' });
      } else {
        await api.createStudent(payload);
        toast({ title: 'Success', description: 'Student created successfully' });
      }
      setIsDialogOpen(false);
      setEditingStudent(null);
      setFormData({ name: '', rollNo: '', grade: '', gender: 'male', schoolId: '' });
      fetchStudents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Operation failed',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.deleteStudent(id);
      toast({ title: 'Success', description: 'Student deleted successfully' });
      fetchStudents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete student',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (student: any) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      rollNo: student.rollNo || '',
      grade: String(student.grade || ''),
      gender: student.gender || 'male',
      schoolId: student.schoolId || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingStudent(null);
    setFormData({ name: '', rollNo: '', grade: '', gender: 'male', schoolId: '' });
    setIsDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Students Management</h1>
        <p className="text-muted-foreground mt-1">Manage student records and enrollments</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {canEdit() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
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
                  <Label>Roll No</Label>
                  <Input 
                    placeholder="Enter roll number" 
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter grade" 
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <select 
                    className="w-full border rounded-md p-2"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
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
              <TableHead>Roll No</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>School</TableHead>
              {(canEdit() || canDelete()) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No students found</TableCell>
              </TableRow>
            ) : (
              students.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.rollNo || 'N/A'}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell className="capitalize">{student.gender}</TableCell>
                  <TableCell>{student.school?.name || 'N/A'}</TableCell>
                  {(canEdit() || canDelete()) && (
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(student.id)}
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

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} students
            {searchTerm && ` (filtered)`}
          </div>
          <div className="flex items-center gap-2">
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

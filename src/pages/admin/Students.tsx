import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Ban, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/contexts/FilterContext';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import { ExportButton } from '@/components/data-transfer/ExportButton';
import { ImportButton } from '@/components/data-transfer/ImportButton';

export default function Students() {
  const { filters } = useFilters();
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
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
  const { canEdit, canDelete, isAdmin, role } = useAuth();
  const { toast } = useToast();

  // Track previous filter values to detect changes and reset pagination
  const prevFiltersRef = useRef({
    division: filters.division,
    district: filters.district,
    tehsil: filters.tehsil,
    school: filters.school,
    activeSearchTerm: activeSearchTerm,
    statusFilter: statusFilter,
  });

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm.trim());
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when search changes
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const fetchStudents = useCallback(async (page = pagination.page) => {
    try {
      setLoading(true);

      // Check if filters have changed - if so, reset to page 1
      const prevFilters = prevFiltersRef.current;
      const filtersChanged =
        prevFilters.division !== filters.division ||
        prevFilters.district !== filters.district ||
        prevFilters.tehsil !== filters.tehsil ||
        prevFilters.school !== filters.school ||
        prevFilters.activeSearchTerm !== activeSearchTerm ||
        prevFilters.statusFilter !== statusFilter;

      // Determine effective page: use page 1 if filters changed
      const effectivePage = filtersChanged ? 1 : page;

      // Update the ref to track current filter values
      if (filtersChanged) {
        prevFiltersRef.current = {
          division: filters.division,
          district: filters.district,
          tehsil: filters.tehsil,
          school: filters.school,
          activeSearchTerm: activeSearchTerm,
          statusFilter: statusFilter,
        };
        // Also update state to keep UI in sync
        if (pagination.page !== 1) {
          setPagination(prev => ({ ...prev, page: 1 }));
        }
      }

      const params: Record<string, string | number> = {
        page: effectivePage,
        pageSize: pagination.pageSize
      };

      // Add geography filters if selected
      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;

      // Add search parameter if provided
      if (activeSearchTerm && activeSearchTerm.trim()) {
        params.search = activeSearchTerm.trim();
      }

      // Include disabled students for management page
      params.includeDisabled = 'true';

      // Add status filter
      if (statusFilter === 'active') {
        params.isActive = 'true';
      } else if (statusFilter === 'inactive') {
        params.isActive = 'false';
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
  }, [pagination.page, pagination.pageSize, filters.division, filters.district, filters.tehsil, filters.school, activeSearchTerm, statusFilter, toast]);

  // Fetch students when filters, search, status, or page changes
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchSchools();
  }, [filters.division, filters.district, filters.tehsil, filters.school]);

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

  const handleDisable = async (student: any) => {
    if (!student.userId) {
      toast({
        title: 'Error',
        description: 'This student does not have a user account to disable',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to disable ${student.name}? They will not be able to mark attendance or perform any actions.`)) return;

    try {
      await api.updateStudent(student.id, { isActive: false });
      toast({ title: 'Success', description: `${student.name} has been disabled successfully` });
      fetchStudents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to disable student',
        variant: 'destructive',
      });
    }
  };

  const handleEnable = async (student: any) => {
    if (!student.userId) {
      toast({
        title: 'Error',
        description: 'This student does not have a user account to enable',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to enable ${student.name}? They will be able to mark attendance and perform actions again.`)) return;

    try {
      await api.updateStudent(student.id, { isActive: true });
      toast({ title: 'Success', description: `${student.name} has been enabled successfully` });
      fetchStudents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to enable student',
        variant: 'destructive',
      });
    }
  };

  const getStudentStatus = (student: any) => {
    if (student.user?.isActive === false) {
      return { label: 'Disabled', variant: 'destructive' as const };
    }
    return { label: 'Active', variant: 'default' as const };
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
      {/* ---------- TOP BAR : title + Export button ---------- */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students Management</h1>
          <p className="text-muted-foreground mt-1">Manage student records and enrollments</p>
        </div>

        {/* ✅ EXPORT BUTTON PLACED HERE (blue-pen highlight) */}
      <ExportButton
  label="Export"
  exportFn={async () => {
    const params: Record<string, string | number> = {};
    if (filters.division) params.divisionId = filters.division;
    if (filters.district) params.districtId = filters.district;
    if (filters.tehsil) params.tehsilId = filters.tehsil;
    if (filters.school) params.schoolId = filters.school;
    if (activeSearchTerm) params.search = activeSearchTerm;
    if (statusFilter === 'active') params.isActive = 'true';
    else if (statusFilter === 'inactive') params.isActive = 'false';
    return api.exportStudents(params);
  }}
  filename="students.csv"
/>
      </div>
      {/* ----------------------------------------------------- */}

      {/* Search + Add Student row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <div className="relative flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} size="default" className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {isAdmin() && (
            <>
              <Button
                variant="outline"
                onClick={async () => {
                  const blob = await api.downloadStudentsTemplate();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'students-template.csv';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Template
              </Button>
              {role === 'admin' && (
                <ImportButton
                  label="Import"
                  importFn={async (file) => {
                    const response = await api.importStudentsCSV(file);
                    return response.data as any;
                  }}
                  onSuccess={() => fetchStudents()}
                />
              )}
            </>
          )}

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
                  <Button onClick={handleSave} className="w-full">
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-4">
        <Tabs value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value as 'all' | 'active' | 'inactive');
          setPagination(prev => ({ ...prev, page: 1 }));
        }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
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
              <TableHead>Status</TableHead>
              {(canEdit() || canDelete() || isAdmin()) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No students found</TableCell>
              </TableRow>
            ) : (
              students.map((student: any) => {
                const status = getStudentStatus(student);
                const isDisabled = student.userId && student.user && !student.user.isActive;

                return (
                  <TableRow
                    key={student.id}
                    className={isDisabled ? 'opacity-60' : ''}
                  >
                    <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>
                      {student.name}
                    </TableCell>
                    <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>
                      {student.rollNo || 'N/A'}
                    </TableCell>
                    <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>
                      {student.grade}
                    </TableCell>
                    <TableCell className={`capitalize ${isDisabled ? 'text-muted-foreground' : ''}`}>
                      {student.gender}
                    </TableCell>
                    <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>
                      {student.school?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    {(canEdit() || canDelete() || isAdmin()) && (
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

                          {isAdmin() && student.userId && (
                            <>
                              {student.user?.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDisable(student)}
                                  title="Disable student"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEnable(student)}
                                  title="Enable student"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </>
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} students
            {activeSearchTerm && ` (filtered)`}
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
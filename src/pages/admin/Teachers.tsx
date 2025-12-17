import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Mail, Phone as PhoneIcon, CreditCard, School, Ban, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFilters } from '@/contexts/FilterContext';
import * as api from '@/lib/api';
import { ExportButton } from '@/components/data-transfer/ExportButton';
import { ImportButton } from '@/components/data-transfer/ImportButton';

export default function Teachers() {
  const isMobile = useIsMobile();
  const { filters } = useFilters();
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
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

  const fetchTeachers = useCallback(async (page = pagination.page) => {
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
      
      // Include disabled teachers for management page
      params.includeDisabled = 'true';
      
      // Add status filter
      if (statusFilter === 'active') {
        params.isActive = 'true';
      } else if (statusFilter === 'inactive') {
        params.isActive = 'false';
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
  }, [pagination.page, pagination.pageSize, filters.division, filters.district, filters.tehsil, filters.school, activeSearchTerm, statusFilter, toast]);

  // Fetch teachers when filters, search, status, or page changes
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

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

  const handleDisable = async (teacher: any) => {
    if (!confirm(`Are you sure you want to disable ${teacher.teacherProfile?.name || 'this teacher'}? They will not be able to mark attendance or perform any actions.`)) return;
    
    try {
      await api.updateTeacher(teacher.id, { isActive: false });
      toast({ title: 'Success', description: `${teacher.teacherProfile?.name || 'Teacher'} has been disabled successfully` });
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to disable teacher',
        variant: 'destructive',
      });
    }
  };

  const handleEnable = async (teacher: any) => {
    if (!confirm(`Are you sure you want to enable ${teacher.teacherProfile?.name || 'this teacher'}? They will be able to mark attendance and perform actions again.`)) return;
    
    try {
      await api.updateTeacher(teacher.id, { isActive: true });
      toast({ title: 'Success', description: `${teacher.teacherProfile?.name || 'Teacher'} has been enabled successfully` });
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to enable teacher',
        variant: 'destructive',
      });
    }
  };

  const getTeacherStatus = (teacher: any) => {
    if (!teacher.isActive) {
      return { label: 'Disabled', variant: 'destructive' as const };
    }
    return { label: 'Active', variant: 'default' as const };
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
          <div className="relative flex gap-2 flex-1 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search teachers..."
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
  {/* ✅ Add Export Button Here */}
  <ExportButton
    label="Export"
    exportFn={async () => {
      const params: Record<string, string | number> = {};
      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;
      if (activeSearchTerm) params.search = activeSearchTerm;
      if (statusFilter === 'active') {
        params.isActive = 'true';
      } else if (statusFilter === 'inactive') {
        params.isActive = 'false';
      }
      return api.exportTeachers(params);
    }}
    filename="teachers.csv"
  />

  {canEdit() && (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      ...
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

      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No teachers found</div>
          ) : (
            teachers.map((teacher: any) => {
              const status = getTeacherStatus(teacher);
              const isDisabled = !teacher.isActive;
              
              return (
              <MobileCard
                key={teacher.id}
                title={teacher.teacherProfile?.name || 'N/A'}
                  subtitle={<Badge variant={status.variant} className="mt-1">{status.label}</Badge> as any}
                metadata={[
                    { label: 'Email', value: teacher.email, icon: <Mail className="h-3 w-3" /> },
                    { label: 'Phone', value: teacher.phone || 'N/A', icon: <PhoneIcon className="h-3 w-3" /> },
                    { label: 'CNIC', value: teacher.teacherProfile?.cnic || 'N/A', icon: <CreditCard className="h-3 w-3" /> },
                    { label: 'School', value: teacher.teacherProfile?.school?.name || 'N/A', icon: <School className="h-3 w-3" /> },
                ]}
                  actions={
                    (canEdit() || canDelete() || isAdmin()) ? (
                  <div className="flex gap-2 flex-wrap">
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
                    {isAdmin() && (
                      <>
                        {teacher.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisable(teacher)}
                            className="flex-1"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Disable
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEnable(teacher)}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Enable
                          </Button>
                        )}
                      </>
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
                    ) : undefined
                  }
              />
              );
            })
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
              <TableHead>Status</TableHead>
              {(canEdit() || canDelete() || isAdmin()) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
              </TableRow>
            ) : teachers.length === 0 ? (
              <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No teachers found
                  </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher: any) => {
                const status = getTeacherStatus(teacher);
                const isDisabled = !teacher.isActive;
                
                return (
                    <TableRow key={teacher.id} className={isDisabled ? 'opacity-60' : ''}>
                    <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>
                      {teacher.teacherProfile?.name || 'N/A'}
                    </TableCell>
                    <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>
                      {teacher.email}
                    </TableCell>
                    <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>
                      {teacher.phone || 'N/A'}
                    </TableCell>
                    <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>
                      {teacher.teacherProfile?.cnic || 'N/A'}
                    </TableCell>
                    <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>
                      {teacher.teacherProfile?.school?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    {(canEdit() || canDelete() || isAdmin()) && (
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

                          {isAdmin() && (
                            <>
                              {teacher.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDisable(teacher)}
                                  title="Disable teacher"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEnable(teacher)}
                                  title="Enable teacher"
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
                            onClick={() => handleDelete(teacher.id)}
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
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between flex-wrap mt-4">
          <div className="text-sm text-muted-foreground mb-4">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} teachers
            {activeSearchTerm && ` (filtered)`}
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

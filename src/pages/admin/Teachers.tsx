import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Mail, Phone as PhoneIcon, CreditCard, School, Ban, CheckCircle, Star } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFilters } from '@/contexts/FilterContext';
import * as api from '@/lib/api';
import { ExportButton } from '@/components/data-transfer/ExportButton';
import { ImportButton } from '@/components/data-transfer/ImportButton';
import { SearchTag } from '@/components/SearchTag';

export default function Teachers() {
  const isMobile = useIsMobile();
  const { filters } = useFilters();
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'missing'>('all');
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
  const { canEdit, canDelete, isAdmin } = useAuth();
  const { toast } = useToast();

  const prevFiltersRef = useRef({
    division: filters.division,
    district: filters.district,
    tehsil: filters.tehsil,
    school: filters.school,
    activeSearchTerm: activeSearchTerm,
    statusFilter: statusFilter,
  });

  const handleSearch = () => {
    const term = searchTerm.trim();
    setActiveSearchTerm(term);
    // Clear input after applying search so UX is driven by the applied filter chip
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const fetchTeachers = useCallback(async (page = pagination.page) => {
    try {
      setLoading(true);
      const prevFilters = prevFiltersRef.current;
      const filtersChanged =
        prevFilters.division !== filters.division ||
        prevFilters.district !== filters.district ||
        prevFilters.tehsil !== filters.tehsil ||
        prevFilters.school !== filters.school ||
        prevFilters.activeSearchTerm !== activeSearchTerm ||
        prevFilters.statusFilter !== statusFilter;

      const effectivePage = filtersChanged ? 1 : page;
      if (filtersChanged) {
        prevFiltersRef.current = {
          division: filters.division,
          district: filters.district,
          tehsil: filters.tehsil,
          school: filters.school,
          activeSearchTerm: activeSearchTerm,
          statusFilter: statusFilter,
        };
        if (pagination.page !== 1) setPagination(prev => ({ ...prev, page: 1 }));
      }

      const params: Record<string, string | number> = { page: effectivePage, pageSize: pagination.pageSize };
      if (filters.division) params.divisionId = filters.division;
      if (filters.district) params.districtId = filters.district;
      if (filters.tehsil) params.tehsilId = filters.tehsil;
      if (filters.school) params.schoolId = filters.school;
      if (activeSearchTerm.trim()) params.search = activeSearchTerm.trim();
      params.includeDisabled = 'true';
      if (statusFilter === 'active') params.isActive = 'true';
      else if (statusFilter === 'inactive') params.isActive = 'false';

      const response =
        statusFilter === 'missing'
          ? await api.getTeachersMissingSpeakingAssessments(params)
          : await api.getTeachers(params);
      setTeachers(response.data.data);
      setPagination(prev => ({
        ...prev,
        page: response.data.page,
        pageSize: response.data.pageSize,
        total: (response.data as any).totalItems || response.data.total,
      }));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load teachers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters, activeSearchTerm, statusFilter, toast]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  useEffect(() => { fetchSchools(); }, [filters.division, filters.district, filters.tehsil, filters.school]);

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
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.deleteTeacher(id);
      toast({ title: 'Success', description: 'Teacher deleted successfully' });
      fetchTeachers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete teacher', variant: 'destructive' });
    }
  };

  const handleDisable = async (teacher: any) => {
    if (!confirm(`Disable ${teacher.teacherProfile?.name || 'this teacher'}?`)) return;
    try {
      await api.updateTeacher(teacher.id, { isActive: false });
      toast({ title: 'Success', description: 'Teacher disabled' });
      fetchTeachers();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to disable teacher', variant: 'destructive' });
    }
  };

  const handleEnable = async (teacher: any) => {
    if (!confirm(`Enable ${teacher.teacherProfile?.name || 'this teacher'}?`)) return;
    try {
      await api.updateTeacher(teacher.id, { isActive: true });
      toast({ title: 'Success', description: 'Teacher enabled' });
      fetchTeachers();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to enable teacher', variant: 'destructive' });
    }
  };

  const getTeacherStatus = (teacher: any) => {
    if (!teacher.isActive) return { label: 'Disabled', variant: 'destructive' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  const handleToggleStar = async (teacher: any) => {
    try {
      await api.updateTeacher(teacher.id, { starred: !teacher.teacherProfile?.starred });
      toast({
        title: teacher.teacherProfile?.starred ? 'Removed from starred' : 'Marked as outstanding',
        description: teacher.teacherProfile?.starred
          ? `${teacher.teacherProfile?.name} is no longer starred`
          : `${teacher.teacherProfile?.name} is now marked as outstanding`,
      });
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update star',
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

  const handlePageChange = (newPage: number) => setPagination(prev => ({ ...prev, page: newPage }));
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  /* ---------- UI ---------- */
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Teachers Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage teacher accounts and school assignments</p>
      </div>

      {/* Search + Add / Export */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="flex gap-2 flex-1">
          <div className="relative flex gap-2 flex-1 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} size="default" className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeSearchTerm && (
          <div className="w-full sm:w-auto">
            <SearchTag
              value={activeSearchTerm}
              onClear={() => {
                setActiveSearchTerm('');
                setSearchTerm('');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-end">
          {/* Export Button */}
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
              return api.exportTeachers(params);
            }}
            filename="teachers.csv"
          />

          {/* Import Button - Only for admin */}
          {isAdmin() && (
            <ImportButton
              label="Import"
              importFn={async (file) => {
                const response = await api.importTeachersCSV(file);
                return response.data as any;
              }}
              onSuccess={() => fetchTeachers()}
            />
          )}

          {canEdit() && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>CNIC</Label>
                    <Input
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
                      {schools.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Password {!editingTeacher ? '' : '(leave empty to keep current)'}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
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
        <Tabs value={statusFilter} onValueChange={(v) => {
          setStatusFilter(v as 'all' | 'active' | 'inactive' | 'missing');
          setPagination(p => ({ ...p, page: 1 }));
        }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="missing">Missing Speaking Assessment</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* MOBILE CARDS */}
      {isMobile ? (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter === 'missing'
                ? 'No teachers are missing a speaking assessment record'
                : 'No teachers found'}
            </div>
          ) : (
            teachers.map((t: any) => {
              const status = getTeacherStatus(t);
              const isDisabled = !t.isActive;
              return (
                <MobileCard
                  key={t.id}
                  title={`${t.teacherProfile?.name || 'N/A'}${t.teacherProfile?.starred ? ' ★' : ''}`}
                  subtitle={<Badge variant={status.variant}>{status.label}</Badge> as any}
                  metadata={[
                    { label: 'Email', value: t.email, icon: <Mail className="h-3 w-3" /> },
                    { label: 'Phone', value: t.phone || 'N/A', icon: <PhoneIcon className="h-3 w-3" /> },
                    { label: 'CNIC', value: t.teacherProfile?.cnic || 'N/A', icon: <CreditCard className="h-3 w-3" /> },
                    { label: 'School', value: t.teacherProfile?.school?.name || 'N/A', icon: <School className="h-3 w-3" /> },
                  ]}
                  actions={
                    (canEdit() || canDelete() || isAdmin()) ? (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStar(t)}
                          title={t.teacherProfile?.starred ? 'Remove star' : 'Mark as outstanding'}
                          className="p-2"
                        >
                          <Star
                            className={`h-4 w-4 ${t.teacherProfile?.starred ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`}
                          />
                        </Button>
                        {canEdit() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(t)}
                            disabled={isDisabled}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                        {isAdmin() && (
                          <>
                            {t.isActive ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDisable(t)}
                                className="flex-1"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Disable
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEnable(t)}
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
                            onClick={() => handleDelete(t.id)}
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
        /* DESKTOP TABLE */
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Star</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="max-w-[150px]">CNIC</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Status</TableHead>
                {(canEdit() || canDelete() || isAdmin()) && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : teachers.length === 0 ? (
                <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {statusFilter === 'missing'
                    ? 'No teachers are missing a speaking assessment record'
                    : 'No teachers found'}
                </TableCell>
                </TableRow>
              ) : (
                teachers.map((t: any) => {
                  const status = getTeacherStatus(t);
                  const isDisabled = !t.isActive;
                  return (
                    <TableRow key={t.id} className={isDisabled ? 'opacity-60' : ''}>
                      <TableCell className="w-10">
                        {canEdit() ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-8 w-8"
                            onClick={() => handleToggleStar(t)}
                            title={t.teacherProfile?.starred ? 'Remove star' : 'Mark as outstanding'}
                          >
                            <Star
                              className={`h-5 w-5 ${t.teacherProfile?.starred ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`}
                            />
                          </Button>
                        ) : (
                          <Star
                            className={`h-5 w-5 ${t.teacherProfile?.starred ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground opacity-50'}`}
                          />
                        )}
                      </TableCell>
                      <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>{t.teacherProfile?.name || 'N/A'}</TableCell>
                      <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>{t.email}</TableCell>
                      <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>{t.phone || 'N/A'}</TableCell>
                      <TableCell 
                        className={`max-w-[150px] truncate ${isDisabled ? 'text-muted-foreground' : ''}`}
                        title={t.teacherProfile?.cnic || 'N/A'}
                      >
                        <span className="block truncate">{t.teacherProfile?.cnic || 'N/A'}</span>
                      </TableCell>
                      <TableCell className={isDisabled ? 'text-muted-foreground' : ''}>{t.teacherProfile?.school?.name || 'N/A'}</TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      {(canEdit() || canDelete() || isAdmin()) && (
                        <TableCell>
                          <div className="flex gap-2">
                            {canEdit() && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(t)}
                                disabled={isDisabled}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {isAdmin() && (
                              <>
                                {t.isActive ? (
                                  <Button size="sm" variant="outline" onClick={() => handleDisable(t)} title="Disable teacher">
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => handleEnable(t)} title="Enable teacher">
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                            {canDelete() && (
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>
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
          <div className="text-sm text-muted-foreground">
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
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, pagination.page - 2)) + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
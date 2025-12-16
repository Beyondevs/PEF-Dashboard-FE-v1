import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import { ExportButton } from '@/components/data-transfer/ExportButton';
import { ImportButton } from '@/components/data-transfer/ImportButton';
import { useFilters } from '@/contexts/FilterContext';

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [formData, setFormData] = useState({
    emisCode: '',
    name: '',
    divisionId: '',
    districtId: '',
    tehsilId: '',
    address: '',
    capacity: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const { filters } = useFilters();
  const { canEdit, canDelete, isAdmin, role } = useAuth();
  const { toast } = useToast();

  // Track previous filter values to detect changes and reset pagination
  const prevFiltersRef = useRef({
    division: filters.division,
    district: filters.district,
    tehsil: filters.tehsil,
    school: filters.school,
    activeSearchTerm: activeSearchTerm,
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

  const fetchSchools = useCallback(async (page = pagination.page) => {
    try {
      setLoading(true);

      // Check if filters have changed - if so, reset to page 1
      const prevFilters = prevFiltersRef.current;
      const filtersChanged = 
        prevFilters.division !== filters.division ||
        prevFilters.district !== filters.district ||
        prevFilters.tehsil !== filters.tehsil ||
        prevFilters.school !== filters.school ||
        prevFilters.activeSearchTerm !== activeSearchTerm;

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
      
      // Add search parameter if provided
      if (activeSearchTerm && activeSearchTerm.trim()) {
        params.search = activeSearchTerm.trim();
      }

      // Apply global filters
      if (filters.division) {
        params.divisionId = filters.division;
      }
      if (filters.district) {
        params.districtId = filters.district;
      }
      if (filters.tehsil) {
        params.tehsilId = filters.tehsil;
      }
      if (filters.school) {
        params.schoolId = filters.school;
      }
      
      const response = await api.getSchools(params);
      setSchools(response.data.data);
      setPagination(prev => ({
        ...prev,
        page: response.data.page,
        pageSize: response.data.pageSize,
        total: (response.data as any).totalItems || response.data.total
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load schools',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, activeSearchTerm, filters.division, filters.district, filters.tehsil, filters.school, toast]);

  useEffect(() => {
    fetchGeography();
  }, []);

  // Fetch schools when search, filters, or page changes
  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const fetchGeography = async () => {
    try {
      const [divsRes, distsRes, tehsRes] = await Promise.all([
        api.getDivisions(),
        api.getDistricts(),
        api.getTehsils(),
      ]);
      setDivisions(divsRes.data);
      setDistricts(distsRes.data);
      setTehsils(tehsRes.data);
    } catch (error) {
      console.error('Failed to load geography', error);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      };

      if (editingSchool) {
        await api.updateSchool(editingSchool.id, payload);
        toast({ title: 'Success', description: 'School updated successfully' });
      } else {
        await api.createSchool(payload);
        toast({ title: 'Success', description: 'School created successfully' });
      }
      setIsDialogOpen(false);
      setEditingSchool(null);
      setFormData({ emisCode: '', name: '', divisionId: '', districtId: '', tehsilId: '', address: '', capacity: '' });
      fetchSchools();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Operation failed',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this school?')) return;
    try {
      await api.deleteSchool(id);
      toast({ title: 'Success', description: 'School deleted successfully' });
      fetchSchools();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete school',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (school: any) => {
    setEditingSchool(school);
    setFormData({
      emisCode: school.emisCode || '',
      name: school.name || '',
      divisionId: school.divisionId || '',
      districtId: school.districtId || '',
      tehsilId: school.tehsilId || '',
      address: school.address || '',
      capacity: school.capacity ? String(school.capacity) : '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSchool(null);
    setFormData({ emisCode: '', name: '', divisionId: '', districtId: '', tehsilId: '', address: '', capacity: '' });
    setIsDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const filteredDistricts = districts.filter((d: any) => 
    !formData.divisionId || d.divisionId === formData.divisionId
  );

  const filteredTehsils = tehsils.filter((t: any) => 
    !formData.districtId || t.districtId === formData.districtId
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Schools Management</h1>
        <p className="text-muted-foreground mt-1">Manage schools and their details</p>
      </div>

            <div className="flex justify-between items-center mb-6">
        <div className="relative flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search schools..."
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

        {/* RIGHT SIDE ACTIONS (TOP-RIGHT AREA) */}
        <div className="flex gap-2">
          {/* NEW EXPORT BUTTON IN THE HIGHLIGHTED AREA */}
          <ExportButton
            label="Export"
            exportFn={async () => {
              const params: Record<string, string | number> = {};
              if (filters.division) params.divisionId = filters.division;
              if (filters.district) params.districtId = filters.district;
              if (filters.tehsil) params.tehsilId = filters.tehsil;
              if (activeSearchTerm) params.search = activeSearchTerm;
              return api.exportSchools(params);
            }}
            filename="schools.csv"
          />

          {isAdmin() && (
            <>
              <Button
                variant="outline"
                size="default"
                onClick={async () => {
                  const blob = await api.downloadSchoolsTemplate();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'schools-template.csv';
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
                    const result = await api.importSchools(file);
                    return result.data as any;
                  }}
                  onSuccess={() => fetchSchools()}
                />
              )}
              {/* you can keep or remove the old ExportButton here if not needed */}
            </>
          )}

          {canEdit() && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add School
                </Button>
              </DialogTrigger>
              {/* dialog content ... */}
            </Dialog>
          )}
        </div>
      </div>


      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>EMIS Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Tehsil</TableHead>
              <TableHead>Capacity</TableHead>
              {(canEdit() || canDelete()) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : schools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No schools found</TableCell>
              </TableRow>
            ) : (
              schools.map((school: any) => (
                <TableRow key={school.id}>
                  <TableCell>{school.emisCode}</TableCell>
                  <TableCell>{school.name}</TableCell>
                  <TableCell>{school.division?.name || 'N/A'}</TableCell>
                  <TableCell>{school.district?.name || 'N/A'}</TableCell>
                  <TableCell>{school.tehsil?.name || 'N/A'}</TableCell>
                  <TableCell>{school.capacity || 'N/A'}</TableCell>
                  {(canEdit() || canDelete()) && (
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(school)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete() && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(school.id)}
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
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} schools
            {activeSearchTerm && ' (filtered)'}
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

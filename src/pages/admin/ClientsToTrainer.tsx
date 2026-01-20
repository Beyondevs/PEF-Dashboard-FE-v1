import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useFilters } from '@/contexts/FilterContext';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import { ExportButton } from '@/components/data-transfer/ExportButton';
import { SearchTag } from '@/components/SearchTag';

export default function ClientsToTrainer() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const { toast } = useToast();
  const { filters } = useFilters();

  const prevFiltersRef = useRef({
    division: filters.division,
    district: filters.district,
    tehsil: filters.tehsil,
    school: filters.school,
    activeSearchTerm: activeSearchTerm,
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
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

  const handleSearch = () => {
    const term = searchTerm.trim();
    setActiveSearchTerm(term);
    setSearchTerm('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const fetchTrainers = useCallback(
    async (page = pagination.page) => {
      try {
        setLoading(true);
        const prevFilters = prevFiltersRef.current;
        const filtersChanged =
          prevFilters.division !== filters.division ||
          prevFilters.district !== filters.district ||
          prevFilters.tehsil !== filters.tehsil ||
          prevFilters.school !== filters.school ||
          prevFilters.activeSearchTerm !== activeSearchTerm;

        const effectivePage = filtersChanged ? 1 : page;
        if (filtersChanged) {
          prevFiltersRef.current = {
            division: filters.division,
            district: filters.district,
            tehsil: filters.tehsil,
            school: filters.school,
            activeSearchTerm: activeSearchTerm,
          };
          if (pagination.page !== 1) setPagination((prev) => ({ ...prev, page: 1 }));
        }

        const params: Record<string, string | number> = {
          page: effectivePage,
          pageSize: pagination.pageSize,
        };
        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.tehsil) params.tehsilId = filters.tehsil;
        if (filters.school) params.schoolId = filters.school;
        if (activeSearchTerm?.trim()) params.search = activeSearchTerm.trim();

        const response = await api.getTrainers(params);
        setTrainers(response.data.data);
        setPagination((prev) => ({
          ...prev,
          page: (response.data as any).page ?? prev.page,
          pageSize: (response.data as any).pageSize ?? prev.pageSize,
          total: (response.data as any).totalItems ?? (response.data as any).total ?? 0,
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
    },
    [
      activeSearchTerm,
      pagination.page,
      pagination.pageSize,
      filters.division,
      filters.district,
      filters.tehsil,
      filters.school,
      toast,
    ],
  );

  useEffect(() => {
    fetchTrainers(pagination.page);
  }, [fetchTrainers, pagination.page]);

  const getSchoolName = (schoolId: string) => {
    const school = schools.find((s: any) => s.id === schoolId);
    return school ? `${school.name} (${school.emisCode})` : schoolId;
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize) || 1;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clients to Trainer</h1>
        <p className="text-muted-foreground mt-1">
          View schools (clients) assigned to each trainer
        </p>
      </div>

      <div className="flex justify-between flex-wrap items-center mb-6 sm:flex sm:nowrap gap-2">
        <div className="relative flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search trainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} size="default" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
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

        <div className="flex gap-2 flex-wrap mt-2 sm:mt-0">
          <ExportButton
            label="Export"
            exportFn={async () => {
              const params: Record<string, string | number> = {};
              if (filters.division) params.divisionId = filters.division;
              if (filters.district) params.districtId = filters.district;
              if (filters.tehsil) params.tehsilId = filters.tehsil;
              if (filters.school) params.schoolId = filters.school;
              if (activeSearchTerm) params.search = activeSearchTerm;
              return api.exportClientsToTrainer(params);
            }}
            filename="clients-to-trainer.csv"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trainer Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Clients (Schools)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : trainers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No trainers found
                </TableCell>
              </TableRow>
            ) : (
              trainers.map((trainer: any) => {
                const assignedSchools = trainer.trainerProfile?.assignedSchools || [];
                const schoolNames = assignedSchools
                  .map((schoolId: string) => getSchoolName(schoolId))
                  .filter(Boolean);

                return (
                  <TableRow key={trainer.id}>
                    <TableCell>{trainer.trainerProfile?.name || 'N/A'}</TableCell>
                    <TableCell>{trainer.email || 'N/A'}</TableCell>
                    <TableCell>{trainer.phone || 'N/A'}</TableCell>
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.total > 0 && (
        <div className="flex items-center justify-between flex-wrap mt-4">
          <div className="text-sm text-muted-foreground mb-4">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} trainers
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
                const pageNum =
                  Math.max(1, Math.min(totalPages - 4, pagination.page - 2)) + i;
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

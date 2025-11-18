import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { School, MapPin, Building2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCard } from '@/components/MobileCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFilters } from '@/contexts/FilterContext';
import { getSchools } from '@/lib/api';
import PaginationControls from '@/components/PaginationControls';

const ITEMS_PER_PAGE = 10;

const Schools = () => {
  const isMobile = useIsMobile();
  const { filters } = useFilters();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch schools from API
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        
        const params: Record<string, string | number> = {
          page: currentPage,
          pageSize: ITEMS_PER_PAGE,
        };

        // Add filter params from FilterContext
        if (filters.school) params.schoolId = filters.school;
        if (filters.division) params.divisionId = filters.division;
        if (filters.district) params.districtId = filters.district;
        if (filters.tehsil) params.tehsilId = filters.tehsil;
        if (searchQuery) params.search = searchQuery;

        const response = await getSchools(params);
        setSchools(response.data.data || []);
        setTotalPages(Math.ceil((response.data.total || 0) / ITEMS_PER_PAGE));
        setTotalItems(response.data.total || 0);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        setSchools([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, [currentPage, filters.school, filters.division, filters.district, filters.tehsil, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.school, filters.division, filters.district, filters.tehsil, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Schools Directory</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Browse and filter schools by division, district, and tehsil
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="w-full sm:w-96">
              <Input
                placeholder="Search schools by name, EMIS code, or address..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <School className="h-4 w-4" />
              <span>
                {isLoading ? 'Loading...' : `Showing ${schools.length} of ${totalItems} schools`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Schools List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading schools...</p>
            </div>
          ) : schools.length > 0 ? (
            <>
              {isMobile ? (
                <div className="space-y-3">
                  {schools.map(school => (
                    <MobileCard
                      key={school.id}
                      title={school.name}
                      subtitle={`${school.division?.name || 'N/A'} - ${school.district?.name || 'N/A'}`}
                      badges={[
                        { label: school.emisCode, variant: "secondary" }
                      ]}
                      metadata={[
                        {
                          label: "Tehsil",
                          value: school.tehsil?.name || 'N/A',
                          icon: <MapPin className="h-3 w-3" />
                        },
                        {
                          label: "Address",
                          value: school.address || 'N/A',
                        }
                      ]}
                      expandable={true}
                    >
                      <div className="text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">{school.address || 'No address available'}</span>
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>EMIS Code</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Tehsil</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map(school => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium max-w-xs">
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                            <span>{school.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{school.emisCode}</Badge>
                        </TableCell>
                        <TableCell>{school.division?.name || 'N/A'}</TableCell>
                        <TableCell>{school.district?.name || 'N/A'}</TableCell>
                        <TableCell>{school.tehsil?.name || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-start gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{school.address || 'No address'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              )}

              {/* Pagination */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageInfo={`Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of ${totalItems} schools`}
                className="mt-6"
              />
            </>
          ) : (
            <div className="text-center py-12">
              <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No schools found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Schools;

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { School, MapPin, Users, Phone, Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  realSchools,
  uniqueDivisions,
  getDistrictsByDivision,
  getTehsilsByDistrict,
} from '@/lib/schoolsData';

const ITEMS_PER_PAGE = 10;

const Schools = () => {
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTehsil, setSelectedTehsil] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Get available districts based on selected division
  const availableDistricts = useMemo(() => {
    if (selectedDivision === 'all') return [];
    return getDistrictsByDivision(selectedDivision);
  }, [selectedDivision]);

  // Get available tehsils based on selected district
  const availableTehsils = useMemo(() => {
    if (selectedDistrict === 'all') return [];
    return getTehsilsByDistrict(selectedDistrict);
  }, [selectedDistrict]);

  // Filter schools based on selections and search
  const filteredSchools = useMemo(() => {
    let filtered = realSchools;

    if (selectedDivision !== 'all') {
      filtered = filtered.filter(s => s.division === selectedDivision);
    }

    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(s => s.district === selectedDistrict);
    }

    if (selectedTehsil !== 'all') {
      filtered = filtered.filter(s => s.tehsil === selectedTehsil);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.schoolName.toLowerCase().includes(query) ||
          s.ownerName.toLowerCase().includes(query) ||
          s.schoolAddress.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [selectedDivision, selectedDistrict, selectedTehsil, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSchools.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSchools = filteredSchools.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Handle division change
  const handleDivisionChange = (value: string) => {
    setSelectedDivision(value);
    setSelectedDistrict('all');
    setSelectedTehsil('all');
    handleFilterChange();
  };

  // Handle district change
  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedTehsil('all');
    handleFilterChange();
  };

  // Handle tehsil change
  const handleTehsilChange = (value: string) => {
    setSelectedTehsil(value);
    handleFilterChange();
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (currentPage <= 3) {
        items.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        items.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return items;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Schools Directory</h1>
        <p className="text-muted-foreground">
          Browse and filter schools by division, district, and tehsil
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Division</label>
              <Select value={selectedDivision} onValueChange={handleDivisionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {uniqueDivisions.map(division => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">District</label>
              <Select
                value={selectedDistrict}
                onValueChange={handleDistrictChange}
                disabled={selectedDivision === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Districts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  {availableDistricts.map(district => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tehsil</label>
              <Select
                value={selectedTehsil}
                onValueChange={handleTehsilChange}
                disabled={selectedDistrict === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Tehsils" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tehsils</SelectItem>
                  {availableTehsils.map(tehsil => (
                    <SelectItem key={tehsil} value={tehsil}>
                      {tehsil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search schools..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <School className="h-4 w-4" />
            <span>
              Showing {currentSchools.length} of {filteredSchools.length} schools
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schools List</CardTitle>
        </CardHeader>
        <CardContent>
          {currentSchools.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Tehsil</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Total Students</TableHead>
                      <TableHead className="text-right">Teachers</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSchools.map(school => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium max-w-xs">
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                            <span>{school.schoolName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{school.division}</TableCell>
                        <TableCell>{school.district}</TableCell>
                        <TableCell>{school.tehsil}</TableCell>
                        <TableCell>{school.ownerName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="font-mono">{school.ownerMobile}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-start gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{school.schoolAddress}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {school.grandTotal}
                        </TableCell>
                        <TableCell className="text-right">
                          {school.totalPrimaryTeachers}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{school.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={
                            currentPage === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      {getPaginationItems().map((item, index) => (
                        <PaginationItem key={index}>
                          {item === '...' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => setCurrentPage(item as number)}
                              isActive={currentPage === item}
                              className="cursor-pointer"
                            >
                              {item}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={
                            currentPage === totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
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

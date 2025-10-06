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
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, Clock } from 'lucide-react';
import { paperRegisters, schools } from '@/lib/mockData';
import { toast } from 'sonner';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/usePagination';

const PaperRegisters = () => {
  const handleUpload = () => {
    toast.success('Register uploaded successfully');
  };

  const handleVerify = () => {
    toast.success('Register verified successfully');
  };

  const {
    items: paginatedRegisters,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(paperRegisters, { initialPageSize: 10 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paper Registers</h1>
          <p className="text-muted-foreground">Upload and manage paper attendance registers for low-connectivity areas</p>
        </div>
        <Button onClick={handleUpload}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Register
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Registers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRegisters.map(register => {
                  const school = schools.find(s => s.id === register.schoolId);
                  
                  return (
                    <TableRow key={register.id}>
                      <TableCell className="font-medium">{school?.name}</TableCell>
                    <TableCell>{register.date}</TableCell>
                    <TableCell>{register.uploadedBy}</TableCell>
                    <TableCell>{register.rows.length} entries</TableCell>
                    <TableCell>
                      <Badge variant={register.status === 'Verified' ? 'default' : 'outline'}>
                        {register.status === 'Verified' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" />Verified</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" />Submitted</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {register.status === 'Submitted' && (
                        <Button size="sm" variant="outline" onClick={handleVerify}>
                          Verify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageInfo={
              totalItems > 0
                ? `Showing ${startIndex}-${endIndex} of ${totalItems} registers`
                : undefined
            }
            className="mt-6"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PaperRegisters;

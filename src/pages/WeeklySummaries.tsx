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
import { Plus, FileSpreadsheet } from 'lucide-react';
import { weeklySummaries } from '@/lib/mockData';
import { toast } from 'sonner';

const WeeklySummaries = () => {
  const handleCreate = () => {
    toast.success('Weekly summary created successfully');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      Draft: 'outline',
      Submitted: 'default',
      Digitized: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weekly Summaries</h1>
          <p className="text-muted-foreground">Compile and manage weekly training summaries for districts</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Summary
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scope</TableHead>
                <TableHead>Week Period</TableHead>
                <TableHead>Compiled By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklySummaries.map(summary => (
                <TableRow key={summary.id}>
                  <TableCell className="font-medium">{summary.scope}</TableCell>
                  <TableCell>
                    {new Date(summary.weekStart).toLocaleDateString()} - {new Date(summary.weekEnd).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{summary.compiledBy}</TableCell>
                  <TableCell>{getStatusBadge(summary.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {summary.status === 'Draft' && (
                        <Button size="sm" variant="outline">
                          Submit
                        </Button>
                      )}
                      {summary.status === 'Submitted' && (
                        <Button size="sm" variant="outline">
                          Digitize
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklySummaries;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, RefreshCw, Trash2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { createDatabaseBackup, deleteDatabaseBackup, downloadDatabaseBackup, listDatabaseBackups, testWeeklyCleanup } from '@/lib/api';

type BackupRow = {
  filename: string;
  size: number;
  sizeMB: string;
  createdAt: string;
};

export default function DatabaseBackups() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isTestingCleanup, setIsTestingCleanup] = useState(false);
  const [backups, setBackups] = useState<BackupRow[]>([]);

  const latest = useMemo(() => backups[0], [backups]);

  const fetchBackups = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await listDatabaseBackups();
      const rows: BackupRow[] = Array.isArray(res?.data?.backups) ? res.data.backups : [];
      setBackups(rows);
    } catch (e: any) {
      console.error('Failed to load backups:', e);
      toast.error('Failed to load backups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const res = await createDatabaseBackup();
      const filename = res?.data?.filename;
      toast.success(filename ? `Backup created: ${filename}` : 'Backup created');
      await fetchBackups();
    } catch (e: any) {
      console.error('Create backup failed:', e);
      toast.error(e?.response?.data?.message || 'Create backup failed');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const blob = await downloadDatabaseBackup(filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Download backup failed:', e);
      toast.error(e?.response?.data?.message || 'Download failed');
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      setIsDeleting(filename);
      await deleteDatabaseBackup(filename);
      toast.success('Backup deleted');
      await fetchBackups();
    } catch (e: any) {
      console.error('Delete backup failed:', e);
      toast.error(e?.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleTestWeeklyCleanup = async () => {
    if (!confirm('This will delete all backups except the most recent one. This simulates the Sunday cleanup. Continue?')) {
      return;
    }
    try {
      setIsTestingCleanup(true);
      const res = await testWeeklyCleanup();
      const remaining = res?.data?.remainingBackups || 0;
      toast.success(`Weekly cleanup completed. ${remaining} backup(s) remaining.`);
      await fetchBackups();
    } catch (e: any) {
      console.error('Weekly cleanup test failed:', e);
      toast.error(e?.response?.data?.message || 'Weekly cleanup test failed');
    } finally {
      setIsTestingCleanup(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">Database Backups</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBackups} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Create Backup Now
          </Button>
          <Button 
            variant="outline" 
            onClick={handleTestWeeklyCleanup} 
            disabled={isTestingCleanup || backups.length <= 1}
            title={backups.length <= 1 ? 'Need at least 2 backups to test cleanup' : 'Test weekly cleanup (keeps only most recent)'}
          >
            {isTestingCleanup ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Weekly Cleanup
          </Button>
          {latest ? (
            <Button variant="secondary" onClick={() => handleDownload(latest.filename)}>
              <Download className="h-4 w-4 mr-2" />
              Download Latest
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Backups</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading backups...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead className="text-right">Size (MB)</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No backups found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    backups.map((b) => (
                      <TableRow key={b.filename}>
                        <TableCell className="font-mono text-xs">{b.filename}</TableCell>
                        <TableCell className="text-right">{b.sizeMB}</TableCell>
                        <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleDownload(b.filename)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(b.filename)}
                              disabled={isDeleting === b.filename}
                            >
                              {isDeleting === b.filename ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


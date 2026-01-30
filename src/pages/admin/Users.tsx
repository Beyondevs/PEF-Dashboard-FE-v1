import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import PaginationControls from '@/components/PaginationControls';

const PAGE_SIZE = 10;
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  client: 'Client',
  bnu: 'BNU',
  division_role: 'Division',
};

function formatLastLogin(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  } catch {
    return '—';
  }
}

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });
  const { toast } = useToast();

  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params: Record<string, string | number> = {
          page,
          pageSize: pagination.pageSize,
        };
        if (activeSearchTerm.trim()) {
          params.search = activeSearchTerm.trim();
        }
        const response = await api.getAdminPortalUsers(params);
        setUsers(response.data.data ?? []);
        const total = (response.data as any).totalItems ?? response.data.total ?? 0;
        setPagination((prev) => ({
          ...prev,
          page: response.data.page ?? page,
          pageSize: response.data.pageSize ?? prev.pageSize,
          total,
        }));
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load admin portal users',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [activeSearchTerm, pagination.pageSize, toast],
  );

  useEffect(() => {
    fetchUsers(pagination.page);
  }, [fetchUsers, pagination.page]);

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  const pageInfo =
    pagination.total > 0
      ? `Showing ${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
          pagination.page * pagination.pageSize,
          pagination.total,
        )} of ${pagination.total}`
      : 'No users';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Portal Users</h1>
        <p className="text-muted-foreground mt-1">
          Admin portal users with assigned roles (admin, client, BNU, division). Students, teachers, and trainers use separate portals and are not listed here.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex gap-2 flex-1 max-w-sm">
          <Input
            placeholder="Search by email, phone, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="secondary" size="icon" onClick={handleSearch} aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">{pageInfo}</span>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Last login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No admin portal users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email ?? '—'}</TableCell>
                  <TableCell>{user.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.divisionProfile?.name ?? '—'}</TableCell>
                  <TableCell>{user.divisionProfile?.division?.name ?? '—'}</TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatLastLogin(user.lastLoginAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <PaginationControls
            currentPage={pagination.page}
            totalPages={totalPages}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            pageInfo={pageInfo}
          />
        </div>
      )}
    </div>
  );
}

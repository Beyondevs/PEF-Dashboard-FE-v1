import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const ROLES = [
  { id: 'admin', label: 'Admin' },
  { id: 'client', label: 'Client' },
  { id: 'bnu', label: 'BNU' },
  { id: 'division_role', label: 'Division' },
];

const PERMISSION_DEFINITION = [
  {
    module: 'Users',
    items: [
      { key: 'users.view', label: 'View users' },
      { key: 'users.create', label: 'Create users' },
      { key: 'users.edit', label: 'Edit users' },
      { key: 'users.delete', label: 'Delete users' },
    ],
  },
  {
    module: 'Trainers',
    items: [
      { key: 'trainers.view', label: 'View trainers' },
      { key: 'trainers.manage_assignments', label: 'Manage assignments' },
    ],
  },
  {
    module: 'Reports',
    items: [
      { key: 'reports.view', label: 'View reports' },
      { key: 'reports.export', label: 'Export reports' },
    ],
  },
];

export default function RolePermissions() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | null>(ROLES[0].id);

  // permissionsState: { [roleId]: Set<permissionKey> }
  const [permissionsState, setPermissionsState] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    for (const r of ROLES) init[r.id] = new Set();
    return init;
  });

  const handleToggle = (permKey: string) => {
    if (!selectedRole) return;
    setPermissionsState((prev) => {
      const copy: Record<string, Set<string>> = { ...prev };
      const set = new Set(copy[selectedRole]);
      if (set.has(permKey)) set.delete(permKey);
      else set.add(permKey);
      copy[selectedRole] = set;
      return copy;
    });
  };

  const currentPermissions = useMemo(() => {
    return selectedRole ? permissionsState[selectedRole] : new Set<string>();
  }, [permissionsState, selectedRole]);

  const handleSave = () => {
    // UI-only: show a toast with a summary
    toast({
      title: 'Permissions saved (UI-only)',
      description: `Saved ${currentPermissions.size} permission(s) for role "${selectedRole}"`,
    });
  };

  const handleReset = () => {
    if (!selectedRole) return;
    setPermissionsState((prev) => ({ ...prev, [selectedRole]: new Set() }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Role Permissions</h1>
        <p className="text-muted-foreground mt-1">
          Configure which actions each portal role is allowed to perform. (UI-only)
        </p>
      </div>

      <div className="flex gap-6">
        <aside className="w-56">
          <div className="mb-2 text-sm font-medium">Roles</div>
          <div className="border rounded-md overflow-hidden">
            {ROLES.map((r) => {
              const active = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 ${active ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Role: <span className="font-medium">{selectedRole}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={!selectedRole}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={!selectedRole}>
                Save
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead className="w-[1%]">Allowed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_DEFINITION.map((group) =>
                  group.items.map((perm, idx) => (
                    <TableRow key={perm.key}>
                      {idx === 0 ? (
                        <TableCell rowSpan={group.items.length} className="align-top font-medium">
                          {group.module}
                        </TableCell>
                      ) : null}
                      <TableCell>{perm.label}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={currentPermissions.has(perm.key)}
                          onCheckedChange={() => handleToggle(perm.key)}
                          id={`perm-${perm.key}`}
                        />
                      </TableCell>
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </div>
  );
}


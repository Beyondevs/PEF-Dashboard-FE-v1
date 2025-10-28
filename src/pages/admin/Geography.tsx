import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function Geography() {
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDivisionDialogOpen, setIsDivisionDialogOpen] = useState(false);
  const [isDistrictDialogOpen, setIsDistrictDialogOpen] = useState(false);
  const [isTehsilDialogOpen, setIsTehsilDialogOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<any>(null);
  const [editingDistrict, setEditingDistrict] = useState<any>(null);
  const [editingTehsil, setEditingTehsil] = useState<any>(null);
  
  const [divisionForm, setDivisionForm] = useState({ name: '', code: '' });
  const [districtForm, setDistrictForm] = useState({ name: '', code: '', divisionId: '' });
  const [tehsilForm, setTehsilForm] = useState({ name: '', code: '', districtId: '' });
  
  const { canEdit, canDelete } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [divsRes, distsRes, tehsRes] = await Promise.all([
        api.getDivisions(),
        api.getDistricts(),
        api.getTehsils(),
      ]);
      setDivisions(divsRes.data);
      setDistricts(distsRes.data);
      setTehsils(tehsRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load geography data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Division handlers
  const handleSaveDivision = async () => {
    try {
      if (editingDivision) {
        await api.updateDivision(editingDivision.id, divisionForm);
        toast({ title: 'Success', description: 'Division updated successfully' });
      } else {
        await api.createDivision(divisionForm);
        toast({ title: 'Success', description: 'Division created successfully' });
      }
      setIsDivisionDialogOpen(false);
      setEditingDivision(null);
      setDivisionForm({ name: '', code: '' });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDeleteDivision = async (id: string) => {
    if (!confirm('Are you sure? This will delete all related districts and schools.')) return;
    try {
      await api.deleteDivision(id);
      toast({ title: 'Success', description: 'Division deleted successfully' });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete division', variant: 'destructive' });
    }
  };

  // District handlers
  const handleSaveDistrict = async () => {
    try {
      if (editingDistrict) {
        await api.updateDistrict(editingDistrict.id, districtForm);
        toast({ title: 'Success', description: 'District updated successfully' });
      } else {
        await api.createDistrict(districtForm);
        toast({ title: 'Success', description: 'District created successfully' });
      }
      setIsDistrictDialogOpen(false);
      setEditingDistrict(null);
      setDistrictForm({ name: '', code: '', divisionId: '' });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDeleteDistrict = async (id: string) => {
    if (!confirm('Are you sure? This will delete all related tehsils and schools.')) return;
    try {
      await api.deleteDistrict(id);
      toast({ title: 'Success', description: 'District deleted successfully' });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete district', variant: 'destructive' });
    }
  };

  // Tehsil handlers
  const handleSaveTehsil = async () => {
    try {
      if (editingTehsil) {
        await api.updateTehsil(editingTehsil.id, tehsilForm);
        toast({ title: 'Success', description: 'Tehsil updated successfully' });
      } else {
        await api.createTehsil(tehsilForm);
        toast({ title: 'Success', description: 'Tehsil created successfully' });
      }
      setIsTehsilDialogOpen(false);
      setEditingTehsil(null);
      setTehsilForm({ name: '', code: '', districtId: '' });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDeleteTehsil = async (id: string) => {
    if (!confirm('Are you sure? This will affect all related schools.')) return;
    try {
      await api.deleteTehsil(id);
      toast({ title: 'Success', description: 'Tehsil deleted successfully' });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete tehsil', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Geography Management</h1>
        <p className="text-muted-foreground mt-1">Manage divisions, districts, and tehsils</p>
      </div>

      <Tabs defaultValue="divisions" className="w-full">
        <TabsList>
          <TabsTrigger value="divisions">Divisions</TabsTrigger>
          <TabsTrigger value="districts">Districts</TabsTrigger>
          <TabsTrigger value="tehsils">Tehsils</TabsTrigger>
        </TabsList>

        {/* Divisions Tab */}
        <TabsContent value="divisions" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Divisions ({divisions.length})</h2>
            {canEdit() && (
              <Dialog open={isDivisionDialogOpen} onOpenChange={setIsDivisionDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingDivision(null); setDivisionForm({ name: '', code: '' }); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Division
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDivision ? 'Edit Division' : 'Add Division'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={divisionForm.name} onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Code</Label>
                      <Input value={divisionForm.code} onChange={(e) => setDivisionForm({ ...divisionForm, code: e.target.value })} />
                    </div>
                    <Button onClick={handleSaveDivision} className="w-full">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  {(canEdit() || canDelete()) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                ) : divisions.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center">No divisions found</TableCell></TableRow>
                ) : (
                  divisions.map((div: any) => (
                    <TableRow key={div.id}>
                      <TableCell>{div.name}</TableCell>
                      <TableCell>{div.code || 'N/A'}</TableCell>
                      {(canEdit() || canDelete()) && (
                        <TableCell>
                          <div className="flex gap-2">
                            {canEdit() && (
                              <Button size="sm" variant="outline" onClick={() => { setEditingDivision(div); setDivisionForm({ name: div.name, code: div.code || '' }); setIsDivisionDialogOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete() && (
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteDivision(div.id)}>
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
        </TabsContent>

        {/* Districts Tab */}
        <TabsContent value="districts" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Districts ({districts.length})</h2>
            {canEdit() && (
              <Dialog open={isDistrictDialogOpen} onOpenChange={setIsDistrictDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingDistrict(null); setDistrictForm({ name: '', code: '', divisionId: '' }); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add District
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDistrict ? 'Edit District' : 'Add District'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={districtForm.name} onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Code</Label>
                      <Input value={districtForm.code} onChange={(e) => setDistrictForm({ ...districtForm, code: e.target.value })} />
                    </div>
                    <div>
                      <Label>Division</Label>
                      <select className="w-full border rounded-md p-2" value={districtForm.divisionId} onChange={(e) => setDistrictForm({ ...districtForm, divisionId: e.target.value })}>
                        <option value="">Select division</option>
                        {divisions.map((div: any) => (
                          <option key={div.id} value={div.id}>{div.name}</option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={handleSaveDistrict} className="w-full">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Division</TableHead>
                  {(canEdit() || canDelete()) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                ) : districts.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center">No districts found</TableCell></TableRow>
                ) : (
                  districts.map((dist: any) => (
                    <TableRow key={dist.id}>
                      <TableCell>{dist.name}</TableCell>
                      <TableCell>{dist.code || 'N/A'}</TableCell>
                      <TableCell>{dist.division?.name || 'N/A'}</TableCell>
                      {(canEdit() || canDelete()) && (
                        <TableCell>
                          <div className="flex gap-2">
                            {canEdit() && (
                              <Button size="sm" variant="outline" onClick={() => { setEditingDistrict(dist); setDistrictForm({ name: dist.name, code: dist.code || '', divisionId: dist.divisionId }); setIsDistrictDialogOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete() && (
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteDistrict(dist.id)}>
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
        </TabsContent>

        {/* Tehsils Tab */}
        <TabsContent value="tehsils" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tehsils ({tehsils.length})</h2>
            {canEdit() && (
              <Dialog open={isTehsilDialogOpen} onOpenChange={setIsTehsilDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingTehsil(null); setTehsilForm({ name: '', code: '', districtId: '' }); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tehsil
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTehsil ? 'Edit Tehsil' : 'Add Tehsil'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={tehsilForm.name} onChange={(e) => setTehsilForm({ ...tehsilForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Code</Label>
                      <Input value={tehsilForm.code} onChange={(e) => setTehsilForm({ ...tehsilForm, code: e.target.value })} />
                    </div>
                    <div>
                      <Label>District</Label>
                      <select className="w-full border rounded-md p-2" value={tehsilForm.districtId} onChange={(e) => setTehsilForm({ ...tehsilForm, districtId: e.target.value })}>
                        <option value="">Select district</option>
                        {districts.map((dist: any) => (
                          <option key={dist.id} value={dist.id}>{dist.name}</option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={handleSaveTehsil} className="w-full">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>District</TableHead>
                  {(canEdit() || canDelete()) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                ) : tehsils.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center">No tehsils found</TableCell></TableRow>
                ) : (
                  tehsils.map((teh: any) => (
                    <TableRow key={teh.id}>
                      <TableCell>{teh.name}</TableCell>
                      <TableCell>{teh.code || 'N/A'}</TableCell>
                      <TableCell>{teh.district?.name || 'N/A'}</TableCell>
                      {(canEdit() || canDelete()) && (
                        <TableCell>
                          <div className="flex gap-2">
                            {canEdit() && (
                              <Button size="sm" variant="outline" onClick={() => { setEditingTehsil(teh); setTehsilForm({ name: teh.name, code: teh.code || '', districtId: teh.districtId }); setIsTehsilDialogOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete() && (
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteTehsil(teh.id)}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

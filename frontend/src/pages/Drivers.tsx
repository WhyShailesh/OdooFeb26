import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, AlertCircle } from 'lucide-react';
import { api } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'suspended';

interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  licenseExpiry: string;
  safetyScore: number;
  status: DriverStatus;
}

const STATUS_VARIANTS: Record<DriverStatus, 'success' | 'default' | 'secondary' | 'destructive'> = {
  available: 'success',
  on_trip: 'default',
  off_duty: 'secondary',
  suspended: 'destructive',
};

export function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    name: '',
    licenseNo: '',
    licenseExpiry: '',
    safetyScore: '100',
    status: 'available' as DriverStatus,
  });

  function load() {
    api<Driver[]>('/drivers').then(setDrivers).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', licenseNo: '', licenseExpiry: '', safetyScore: '100', status: 'available' });
    setOpen(true);
  }

  function openEdit(d: Driver) {
    setEditing(d);
    setForm({
      name: d.name,
      licenseNo: d.licenseNo,
      licenseExpiry: d.licenseExpiry.slice(0, 10),
      safetyScore: String(d.safetyScore),
      status: d.status,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      licenseNo: form.licenseNo,
      licenseExpiry: form.licenseExpiry,
      safetyScore: Number(form.safetyScore),
      status: form.status,
    };
    try {
      if (editing) {
        await api(`/drivers/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/drivers', { method: 'POST', body: JSON.stringify(payload) });
      }
      setOpen(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this driver?')) return;
    try {
      await api(`/drivers/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  const filtered = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(filter.toLowerCase()) ||
      d.licenseNo.toLowerCase().includes(filter.toLowerCase())
  );

  function isExpired(exp: string) {
    return new Date(exp) < new Date();
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Driver Management</h1>
          <p className="mt-1 text-muted-foreground">Manage drivers and license status</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Drivers
          </CardTitle>
          <Input
            placeholder="Filter by name or license..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs bg-background/50"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>License No</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Safety Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="font-mono">{d.licenseNo}</TableCell>
                    <TableCell>
                      <span className={isExpired(d.licenseExpiry) ? 'text-destructive flex items-center gap-1' : ''}>
                        {d.licenseExpiry.slice(0, 10)}
                        {isExpired(d.licenseExpiry) && <AlertCircle className="h-4 w-4" />}
                      </span>
                    </TableCell>
                    <TableCell>{d.safetyScore}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[d.status]}>{d.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>License Number (unique)</Label>
              <Input value={form.licenseNo} onChange={(e) => setForm((f) => ({ ...f, licenseNo: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>License Expiry</Label>
              <Input type="date" value={form.licenseExpiry} onChange={(e) => setForm((f) => ({ ...f, licenseExpiry: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Safety Score (0-100)</Label>
                <Input type="number" min={0} max={100} value={form.safetyScore} onChange={(e) => setForm((f) => ({ ...f, safetyScore: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as DriverStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['available', 'on_trip', 'off_duty', 'suspended'] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

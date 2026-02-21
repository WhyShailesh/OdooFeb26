import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Truck } from 'lucide-react';
import { api } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type VehicleStatus = 'available' | 'on_trip' | 'in_shop' | 'retired';

interface Vehicle {
  id: string;
  model: string;
  licensePlate: string;
  capacity: number;
  odometer: number;
  status: VehicleStatus;
}

const STATUS_VARIANTS: Record<VehicleStatus, 'success' | 'default' | 'warning' | 'secondary'> = {
  available: 'success',
  on_trip: 'default',
  in_shop: 'warning',
  retired: 'secondary',
};

export function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ model: '', licensePlate: '', capacity: '', odometer: '0', status: 'available' as VehicleStatus });

  function load() {
    api<Vehicle[]>('/vehicles').then(setVehicles).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ model: '', licensePlate: '', capacity: '', odometer: '0', status: 'available' });
    setOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      model: v.model,
      licensePlate: v.licensePlate,
      capacity: String(v.capacity),
      odometer: String(v.odometer),
      status: v.status,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      model: form.model,
      licensePlate: form.licensePlate,
      capacity: Number(form.capacity),
      odometer: Number(form.odometer) || 0,
      status: form.status,
    };
    try {
      if (editing) {
        await api(`/vehicles/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/vehicles', { method: 'POST', body: JSON.stringify(payload) });
      }
      setOpen(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await api(`/vehicles/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  const filtered = vehicles.filter(
    (v) =>
      v.model.toLowerCase().includes(filter.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vehicle Registry</h1>
          <p className="mt-1 text-muted-foreground">Manage fleet vehicles</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            All Vehicles
          </CardTitle>
          <Input
            placeholder="Filter by model or plate..."
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
                  <TableHead>Model</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Capacity (kg)</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.model}</TableCell>
                    <TableCell className="font-mono">{v.licensePlate}</TableCell>
                    <TableCell>{v.capacity.toLocaleString()}</TableCell>
                    <TableCell>{v.odometer.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[v.status]}>{v.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(v.id)}>
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
            <DialogTitle>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>License Plate (unique)</Label>
              <Input value={form.licensePlate} onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity (kg)</Label>
                <Input type="number" min={0} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Odometer</Label>
                <Input type="number" min={0} value={form.odometer} onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as VehicleStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['available', 'on_trip', 'in_shop', 'retired'] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

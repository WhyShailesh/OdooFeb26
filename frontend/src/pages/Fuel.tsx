import { useEffect, useState } from 'react';
import { Plus, Fuel as FuelIcon, Truck } from 'lucide-react';
import { api } from '@/lib/utils';
import { formatINR, formatDateIN } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';
import { canManageFuel, isReadOnly } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Vehicle {
  id: string;
  model: string;
  licensePlate: string;
}

interface FuelLog {
  id: string;
  liters: number;
  cost: number;
  date: string;
  odometerAtFill: number | null;
  vehicle: Vehicle;
}

export function FuelLogsPage() {
  const { user } = useAuth();
  const canEdit = user ? canManageFuel(user.role) : false;
  const readOnly = user ? isReadOnly(user.role) : false;
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [form, setForm] = useState({
    vehicleId: '',
    liters: '',
    cost: '',
    date: new Date().toISOString().slice(0, 10),
    odometerAtFill: '',
  });

  function load() {
    Promise.all([api<FuelLog[]>('/fuel'), api<Vehicle[]>('/vehicles')]).then(([l, v]) => {
      setLogs(l);
      setVehicles(v);
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({
      vehicleId: vehicles[0]?.id ?? '',
      liters: '',
      cost: '',
      date: new Date().toISOString().slice(0, 10),
      odometerAtFill: '',
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/fuel', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: form.vehicleId,
          liters: Number(form.liters),
          cost: Number(form.cost),
          date: form.date,
          odometerAtFill: form.odometerAtFill ? Number(form.odometerAtFill) : undefined,
        }),
      });
      setOpen(false);
      setError(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this fuel log?')) return;
    try {
      await api(`/fuel/${id}`, { method: 'DELETE' });
      setError(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  const filtered = vehicleFilter === 'all' ? logs : logs.filter((l) => l.vehicle.id === vehicleFilter);
  const totalLiters = filtered.reduce((s, l) => s + l.liters, 0);
  const totalCost = filtered.reduce((s, l) => s + l.cost, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Fuel & Expense</h1>
            {readOnly && <Badge variant="secondary" className="text-xs">Read-only</Badge>}
          </div>
          <p className="mt-1 text-muted-foreground">Track fuel and operational cost per vehicle</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Fuel Log
          </Button>
        )}
      </div>
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Liters (filtered)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLiters.toFixed(1)} L</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost (filtered)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatINR(totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FuelIcon className="h-5 w-5 text-primary" />
            Fuel Logs
          </CardTitle>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[200px] bg-background/50">
              <SelectValue placeholder="Vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vehicles</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.licensePlate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      {l.vehicle.licensePlate}
                    </TableCell>
                    <TableCell>{formatDateIN(l.date)}</TableCell>
                    <TableCell>{l.liters} L</TableCell>
                    <TableCell>{formatINR(l.cost)}</TableCell>
                    <TableCell>{l.odometerAtFill ?? '—'}</TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(l.id)}>
                          Delete
                        </Button>
                      )}
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
            <DialogTitle>Add Fuel Log</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.licensePlate} — {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Liters</Label>
                <Input type="number" min={0} step={0.01} value={form.liters} onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Cost (₹)</Label>
                <Input type="number" min={0} step={0.01} value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Odometer at fill (optional)</Label>
                <Input type="number" min={0} value={form.odometerAtFill} onChange={(e) => setForm((f) => ({ ...f, odometerAtFill: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

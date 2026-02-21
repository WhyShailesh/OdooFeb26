import { useEffect, useState } from 'react';
import { Plus, MapPin, Send, Check, X, Truck, User } from 'lucide-react';
import { api } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TripStatus = 'draft' | 'dispatched' | 'completed' | 'cancelled';

interface Vehicle {
  id: string;
  model: string;
  licensePlate: string;
  capacity: number;
  status: string;
}

interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  licenseExpiry: string;
  status: string;
}

interface Trip {
  id: string;
  reference: string;
  cargoWeight: number;
  origin: string;
  destination: string;
  status: TripStatus;
  vehicle: Vehicle;
  driver: Driver;
}

export function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form, setForm] = useState({
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    origin: '',
    destination: '',
  });

  function load() {
    Promise.all([
      api<Trip[]>('/trips'),
      api<Vehicle[]>('/vehicles'),
      api<Driver[]>('/drivers'),
    ]).then(([t, v, d]) => {
      setTrips(t);
      setVehicles(v);
      setDrivers(d);
    }).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const availableVehicles = vehicles.filter((v) => v.status === 'available');
  const availableDrivers = drivers.filter((d) => {
    if (d.status !== 'available') return false;
    return new Date(d.licenseExpiry) >= new Date();
  });

  function openCreate() {
    setForm({
      vehicleId: availableVehicles[0]?.id ?? '',
      driverId: availableDrivers[0]?.id ?? '',
      cargoWeight: '',
      origin: '',
      destination: '',
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === form.vehicleId);
    if (!vehicle || Number(form.cargoWeight) > vehicle.capacity) {
      alert('Cargo weight exceeds vehicle capacity');
      return;
    }
    try {
      await api('/trips', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: form.vehicleId,
          driverId: form.driverId,
          cargoWeight: Number(form.cargoWeight),
          origin: form.origin,
          destination: form.destination,
        }),
      });
      setOpen(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function dispatch(id: string) {
    try {
      await api(`/trips/${id}/dispatch`, { method: 'PATCH' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function complete(id: string) {
    try {
      await api(`/trips/${id}/complete`, { method: 'PATCH', body: JSON.stringify({}) });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function cancel(id: string) {
    if (!confirm('Cancel this trip?')) return;
    try {
      await api(`/trips/${id}/cancel`, { method: 'PATCH' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  }

  const filtered = statusFilter === 'all' ? trips : trips.filter((t) => t.status === statusFilter);

  const statusVariant = (s: TripStatus) => (s === 'completed' ? 'success' : s === 'dispatched' ? 'default' : s === 'cancelled' ? 'destructive' : 'secondary');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Trip Dispatch</h1>
          <p className="mt-1 text-muted-foreground">Draft → Dispatched → Completed</p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={availableVehicles.length === 0 || availableDrivers.length === 0}>
          <Plus className="h-4 w-4" />
          New Trip
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Trips
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  <TableHead>Reference</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-medium">{t.reference}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{t.origin}</span>
                      <span className="mx-1">→</span>
                      <span>{t.destination}</span>
                    </TableCell>
                    <TableCell>{t.cargoWeight} kg</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      {t.vehicle.licensePlate}
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {t.driver.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {t.status === 'draft' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => dispatch(t.id)}>
                              <Send className="h-3 w-3 mr-1" />
                              Dispatch
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(t.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {t.status === 'dispatched' && (
                          <>
                            <Button size="sm" onClick={() => complete(t.id)}>
                              <Check className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(t.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
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
            <DialogTitle>New Trip (Draft)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select value={form.vehicleId} onValueChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.licensePlate} — {v.model} (cap: {v.capacity} kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Driver</Label>
              <Select value={form.driverId} onValueChange={(v) => setForm((f) => ({ ...f, driverId: v }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} — {d.licenseNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargo Weight (kg)</Label>
              <Input
                type="number"
                min={0}
                value={form.cargoWeight}
                onChange={(e) => setForm((f) => ({ ...f, cargoWeight: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Origin</Label>
              <Input value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Draft</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

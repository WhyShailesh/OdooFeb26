import { useEffect, useState } from 'react';
import { Truck, AlertTriangle, Activity, Package, TrendingUp } from 'lucide-react';
import { api } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  activeFleetCount: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  pendingCargo: number;
  totalVehicles: number;
  totalDrivers: number;
  recentTrips: Array<{
    id: string;
    reference: string;
    status: string;
    origin: string;
    destination: string;
    cargoWeight: number;
    vehicle?: { licensePlate: string };
    driver?: { name: string };
  }>;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<DashboardData>('/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const cards = [
    { title: 'Active Fleet', value: data.activeFleetCount, icon: Truck, color: 'text-sky-400', bg: 'from-sky-500/20 to-sky-600/5' },
    { title: 'Maintenance Alerts', value: data.maintenanceAlerts, icon: AlertTriangle, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/5' },
    { title: 'Utilization Rate', value: `${data.utilizationRate}%`, icon: Activity, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/5' },
    { title: 'Pending Cargo', value: data.pendingCargo, icon: Package, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-indigo-600/5' },
  ];

  const chartData = [
    { name: 'Mon', trips: 12, utilization: 78 },
    { name: 'Tue', trips: 15, utilization: 82 },
    { name: 'Wed', trips: 10, utilization: 65 },
    { name: 'Thu', trips: 18, utilization: 90 },
    { name: 'Fri', trips: 14, utilization: 75 },
    { name: 'Sat', trips: 8, utilization: 50 },
    { name: 'Sun', trips: 6, utilization: 40 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
        <p className="mt-1 text-muted-foreground">Real-time fleet overview and key metrics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title} className="overflow-hidden transition-all hover:border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <div className={`rounded-lg bg-gradient-to-br ${bg} p-2`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Trips and utilization trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" />
                <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="trips" stroke="hsl(199, 89%, 48%)" fillOpacity={1} fill="url(#colorTrips)" name="Trips" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
            <CardDescription>Latest dispatch activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentTrips.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent trips</p>
              ) : (
                data.recentTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">{trip.reference}</p>
                      <p className="text-xs text-muted-foreground">
                        {trip.origin} → {trip.destination}
                      </p>
                      {trip.vehicle && <p className="text-xs text-muted-foreground">Vehicle: {trip.vehicle.licensePlate}</p>}
                    </div>
                    <Badge variant={trip.status === 'completed' ? 'success' : trip.status === 'dispatched' ? 'default' : 'secondary'}>
                      {trip.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

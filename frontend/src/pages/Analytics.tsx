import { useEffect, useState } from 'react';
import { BarChart3, Download, FileText } from 'lucide-react';
import { api } from '@/lib/utils';
import { API_BASE_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface VehicleStat {
  vehicleId: string;
  model: string;
  licensePlate: string;
  totalOperationalCost: number;
  fuelCost: number;
  maintenanceCost: number;
  costPerKm: number;
  fuelEfficiency: number;
  tripCount: number;
}

interface AnalyticsData {
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalLiters: number;
  fuelEfficiencyOverall: number;
  vehicleStats: VehicleStat[];
  chartData: {
    fuelByMonth: Record<string, number>;
    maintenanceByMonth: Record<string, number>;
  };
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<AnalyticsData>('/analytics/summary').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function exportCsv() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/analytics/export/csv`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fleetflow-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed');
    }
  }

  async function exportPdf() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/analytics/export/pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fleetflow-report.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Export failed');
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const fuelChartData = Object.entries(data.chartData.fuelByMonth).map(([name, value]) => ({ name, fuel: value }));
  const maintChartData = Object.entries(data.chartData.maintenanceByMonth).map(([name, value]) => ({ name, maintenance: value }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Fuel efficiency, ROI, cost per km</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportPdf} className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${data.totalFuelCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Maintenance Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${data.totalMaintenanceCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Liters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totalLiters.toFixed(1)} L</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Fuel Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.fuelEfficiencyOverall.toFixed(1)} km/L</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Fuel Cost by Month
            </CardTitle>
            <CardDescription>Monthly fuel spend</CardDescription>
          </CardHeader>
          <CardContent>
            {fuelChartData.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No fuel data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fuelChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" />
                  <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="fuel" fill="hsl(199, 89%, 48%)" name="Fuel ($)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Cost by Month</CardTitle>
            <CardDescription>Monthly maintenance spend</CardDescription>
          </CardHeader>
          <CardContent>
            {maintChartData.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No maintenance data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={maintChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" />
                  <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="maintenance" fill="hsl(262, 83%, 58%)" name="Maintenance ($)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost per Vehicle (ROI / Cost per km)</CardTitle>
          <CardDescription>Total operational cost, cost per km, fuel efficiency per vehicle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Vehicle</th>
                  <th className="pb-3 pr-4 font-medium">Total Cost</th>
                  <th className="pb-3 pr-4 font-medium">Fuel</th>
                  <th className="pb-3 pr-4 font-medium">Maintenance</th>
                  <th className="pb-3 pr-4 font-medium">Cost/km</th>
                  <th className="pb-3 font-medium">Efficiency (km/L)</th>
                </tr>
              </thead>
              <tbody>
                {data.vehicleStats.map((v) => (
                  <tr key={v.vehicleId} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-mono">{v.licensePlate}</td>
                    <td className="py-3 pr-4">${v.totalOperationalCost.toFixed(2)}</td>
                    <td className="py-3 pr-4">${v.fuelCost.toFixed(2)}</td>
                    <td className="py-3 pr-4">${v.maintenanceCost.toFixed(2)}</td>
                    <td className="py-3 pr-4">${v.costPerKm.toFixed(2)}</td>
                    <td className="py-3">{v.fuelEfficiency.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

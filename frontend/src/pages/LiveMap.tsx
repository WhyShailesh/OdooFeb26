import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '@/lib/utils';
import { formatINR, formatDateTimeIST } from '@/lib/format';

// Fix default marker icon in bundler (Vite)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const AHMEDABAD_CENTER: [number, number] = [23.0225, 72.5714];

const MARKER_COLORS: Record<string, string> = {
  available: '#22c55e',
  on_trip: '#3b82f6',
  in_shop: '#f97316',
  retired: '#6b7280',
};

function createColoredIcon(status: string): L.DivIcon {
  const color = MARKER_COLORS[status] ?? '#6b7280';
  return L.divIcon({
    className: 'fleetflow-marker',
    html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export interface LiveVehicle {
  id: string;
  vehicleName: string;
  licensePlate: string;
  driverName: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  lastUpdated: string | null;
  currentTripDestination: string | null;
  fuelEfficiency: number;
  totalProfit: number;
  odometer: number;
}


function VehiclePopupCard({ v }: { v: LiveVehicle }) {
  return (
    <div className="min-w-[220px] rounded-xl border border-white/10 bg-zinc-900/95 p-4 shadow-xl backdrop-blur-sm">
      <h3 className="border-b border-white/10 pb-2 text-base font-semibold text-white">
        {v.vehicleName}
      </h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-400">{v.licensePlate}</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Driver</span>
          <span className="text-white">{v.driverName ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Status</span>
          <span className="text-emerald-400">{v.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Speed</span>
          <span className="text-white">{v.speed != null ? `${v.speed} km/h` : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Fuel efficiency</span>
          <span className="text-white">{v.fuelEfficiency ? `${v.fuelEfficiency} km/L` : '—'}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-emerald-500/15 px-3 py-2 border border-emerald-500/20">
          <span className="text-sm font-medium text-emerald-400/90">Profit generated</span>
          <span className="font-semibold text-emerald-400">{formatINR(v.totalProfit)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Odometer</span>
          <span className="text-white">{v.odometer?.toLocaleString('en-IN') ?? 0} km</span>
        </div>
        {v.currentTripDestination && (
          <div className="flex justify-between">
            <span className="text-zinc-400">Destination</span>
            <span className="truncate text-white max-w-[120px]" title={v.currentTripDestination}>{v.currentTripDestination}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 border-t border-white/10">
          <span className="text-zinc-400">Last updated</span>
          <span className="text-xs text-zinc-500">{v.lastUpdated ? formatDateTimeIST(v.lastUpdated) : '—'}</span>
        </div>
      </dl>
    </div>
  );
}

export function LiveMap() {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLive = () => {
      api<LiveVehicle[]>('/vehicles/live')
        .then(setVehicles)
        .catch(console.error)
        .finally(() => setLoading(false));
    };
    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, []);

  const vehiclesToShow = vehicles;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Live Map</h1>
        <p className="mt-1 text-muted-foreground">Real-time truck positions & details · updates every 5s</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="h-[500px] w-full">
              <MapContainer
                center={AHMEDABAD_CENTER}
                zoom={10}
                className="h-full w-full"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {vehiclesToShow.map((v) => {
                  const lat = v.latitude ?? AHMEDABAD_CENTER[0];
                  const lng = v.longitude ?? AHMEDABAD_CENTER[1];
                  return (
                    <Marker key={v.id} position={[lat, lng]} icon={createColoredIcon(v.status)}>
                      <Popup className="fleetflow-popup">
                        <VehiclePopupCard v={v} />
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground">Vehicles</h2>
          <p className="text-sm text-muted-foreground">{vehicles.length} vehicles on map</p>
          <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto">
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vehicles</p>
            ) : (
              vehicles.map((v) => (
                <div key={v.id} className="rounded-lg border border-border bg-background/50 p-3">
                  <p className="font-medium text-foreground">{v.vehicleName} · {v.licensePlate}</p>
                  <p className="text-xs text-muted-foreground">{v.driverName ?? '—'} · {v.status}</p>
                  {v.speed != null && <p className="text-xs text-muted-foreground">{v.speed} km/h</p>}
                  {v.lastUpdated && <p className="text-xs text-muted-foreground">{formatDateTimeIST(v.lastUpdated)}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

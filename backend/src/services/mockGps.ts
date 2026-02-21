import { prisma } from '../utils/prisma.js';
import { checkGeofenceAndUpdateTrip, appendRouteHistory } from './geofence.js';

// Indian demo: Ahmedabad center
const MOCK_CENTER = { lat: 23.0225, lng: 72.5714 };
const JITTER = 0.001; // ~100m for smoother path

export function startMockGpsInterval(intervalMs = 5000) {
  setInterval(async () => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { status: 'on_trip' },
        select: { id: true, latitude: true, longitude: true },
      });
      const now = new Date();
      for (const v of vehicles) {
        const lat = (v.latitude ?? MOCK_CENTER.lat) + (Math.random() - 0.5) * JITTER;
        const lng = (v.longitude ?? MOCK_CENTER.lng) + (Math.random() - 0.5) * JITTER;
        const speed = Math.round((20 + Math.random() * 50) * 10) / 10; // 20–70 km/h random
        await prisma.vehicle.update({
          where: { id: v.id },
          data: { latitude: lat, longitude: lng, speed, lastLocationAt: now, lastUpdated: now },
        });
        await checkGeofenceAndUpdateTrip(v.id, lat, lng);
        const trip = await prisma.trip.findFirst({
          where: { vehicleId: v.id, status: 'dispatched' },
          select: { id: true },
        });
        if (trip) await appendRouteHistory(trip.id, lat, lng);
      }
    } catch (e) {
      console.error('Mock GPS update error:', e);
    }
  }, intervalMs);
  console.log(`Mock GPS (India) updates every ${intervalMs / 1000}s`);
}

import { prisma } from '../utils/prisma.js';

const DESTINATION_RADIUS_METERS = 100;

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function checkGeofenceAndUpdateTrip(vehicleId: string, lat: number, lng: number): Promise<void> {
  const trip = await prisma.trip.findFirst({
    where: { vehicleId, status: 'dispatched' },
    include: { vehicle: true },
  });
  if (!trip || trip.destinationLat == null || trip.destinationLng == null) return;

  const dist = haversineMeters(lat, lng, trip.destinationLat, trip.destinationLng);
  if (dist > DESTINATION_RADIUS_METERS) return;

  const now = new Date();
  const updates: Record<string, unknown> = {
    deliveredAt: now,
    arrivedAt: trip.arrivedAt ?? now,
  };

  await prisma.trip.update({
    where: { id: trip.id },
    data: updates,
  });

  // Optional: auto-complete trip when delivered (uncomment to enable)
  // await prisma.$transaction([
  //   prisma.trip.update({ where: { id: trip.id }, data: { status: 'completed', completedAt: now, ...updates } }),
  //   prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'available' } }),
  //   prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'available' } }),
  // ]);
}

export async function appendRouteHistory(tripId: string, lat: number, lng: number): Promise<void> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { routeHistory: true } });
  if (!trip) return;
  const history = (trip.routeHistory as Array<{ lat: number; lng: number; at: string }>) ?? [];
  history.push({ lat, lng, at: new Date().toISOString() });
  await prisma.trip.update({
    where: { id: tripId },
    data: { routeHistory: history.slice(-500) },
  });
}

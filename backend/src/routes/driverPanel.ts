import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { roleMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { CAN_DRIVER_PANEL } from '../config/roles.js';
import { checkGeofenceAndUpdateTrip } from '../services/geofence.js';

const router = Router();
const prisma = new PrismaClient();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// Driver sees only their trips (or Manager sees all when testing)
router.get('/my-trips', roleMiddleware(...CAN_DRIVER_PANEL), async (req: AuthRequest, res) => {
  const driverId = req.user?.driverId;
  if (!driverId && req.user?.role !== 'FLEET_MANAGER') return res.status(403).json({ error: 'Driver profile not linked' });
  const where = driverId ? { driverId } : {};
  const trips = await prisma.trip.findMany({
    where: { ...where, status: { in: ['draft', 'dispatched'] } },
    include: { vehicle: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(trips);
});

// Update live location (driver's current trip vehicle)
router.patch(
  '/location',
  roleMiddleware(...CAN_DRIVER_PANEL),
  [body('latitude').isFloat(), body('longitude').isFloat(), body('vehicleId').trim().notEmpty()],
  validate,
  async (req: AuthRequest, res) => {
    const driverId = req.user?.driverId;
    if (!driverId) return res.status(403).json({ error: 'Driver profile not linked' });
    const { latitude, longitude, vehicleId } = req.body;
    const trip = await prisma.trip.findFirst({
      where: { driverId, vehicleId, status: 'dispatched' },
    });
    if (!trip) return res.status(400).json({ error: 'No active trip for this vehicle' });
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { latitude, longitude, lastLocationAt: new Date() },
    });
    await checkGeofenceAndUpdateTrip(vehicleId, latitude, longitude);
    const history = (trip.routeHistory as Array<{ lat: number; lng: number; at: string }>) ?? [];
    history.push({ lat: latitude, lng: longitude, at: new Date().toISOString() });
    await prisma.trip.update({
      where: { id: trip.id },
      data: { routeHistory: history.slice(-500) },
    });
    res.json({ ok: true });
  }
);

// Update odometer (driver reports current odometer during/end trip)
router.patch(
  '/trips/:id/odometer',
  roleMiddleware(...CAN_DRIVER_PANEL),
  [param('id').isString(), body('odometer').isFloat({ min: 0 })],
  validate,
  async (req: AuthRequest, res) => {
    const driverId = req.user?.driverId;
    if (!driverId) return res.status(403).json({ error: 'Driver profile not linked' });
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, driverId },
      include: { vehicle: true },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'dispatched') return res.status(400).json({ error: 'Only active trip can update odometer' });
    const odometer = req.body.odometer as number;
    if (odometer < (trip.vehicle.odometer ?? 0)) return res.status(400).json({ error: 'Odometer cannot be decreased' });
    await prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { odometer },
    });
    res.json({ ok: true });
  }
);

// Driver ends trip (complete with end odometer)
router.patch(
  '/trips/:id/complete',
  roleMiddleware(...CAN_DRIVER_PANEL),
  [param('id').isString(), body('endOdometer').isFloat({ min: 0 })],
  validate,
  async (req: AuthRequest, res) => {
    const driverId = req.user?.driverId;
    if (!driverId) return res.status(403).json({ error: 'Driver profile not linked' });
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, driverId },
      include: { vehicle: true },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'dispatched') return res.status(400).json({ error: 'Only active trip can be completed' });
    const endOdometer = req.body.endOdometer as number;
    const currentOdometer = trip.vehicle.odometer ?? 0;
    if (endOdometer < currentOdometer) return res.status(400).json({ error: 'End odometer cannot be less than current odometer' });
    const startOdometer = trip.startOdometer ?? currentOdometer;
    if (endOdometer <= startOdometer) return res.status(400).json({ error: 'End odometer must be greater than start odometer' });
    const distance = endOdometer - startOdometer;

    await prisma.$transaction([
      prisma.trip.update({
        where: { id: trip.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          startOdometer,
          endOdometer,
          distance,
        },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'available', odometer: endOdometer },
      }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'available' } }),
    ]);

    const updated = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: { vehicle: true, driver: true },
    });
    res.json(updated);
  }
);

export { router as driverPanelRouter };

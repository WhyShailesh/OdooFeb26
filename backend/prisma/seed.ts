import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'manager@fleetflow.com' },
      update: {},
      create: { email: 'manager@fleetflow.com', password: hash, name: 'Alex Fleet', role: 'FLEET_MANAGER' },
    }),
    prisma.user.upsert({
      where: { email: 'dispatcher@fleetflow.com' },
      update: {},
      create: { email: 'dispatcher@fleetflow.com', password: hash, name: 'Sam Dispatch', role: 'DISPATCHER' },
    }),
    prisma.user.upsert({
      where: { email: 'safety@fleetflow.com' },
      update: {},
      create: { email: 'safety@fleetflow.com', password: hash, name: 'Jordan Safety', role: 'SAFETY_OFFICER' },
    }),
    prisma.user.upsert({
      where: { email: 'finance@fleetflow.com' },
      update: {},
      create: { email: 'finance@fleetflow.com', password: hash, name: 'Morgan Finance', role: 'FINANCIAL_ANALYST' },
    }),
  ]);

  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { licensePlate: 'ABC-1001' },
      update: {},
      create: { model: 'Freightliner M2', licensePlate: 'ABC-1001', capacity: 5000, odometer: 45000, status: 'available' },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'ABC-1002' },
      update: {},
      create: { model: 'Kenworth T680', licensePlate: 'ABC-1002', capacity: 8000, odometer: 72000, status: 'available' },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'ABC-1003' },
      update: {},
      create: { model: 'Volvo VNL', licensePlate: 'ABC-1003', capacity: 10000, odometer: 120000, status: 'in_shop' },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'ABC-1004' },
      update: {},
      create: { model: 'Peterbilt 579', licensePlate: 'ABC-1004', capacity: 7500, odometer: 32000, status: 'on_trip' },
    }),
    prisma.vehicle.upsert({
      where: { licensePlate: 'ABC-1005' },
      update: {},
      create: { model: 'International LT', licensePlate: 'ABC-1005', capacity: 6000, odometer: 89000, status: 'available' },
    }),
  ]);

  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { licenseNo: 'DL-001' },
      update: {},
      create: { name: 'Chris Driver', licenseNo: 'DL-001', licenseExpiry: new Date('2026-12-31'), safetyScore: 95, status: 'available' },
    }),
    prisma.driver.upsert({
      where: { licenseNo: 'DL-002' },
      update: {},
      create: { name: 'Taylor Smith', licenseNo: 'DL-002', licenseExpiry: new Date('2025-06-15'), safetyScore: 88, status: 'on_trip' },
    }),
    prisma.driver.upsert({
      where: { licenseNo: 'DL-003' },
      update: {},
      create: { name: 'Jamie Lee', licenseNo: 'DL-003', licenseExpiry: new Date('2024-03-01'), safetyScore: 92, status: 'off_duty' },
    }),
    prisma.driver.upsert({
      where: { licenseNo: 'DL-004' },
      update: {},
      create: { name: 'Riley Johnson', licenseNo: 'DL-004', licenseExpiry: new Date('2026-08-20'), safetyScore: 100, status: 'available' },
    }),
  ]);

  const v1 = vehicles[0];
  const v2 = vehicles[1];
  const v3 = vehicles[3];
  const d1 = drivers[0];
  const d2 = drivers[1];

  await prisma.trip.upsert({
    where: { reference: 'TRP-SAMPLE-001' },
    update: {},
    create: {
      reference: 'TRP-SAMPLE-001',
      vehicleId: v1.id,
      driverId: d1.id,
      cargoWeight: 3500,
      origin: 'Warehouse A',
      destination: 'Distribution Center B',
      status: 'completed',
      dispatchedAt: new Date(Date.now() - 86400000 * 2),
      completedAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 5),
    },
  });

  await prisma.trip.upsert({
    where: { reference: 'TRP-SAMPLE-002' },
    update: {},
    create: {
      reference: 'TRP-SAMPLE-002',
      vehicleId: v3.id,
      driverId: d2.id,
      cargoWeight: 6000,
      origin: 'Port City',
      destination: 'Metro Hub',
      status: 'dispatched',
      dispatchedAt: new Date(),
    },
  });

  await prisma.trip.upsert({
    where: { reference: 'TRP-SAMPLE-003' },
    update: {},
    create: {
      reference: 'TRP-SAMPLE-003',
      vehicleId: v2.id,
      driverId: d1.id,
      cargoWeight: 2000,
      origin: 'Depot North',
      destination: 'Retail South',
      status: 'draft',
    },
  });

  const vehicleIds = vehicles.map((v) => v.id);
  await prisma.maintenanceLog.createMany({
    data: [
      { vehicleId: vehicleIds[0], type: 'oil_change', cost: 180, date: new Date(Date.now() - 86400000 * 30) },
      { vehicleId: vehicleIds[1], type: 'tire_rotation', cost: 250, date: new Date(Date.now() - 86400000 * 14) },
      { vehicleId: vehicleIds[2], type: 'brake_repair', cost: 1200, date: new Date(Date.now() - 86400000 * 3) },
      { vehicleId: vehicleIds[0], type: 'inspection', cost: 95, date: new Date(Date.now() - 86400000 * 60) },
    ],
    skipDuplicates: true,
  });

  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: vehicleIds[0], liters: 120, cost: 480, date: new Date(Date.now() - 86400000 * 5), odometerAtFill: 44800 },
      { vehicleId: vehicleIds[1], liters: 150, cost: 600, date: new Date(Date.now() - 86400000 * 2), odometerAtFill: 71800 },
      { vehicleId: vehicleIds[3], liters: 180, cost: 720, date: new Date(Date.now() - 86400000), odometerAtFill: 31800 },
      { vehicleId: vehicleIds[0], liters: 110, cost: 440, date: new Date(Date.now() - 86400000 * 12), odometerAtFill: 43200 },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete:', { users: users.length, vehicles: vehicles.length, drivers: drivers.length });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

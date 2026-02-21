-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('accident', 'damage', 'violation', 'overspeeding', 'late_delivery_risk');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- AlterEnum (add DRIVER to Role)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DRIVER';

-- CreateTable
CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- AlterTable users: add companyId, driverId
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
ADD COLUMN IF NOT EXISTS "driverId" TEXT;

-- AlterTable vehicles: add companyId, latitude, longitude, lastLocationAt
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "lastLocationAt" TIMESTAMP(3);

-- AlterTable drivers: add companyId, complianceApproved, complianceNotes
ALTER TABLE "drivers" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
ADD COLUMN IF NOT EXISTS "complianceApproved" BOOLEAN,
ADD COLUMN IF NOT EXISTS "complianceNotes" TEXT;

-- AlterTable trips: add companyId, tripRevenue, safetyApprovedAt
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "companyId" TEXT,
ADD COLUMN IF NOT EXISTS "tripRevenue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "safetyApprovedAt" TIMESTAMP(3);

-- CreateTable incidents
CREATE TABLE IF NOT EXISTS "incidents" (
    "id" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'medium',
    "vehicleId" TEXT,
    "driverId" TEXT,
    "tripId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "roleTarget" TEXT,
    "companyId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (optional - only if columns were just created; Prisma may have created some)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_companyId_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_driverId_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_companyId_fkey') THEN
    ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drivers_companyId_fkey') THEN
    ALTER TABLE "drivers" ADD CONSTRAINT "drivers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_companyId_fkey') THEN
    ALTER TABLE "trips" ADD CONSTRAINT "trips_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_vehicleId_fkey') THEN
    ALTER TABLE "incidents" ADD CONSTRAINT "incidents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_driverId_fkey') THEN
    ALTER TABLE "incidents" ADD CONSTRAINT "incidents_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_tripId_fkey') THEN
    ALTER TABLE "incidents" ADD CONSTRAINT "incidents_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'incidents_companyId_fkey') THEN
    ALTER TABLE "incidents" ADD CONSTRAINT "incidents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_companyId_fkey') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

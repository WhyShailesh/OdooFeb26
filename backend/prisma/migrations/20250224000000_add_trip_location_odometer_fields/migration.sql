-- Safe migration: add all trip location & odometer fields if missing (no data loss, no reset)
-- Ensures trips table has: startOdometer, endOdometer, distance, originLat, originLng, destinationLat, destinationLng

ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "startOdometer" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "endOdometer" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "distance" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "originLat" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "originLng" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "destinationLat" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "destinationLng" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "routeHistory" JSONB;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "estimatedFuelCost" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "arrivedAt" TIMESTAMP(3);
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);

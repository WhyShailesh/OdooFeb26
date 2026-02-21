-- Add live tracking fields to vehicles (speed km/h, lastUpdated)
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "speed" DOUBLE PRECISION;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "lastUpdated" TIMESTAMP(3);

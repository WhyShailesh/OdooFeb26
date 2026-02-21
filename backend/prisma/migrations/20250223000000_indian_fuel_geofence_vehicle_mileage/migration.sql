-- Indian standards: fuel price by city, trip geofence & timestamps, vehicle mileage/fuelType
-- Add vehicle columns
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "mileage" DOUBLE PRECISION;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "fuelType" TEXT;

-- Add trip columns (destination lat/lng for geofence, route history, timestamps)
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "destinationLat" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "destinationLng" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "routeHistory" JSONB;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "estimatedFuelCost" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "arrivedAt" TIMESTAMP(3);
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);

-- Fuel prices per city (India - admin controlled)
CREATE TABLE IF NOT EXISTS "fuel_prices" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "petrolPrice" DOUBLE PRECISION NOT NULL,
    "dieselPrice" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fuel_prices_city_key" ON "fuel_prices"("city");

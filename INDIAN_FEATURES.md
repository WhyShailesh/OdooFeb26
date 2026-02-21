# FleetFlow — Indian Version & New Features

This document lists changes made to convert and extend FleetFlow for Indian standards **without rebuilding** the project.

---

## 1. Indian Localization

- **Currency:** All amounts use **Indian Rupees (₹)** with Indian number format (e.g. ₹1,00,000).
  - Helpers: `formatINR()`, `formatDateIN()`, `formatDateTimeIST()` in `frontend/src/lib/format.ts`.
- **Dates:** DD-MM-YYYY and IST timezone where applicable.
- **Cities:** Indian cities used for demo/suggestions: Ahmedabad, Mumbai, Delhi, Surat, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Jaipur.
- **Trip origin/destination:** Inputs use a datalist of Indian cities.
- **Vehicle types (India):** Bike, Scooter, Auto, Van, Truck supported; vehicles can have **mileage** (km/L) and **fuelType** (petrol/diesel).

---

## 2. Real-Time Fuel Price (India)

- **Backend:** `FuelPrice` model stores **petrol** and **diesel** price per city.
- **API:**  
  - `GET /api/fuel-price` — list all city prices  
  - `GET /api/fuel-price/:city` — price for one city  
  - `PUT /api/fuel-price` — Manager only: set/update city price (body: `city`, `petrolPrice`, `dieselPrice`).
- **Formula:** Fuel cost = (distance in km / vehicle mileage) × fuel price (₹/L). Trip has optional `estimatedFuelCost`; vehicle has optional `mileage` and `fuelType`.

---

## 3. Automatic Delivery Status (Geo-Fencing)

- **Trip fields:** `destinationLat`, `destinationLng`, `arrivedAt`, `deliveredAt`.
- **Logic:** When driver/vehicle location is within **100 m** of destination, backend sets `deliveredAt` (and `arrivedAt` if not set).
- **Where it runs:** On each driver location update (PATCH `/api/driver/location`) and in the **mock GPS** service (every 5 s for vehicles on trip).
- **Route history:** Trip has `routeHistory` (JSON array of `{ lat, lng, at }`) updated with each location ping.

---

## 4. Real-Time GPS

- **Interval:** Mock GPS runs every **5 seconds** (was 10 s); center is **Ahmedabad** (23.0225, 72.5714).
- **Driver panel:** Driver can PATCH `/api/driver/location` with `latitude`, `longitude`, `vehicleId`; backend updates vehicle position and runs geofence + route history.
- **Live Map:** Frontend **Live Map** page polls `GET /api/vehicles/locations` every 5 s and shows markers (Leaflet, OpenStreetMap).

---

## 5. New / Extended Features

- **Driver performance:** `GET /api/analytics/driver-performance` returns ranking with total deliveries, average delivery time (min), total fuel cost, distance, efficiency score. Shown in **Analytics**.
- **Dashboard:** New metrics: **Delivery success rate** (%), **Today’s profit** (₹), plus existing KPIs. Backend returns `deliverySuccessRate` and `dailyExpenseVsProfit`.
- **Trip create/update:** Optional `destinationLat`, `destinationLng` for geo-fencing; optional `mileage` and `fuelType` on vehicle create/PATCH.

---

## 6. Dark / Light Mode

- **Toggle:** Top-right of dashboard layout (sun/moon icon).
- **Persistence:** Preference saved in **localStorage** (`fleetflow-theme`).
- **Themes:**  
  - Dark: existing black/purple style  
  - Light: clean white/minimal  
- **Implementation:** `ThemeContext`, `data-theme` on `<html>`, CSS variables in `index.css` for both themes.

---

## 7. UI Tweaks (No Full Redesign)

- **Dashboard:** Extra cards for delivery success and today’s profit; grid adjusted for more cards.
- **Live Map:** New sidebar link; full-page map + vehicle list; Indian time in popups.
- **Analytics:** All currency in ₹; “Driver Performance Ranking” table; chart tooltips say “Fuel (₹)” / “Maintenance (₹)”.
- **Fuel / Maintenance:** All costs in ₹; dates in DD-MM-YYYY where used.
- **Trips:** Origin/destination with Indian city suggestions.

---

## 8. Database (Prisma)

- **Migration:** `20250223000000_indian_fuel_geofence_vehicle_mileage/migration.sql` adds:
  - `vehicles`: `mileage`, `fuelType`
  - `trips`: `destinationLat`, `destinationLng`, `routeHistory`, `estimatedFuelCost`, `arrivedAt`, `deliveredAt`
  - New table: `fuel_prices` (id, city, petrolPrice, dieselPrice, updatedAt)
- **Apply:** From `backend`: `npx prisma migrate deploy` (or `migrate dev` if you use dev DB). Then `npx prisma generate` (if client was not generated).

---

## 9. How to Run

1. **Backend:**  
   - Apply migrations and run as before.  
   - Mock GPS and geofence run automatically; no extra config.

2. **Frontend:**  
   - `npm install` (includes `leaflet`, `react-leaflet`, `@types/leaflet`).  
   - `npm run dev` — theme and INR formatting work without env.

3. **Fuel prices:**  
   - Use `PUT /api/fuel-price` (as Manager) to set petrol/diesel price per city, or seed `fuel_prices` manually.

---

## 10. Not Done in This Pass (Optional Next Steps)

- **AI route optimization / traffic:** Not implemented; can be added via external API and a new service.
- **Safety alerts (over-speed, SOS, etc.):** Not implemented; can use existing `notifications` and `incidents` and add rules.
- **Auto expense/earnings per driver:** Driver performance and trip revenue exist; per-driver earnings can be derived from analytics.
- **PDF/CSV export:** Existing analytics export unchanged; already uses backend data (can be switched to INR labels if needed).

All existing features, UI structure, and role-based access are preserved; only extensions and Indian localization were added.

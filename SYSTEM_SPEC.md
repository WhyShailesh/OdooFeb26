# FleetFlow — System Specification

**Version:** 1.0  
**Stack:** Laravel 10, PHP 8.2, MySQL, Blade, Tailwind, Livewire  
**Purpose:** Permanent reference for all future changes to the Fleet Management System.

---

## 1. Objective

Replace manual logbooks with a **centralized, rule-based digital hub** that manages:

- **Vehicle lifecycle** — acquisition, status (available / in use / in shop / out of service), maintenance, fuel, retirement
- **Driver safety** — license validity, assignment rules, status (available / on trip / off duty / suspended)
- **Dispatching** — trip lifecycle (draft → dispatched → completed / cancelled) with consistent vehicle and driver status
- **Financial analytics** — fuel efficiency (km/liters), vehicle ROI (revenue − fuel − maintenance) / acquisition cost

The system must enforce all business rules at the backend and keep vehicle/driver availability **real-time and consistent** without duplicating calculated values in the database.

---

## 2. Roles

| Role | Identifier | Description |
|------|------------|-------------|
| **Fleet Manager** | `fleet_manager` | Full oversight: vehicles, drivers, trips, maintenance, fuel, metrics. |
| **Dispatcher** | `dispatcher` | Create/edit trips, dispatch, complete, cancel. Must respect vehicle/driver availability and rules. |
| **Safety Officer** | `safety_officer` | Focus on driver license validity, maintenance due dates, safety-related views and reports. |
| **Financial Analyst** | `financial_analyst` | Access to revenue, fuel cost, maintenance cost, ROI, fuel efficiency, and related analytics. |

- Every **User** has exactly one **Role**.
- Role-based access is enforced via the `role` middleware (`EnsureUserHasRole`) when applied to routes; all authenticated users share the same pages unless routes are explicitly restricted by role.

---

## 3. Pages

All pages below require authentication unless noted.

| Page | Route(s) | Description |
|------|----------|-------------|
| **Login** | `GET/POST /login` | Email/password; redirect to dashboard when authenticated. |
| **Dashboard** | `GET /dashboard` | Summary: vehicle/driver counts, draft/dispatched trip counts, real-time availability (Livewire), fleet fuel efficiency and ROI summary. |
| **Vehicles – List** | `GET /vehicles` | Paginated list: plate, make/model, year, max capacity, status, trip count; links to show/edit/delete. |
| **Vehicles – Create** | `GET /vehicles/create`, `POST /vehicles` | Form: plate_number, make, model, year, max_capacity_kg, acquisition_cost. |
| **Vehicles – Show** | `GET /vehicles/{vehicle}` | Details, status, fuel efficiency, ROI, recent trips, recent maintenance logs; links to log maintenance/fuel. |
| **Vehicles – Edit** | `GET /vehicles/{vehicle}/edit`, `PUT /vehicles/{vehicle}` | Same fields as create. |
| **Vehicles – Delete** | `DELETE /vehicles/{vehicle}` | Soft/hard delete per implementation; must respect FK constraints. |
| **Drivers – List** | `GET /drivers` | Paginated list: name, license number, expiry, status, trip count; highlight expired license. |
| **Drivers – Create** | `GET /drivers/create`, `POST /drivers` | Form: name, license_number, license_expires_at, phone, email. |
| **Drivers – Show** | `GET /drivers/{driver}` | Details, license status, recent trips. |
| **Drivers – Edit** | `GET /drivers/{driver}/edit`, `PUT /drivers/{driver}` | Same fields as create. |
| **Drivers – Delete** | `DELETE /drivers/{driver}` | Per implementation; respect FK constraints. |
| **Trips – List** | `GET /trips` | Paginated list: route, vehicle, driver, status, scheduled time; link to show/edit (edit only for draft). |
| **Trips – Create** | `GET /trips/create`, `POST /trips` | Draft trip: vehicle_id, driver_id, origin, destination, distance_km, cargo_weight_kg, revenue, scheduled_at, notes. Only available vehicles and license-valid drivers in dropdowns. |
| **Trips – Show** | `GET /trips/{trip}` | Full trip details; actions: Edit (draft), Dispatch (draft), Complete (dispatched), Cancel (draft or dispatched). Linked fuel logs. |
| **Trips – Edit** | `GET /trips/{trip}/edit`, `PUT /trips/{trip}` | Allowed only when status = DRAFT; same fields as create. |
| **Trip – Dispatch** | `POST /trips/{trip}/dispatch` | Transition DRAFT → DISPATCHED; cascade vehicle → IN_USE, driver → ON_TRIP. |
| **Trip – Complete** | `POST /trips/{trip}/complete` | Transition DISPATCHED → COMPLETED; cascade vehicle/driver → AVAILABLE. |
| **Trip – Cancel** | `POST /trips/{trip}/cancel` | Transition DRAFT or DISPATCHED → CANCELLED; if was DISPATCHED, set vehicle/driver → AVAILABLE. |
| **Maintenance – List** | `GET /maintenance` | Paginated list: vehicle, type, performed_at, cost; link to show. |
| **Maintenance – Create** | `GET /maintenance/create`, `POST /maintenance` | Form: vehicle_id, type, description, cost, performed_at, due_at, vendor. On create, vehicle status → IN_SHOP. |
| **Maintenance – Show** | `GET /maintenance/{maintenance}` | Single log details. |
| **Fuel – List** | `GET /fuel` | Paginated list: vehicle, fueled_at, liters, cost, linked trip. |
| **Fuel – Create** | `GET /fuel/create`, `POST /fuel` | Form: vehicle_id, trip_id (optional), liters, cost_per_liter, odometer_km, fueled_at, station. |
| **Fuel – Show** | `GET /fuel/{fuel}` | Single fuel log details. |
| **Logout** | `POST /logout` | Invalidate session; redirect to login. |

---

## 4. Business Rules

### 4.1 Trips

- **Cargo vs capacity:** For create and update, `cargo_weight_kg` must be ≤ vehicle `max_capacity_kg`. If not, reject with a clear error (backend only; optional client-side validation).
- **Trip status lifecycle:** Only the following transitions are allowed:
  - **DRAFT** → DISPATCHED, or DRAFT → CANCELLED
  - **DISPATCHED** → COMPLETED, or DISPATCHED → CANCELLED
  - **COMPLETED** and **CANCELLED** are terminal (no further transitions).
- **Dispatch rules:** Dispatch is allowed only when:
  - Trip status is DRAFT.
  - Driver license is not expired (`license_expires_at > now()`).
- **Status cascade (on dispatch):** Trip → DISPATCHED; assigned Vehicle → IN_USE; assigned Driver → ON_TRIP.
- **Status cascade (on complete):** Trip → COMPLETED; Vehicle → AVAILABLE; Driver → AVAILABLE.
- **Status cascade (on cancel):** Trip → CANCELLED; if trip was DISPATCHED, Vehicle → AVAILABLE and Driver → AVAILABLE.

### 4.2 Drivers

- **Assignment rule:** A driver with an expired license must not be assigned to a new trip (block at dispatch; optionally hide or flag in trip create/edit).
- **License expiry:** Determined by `license_expires_at` (date); expired if `license_expires_at <= today`.

### 4.3 Vehicles

- **Maintenance log effect:** Creating a maintenance log for a vehicle must set that vehicle’s status to **IN_SHOP** (no separate “maintenance status” field; status is the single source of truth).
- **Status values:** AVAILABLE, IN_USE, IN_SHOP, OUT_OF_SERVICE. Only these enum values may be stored.

### 4.4 Metrics (no stored duplicates)

- **Fuel efficiency:** Computed as **km / liters** (e.g. per vehicle over a period, using trip distances and fuel log liters). Not stored; calculated on demand.
- **Vehicle ROI:** Computed as **(revenue − fuel_cost − maintenance_cost) / acquisition_cost**. Revenue from completed trips; fuel and maintenance from logs. Not stored; calculated on demand.

### 4.5 Consistency

- Vehicle and driver availability must be **derived from current data** (status, license_expires_at, trip state). No separate “available” cache that can drift; use scopes/queries and services as the single source of truth.

---

## 5. Non-Negotiable Architecture Constraints

These constraints must be respected by all current and future changes.

### 5.1 Business logic in services

- **All business rules live in Service classes**, not in Controllers or Models (beyond simple attribute rules and scopes).
- Controllers must: validate input, call Services, return redirects/views/JSON. Controllers must **not** contain:
  - Validation of cargo vs capacity
  - Trip status transition logic
  - Vehicle/driver status updates
  - License expiry checks for assignment
  - ROI or fuel-efficiency calculations
- Recommended service layer: `TripService`, `DispatchService`, `DriverService`, `VehicleService`, `MaintenanceService`, `MetricsService` (or equivalent names). New rules = new or updated methods in the appropriate service.

### 5.2 Real-time, consistent availability

- **Vehicle and driver availability** must be **real-time and consistent**:
  - Availability is determined by current status (and, for drivers, license validity), not by a duplicated “is_available” or similar field.
  - Use Eloquent scopes (e.g. `available()`, `licenseValid()`) and service methods so that availability is always derived from the same source of truth.

### 5.3 Invalid states blocked at backend

- **Invalid states must be blocked at the backend**, regardless of UI:
  - Cargo weight > vehicle max capacity → reject trip create/update.
  - Driver license expired → reject dispatch (and optionally trip create/update if driver is selected).
  - Invalid trip status transitions → reject (e.g. COMPLETED → DISPATCHED).
- Return clear, safe error messages (no stack traces to end users); use validation or domain exceptions and map them to HTTP responses in the application layer.

### 5.4 No duplicated calculated values

- **Do not store duplicated calculated values** for:
  - Fuel efficiency (km/liters)
  - Vehicle ROI
  - “Available” counts or flags that can be derived from status and license
- These must be **computed on demand** (e.g. in `MetricsService` or equivalent). Caching for performance is allowed only if it is clearly invalidated when source data changes.

### 5.5 Enums for statuses

- **Use PHP 8.2 (or later) backed enums** for all status-like fields:
  - Trip: e.g. `TripStatus` (DRAFT, DISPATCHED, COMPLETED, CANCELLED).
  - Vehicle: e.g. `VehicleStatus` (AVAILABLE, IN_USE, IN_SHOP, OUT_OF_SERVICE).
  - Driver: e.g. `DriverStatus` (AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED).
  - Role: e.g. `RoleName` (FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER, FINANCIAL_ANALYST).
- Store enum **values** (e.g. strings) in the database; use enum **types** in application code. Transition rules (e.g. allowed next statuses) should live in the enum or the service layer, not in controllers.

### 5.6 Transactions for dispatching

- **All dispatching logic that changes trip + vehicle + driver** must run inside a **database transaction**:
  - Dispatch: set trip DISPATCHED, vehicle IN_USE, driver ON_TRIP in one transaction.
  - Complete: set trip COMPLETED, vehicle AVAILABLE, driver AVAILABLE in one transaction.
  - Cancel (when was DISPATCHED): set trip CANCELLED, vehicle AVAILABLE, driver AVAILABLE in one transaction.
- This ensures no partial updates (e.g. trip dispatched but vehicle still “available”).

### 5.7 Thin controllers

- Controllers remain **thin**: validate request, call one or more services, return response. No business conditionals (e.g. “if cargo > max then …”) in controllers; those belong in services.

### 5.8 Tech stack (reference)

- **Laravel 10**, **PHP 8.2**, **MySQL** for the backend.
- **Blade** for server-rendered views.
- **Tailwind** for styling (CDN or build as per project setup).
- **Livewire** for real-time or interactive UI (e.g. dashboard availability) where appropriate.

---

## 6. Core Entities (reference)

| Entity | Purpose |
|--------|--------|
| **User** | Authentication; belongs to one Role. |
| **Role** | Name (enum); has many Users. |
| **Vehicle** | Plate, make, model, year, max_capacity_kg, acquisition_cost, status (enum). |
| **Driver** | Name, license_number, license_expires_at, status (enum), contact info. |
| **Trip** | vehicle_id, driver_id, status (enum), origin, destination, distance_km, cargo_weight_kg, revenue, scheduled_at, started_at, completed_at, notes. |
| **MaintenanceLog** | vehicle_id, type, description, cost, performed_at, due_at, vendor. |
| **FuelLog** | vehicle_id, trip_id (nullable), liters, cost_per_liter, odometer_km, fueled_at, station. |

---

*This document is the single source of truth for system behavior and architecture. When adding or changing features, update this spec and ensure implementation adheres to it.*

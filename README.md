# FleetFlow — Fleet & Logistics Management System

A modern, full-stack **Fleet & Logistics Management System** with a premium dark UI, glassmorphism, and role-based access.

## Tech Stack

| Layer    | Stack |
|----------|--------|
| Frontend | React 18, TypeScript, TailwindCSS, ShadCN-style UI (Radix), Recharts |
| Backend  | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Auth     | JWT, role-based (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) |

## Features

- **Authentication** — Login/Register, JWT, 4 roles
- **Command Center (Dashboard)** — Active fleet, maintenance alerts, utilization, pending cargo, charts
- **Vehicle Registry** — CRUD, status (available, on_trip, in_shop, retired), unique license plate
- **Driver Management** — CRUD, license expiry, safety score; trip assignment blocked if license expired
- **Trip Dispatch** — Lifecycle: Draft → Dispatched → Completed/Cancelled; validations (cargo ≤ capacity, vehicle/driver available)
- **Maintenance** — Logs (vehicle, type, cost, date); vehicle auto set to `in_shop`
- **Fuel & Expense** — Liters, cost, vehicle, date; operational cost per vehicle
- **Analytics** — Fuel efficiency, ROI/cost per km, charts; CSV and PDF export

## Project Structure

```
fleetflow/
├── backend/           # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       └── index.ts
├── frontend/          # React + Vite app
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── pages/
│       └── lib/
├── SETUP.md           # Setup instructions
└── README.md
```

## Quick Start

1. **Setup** — See [SETUP.md](./SETUP.md) for database, env, and seed steps.
2. **Run backend**: `cd backend && npm run dev`
3. **Run frontend**: `cd frontend && npm run dev`
4. **Login** — Use `dispatcher@fleetflow.com` / `password123` (or any seeded user).

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| POST   | /api/auth/register | Register |
| POST   | /api/auth/login    | Login |
| GET    | /api/auth/me       | Current user (Bearer token) |
| GET    | /api/dashboard    | Dashboard metrics |
| CRUD   | /api/vehicles      | Vehicles |
| CRUD   | /api/drivers      | Drivers |
| CRUD   | /api/trips        | Trips (+ dispatch, complete, cancel) |
| CRUD   | /api/maintenance  | Maintenance logs |
| CRUD   | /api/fuel         | Fuel logs |
| GET    | /api/analytics/summary | Analytics summary |
| GET    | /api/analytics/export/csv | Export CSV |
| GET    | /api/analytics/export/pdf | Export PDF |

All routes except `/api/auth/*` and `/api/health` require `Authorization: Bearer <token>`.



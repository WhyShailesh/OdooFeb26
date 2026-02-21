# FleetFlow — Setup Guide

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- Git

## 1. Clone & Install

```bash
cd fleetflow
```

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## 2. Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE fleetflow;
```

2. Create a `.env` file in the `backend` folder:

```bash
cd backend
cp .env.example .env
```

3. Edit `backend/.env` and set your database URL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fleetflow?schema=public"
PORT=4000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

4. Generate Prisma client and push schema:

```bash
cd backend
npm run db:generate
npm run db:push
```

5. Seed sample data (optional but recommended):

```bash
npm run db:seed
```

This creates:

- **Users** (login with any):
  - `manager@fleetflow.com` / `password123` (Fleet Manager)
  - `dispatcher@fleetflow.com` / `password123` (Dispatcher)
  - `safety@fleetflow.com` / `password123` (Safety Officer)
  - `finance@fleetflow.com` / `password123` (Financial Analyst)
- Vehicles, drivers, sample trips, maintenance logs, fuel logs

## 3. Run the Application

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

API runs at **http://localhost:4000**

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

App runs at **http://localhost:5173**

The frontend is configured to proxy `/api` to the backend when using the dev server.

## 4. Production Build

### Backend

```bash
cd backend
npm run build
npm start
```

Set `NODE_ENV=production` and use a strong `JWT_SECRET`.

### Frontend

```bash
cd frontend
npm run build
```

Serve the `dist` folder with any static host. Set your API base URL (e.g. `VITE_API_URL`) if the API is on a different origin.

## Troubleshooting

- **Database connection failed**: Check `DATABASE_URL`, PostgreSQL is running, and the database exists.
- **401 on API**: Ensure you are logged in and the token is sent (frontend stores it in `localStorage`).
- **CORS**: In production, set `FRONTEND_URL` on the backend to your frontend origin.

import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { vehiclesRouter } from './routes/vehicles.js';
import { driversRouter } from './routes/drivers.js';
import { tripsRouter } from './routes/trips.js';
import { maintenanceRouter } from './routes/maintenance.js';
import { fuelRouter } from './routes/fuel.js';
import { analyticsRouter } from './routes/analytics.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);
app.use('/api/vehicles', authMiddleware, vehiclesRouter);
app.use('/api/drivers', authMiddleware, driversRouter);
app.use('/api/trips', authMiddleware, tripsRouter);
app.use('/api/maintenance', authMiddleware, maintenanceRouter);
app.use('/api/fuel', authMiddleware, fuelRouter);
app.use('/api/analytics', authMiddleware, analyticsRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'FleetFlow API' }));

app.listen(PORT, () => {
  console.log(`FleetFlow API running at http://localhost:${PORT}`);
});

import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { roleMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { CAN_VIEW_FINANCE, FLEET_MANAGER } from '../config/roles.js';

const router = Router();
const prisma = new PrismaClient();

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// Indian cities for fuel price (admin-controlled; fallback when no live API)
export const INDIAN_CITIES = ['Ahmedabad', 'Mumbai', 'Delhi', 'Surat', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur'];

// GET all fuel prices (for dropdowns and display)
router.get('/', async (_req, res) => {
  const prices = await prisma.fuelPrice.findMany({ orderBy: { city: 'asc' } });
  res.json(prices);
});

// GET by city
router.get('/:city', param('city').trim().notEmpty(), validate, async (req, res) => {
  const city = decodeURIComponent(req.params.city);
  const price = await prisma.fuelPrice.findUnique({ where: { city } });
  if (!price) return res.status(404).json({ error: 'Fuel price not found for this city' });
  res.json(price);
});

// Manager: set fuel price for a city (upsert)
router.put(
  '/',
  roleMiddleware(FLEET_MANAGER),
  [
    body('city').trim().notEmpty(),
    body('petrolPrice').isFloat({ min: 0 }),
    body('dieselPrice').isFloat({ min: 0 }),
  ],
  validate,
  async (req: AuthRequest, res) => {
    const { city, petrolPrice, dieselPrice } = req.body;
    const price = await prisma.fuelPrice.upsert({
      where: { city },
      create: { city, petrolPrice, dieselPrice, updatedAt: new Date() },
      update: { petrolPrice, dieselPrice, updatedAt: new Date() },
    });
    res.json(price);
  }
);

export { router as fuelPriceRouter };

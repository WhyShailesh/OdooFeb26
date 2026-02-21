import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

function companyWhere(req: AuthRequest) {
  return req.user?.companyId ? { companyId: req.user.companyId } : {};
}

async function ruleBasedAnswer(message: string, req: AuthRequest): Promise<string> {
  const where = companyWhere(req);
  const lower = message.toLowerCase().trim();

  if (/\b(profit|profitable|revenue|earning)\b/.test(lower)) {
    const vehicles = await prisma.vehicle.findMany({
      where: { ...where },
      include: { trips: { where: { status: 'completed' } }, fuelLogs: true, maintenanceLogs: true },
    });
    const withProfit = vehicles.map((v) => {
      const rev = v.trips.reduce((s, t) => s + (t.tripRevenue ?? 0), 0);
      const cost = v.fuelLogs.reduce((s, f) => s + f.cost, 0) + v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
      return { name: v.model, plate: v.licensePlate, profit: rev - cost };
    }).filter((x) => x.profit > 0).sort((a, b) => b.profit - a.profit);
    const top = withProfit[0];
    if (top) return `${top.name} (${top.plate}) generated the highest profit this month: ₹${Math.round(top.profit).toLocaleString('en-IN')}.`;
    return 'No profit data available for vehicles yet.';
  }

  if (/\b(cost|expense|expensive|spending)\b/.test(lower)) {
    const vehicles = await prisma.vehicle.findMany({
      where: { ...where },
      include: { fuelLogs: true, maintenanceLogs: true },
    });
    const withCost = vehicles.map((v) => ({
      name: v.model,
      plate: v.licensePlate,
      cost: v.fuelLogs.reduce((s, f) => s + f.cost, 0) + v.maintenanceLogs.reduce((s, m) => s + m.cost, 0),
    })).sort((a, b) => b.cost - a.cost);
    const top = withCost[0];
    if (top && top.cost > 0) return `Highest expense vehicle: ${top.name} (${top.plate}) with total cost ₹${Math.round(top.cost).toLocaleString('en-IN')}.`;
    return 'No expense data available yet.';
  }

  if (/\b(driver|drivers)\b/.test(lower)) {
    const drivers = await prisma.driver.findMany({
      where,
      include: { trips: { where: { status: 'completed' } } },
    });
    const unsafe = drivers.filter((d) => d.complianceApproved === false || d.status === 'suspended');
    if (/\b(unsafe|bad|suspended)\b/.test(lower) && unsafe.length > 0) {
      return `Unsafe or suspended drivers: ${unsafe.map((d) => d.name).join(', ')}.`;
    }
    const withTrips = drivers.map((d) => ({ name: d.name, count: d.trips.length })).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
    const best = withTrips[0];
    if (best) return `Best performing driver by deliveries: ${best.name} with ${best.count} completed trips.`;
    return 'No driver trip data available yet.';
  }

  if (/\b(maintenance|in.?shop|repair)\b/.test(lower)) {
    const vehicles = await prisma.vehicle.findMany({
      where: { ...where, status: 'in_shop' },
      select: { model: true, licensePlate: true },
    });
    if (vehicles.length === 0) return 'No vehicles currently in maintenance.';
    return `Vehicles in maintenance: ${vehicles.map((v) => `${v.model} (${v.licensePlate})`).join(', ')}.`;
  }

  if (/\b(fuel|efficiency|mileage)\b/.test(lower)) {
    const vehicles = await prisma.vehicle.findMany({
      where: { ...where },
      include: { fuelLogs: true, trips: { where: { status: 'completed' } } },
    });
    const withEff = vehicles.map((v) => {
      const km = v.trips.reduce((s, t) => s + (t.distance ?? 0), 0);
      const liters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
      const eff = liters > 0 ? km / liters : 0;
      return { name: v.model, plate: v.licensePlate, efficiency: eff };
    }).filter((x) => x.efficiency > 0).sort((a, b) => a.efficiency - b.efficiency);
    const low = withEff[0];
    if (low) return `Lowest fuel efficiency: ${low.name} (${low.plate}) at ${low.efficiency.toFixed(1)} km/L.`;
    return 'No fuel efficiency data available yet.';
  }

  if (/\b(trip|trips|active|dispatch)\b/.test(lower)) {
    const active = await prisma.trip.count({ where: { ...where, status: { in: ['draft', 'dispatched'] } } });
    const completed = await prisma.trip.count({ where: { ...where, status: 'completed' } });
    return `Active trips (draft + dispatched): ${active}. Completed trips so far: ${completed}.`;
  }

  return 'I can answer about profit, cost, drivers, maintenance, fuel efficiency, or active trips. Try asking e.g. "Which vehicle has highest profit?" or "Vehicles in maintenance?".';
}

router.post(
  '/query',
  body('message').trim().notEmpty().withMessage('message is required'),
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const message = req.body.message as string;
      let reply: string;
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: 'You are a FleetFlow fleet assistant. Answer briefly about fleet profit, costs, drivers, maintenance, fuel, or trips. Use Indian Rupee (₹) when mentioning money.' },
                { role: 'user', content: message },
              ],
              max_tokens: 150,
            }),
          });
          const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
          reply = data.choices?.[0]?.message?.content?.trim() ?? await ruleBasedAnswer(message, req);
        } catch {
          reply = await ruleBasedAnswer(message, req);
        }
      } else {
        reply = await ruleBasedAnswer(message, req);
      }
      res.json({ reply });
    } catch (e) {
      console.error('AI query error:', e);
      res.status(500).json({ error: 'AI request failed' });
    }
  }
);

export { router as aiRouter };

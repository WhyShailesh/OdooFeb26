<?php

namespace App\Services;

use App\Models\Vehicle;
use App\Models\Trip;
use App\Models\FuelLog;
use App\Models\MaintenanceLog;
use Illuminate\Support\Collection;

class MetricsService
{
    /**
     * Fuel efficiency = km / liters (for a vehicle over a period, or per trip when trip_id is set).
     * Returns km per liter; no duplicated stored value, calculated on demand.
     */
    public function fuelEfficiencyKmPerLiter(Vehicle $vehicle, ?\DateTimeInterface $from = null, ?\DateTimeInterface $to = null): ?float
    {
        $query = FuelLog::where('vehicle_id', $vehicle->id);
        if ($from) {
            $query->where('fueled_at', '>=', $from);
        }
        if ($to) {
            $query->where('fueled_at', '<=', $to);
        }
        $logs = $query->orderBy('fueled_at')->get();

        if ($logs->isEmpty() || $logs->sum('liters') <= 0) {
            return null;
        }

        // Use odometer delta if available for accuracy; else sum trip distances for linked trips
        $totalKm = 0.0;
        $totalLiters = (float) $logs->sum('liters');

        foreach ($logs as $log) {
            if ($log->trip_id && $log->trip) {
                $totalKm += (float) $log->trip->distance_km;
            }
        }

        if ($totalKm <= 0) {
            // Fallback: use odometer difference between first and last if present
            $withOdo = $logs->filter(fn ($l) => $l->odometer_km !== null);
            if ($withOdo->count() >= 2) {
                $first = $withOdo->first()->odometer_km;
                $last = $withOdo->last()->odometer_km;
                $totalKm = (float) ($last - $first);
            }
        }

        if ($totalKm <= 0) {
            return null;
        }

        return round($totalKm / $totalLiters, 2);
    }

    /**
     * Vehicle ROI = (revenue - (fuel + maintenance)) / acquisition_cost.
     * Revenue from completed trips; fuel/maintenance from logs. No stored duplicate.
     */
    public function vehicleROI(Vehicle $vehicle): ?float
    {
        $acquisitionCost = (float) $vehicle->acquisition_cost;
        if ($acquisitionCost <= 0) {
            return null;
        }

        $revenue = (float) Trip::where('vehicle_id', $vehicle->id)
            ->where('status', 'completed')
            ->sum('revenue');

        $fuelCost = (float) FuelLog::where('vehicle_id', $vehicle->id)->get()->sum('total_cost');
        $maintenanceCost = (float) MaintenanceLog::where('vehicle_id', $vehicle->id)->sum('cost');

        $net = $revenue - ($fuelCost + $maintenanceCost);
        return round($net / $acquisitionCost, 4);
    }

    /**
     * Fleet-wide fuel efficiency (all vehicles).
     */
    public function fleetFuelEfficiency(?\DateTimeInterface $from = null, ?\DateTimeInterface $to = null): Collection
    {
        return Vehicle::all()->mapWithKeys(function (Vehicle $v) use ($from, $to) {
            return [$v->id => $this->fuelEfficiencyKmPerLiter($v, $from, $to)];
        });
    }

    /**
     * Fleet-wide ROI (all vehicles).
     */
    public function fleetROI(): Collection
    {
        return Vehicle::all()->mapWithKeys(function (Vehicle $v) {
            return [$v->id => $this->vehicleROI($v)];
        });
    }
}

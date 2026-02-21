<?php

namespace App\Services;

use App\Enums\TripStatus;
use App\Enums\VehicleStatus;
use App\Models\Driver;
use App\Models\FuelLog;
use App\Models\MaintenanceLog;
use App\Models\Trip;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Dashboard metrics. All values computed on demand; no stored duplicates (SYSTEM_SPEC §4.4, §5.4).
 */
class DashboardMetricsService
{
    /** Days ahead to consider maintenance "due soon". */
    private const MAINTENANCE_DUE_SOON_DAYS = 7;

    public function __construct(
        protected DriverAvailabilityService $driverAvailabilityService
    ) {}

    /**
     * Counts and summaries for dashboard: vehicle/driver counts, draft/dispatched trips,
     * real-time availability, fleet fuel efficiency and ROI (SYSTEM_SPEC §3 Dashboard).
     * KPIs: active_fleet, maintenance_alerts, utilization_rate, pending_trips.
     * Uses aggregated queries to avoid N+1.
     */
    public function getDashboardMetrics(): array
    {
        $vehicleCounts = $this->getVehicleCountsByStatus();
        $tripCounts = $this->getTripCountsByStatus();

        $totalVehicles = $vehicleCounts['total'];
        $inUse = $vehicleCounts['in_use'];
        $outOfService = $vehicleCounts['out_of_service'];

        return [
            'vehicle_count' => $totalVehicles,
            'driver_count' => Driver::count(),
            'trip_draft_count' => $tripCounts['draft'],
            'trip_dispatched_count' => $tripCounts['dispatched'],
            'available_vehicle_count' => $vehicleCounts['available'],
            'available_driver_count' => $this->driverAvailabilityService->assignableDriversQuery()->count(),
            'fleet_fuel_efficiency' => $this->fleetFuelEfficiencySummary(),
            'fleet_roi' => $this->fleetROISummary(),
            // KPIs
            'active_fleet' => $totalVehicles - $outOfService,
            'maintenance_alerts' => $this->getMaintenanceAlerts(),
            'utilization_rate' => $totalVehicles > 0 ? round(($inUse / $totalVehicles) * 100, 1) : null,
            'pending_trips' => $tripCounts['draft'] + $tripCounts['dispatched'],
        ];
    }

    /**
     * Single query: vehicle counts by status (total, available, in_use, in_shop, out_of_service).
     */
    private function getVehicleCountsByStatus(): array
    {
        $av = VehicleStatus::AVAILABLE->value;
        $iu = VehicleStatus::IN_USE->value;
        $is = VehicleStatus::IN_SHOP->value;
        $oo = VehicleStatus::OUT_OF_SERVICE->value;

        $row = Vehicle::query()
            ->selectRaw(
                "count(*) as total, " .
                "sum(case when status = ? then 1 else 0 end) as available, " .
                "sum(case when status = ? then 1 else 0 end) as in_use, " .
                "sum(case when status = ? then 1 else 0 end) as in_shop, " .
                "sum(case when status = ? then 1 else 0 end) as out_of_service",
                [$av, $iu, $is, $oo]
            )
            ->first();

        return [
            'total' => (int) ($row?->total ?? 0),
            'available' => (int) ($row?->available ?? 0),
            'in_use' => (int) ($row?->in_use ?? 0),
            'in_shop' => (int) ($row?->in_shop ?? 0),
            'out_of_service' => (int) ($row?->out_of_service ?? 0),
        ];
    }

    /**
     * Single query: trip counts by status (draft, dispatched).
     */
    private function getTripCountsByStatus(): array
    {
        $draft = TripStatus::DRAFT->value;
        $disp = TripStatus::DISPATCHED->value;

        $row = Trip::query()
            ->selectRaw(
                "sum(case when status = ? then 1 else 0 end) as draft, " .
                "sum(case when status = ? then 1 else 0 end) as dispatched",
                [$draft, $disp]
            )
            ->first();

        return [
            'draft' => (int) ($row?->draft ?? 0),
            'dispatched' => (int) ($row?->dispatched ?? 0),
        ];
    }

    /**
     * Maintenance alerts: overdue (due_at < today) and due soon (due_at in next N days). Single query.
     */
    private function getMaintenanceAlerts(): array
    {
        $today = Carbon::today()->toDateString();
        $dueSoonEnd = Carbon::today()->addDays(self::MAINTENANCE_DUE_SOON_DAYS)->toDateString();

        $row = MaintenanceLog::query()
            ->whereNotNull('due_at')
            ->selectRaw(
                "sum(case when due_at < ? then 1 else 0 end) as overdue, " .
                "sum(case when due_at >= ? and due_at <= ? then 1 else 0 end) as due_soon",
                [$today, $today, $dueSoonEnd]
            )
            ->first();

        $overdue = (int) ($row?->overdue ?? 0);
        $dueSoon = (int) ($row?->due_soon ?? 0);

        return [
            'overdue' => $overdue,
            'due_soon' => $dueSoon,
            'total' => $overdue + $dueSoon,
        ];
    }

    /**
     * Fuel efficiency = km / liters per vehicle; not stored (SYSTEM_SPEC §4.4).
     */
    public function vehicleFuelEfficiencyKmPerLiter(Vehicle $vehicle, ?\DateTimeInterface $from = null, ?\DateTimeInterface $to = null): ?float
    {
        $query = FuelLog::where('vehicle_id', $vehicle->id);
        if ($from) {
            $query->where('fueled_at', '>=', $from);
        }
        if ($to) {
            $query->where('fueled_at', '<=', $to);
        }
        $logs = $query->orderBy('fueled_at')->with('trip')->get();

        if ($logs->isEmpty()) {
            return null;
        }

        $totalLiters = (float) $logs->sum('liters');
        if ($totalLiters <= 0) {
            return null;
        }

        $totalKm = 0.0;
        foreach ($logs as $log) {
            if ($log->trip_id && $log->trip) {
                $totalKm += (float) $log->trip->distance_km;
            }
        }
        if ($totalKm <= 0) {
            $withOdo = $logs->filter(fn ($l) => $l->odometer_km !== null);
            if ($withOdo->count() >= 2) {
                $first = (float) $withOdo->first()->odometer_km;
                $last = (float) $withOdo->last()->odometer_km;
                $totalKm = $last - $first;
            }
        }
        if ($totalKm <= 0) {
            return null;
        }

        return round($totalKm / $totalLiters, 2);
    }

    /**
     * Vehicle ROI = (revenue - fuel_cost - maintenance_cost) / acquisition_cost (SYSTEM_SPEC §4.4). Not stored.
     */
    public function vehicleROI(Vehicle $vehicle): ?float
    {
        $acquisitionCost = (float) $vehicle->acquisition_cost;
        if ($acquisitionCost <= 0) {
            return null;
        }

        $revenue = (float) Trip::where('vehicle_id', $vehicle->id)
            ->where('status', TripStatus::COMPLETED)
            ->sum('revenue');

        $fuelCost = $this->totalFuelCostForVehicle($vehicle);
        $maintenanceCost = (float) MaintenanceLog::where('vehicle_id', $vehicle->id)->sum('cost');
        $net = $revenue - ($fuelCost + $maintenanceCost);

        return round($net / $acquisitionCost, 4);
    }

    /**
     * Fleet fuel efficiency summary: per-vehicle km/liter (computed on demand).
     */
    public function fleetFuelEfficiencySummary(): Collection
    {
        return Vehicle::all()->mapWithKeys(function (Vehicle $v) {
            return [$v->id => $this->vehicleFuelEfficiencyKmPerLiter($v)];
        });
    }

    /**
     * Fleet ROI summary: per-vehicle ROI (computed on demand).
     */
    public function fleetROISummary(): Collection
    {
        return Vehicle::all()->mapWithKeys(function (Vehicle $v) {
            return [$v->id => $this->vehicleROI($v)];
        });
    }

    /**
     * Total fuel cost for a vehicle: sum(liters * cost_per_liter). No stored total (SYSTEM_SPEC §5.4).
     */
    private function totalFuelCostForVehicle(Vehicle $vehicle): float
    {
        return (float) FuelLog::where('vehicle_id', $vehicle->id)
            ->get()
            ->sum(fn ($log) => (float) $log->liters * (float) $log->cost_per_liter);
    }
}

<?php

namespace App\Services;

use App\Models\Vehicle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class VehicleService
{
    public function __construct(
        protected DashboardMetricsService $dashboardMetricsService
    ) {}

    public function listPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return Vehicle::withCount(['trips', 'maintenanceLogs'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Data for vehicle show view: vehicle with relations, fuel efficiency, ROI.
     */
    public function getForShow(Vehicle $vehicle): array
    {
        $vehicle->load([
            'trips' => fn ($q) => $q->latest()->limit(10),
            'maintenanceLogs',
            'fuelLogs',
        ]);

        return [
            'vehicle' => $vehicle,
            'fuelEfficiency' => $this->dashboardMetricsService->vehicleFuelEfficiencyKmPerLiter($vehicle),
            'roi' => $this->dashboardMetricsService->vehicleROI($vehicle),
        ];
    }

    public function getAvailableForSelect(): Collection
    {
        return Vehicle::available()->orderBy('plate_number')->get();
    }

    public function create(array $data): Vehicle
    {
        $data['acquisition_cost'] = $data['acquisition_cost'] ?? 0;
        return Vehicle::create($data);
    }

    public function update(Vehicle $vehicle, array $data): Vehicle
    {
        $vehicle->update($data);
        return $vehicle->fresh();
    }

    public function delete(Vehicle $vehicle): void
    {
        $vehicle->delete();
    }
}

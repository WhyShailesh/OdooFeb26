<?php

namespace App\Services;

use App\Enums\TripStatus;
use App\Models\FuelLog;
use App\Models\Trip;
use App\Models\Vehicle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class FuelLogService
{
    public function listPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return FuelLog::with(['vehicle', 'trip'])->latest('fueled_at')->paginate($perPage);
    }

    /**
     * Data for fuel log show view.
     */
    public function getForShow(FuelLog $log): array
    {
        $log->load(['vehicle', 'trip']);
        return ['log' => $log];
    }

    public function getVehiclesForSelect(): Collection
    {
        return Vehicle::orderBy('plate_number')->get();
    }

    /**
     * Trips that can be linked to a fuel log (dispatched or completed).
     */
    public function getTripsForSelect(int $limit = 50): Collection
    {
        return Trip::whereIn('status', [TripStatus::DISPATCHED, TripStatus::COMPLETED])
            ->with('vehicle')
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function create(array $data): FuelLog
    {
        $data['cost_per_liter'] = $data['cost_per_liter'] ?? 0;
        return FuelLog::create($data);
    }
}

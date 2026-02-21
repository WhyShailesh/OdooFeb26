<?php

namespace App\Services;

use App\Enums\TripStatus;
use App\Exceptions\TripDispatchException;
use App\Models\Trip;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TripService
{
    public function listPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return Trip::with(['vehicle', 'driver'])
            ->latest('scheduled_at')
            ->paginate($perPage);
    }

    /**
     * Data for trip show view: trip with vehicle, driver, fuel logs.
     */
    public function getForShow(Trip $trip): array
    {
        $trip->load(['vehicle', 'driver', 'fuelLogs']);

        return ['trip' => $trip];
    }

    /**
     * Throws if trip is not in DRAFT (for edit/update). Enforces business rule in service.
     */
    public function ensureCanEdit(Trip $trip): void
    {
        if ($trip->status !== TripStatus::DRAFT) {
            throw new TripDispatchException('Only draft trips can be edited.');
        }
    }
}

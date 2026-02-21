<?php

namespace App\Services;

use App\Models\Driver;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DriverService
{
    public function listPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return Driver::withCount('trips')->latest()->paginate($perPage);
    }

    /**
     * Data for driver show view: driver with recent trips.
     */
    public function getForShow(Driver $driver): array
    {
        $driver->load(['trips' => fn ($q) => $q->latest()->limit(15)]);

        return ['driver' => $driver];
    }

    public function create(array $data): Driver
    {
        return Driver::create($data);
    }

    public function update(Driver $driver, array $data): Driver
    {
        $driver->update($data);
        return $driver->fresh();
    }

    public function delete(Driver $driver): void
    {
        $driver->delete();
    }
}

<?php

namespace App\Services;

use App\Models\MaintenanceLog;
use App\Models\Vehicle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MaintenanceService
{
    public function __construct(
        protected VehicleStatusService $vehicleStatusService
    ) {}

    public function listPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return MaintenanceLog::with('vehicle')->latest('performed_at')->paginate($perPage);
    }

    /**
     * Data for maintenance show view.
     */
    public function getForShow(MaintenanceLog $log): array
    {
        $log->load('vehicle');
        return ['log' => $log];
    }

    public function getVehiclesForSelect(): Collection
    {
        return Vehicle::orderBy('plate_number')->get();
    }

    /**
     * Create maintenance log and set vehicle status to IN_SHOP (SYSTEM_SPEC §4.3). Uses transaction.
     */
    public function createLog(array $data): MaintenanceLog
    {
        return DB::transaction(function () use ($data) {
            $log = MaintenanceLog::create($data);
            $this->vehicleStatusService->markInShop($log->vehicle);
            return $log->fresh();
        });
    }

    /**
     * Set vehicle back to AVAILABLE when maintenance is completed (e.g. separate flow).
     */
    public function completeMaintenance(MaintenanceLog $log): MaintenanceLog
    {
        $this->vehicleStatusService->markAvailable($log->vehicle);
        return $log->fresh();
    }
}

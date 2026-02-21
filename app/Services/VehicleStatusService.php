<?php

namespace App\Services;

use App\Enums\VehicleStatus;
use App\Exceptions\VehicleStatusException;
use App\Models\Vehicle;

class VehicleStatusService
{
    private const VALID_STATUSES = [
        VehicleStatus::AVAILABLE,
        VehicleStatus::IN_USE,
        VehicleStatus::IN_SHOP,
        VehicleStatus::OUT_OF_SERVICE,
    ];

    /**
     * Set vehicle status. Only enum values allowed (SYSTEM_SPEC §4.3).
     */
    public function setStatus(Vehicle $vehicle, VehicleStatus $status): Vehicle
    {
        if (! in_array($status, self::VALID_STATUSES, true)) {
            throw new VehicleStatusException("Invalid vehicle status: {$status->value}");
        }
        $vehicle->update(['status' => $status]);
        return $vehicle->fresh();
    }

    public function markAvailable(Vehicle $vehicle): Vehicle
    {
        return $this->setStatus($vehicle, VehicleStatus::AVAILABLE);
    }

    public function markInUse(Vehicle $vehicle): Vehicle
    {
        return $this->setStatus($vehicle, VehicleStatus::IN_USE);
    }

    public function markInShop(Vehicle $vehicle): Vehicle
    {
        return $this->setStatus($vehicle, VehicleStatus::IN_SHOP);
    }

    public function markOutOfService(Vehicle $vehicle): Vehicle
    {
        return $this->setStatus($vehicle, VehicleStatus::OUT_OF_SERVICE);
    }
}

<?php

namespace App\Services;

use App\Enums\DriverStatus;
use App\Enums\TripStatus;
use App\Enums\VehicleStatus;
use App\Models\Trip;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DispatchService
{
    public function __construct(
        protected TripService $tripService,
        protected DriverService $driverService,
        protected VehicleService $vehicleService
    ) {}

    /**
     * Dispatch a draft trip: transition to DISPATCHED and cascade vehicle IN_USE, driver ON_TRIP.
     * Uses a transaction so all-or-nothing.
     */
    public function dispatch(Trip $trip): Trip
    {
        if ($trip->status !== TripStatus::DRAFT) {
            throw new InvalidArgumentException('Only draft trips can be dispatched.');
        }

        $this->driverService->ensureLicenseValid($trip->driver);

        return DB::transaction(function () use ($trip) {
            $this->tripService->transitionStatus($trip, TripStatus::DISPATCHED);
            $trip->refresh();
            $this->vehicleService->markInUse($trip->vehicle);
            $trip->driver->update(['status' => DriverStatus::ON_TRIP]);
            return $trip->fresh();
        });
    }

    /**
     * Complete a dispatched trip: transition to COMPLETED, vehicle AVAILABLE, driver AVAILABLE.
     */
    public function complete(Trip $trip): Trip
    {
        if ($trip->status !== TripStatus::DISPATCHED) {
            throw new InvalidArgumentException('Only dispatched trips can be completed.');
        }

        return DB::transaction(function () use ($trip) {
            $trip->update([
                'status' => TripStatus::COMPLETED,
                'completed_at' => now(),
            ]);
            $this->vehicleService->markAvailable($trip->vehicle);
            $trip->driver->update(['status' => DriverStatus::AVAILABLE]);
            return $trip->fresh();
        });
    }

    /**
     * Cancel trip: transition to CANCELLED; if was DISPATCHED, set vehicle and driver back to available.
     */
    public function cancel(Trip $trip): Trip
    {
        if (!$trip->status->canTransitionTo(TripStatus::CANCELLED)) {
            throw new InvalidArgumentException('This trip cannot be cancelled.');
        }

        return DB::transaction(function () use ($trip) {
            $wasDispatched = $trip->status === TripStatus::DISPATCHED;
            $this->tripService->transitionStatus($trip, TripStatus::CANCELLED);
            $trip->refresh();

            if ($wasDispatched) {
                $this->vehicleService->markAvailable($trip->vehicle);
                $trip->driver->update(['status' => DriverStatus::AVAILABLE]);
            }
            return $trip->fresh();
        });
    }
}

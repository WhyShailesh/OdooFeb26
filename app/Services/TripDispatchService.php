<?php

namespace App\Services;

use App\Enums\DriverStatus;
use App\Enums\TripStatus;
use App\Enums\VehicleStatus;
use App\Exceptions\DriverAvailabilityException;
use App\Exceptions\TripDispatchException;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;

class TripDispatchService
{
    /** @var array<string, list<TripStatus>> Allowed status transitions per SYSTEM_SPEC §4.1 (key = status value) */
    private const ALLOWED_TRANSITIONS = [
        'draft' => [TripStatus::DISPATCHED, TripStatus::CANCELLED],
        'dispatched' => [TripStatus::COMPLETED, TripStatus::CANCELLED],
        'completed' => [],
        'cancelled' => [],
    ];

    public function __construct(
        protected VehicleStatusService $vehicleStatusService,
        protected DriverAvailabilityService $driverAvailabilityService
    ) {}

    /**
     * Cargo vs capacity: cargo_weight_kg must be ≤ vehicle max_capacity_kg (SYSTEM_SPEC §4.1).
     */
    public function validateCargoWeight(Vehicle $vehicle, float $cargoWeightKg): void
    {
        $max = (float) $vehicle->max_capacity_kg;
        if ($cargoWeightKg > $max) {
            throw new TripDispatchException(
                "Cargo weight ({$cargoWeightKg} kg) exceeds vehicle max capacity ({$max} kg)."
            );
        }
    }

    /**
     * Guard: only available vehicles can be assigned to trips. Retired (out_of_service) and
     * vehicles in maintenance (in_shop) or already in use are blocked.
     */
    private function ensureVehicleAssignable(Vehicle $vehicle): void
    {
        if ($vehicle->status !== VehicleStatus::AVAILABLE) {
            throw new TripDispatchException(
                "Vehicle cannot be assigned (status: {$vehicle->status->label()}). Only available vehicles can be assigned to trips."
            );
        }
    }

    /**
     * Guard: driver must have valid license for assignment (create, update, dispatch).
     */
    private function ensureDriverAssignable(Driver $driver): void
    {
        try {
            $this->driverAvailabilityService->ensureLicenseValid($driver);
        } catch (DriverAvailabilityException $e) {
            throw new TripDispatchException('Cannot assign driver: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Create a trip in DRAFT. Validates vehicle assignable, driver assignable, cargo weight.
     */
    public function createDraft(array $data): Trip
    {
        $vehicle = Vehicle::findOrFail($data['vehicle_id']);
        $driver = Driver::findOrFail($data['driver_id']);

        $this->ensureVehicleAssignable($vehicle);
        $this->ensureDriverAssignable($driver);
        $this->validateCargoWeight($vehicle, (float) ($data['cargo_weight_kg'] ?? 0));

        $data['status'] = TripStatus::DRAFT;
        return Trip::create($data);
    }

    /**
     * Update trip. Allowed only when status is DRAFT. Re-validates vehicle, driver, cargo.
     */
    public function updateDraft(Trip $trip, array $data): Trip
    {
        if ($trip->status !== TripStatus::DRAFT) {
            throw new TripDispatchException('Only draft trips can be updated.');
        }

        $vehicle = isset($data['vehicle_id'])
            ? Vehicle::findOrFail($data['vehicle_id'])
            : $trip->vehicle;
        $driver = isset($data['driver_id'])
            ? Driver::findOrFail($data['driver_id'])
            : $trip->driver;

        $this->ensureVehicleAssignable($vehicle);
        $this->ensureDriverAssignable($driver);
        $cargo = (float) ($data['cargo_weight_kg'] ?? $trip->cargo_weight_kg);
        $this->validateCargoWeight($vehicle, $cargo);

        $trip->update($data);
        return $trip->fresh();
    }

    /**
     * Dispatch: DRAFT → DISPATCHED; vehicle → IN_USE; driver → ON_TRIP (SYSTEM_SPEC §4.1, §5.6).
     * Guards: vehicle must still be assignable (available); driver license must not be expired.
     */
    public function dispatch(Trip $trip): Trip
    {
        if ($trip->status !== TripStatus::DRAFT) {
            throw new TripDispatchException('Only draft trips can be dispatched.');
        }

        $trip->load(['vehicle', 'driver']);
        $trip->vehicle->refresh();
        $trip->driver->refresh();
        $this->ensureVehicleAssignable($trip->vehicle);
        $this->ensureDriverAssignable($trip->driver);

        return DB::transaction(function () use ($trip) {
            $trip->update(['status' => TripStatus::DISPATCHED]);
            $trip->refresh();
            $this->vehicleStatusService->setStatus($trip->vehicle, VehicleStatus::IN_USE);
            $trip->driver->update(['status' => DriverStatus::ON_TRIP]);
            return $trip->fresh();
        });
    }

    /**
     * Complete: DISPATCHED → COMPLETED; vehicle and driver → AVAILABLE (SYSTEM_SPEC §4.1, §5.6).
     * Resets availability so vehicle and driver can be assigned to new trips.
     */
    public function complete(Trip $trip): Trip
    {
        if ($trip->status !== TripStatus::DISPATCHED) {
            throw new TripDispatchException('Only dispatched trips can be completed.');
        }

        return DB::transaction(function () use ($trip) {
            $trip->update([
                'status' => TripStatus::COMPLETED,
                'completed_at' => now(),
            ]);
            $trip->refresh();
            $this->vehicleStatusService->setStatus($trip->vehicle, VehicleStatus::AVAILABLE);
            $trip->driver->update(['status' => DriverStatus::AVAILABLE]);
            return $trip->fresh();
        });
    }

    /**
     * Cancel: DRAFT or DISPATCHED → CANCELLED; if was DISPATCHED, set vehicle and driver → AVAILABLE
     * so availability is reset correctly (SYSTEM_SPEC §4.1, §5.6).
     */
    public function cancel(Trip $trip): Trip
    {
        if (! in_array(TripStatus::CANCELLED, self::ALLOWED_TRANSITIONS[$trip->status->value] ?? [], true)) {
            throw new TripDispatchException(
                "Cannot cancel a trip with status {$trip->status->value}. Only draft or dispatched trips can be cancelled."
            );
        }

        return DB::transaction(function () use ($trip) {
            $wasDispatched = $trip->status === TripStatus::DISPATCHED;
            $trip->update(['status' => TripStatus::CANCELLED]);
            $trip->refresh();

            if ($wasDispatched) {
                $this->vehicleStatusService->setStatus($trip->vehicle, VehicleStatus::AVAILABLE);
                $trip->driver->update(['status' => DriverStatus::AVAILABLE]);
            }
            return $trip->fresh();
        });
    }

    /**
     * Whether the trip can transition to the given status (SYSTEM_SPEC §4.1).
     */
    public function canTransitionTo(Trip $trip, TripStatus $newStatus): bool
    {
        $allowed = self::ALLOWED_TRANSITIONS[$trip->status->value] ?? [];
        return in_array($newStatus, $allowed, true);
    }
}

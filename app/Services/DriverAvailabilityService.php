<?php

namespace App\Services;

use App\Models\Driver;
use App\Exceptions\DriverAvailabilityException;
use Illuminate\Database\Eloquent\Builder;

class DriverAvailabilityService
{
    /**
     * License expiry per SYSTEM_SPEC §4.2: expired if license_expires_at <= today.
     */
    public function isLicenseValid(Driver $driver): bool
    {
        return $driver->license_expires_at->startOfDay()->gt(now()->startOfDay());
    }

    /**
     * Throws if driver license is expired. Used before dispatch (SYSTEM_SPEC §4.2, §4.1).
     */
    public function ensureLicenseValid(Driver $driver): void
    {
        if (! $this->isLicenseValid($driver)) {
            throw new DriverAvailabilityException(
                "Driver {$driver->name} (license {$driver->license_number}) has an expired license (expired {$driver->license_expires_at->toDateString()})."
            );
        }
    }

    /**
     * Drivers that can be assigned to a trip: available and license valid (SYSTEM_SPEC §4.2, §5.2).
     */
    public function assignableDriversQuery(): Builder
    {
        return Driver::available()->licenseValid();
    }
}

<?php

namespace App\Http\Livewire;

use App\Models\Vehicle;
use App\Models\Driver;
use App\Enums\VehicleStatus;
use App\Enums\DriverStatus;
use Livewire\Component;

class DashboardMetrics extends Component
{
    /**
     * Real-time availability counts (no duplicated stored values; computed).
     */
    public function getAvailableVehiclesProperty(): int
    {
        return Vehicle::available()->count();
    }

    public function getAvailableDriversProperty(): int
    {
        return Driver::available()->licenseValid()->count();
    }

    public function render()
    {
        return view('livewire.dashboard-metrics');
    }
}

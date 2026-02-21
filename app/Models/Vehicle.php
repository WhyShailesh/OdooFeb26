<?php

namespace App\Models;

use App\Enums\VehicleStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    protected $fillable = [
        'plate_number',
        'make',
        'model',
        'year',
        'max_capacity_kg',
        'acquisition_cost',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'max_capacity_kg' => 'decimal:2',
            'acquisition_cost' => 'decimal:2',
            'status' => VehicleStatus::class,
        ];
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function maintenanceLogs(): HasMany
    {
        return $this->hasMany(MaintenanceLog::class, 'vehicle_id');
    }

    public function fuelLogs(): HasMany
    {
        return $this->hasMany(FuelLog::class, 'vehicle_id');
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', VehicleStatus::AVAILABLE);
    }

    public function scopeInShop($query)
    {
        return $query->where('status', VehicleStatus::IN_SHOP);
    }
}

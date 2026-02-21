<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuelLog extends Model
{
    protected $fillable = [
        'vehicle_id',
        'trip_id',
        'liters',
        'cost_per_liter',
        'odometer_km',
        'fueled_at',
        'station',
    ];

    protected function casts(): array
    {
        return [
            'liters' => 'decimal:2',
            'cost_per_liter' => 'decimal:2',
            'odometer_km' => 'decimal:2',
            'fueled_at' => 'date',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }
}

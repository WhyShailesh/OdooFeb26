<?php

namespace App\Models;

use App\Enums\TripStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trip extends Model
{
    protected $fillable = [
        'vehicle_id',
        'driver_id',
        'status',
        'origin',
        'destination',
        'distance_km',
        'cargo_weight_kg',
        'revenue',
        'scheduled_at',
        'started_at',
        'completed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'distance_km' => 'decimal:2',
            'cargo_weight_kg' => 'decimal:2',
            'revenue' => 'decimal:2',
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'status' => TripStatus::class,
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function fuelLogs(): HasMany
    {
        return $this->hasMany(FuelLog::class);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', TripStatus::DRAFT);
    }

    public function scopeDispatched($query)
    {
        return $query->where('status', TripStatus::DISPATCHED);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', TripStatus::COMPLETED);
    }
}

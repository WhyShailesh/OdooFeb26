<?php

namespace App\Models;

use App\Enums\MaintenanceType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceLog extends Model
{
    protected $fillable = [
        'vehicle_id',
        'type',
        'description',
        'cost',
        'performed_at',
        'due_at',
        'vendor',
    ];

    protected function casts(): array
    {
        return [
            'type' => MaintenanceType::class,
            'cost' => 'decimal:2',
            'performed_at' => 'date',
            'due_at' => 'date',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }
}

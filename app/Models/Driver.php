<?php

namespace App\Models;

use App\Enums\DriverStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Driver extends Model
{
    protected $fillable = [
        'name',
        'license_number',
        'license_expires_at',
        'status',
        'phone',
        'email',
    ];

    protected function casts(): array
    {
        return [
            'license_expires_at' => 'date',
            'status' => DriverStatus::class,
        ];
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', DriverStatus::AVAILABLE);
    }

    public function scopeLicenseValid($query)
    {
        return $query->where('license_expires_at', '>', now());
    }
}

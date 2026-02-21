<?php

namespace App\Enums;

enum DriverStatus: string
{
    case AVAILABLE = 'available';
    case ON_TRIP = 'on_trip';
    case OFF_DUTY = 'off_duty';
    case SUSPENDED = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::AVAILABLE => 'Available',
            self::ON_TRIP => 'On Trip',
            self::OFF_DUTY => 'Off Duty',
            self::SUSPENDED => 'Suspended',
        };
    }
}

<?php

namespace App\Enums;

enum MaintenanceType: string
{
    case OIL_CHANGE = 'oil_change';
    case REPAIR = 'repair';
    case INSPECTION = 'inspection';
    case TIRE_ROTATION = 'tire_rotation';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::OIL_CHANGE => 'Oil Change',
            self::REPAIR => 'Repair',
            self::INSPECTION => 'Inspection',
            self::TIRE_ROTATION => 'Tire Rotation',
            self::OTHER => 'Other',
        };
    }
}

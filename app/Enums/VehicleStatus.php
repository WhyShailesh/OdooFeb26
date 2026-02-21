<?php

namespace App\Enums;

enum VehicleStatus: string
{
    case AVAILABLE = 'available';
    case IN_USE = 'in_use';
    case IN_SHOP = 'in_shop';
    case OUT_OF_SERVICE = 'out_of_service';

    public function label(): string
    {
        return match ($this) {
            self::AVAILABLE => 'Available',
            self::IN_USE => 'In Use',
            self::IN_SHOP => 'In Shop',
            self::OUT_OF_SERVICE => 'Out of Service',
        };
    }
}

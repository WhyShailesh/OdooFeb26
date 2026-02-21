<?php

namespace App\Enums;

enum TripStatus: string
{
    case DRAFT = 'draft';
    case DISPATCHED = 'dispatched';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::DISPATCHED => 'Dispatched',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
        };
    }
}

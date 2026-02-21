<?php

namespace App\Enums;

enum RoleName: string
{
    case FLEET_MANAGER = 'fleet_manager';
    case DISPATCHER = 'dispatcher';
    case SAFETY_OFFICER = 'safety_officer';
    case FINANCIAL_ANALYST = 'financial_analyst';

    public function label(): string
    {
        return match ($this) {
            self::FLEET_MANAGER => 'Fleet Manager',
            self::DISPATCHER => 'Dispatcher',
            self::SAFETY_OFFICER => 'Safety Officer',
            self::FINANCIAL_ANALYST => 'Financial Analyst',
        };
    }
}

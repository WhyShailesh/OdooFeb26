<?php

namespace App\Providers;

use App\Enums\RoleName;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public const HOME = '/dashboard';

    /**
     * Home URL for the authenticated user by role. Non–fleet-managers are sent to
     * the first page they can access to avoid 403 on /dashboard.
     */
    public static function homeForUser(?object $user): string
    {
        if (! $user || ! $user->relationLoaded('role')) {
            return self::HOME;
        }
        $role = $user->role?->name;
        return match ($role) {
            RoleName::FLEET_MANAGER => '/dashboard',
            RoleName::DISPATCHER => '/trips',
            RoleName::SAFETY_OFFICER => '/drivers',
            RoleName::FINANCIAL_ANALYST => '/reports',
            default => self::HOME,
        };
    }

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}

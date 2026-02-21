<?php

namespace App\Http\Controllers;

use App\Services\DashboardMetricsService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardMetricsService $dashboardMetricsService
    ) {}

    public function __invoke(Request $request): View
    {
        $metrics = $this->dashboardMetricsService->getDashboardMetrics();
        return view('dashboard', array_merge($metrics, [
            'fleetROI' => $metrics['fleet_roi'],
            'fleetFuelEfficiency' => $metrics['fleet_fuel_efficiency'],
        ]));
    }
}

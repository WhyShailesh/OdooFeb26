<?php

namespace App\Http\Controllers;

use App\Models\FuelLog;
use App\Services\FuelLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class FuelLogController extends Controller
{
    public function __construct(
        protected FuelLogService $fuelLogService
    ) {}

    public function index(Request $request): View
    {
        $logs = $this->fuelLogService->listPaginated(15);
        return view('fuel.index', compact('logs'));
    }

    public function create(Request $request): View
    {
        $vehicles = $this->fuelLogService->getVehiclesForSelect();
        $trips = $this->fuelLogService->getTripsForSelect(50);
        $vehicleId = $request->get('vehicle_id');
        return view('fuel.create', compact('vehicles', 'trips', 'vehicleId'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'trip_id' => 'nullable|exists:trips,id',
            'liters' => 'required|numeric|min:0.01',
            'cost_per_liter' => 'nullable|numeric|min:0',
            'odometer_km' => 'nullable|numeric|min:0',
            'fueled_at' => 'required|date',
            'station' => 'nullable|string|max:255',
        ]);

        $this->fuelLogService->create($validated);
        return redirect()->route('fuel.index')->with('success', 'Fuel log created.');
    }

    public function show(FuelLog $fuel): View
    {
        $data = $this->fuelLogService->getForShow($fuel);
        return view('fuel.show', $data);
    }
}

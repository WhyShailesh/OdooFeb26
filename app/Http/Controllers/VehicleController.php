<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Services\VehicleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class VehicleController extends Controller
{
    public function __construct(
        protected VehicleService $vehicleService
    ) {}

    public function index(Request $request): View
    {
        $vehicles = $this->vehicleService->listPaginated(15);
        return view('vehicles.index', compact('vehicles'));
    }

    public function create(): View
    {
        return view('vehicles.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'plate_number' => 'required|string|max:20|unique:vehicles,plate_number',
            'make' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1900|max:2100',
            'max_capacity_kg' => 'required|numeric|min:0',
            'acquisition_cost' => 'nullable|numeric|min:0',
        ]);

        $this->vehicleService->create($validated);
        return redirect()->route('vehicles.index')->with('success', 'Vehicle created.');
    }

    public function show(Vehicle $vehicle): View
    {
        $data = $this->vehicleService->getForShow($vehicle);
        return view('vehicles.show', $data);
    }

    public function edit(Vehicle $vehicle): View
    {
        return view('vehicles.edit', compact('vehicle'));
    }

    public function update(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $validated = $request->validate([
            'plate_number' => 'required|string|max:20|unique:vehicles,plate_number,' . $vehicle->id,
            'make' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1900|max:2100',
            'max_capacity_kg' => 'required|numeric|min:0',
            'acquisition_cost' => 'nullable|numeric|min:0',
        ]);

        $this->vehicleService->update($vehicle, $validated);
        return redirect()->route('vehicles.show', $vehicle)->with('success', 'Vehicle updated.');
    }

    public function destroy(Vehicle $vehicle): RedirectResponse
    {
        $this->vehicleService->delete($vehicle);
        return redirect()->route('vehicles.index')->with('success', 'Vehicle deleted.');
    }
}

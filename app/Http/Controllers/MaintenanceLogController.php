<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceLog;
use App\Services\MaintenanceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class MaintenanceLogController extends Controller
{
    public function __construct(
        protected MaintenanceService $maintenanceService
    ) {}

    public function index(Request $request): View
    {
        $logs = $this->maintenanceService->listPaginated(15);
        return view('maintenance.index', compact('logs'));
    }

    public function create(Request $request): View
    {
        $vehicles = $this->maintenanceService->getVehiclesForSelect();
        $vehicleId = $request->get('vehicle_id');
        return view('maintenance.create', compact('vehicles', 'vehicleId'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'type' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'cost' => 'nullable|numeric|min:0',
            'performed_at' => 'required|date',
            'due_at' => 'nullable|date',
            'vendor' => 'nullable|string|max:255',
        ]);

        $validated['cost'] = $validated['cost'] ?? 0;
        $this->maintenanceService->createLog($validated);

        return redirect()->route('maintenance.index')->with('success', 'Maintenance log created. Vehicle set to In Shop.');
    }

    public function show(MaintenanceLog $maintenance): View
    {
        $data = $this->maintenanceService->getForShow($maintenance);
        return view('maintenance.show', $data);
    }
}

<?php

namespace App\Http\Controllers;

use App\Exceptions\TripDispatchException;
use App\Models\Trip;
use App\Services\DriverAvailabilityService;
use App\Services\TripDispatchService;
use App\Services\TripService;
use App\Services\VehicleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class TripController extends Controller
{
    public function __construct(
        protected TripService $tripService,
        protected TripDispatchService $tripDispatchService,
        protected VehicleService $vehicleService,
        protected DriverAvailabilityService $driverAvailabilityService
    ) {}

    public function index(Request $request): View
    {
        $trips = $this->tripService->listPaginated(15);
        return view('trips.index', compact('trips'));
    }

    public function create(): View
    {
        $vehicles = $this->vehicleService->getAvailableForSelect();
        $drivers = $this->driverAvailabilityService->assignableDriversQuery()->get();
        return view('trips.create', compact('vehicles', 'drivers'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:drivers,id',
            'origin' => 'required|string|max:255',
            'destination' => 'required|string|max:255',
            'distance_km' => 'nullable|numeric|min:0',
            'cargo_weight_kg' => 'required|numeric|min:0',
            'revenue' => 'nullable|numeric|min:0',
            'scheduled_at' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validated['distance_km'] = $validated['distance_km'] ?? 0;
        $validated['revenue'] = $validated['revenue'] ?? 0;

        try {
            $this->tripDispatchService->createDraft($validated);
        } catch (TripDispatchException $e) {
            return back()->withInput()->withErrors(['cargo_weight_kg' => $e->getMessage()]);
        }

        return redirect()->route('trips.index')->with('success', 'Trip created as draft.');
    }

    public function show(Trip $trip): View
    {
        $data = $this->tripService->getForShow($trip);
        return view('trips.show', $data);
    }

    public function edit(Trip $trip): View
    {
        try {
            $this->tripService->ensureCanEdit($trip);
        } catch (TripDispatchException $e) {
            return redirect()->route('trips.show', $trip)->with('error', $e->getMessage());
        }

        $vehicles = $this->vehicleService->getAvailableForSelect();
        $drivers = $this->driverAvailabilityService->assignableDriversQuery()->get();
        return view('trips.edit', compact('trip', 'vehicles', 'drivers'));
    }

    public function update(Request $request, Trip $trip): RedirectResponse
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:drivers,id',
            'origin' => 'required|string|max:255',
            'destination' => 'required|string|max:255',
            'distance_km' => 'nullable|numeric|min:0',
            'cargo_weight_kg' => 'required|numeric|min:0',
            'revenue' => 'nullable|numeric|min:0',
            'scheduled_at' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $this->tripDispatchService->updateDraft($trip, $validated);
        } catch (TripDispatchException $e) {
            return back()->withInput()->withErrors(['cargo_weight_kg' => $e->getMessage()]);
        }

        return redirect()->route('trips.show', $trip)->with('success', 'Trip updated.');
    }

    public function dispatch(Trip $trip): RedirectResponse
    {
        try {
            $this->tripDispatchService->dispatch($trip);
        } catch (TripDispatchException $e) {
            return back()->with('error', $e->getMessage());
        }
        return redirect()->route('trips.show', $trip)->with('success', 'Trip dispatched.');
    }

    public function complete(Trip $trip): RedirectResponse
    {
        try {
            $this->tripDispatchService->complete($trip);
        } catch (TripDispatchException $e) {
            return back()->with('error', $e->getMessage());
        }
        return redirect()->route('trips.show', $trip)->with('success', 'Trip completed.');
    }

    public function cancel(Trip $trip): RedirectResponse
    {
        try {
            $this->tripDispatchService->cancel($trip);
        } catch (TripDispatchException $e) {
            return back()->with('error', $e->getMessage());
        }
        return redirect()->route('trips.show', $trip)->with('success', 'Trip cancelled.');
    }
}

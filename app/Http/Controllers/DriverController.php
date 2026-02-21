<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Services\DriverService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DriverController extends Controller
{
    public function __construct(
        protected DriverService $driverService
    ) {}

    public function index(Request $request): View
    {
        $drivers = $this->driverService->listPaginated(15);
        return view('drivers.index', compact('drivers'));
    }

    public function create(): View
    {
        return view('drivers.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'license_number' => 'required|string|max:50|unique:drivers,license_number',
            'license_expires_at' => 'required|date|after:today',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
        ]);

        $this->driverService->create($validated);
        return redirect()->route('drivers.index')->with('success', 'Driver created.');
    }

    public function show(Driver $driver): View
    {
        $data = $this->driverService->getForShow($driver);
        return view('drivers.show', $data);
    }

    public function edit(Driver $driver): View
    {
        return view('drivers.edit', compact('driver'));
    }

    public function update(Request $request, Driver $driver): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'license_number' => 'required|string|max:50|unique:drivers,license_number,' . $driver->id,
            'license_expires_at' => 'required|date',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
        ]);

        $this->driverService->update($driver, $validated);
        return redirect()->route('drivers.show', $driver)->with('success', 'Driver updated.');
    }

    public function destroy(Driver $driver): RedirectResponse
    {
        $this->driverService->delete($driver);
        return redirect()->route('drivers.index')->with('success', 'Driver deleted.');
    }
}

<div class="rounded-xl bg-slate-900 text-white p-6 mb-8">
    <h2 class="text-lg font-semibold mb-4">Real-time availability</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <span class="text-slate-400">Vehicles available</span>
            <p class="text-2xl font-bold text-amber-400">{{ $this->availableVehicles }}</p>
        </div>
        <div>
            <span class="text-slate-400">Drivers available (license valid)</span>
            <p class="text-2xl font-bold text-amber-400">{{ $this->availableDrivers }}</p>
        </div>
    </div>
</div>

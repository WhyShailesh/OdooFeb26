@extends('layouts.app')

@section('title', $vehicle->plate_number)

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Vehicle Registry') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ $vehicle->plate_number }} — {{ $vehicle->make }} {{ $vehicle->model }}</h1>
        <div class="flex gap-2">
            <a href="{{ route('vehicles.edit', $vehicle) }}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">{{ __('Edit') }}</a>
            <a href="{{ route('maintenance.create', ['vehicle_id' => $vehicle->id]) }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">{{ __('Log maintenance') }}</a>
            <a href="{{ route('fuel.create', ['vehicle_id' => $vehicle->id]) }}" class="inline-flex items-center px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800">{{ __('Log fuel') }}</a>
        </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ __('Details') }}</h2>
            <dl class="grid grid-cols-2 gap-3">
                <dt class="text-sm text-gray-500">{{ __('Status') }}</dt>
                <dd><x-status-pill :label="$vehicle->status->label()" :variant="$vehicle->status->value" /></dd>
                <dt class="text-sm text-gray-500">{{ __('Year') }}</dt>
                <dd class="text-sm text-gray-900">{{ $vehicle->year }}</dd>
                <dt class="text-sm text-gray-500">{{ __('Max capacity (kg)') }}</dt>
                <dd class="text-sm text-gray-900">{{ number_format($vehicle->max_capacity_kg, 0) }}</dd>
                <dt class="text-sm text-gray-500">{{ __('Acquisition cost') }}</dt>
                <dd class="text-sm text-gray-900">{{ number_format($vehicle->acquisition_cost, 2) }}</dd>
                <dt class="text-sm text-gray-500">{{ __('Fuel efficiency (km/L)') }}</dt>
                <dd class="text-sm text-gray-900">{{ $fuelEfficiency !== null ? number_format($fuelEfficiency, 2) : '—' }}</dd>
                <dt class="text-sm text-gray-500">{{ __('ROI') }}</dt>
                <dd class="text-sm text-gray-900">{{ $roi !== null ? number_format($roi * 100, 2) . '%' : '—' }}</dd>
            </dl>
        </div>
        <div class="bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ __('Recent trips') }}</h2>
            <ul class="space-y-2">
                @forelse($vehicle->trips as $t)
                <li><a href="{{ route('trips.show', $t) }}" class="text-indigo-600 hover:underline">{{ $t->origin }} → {{ $t->destination }}</a> <x-status-pill :label="$t->status->label()" :variant="$t->status->value" class="ml-1" /></li>
                @empty
                <li class="text-sm text-gray-500">{{ __('No trips') }}</li>
                @endforelse
            </ul>
        </div>
    </div>

    <div class="mt-6 bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ __('Maintenance logs') }}</h2>
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Date') }}</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Type') }}</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Cost') }}</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($vehicle->maintenanceLogs->take(10) as $m)
                <tr>
                    <td class="px-4 py-2 text-sm text-gray-900">{{ $m->performed_at->format('Y-m-d') }}</td>
                    <td class="px-4 py-2 text-sm text-gray-600">{{ $m->type->label() }}</td>
                    <td class="px-4 py-2 text-sm text-gray-600">{{ number_format($m->cost, 2) }}</td>
                </tr>
                @empty
                <tr><td colspan="3" class="px-4 py-4 text-sm text-gray-500">{{ __('No maintenance logs') }}</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection

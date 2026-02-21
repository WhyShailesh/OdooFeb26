@extends('layouts.app')

@section('title', __('Trip'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Trip Dispatcher') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ $trip->origin }} → {{ $trip->destination }}</h1>
        <div class="flex gap-2">
            @if($trip->status->value === 'draft')
            <a href="{{ route('trips.edit', $trip) }}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">{{ __('Edit') }}</a>
            <form action="{{ route('trips.dispatch', $trip) }}" method="POST" class="inline">
                @csrf
                <button type="submit" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">{{ __('Dispatch') }}</button>
            </form>
            <form action="{{ route('trips.cancel', $trip) }}" method="POST" class="inline" onsubmit="return confirm('{{ __('Cancel this trip?') }}');">
                @csrf
                <button type="submit" class="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200">{{ __('Cancel trip') }}</button>
            </form>
            @endif
            @if($trip->status->value === 'dispatched')
            <form action="{{ route('trips.complete', $trip) }}" method="POST" class="inline">
                @csrf
                <button type="submit" class="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700">{{ __('Mark completed') }}</button>
            </form>
            <form action="{{ route('trips.cancel', $trip) }}" method="POST" class="inline" onsubmit="return confirm('{{ __('Cancel this trip?') }}');">
                @csrf
                <button type="submit" class="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200">{{ __('Cancel trip') }}</button>
            </form>
            @endif
        </div>
    </div>

    <div class="bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6 mb-6">
        <x-status-pill :label="$trip->status->label()" :variant="$trip->status->value" class="text-sm" />
        <dl class="grid grid-cols-2 gap-3 mt-4">
            <dt class="text-sm text-gray-500">{{ __('Vehicle') }}</dt>
            <dd class="text-sm"><a href="{{ route('vehicles.show', $trip->vehicle) }}" class="text-indigo-600 hover:underline">{{ $trip->vehicle->plate_number }}</a></dd>
            <dt class="text-sm text-gray-500">{{ __('Driver') }}</dt>
            <dd class="text-sm"><a href="{{ route('drivers.show', $trip->driver) }}" class="text-indigo-600 hover:underline">{{ $trip->driver->name }}</a></dd>
            <dt class="text-sm text-gray-500">{{ __('Distance (km)') }}</dt>
            <dd class="text-sm text-gray-900">{{ number_format($trip->distance_km, 2) }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Cargo (kg)') }}</dt>
            <dd class="text-sm text-gray-900">{{ number_format($trip->cargo_weight_kg, 2) }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Revenue') }}</dt>
            <dd class="text-sm text-gray-900">{{ number_format($trip->revenue, 2) }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Scheduled') }}</dt>
            <dd class="text-sm text-gray-900">{{ $trip->scheduled_at?->format('Y-m-d H:i') ?? '—' }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Completed') }}</dt>
            <dd class="text-sm text-gray-900">{{ $trip->completed_at?->format('Y-m-d H:i') ?? '—' }}</dd>
            @if($trip->notes)
            <dt class="text-sm text-gray-500">{{ __('Notes') }}</dt>
            <dd class="text-sm text-gray-900 col-span-1">{{ $trip->notes }}</dd>
            @endif
        </dl>
    </div>

    @if($trip->fuelLogs->isNotEmpty())
    <div class="bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ __('Fuel logs') }}</h2>
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Date') }}</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Liters') }}</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Cost') }}</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @foreach($trip->fuelLogs as $f)
                <tr>
                    <td class="px-4 py-2 text-sm text-gray-900">{{ $f->fueled_at->format('Y-m-d') }}</td>
                    <td class="px-4 py-2 text-sm text-gray-600">{{ number_format($f->liters, 2) }}</td>
                    <td class="px-4 py-2 text-sm text-gray-600">{{ number_format((float) $f->liters * (float) $f->cost_per_liter, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
</div>
@endsection

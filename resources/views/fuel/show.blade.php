@extends('layouts.app')

@section('title', __('Fuel log'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Fuel Logs') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <div class="mb-6">
        <a href="{{ route('fuel.index') }}" class="text-sm text-indigo-600 hover:underline mb-2 inline-block">{{ __('← Fuel logs') }}</a>
        <h1 class="text-2xl font-bold text-gray-900">{{ __('Fuel log') }}</h1>
    </div>

    <div class="bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
        <dl class="grid grid-cols-2 gap-3">
            <dt class="text-sm text-gray-500">{{ __('Vehicle') }}</dt>
            <dd class="text-sm"><a href="{{ route('vehicles.show', $log->vehicle) }}" class="text-indigo-600 hover:underline">{{ $log->vehicle->plate_number }}</a></dd>
            <dt class="text-sm text-gray-500">{{ __('Fueled at') }}</dt>
            <dd class="text-sm text-gray-900">{{ $log->fueled_at->format('Y-m-d') }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Liters') }}</dt>
            <dd class="text-sm text-gray-900">{{ number_format($log->liters, 2) }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Cost per liter') }}</dt>
            <dd class="text-sm text-gray-900">{{ number_format($log->cost_per_liter, 2) }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Total cost') }}</dt>
            <dd class="text-sm text-gray-900">{{ number_format((float) $log->liters * (float) $log->cost_per_liter, 2) }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Odometer (km)') }}</dt>
            <dd class="text-sm text-gray-900">{{ $log->odometer_km ? number_format($log->odometer_km, 2) : '—' }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Trip') }}</dt>
            <dd class="text-sm">@if($log->trip)<a href="{{ route('trips.show', $log->trip) }}" class="text-indigo-600 hover:underline">{{ $log->trip->origin }} → {{ $log->trip->destination }}</a>@else—@endif</dd>
            <dt class="text-sm text-gray-500">{{ __('Station') }}</dt>
            <dd class="text-sm text-gray-900">{{ $log->station ?? '—' }}</dd>
        </dl>
    </div>
</div>
@endsection

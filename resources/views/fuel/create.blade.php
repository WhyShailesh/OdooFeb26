@extends('layouts.app')

@section('title', __('Log fuel'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Fuel Logs') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ __('Log fuel') }}</h1>

    <form action="{{ route('fuel.store') }}" method="POST" class="max-w-xl bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
        @csrf
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="md:col-span-2">
                <label for="vehicle_id" class="block text-sm font-medium text-gray-700">{{ __('Vehicle') }} *</label>
                <select name="vehicle_id" id="vehicle_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">{{ __('Select vehicle') }}</option>
                    @foreach($vehicles as $v)
                    <option value="{{ $v->id }}" @selected(old('vehicle_id', $vehicleId ?? null) == $v->id)>{{ $v->plate_number }} — {{ $v->make }} {{ $v->model }}</option>
                    @endforeach
                </select>
                <x-input-error :messages="$errors->get('vehicle_id')" class="mt-1" />
            </div>
            <div>
                <label for="liters" class="block text-sm font-medium text-gray-700">{{ __('Liters') }} *</label>
                <input type="number" name="liters" id="liters" value="{{ old('liters') }}" required min="0.01" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('liters')" class="mt-1" />
            </div>
            <div>
                <label for="cost_per_liter" class="block text-sm font-medium text-gray-700">{{ __('Cost per liter') }}</label>
                <input type="number" name="cost_per_liter" id="cost_per_liter" value="{{ old('cost_per_liter', 0) }}" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('cost_per_liter')" class="mt-1" />
            </div>
            <div>
                <label for="fueled_at" class="block text-sm font-medium text-gray-700">{{ __('Fueled at') }} *</label>
                <input type="date" name="fueled_at" id="fueled_at" value="{{ old('fueled_at', now()->format('Y-m-d')) }}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('fueled_at')" class="mt-1" />
            </div>
            <div>
                <label for="odometer_km" class="block text-sm font-medium text-gray-700">{{ __('Odometer (km)') }}</label>
                <input type="number" name="odometer_km" id="odometer_km" value="{{ old('odometer_km') }}" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('odometer_km')" class="mt-1" />
            </div>
            <div class="md:col-span-2">
                <label for="trip_id" class="block text-sm font-medium text-gray-700">{{ __('Linked trip (optional)') }}</label>
                <select name="trip_id" id="trip_id" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">{{ __('None') }}</option>
                    @foreach($trips as $t)
                    <option value="{{ $t->id }}" @selected(old('trip_id') == $t->id)>{{ $t->vehicle->plate_number }} — {{ $t->origin }} → {{ $t->destination }}</option>
                    @endforeach
                </select>
                <x-input-error :messages="$errors->get('trip_id')" class="mt-1" />
            </div>
            <div class="md:col-span-2">
                <label for="station" class="block text-sm font-medium text-gray-700">{{ __('Station') }}</label>
                <input type="text" name="station" id="station" value="{{ old('station') }}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('station')" class="mt-1" />
            </div>
        </div>
        <div class="mt-6 flex gap-3">
            <button type="submit" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">{{ __('Create') }}</button>
            <a href="{{ route('fuel.index') }}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">{{ __('Cancel') }}</a>
        </div>
    </form>
</div>
@endsection

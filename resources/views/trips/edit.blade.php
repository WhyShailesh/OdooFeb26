@extends('layouts.app')

@section('title', __('Edit trip'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Trip Dispatcher') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ __('Edit trip (draft)') }}</h1>

    <form action="{{ route('trips.update', $trip) }}" method="POST" class="max-w-2xl bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
        @csrf
        @method('PUT')
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
                <label for="vehicle_id" class="block text-sm font-medium text-gray-700">{{ __('Vehicle') }} *</label>
                <select name="vehicle_id" id="vehicle_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    @foreach($vehicles as $v)
                    <option value="{{ $v->id }}" @selected(old('vehicle_id', $trip->vehicle_id) == $v->id)>{{ $v->plate_number }} — max {{ number_format($v->max_capacity_kg, 0) }} kg</option>
                    @endforeach
                </select>
                <x-input-error :messages="$errors->get('vehicle_id')" class="mt-1" />
            </div>
            <div>
                <label for="driver_id" class="block text-sm font-medium text-gray-700">{{ __('Driver') }} *</label>
                <select name="driver_id" id="driver_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    @foreach($drivers as $d)
                    <option value="{{ $d->id }}" @selected(old('driver_id', $trip->driver_id) == $d->id)>{{ $d->name }}</option>
                    @endforeach
                </select>
                <x-input-error :messages="$errors->get('driver_id')" class="mt-1" />
            </div>
            <div>
                <label for="origin" class="block text-sm font-medium text-gray-700">{{ __('Origin') }} *</label>
                <input type="text" name="origin" id="origin" value="{{ old('origin', $trip->origin) }}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('origin')" class="mt-1" />
            </div>
            <div>
                <label for="destination" class="block text-sm font-medium text-gray-700">{{ __('Destination') }} *</label>
                <input type="text" name="destination" id="destination" value="{{ old('destination', $trip->destination) }}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('destination')" class="mt-1" />
            </div>
            <div>
                <label for="distance_km" class="block text-sm font-medium text-gray-700">{{ __('Distance (km)') }}</label>
                <input type="number" name="distance_km" id="distance_km" value="{{ old('distance_km', $trip->distance_km) }}" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('distance_km')" class="mt-1" />
            </div>
            <div>
                <label for="cargo_weight_kg" class="block text-sm font-medium text-gray-700">{{ __('Cargo weight (kg)') }} *</label>
                <input type="number" name="cargo_weight_kg" id="cargo_weight_kg" value="{{ old('cargo_weight_kg', $trip->cargo_weight_kg) }}" required min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('cargo_weight_kg')" class="mt-1" />
            </div>
            <div>
                <label for="revenue" class="block text-sm font-medium text-gray-700">{{ __('Revenue') }}</label>
                <input type="number" name="revenue" id="revenue" value="{{ old('revenue', $trip->revenue) }}" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('revenue')" class="mt-1" />
            </div>
            <div>
                <label for="scheduled_at" class="block text-sm font-medium text-gray-700">{{ __('Scheduled at') }}</label>
                <input type="datetime-local" name="scheduled_at" id="scheduled_at" value="{{ old('scheduled_at', $trip->scheduled_at?->format('Y-m-d\TH:i')) }}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('scheduled_at')" class="mt-1" />
            </div>
            <div class="md:col-span-2">
                <label for="notes" class="block text-sm font-medium text-gray-700">{{ __('Notes') }}</label>
                <textarea name="notes" id="notes" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">{{ old('notes', $trip->notes) }}</textarea>
                <x-input-error :messages="$errors->get('notes')" class="mt-1" />
            </div>
        </div>
        <div class="mt-6 flex gap-3">
            <button type="submit" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">{{ __('Update') }}</button>
            <a href="{{ route('trips.show', $trip) }}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">{{ __('Cancel') }}</a>
        </div>
    </form>
</div>
@endsection

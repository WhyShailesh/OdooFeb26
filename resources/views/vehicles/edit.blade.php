@extends('layouts.app')

@section('title', __('Edit vehicle'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Vehicle Registry') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ __('Edit vehicle') }}</h1>

    <form action="{{ route('vehicles.update', $vehicle) }}" method="POST" class="max-w-xl bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
        @csrf
        @method('PUT')
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
                <label for="plate_number" class="block text-sm font-medium text-gray-700">{{ __('Plate number') }} *</label>
                <input type="text" name="plate_number" id="plate_number" value="{{ old('plate_number', $vehicle->plate_number) }}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('plate_number')" class="mt-1" />
            </div>
            <div>
                <label for="year" class="block text-sm font-medium text-gray-700">{{ __('Year') }} *</label>
                <input type="number" name="year" id="year" value="{{ old('year', $vehicle->year) }}" required min="1900" max="2100" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('year')" class="mt-1" />
            </div>
            <div>
                <label for="make" class="block text-sm font-medium text-gray-700">{{ __('Make') }} *</label>
                <input type="text" name="make" id="make" value="{{ old('make', $vehicle->make) }}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('make')" class="mt-1" />
            </div>
            <div>
                <label for="model" class="block text-sm font-medium text-gray-700">{{ __('Model') }} *</label>
                <input type="text" name="model" id="model" value="{{ old('model', $vehicle->model) }}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('model')" class="mt-1" />
            </div>
            <div>
                <label for="max_capacity_kg" class="block text-sm font-medium text-gray-700">{{ __('Max capacity (kg)') }} *</label>
                <input type="number" name="max_capacity_kg" id="max_capacity_kg" value="{{ old('max_capacity_kg', $vehicle->max_capacity_kg) }}" required min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('max_capacity_kg')" class="mt-1" />
            </div>
            <div>
                <label for="acquisition_cost" class="block text-sm font-medium text-gray-700">{{ __('Acquisition cost') }}</label>
                <input type="number" name="acquisition_cost" id="acquisition_cost" value="{{ old('acquisition_cost', $vehicle->acquisition_cost) }}" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('acquisition_cost')" class="mt-1" />
            </div>
        </div>
        <div class="mt-6 flex gap-3">
            <button type="submit" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">{{ __('Update') }}</button>
            <a href="{{ route('vehicles.show', $vehicle) }}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">{{ __('Cancel') }}</a>
        </div>
    </form>
</div>
@endsection

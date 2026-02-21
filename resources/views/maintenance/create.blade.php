@extends('layouts.app')

@section('title', __('Log maintenance'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Maintenance Logs') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ __('Log maintenance') }}</h1>
    <p class="text-sm text-gray-600 mb-4">{{ __('Creating a maintenance log will set the vehicle status to In Shop.') }}</p>

    <form action="{{ route('maintenance.store') }}" method="POST" class="max-w-xl bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
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
                <label for="type" class="block text-sm font-medium text-gray-700">{{ __('Type') }} *</label>
                <select name="type" id="type" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">{{ __('Select type') }}</option>
                    <option value="oil_change" @selected(old('type') === 'oil_change')>{{ __('Oil Change') }}</option>
                    <option value="repair" @selected(old('type') === 'repair')>{{ __('Repair') }}</option>
                    <option value="inspection" @selected(old('type') === 'inspection')>{{ __('Inspection') }}</option>
                    <option value="tire_rotation" @selected(old('type') === 'tire_rotation')>{{ __('Tire Rotation') }}</option>
                    <option value="other" @selected(old('type') === 'other')>{{ __('Other') }}</option>
                </select>
                <x-input-error :messages="$errors->get('type')" class="mt-1" />
            </div>
            <div>
                <label for="performed_at" class="block text-sm font-medium text-gray-700">{{ __('Performed at') }} *</label>
                <input type="date" name="performed_at" id="performed_at" value="{{ old('performed_at', now()->format('Y-m-d')) }}" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('performed_at')" class="mt-1" />
            </div>
            <div>
                <label for="cost" class="block text-sm font-medium text-gray-700">{{ __('Cost') }}</label>
                <input type="number" name="cost" id="cost" value="{{ old('cost', 0) }}" min="0" step="0.01" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('cost')" class="mt-1" />
            </div>
            <div>
                <label for="due_at" class="block text-sm font-medium text-gray-700">{{ __('Due at') }}</label>
                <input type="date" name="due_at" id="due_at" value="{{ old('due_at') }}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('due_at')" class="mt-1" />
            </div>
            <div class="md:col-span-2">
                <label for="description" class="block text-sm font-medium text-gray-700">{{ __('Description') }}</label>
                <textarea name="description" id="description" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">{{ old('description') }}</textarea>
                <x-input-error :messages="$errors->get('description')" class="mt-1" />
            </div>
            <div class="md:col-span-2">
                <label for="vendor" class="block text-sm font-medium text-gray-700">{{ __('Vendor') }}</label>
                <input type="text" name="vendor" id="vendor" value="{{ old('vendor') }}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <x-input-error :messages="$errors->get('vendor')" class="mt-1" />
            </div>
        </div>
        <div class="mt-6 flex gap-3">
            <button type="submit" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">{{ __('Create') }}</button>
            <a href="{{ route('maintenance.index') }}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">{{ __('Cancel') }}</a>
        </div>
    </form>
</div>
@endsection

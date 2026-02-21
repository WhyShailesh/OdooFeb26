@extends('layouts.app')

@section('title', $driver->name)

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Driver Management') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ $driver->name }}</h1>
        <a href="{{ route('drivers.edit', $driver) }}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">{{ __('Edit') }}</a>
    </div>

    <div class="bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ __('Details') }}</h2>
        <dl class="grid grid-cols-2 gap-3">
            <dt class="text-sm text-gray-500">{{ __('License number') }}</dt>
            <dd class="text-sm text-gray-900">{{ $driver->license_number }}</dd>
            <dt class="text-sm text-gray-500">{{ __('License expires') }}</dt>
            <dd class="text-sm text-gray-900">{{ $driver->license_expires_at->format('Y-m-d') }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Status') }}</dt>
            <dd><x-status-pill :label="$driver->status->label()" :variant="$driver->status->value" /></dd>
            <dt class="text-sm text-gray-500">{{ __('Phone') }}</dt>
            <dd class="text-sm text-gray-900">{{ $driver->phone ?? '—' }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Email') }}</dt>
            <dd class="text-sm text-gray-900">{{ $driver->email ?? '—' }}</dd>
        </dl>
    </div>

    <div class="bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ __('Recent trips') }}</h2>
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Route') }}</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Status') }}</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Scheduled') }}</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                @forelse($driver->trips as $t)
                <tr>
                    <td class="px-4 py-2 text-sm"><a href="{{ route('trips.show', $t) }}" class="text-indigo-600 hover:underline">{{ $t->origin }} → {{ $t->destination }}</a></td>
                    <td class="px-4 py-2"><x-status-pill :label="$t->status->label()" :variant="$t->status->value" /></td>
                    <td class="px-4 py-2 text-sm text-gray-600">{{ $t->scheduled_at?->format('Y-m-d H:i') ?? '—' }}</td>
                </tr>
                @empty
                <tr><td colspan="3" class="px-4 py-4 text-sm text-gray-500">{{ __('No trips') }}</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection

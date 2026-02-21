@extends('layouts.app')

@section('title', __('Trips'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Trip Dispatcher') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ __('Trips') }}</h1>
        <a href="{{ route('trips.create') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">{{ __('New trip') }}</a>
    </div>

    <div class="bg-white shadow-sm sm:rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Route') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Vehicle') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Driver') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Status') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Scheduled') }}</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ __('Actions') }}</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($trips as $t)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-900">{{ $t->origin }} → {{ $t->destination }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $t->vehicle->plate_number }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $t->driver->name }}</td>
                    <td class="px-4 py-3">
                        <x-status-pill :label="$t->status->label()" :variant="$t->status->value" />
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $t->scheduled_at?->format('Y-m-d H:i') ?? '—' }}</td>
                    <td class="px-4 py-3 text-right text-sm">
                        <a href="{{ route('trips.show', $t) }}" class="text-indigo-600 hover:text-indigo-900 font-medium">{{ __('View') }}</a>
                        @if($t->status->value === 'draft')
                        <a href="{{ route('trips.edit', $t) }}" class="ml-3 text-gray-600 hover:text-gray-900">{{ __('Edit') }}</a>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-500">{{ __('No trips yet.') }}</td>
                </tr>
                @endforelse
            </tbody>
        </table>
        <div class="px-4 py-3 border-t border-gray-200">{{ $trips->links() }}</div>
    </div>
</div>
@endsection

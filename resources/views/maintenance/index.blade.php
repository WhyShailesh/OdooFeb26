@extends('layouts.app')

@section('title', __('Maintenance'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Maintenance Logs') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ __('Maintenance logs') }}</h1>
        <a href="{{ route('maintenance.create') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">{{ __('Log maintenance') }}</a>
    </div>

    <div class="bg-white shadow-sm sm:rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Vehicle') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Type') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Performed') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Cost') }}</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ __('Actions') }}</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($logs as $log)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm"><a href="{{ route('vehicles.show', $log->vehicle) }}" class="text-indigo-600 hover:underline">{{ $log->vehicle->plate_number }}</a></td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $log->type->label() }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $log->performed_at->format('Y-m-d') }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ number_format($log->cost, 2) }}</td>
                    <td class="px-4 py-3 text-right text-sm"><a href="{{ route('maintenance.show', $log) }}" class="text-indigo-600 hover:text-indigo-900 font-medium">{{ __('View') }}</a></td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-sm text-gray-500">{{ __('No maintenance logs yet.') }}</td>
                </tr>
                @endforelse
            </tbody>
        </table>
        <div class="px-4 py-3 border-t border-gray-200">{{ $logs->links() }}</div>
    </div>
</div>
@endsection

@extends('layouts.app')

@section('title', __('Drivers'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Driver Management') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ __('Drivers') }}</h1>
        <a href="{{ route('drivers.create') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">{{ __('Add driver') }}</a>
    </div>

    <div class="bg-white shadow-sm sm:rounded-lg overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Name') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('License') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Expires') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Status') }}</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{{ __('Trips') }}</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{{ __('Actions') }}</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($drivers as $d)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ $d->name }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $d->license_number }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $d->license_expires_at->format('Y-m-d') }}</td>
                    <td class="px-4 py-3">
                        <x-status-pill :label="$d->status->label()" :variant="$d->status->value" />
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $d->trips_count }}</td>
                    <td class="px-4 py-3 text-right text-sm">
                        <a href="{{ route('drivers.show', $d) }}" class="text-indigo-600 hover:text-indigo-900 font-medium">{{ __('View') }}</a>
                        <a href="{{ route('drivers.edit', $d) }}" class="ml-3 text-gray-600 hover:text-gray-900">{{ __('Edit') }}</a>
                        <form action="{{ route('drivers.destroy', $d) }}" method="POST" class="inline ml-3" onsubmit="return confirm('{{ __('Delete this driver?') }}');">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="text-red-600 hover:text-red-800">{{ __('Delete') }}</button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-500">{{ __('No drivers yet.') }}</td>
                </tr>
                @endforelse
            </tbody>
        </table>
        <div class="px-4 py-3 border-t border-gray-200">{{ $drivers->links() }}</div>
    </div>
</div>
@endsection

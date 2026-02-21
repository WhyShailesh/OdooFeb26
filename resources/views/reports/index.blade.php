<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Reports') }}
        </h2>
    </x-slot>

    <div class="py-6">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <x-validation-errors />

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ __('Reports and analytics') }}</h3>
                    <p class="text-sm text-gray-600">{{ __('Revenue, fuel cost, maintenance cost, ROI, and fuel efficiency reports. Use vehicle and trip pages for per-entity metrics.') }}</p>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>

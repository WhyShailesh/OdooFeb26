@extends('layouts.app')

@section('title', __('Maintenance log'))

@section('header')
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        {{ __('Maintenance Logs') }}
    </h2>
@endsection

@section('content')
<div class="max-w-7xl mx-auto">
    <x-validation-errors />

    <div class="mb-6">
        <a href="{{ route('maintenance.index') }}" class="text-sm text-indigo-600 hover:underline mb-2 inline-block">{{ __('← Maintenance logs') }}</a>
        <h1 class="text-2xl font-bold text-gray-900">{{ __('Maintenance log') }}</h1>
    </div>

    <div class="bg-white shadow-sm sm:rounded-lg border border-gray-200 p-6">
        <dl class="grid grid-cols-2 gap-3">
            <dt class="text-sm text-gray-500">{{ __('Vehicle') }}</dt>
            <dd class="text-sm"><a href="{{ route('vehicles.show', $log->vehicle) }}" class="text-indigo-600 hover:underline">{{ $log->vehicle->plate_number }}</a></dd>
            <dt class="text-sm text-gray-500">{{ __('Type') }}</dt>
            <dd class="text-sm text-gray-900">{{ $log->type->label() }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Performed at') }}</dt>
            <dd class="text-sm text-gray-900">{{ $log->performed_at->format('Y-m-d') }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Due at') }}</dt>
            <dd class="text-sm text-gray-900">{{ $log->due_at?->format('Y-m-d') ?? '—' }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Cost') }}</dt>
            <dd class="text-sm text-gray-900">{{ number_format($log->cost, 2) }}</dd>
            <dt class="text-sm text-gray-500">{{ __('Vendor') }}</dt>
            <dd class="text-sm text-gray-900">{{ $log->vendor ?? '—' }}</dd>
            @if($log->description)
            <dt class="text-sm text-gray-500">{{ __('Description') }}</dt>
            <dd class="text-sm text-gray-900 col-span-1">{{ $log->description }}</dd>
            @endif
        </dl>
    </div>
</div>
@endsection

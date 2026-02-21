<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ __('Dashboard') }} — {{ config('app.name') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>body { font-family: ui-sans-serif, system-ui, sans-serif; }</style>
</head>
<body class="min-h-screen bg-gray-100">
    @php $user = $user ?? auth()->user(); @endphp
    <header class="bg-white shadow">
        <div class="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 class="text-xl font-semibold text-gray-800">{{ $user?->role?->name?->label() ?? __('Dashboard') }}</h1>
            <div class="flex items-center gap-4">
                <span class="text-sm text-gray-600">{{ $user?->name }}</span>
                <form method="POST" action="{{ route('logout') }}" class="inline">
                    @csrf
                    <button type="submit" class="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300">{{ __('Log out') }}</button>
                </form>
            </div>
        </div>
    </header>

    <main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <p class="mb-6 text-sm text-gray-600">{{ __('Manages trip scheduling, dispatch, and trip status.') }}</p>
        <div class="rounded-lg border border-gray-200 bg-white px-6 py-8 shadow-sm space-y-4">
            {{-- Placeholders: real data will be injected later --}}
            <p class="text-gray-700"><span class="font-medium">{{ __('Draft Trips') }}:</span> —</p>
            <p class="text-gray-700"><span class="font-medium">{{ __('Dispatched Trips') }}:</span> —</p>
            <p class="text-gray-700"><span class="font-medium">{{ __('Available Vehicles') }}:</span> —</p>
            <p class="text-gray-700"><span class="font-medium">{{ __('Available Drivers') }}:</span> —</p>
        </div>
    </main>
</body>
</html>

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ __('Register') }} — {{ config('app.name') }}</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <style>
        body { font-family: ui-sans-serif, system-ui, sans-serif; }
    </style>
</head>
<body class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 class="mt-6 text-center text-2xl font-semibold text-gray-900">
            {{ config('app.name') }}
        </h1>
        <h2 class="mt-2 text-center text-sm text-gray-600">
            {{ __('Create your account') }}
        </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10">

            {{-- Validation Errors --}}
            @if ($errors->any())
                <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <ul class="list-disc list-inside space-y-1">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form method="POST" action="{{ route('register') }}" class="space-y-6">
                @csrf

                {{-- Name --}}
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">
                        {{ __('Name') }}
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value="{{ old('name') }}"
                        required
                        autofocus
                        autocomplete="name"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                               focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                </div>

                {{-- Email --}}
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">
                        {{ __('Email') }}
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value="{{ old('email') }}"
                        required
                        autocomplete="username"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                               focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                </div>

                {{-- Role --}}
                <div>
                    <label for="role_id" class="block text-sm font-medium text-gray-700">
                        {{ __('Role') }}
                    </label>
                    <select
                        id="role_id"
                        name="role_id"
                        required
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                               focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">

                        <option value="">
                            {{ __('Select a role') }}
                        </option>

                        @foreach ($roles ?? [] as $role)
                            <option value="{{ $role->id }}"
                                {{ old('role_id') == $role->id ? 'selected' : '' }}>
                                {{ ucfirst(str_replace('_', ' ', $role->name)) }}
                            </option>
                        @endforeach

                    </select>
                </div>

                {{-- Password --}}
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">
                        {{ __('Password') }}
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autocomplete="new-password"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                               focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                </div>

                {{-- Confirm Password --}}
                <div>
                    <label for="password_confirmation" class="block text-sm font-medium text-gray-700">
                        {{ __('Confirm Password') }}
                    </label>
                    <input
                        id="password_confirmation"
                        name="password_confirmation"
                        type="password"
                        required
                        autocomplete="new-password"
                        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
                               focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                </div>

                {{-- Submit --}}
                <div>
                    <button
                        type="submit"
                        class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                               shadow hover:bg-indigo-700 focus:outline-none focus:ring-2
                               focus:ring-indigo-500 focus:ring-offset-2">
                        {{ __('Register') }}
                    </button>
                </div>
            </form>

            <p class="mt-6 text-center text-sm text-gray-600">
                <a href="{{ route('login') }}"
                   class="font-medium text-indigo-600 hover:text-indigo-500">
                    {{ __('Already registered?') }}
                </a>
            </p>

        </div>
    </div>

</body>
</html>
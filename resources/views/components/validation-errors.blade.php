@if ($errors->any())
    <div class="rounded-lg border border-red-200 bg-red-50 p-4 mb-6" role="alert">
        <p class="text-sm font-medium text-red-800">{{ __('Please correct the errors below.') }}</p>
        <ul class="mt-2 list-disc list-inside text-sm text-red-700 space-y-1">
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

@if (session('error'))
    <div class="rounded-lg border border-red-200 bg-red-50 p-4 mb-6" role="alert">
        <p class="text-sm font-medium text-red-800">{{ session('error') }}</p>
    </div>
@endif

@if (session('success'))
    <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-6" role="alert">
        <p class="text-sm font-medium text-emerald-800">{{ session('success') }}</p>
    </div>
@endif

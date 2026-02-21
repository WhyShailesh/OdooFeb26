@props(['label', 'variant' => 'default'])

@php
    $classes = match($variant) {
        'available' => 'bg-emerald-100 text-emerald-800',
        'in_use', 'on_trip', 'dispatched' => 'bg-amber-100 text-amber-800',
        'in_shop' => 'bg-sky-100 text-sky-800',
        'out_of_service', 'suspended', 'cancelled' => 'bg-red-100 text-red-800',
        'off_duty', 'draft' => 'bg-slate-100 text-slate-700',
        'completed' => 'bg-emerald-100 text-emerald-800',
        default => 'bg-slate-100 text-slate-700',
    };
@endphp
<span {{ $attributes->merge(['class' => 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' . $classes]) }}>{{ $label }}</span>

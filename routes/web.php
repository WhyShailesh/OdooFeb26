<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes (Breeze-stable: /, /login, /register, /dashboard, profile)
|--------------------------------------------------------------------------
*/

// Redirect unauthenticated users to login.
Route::get('/', function () {
    return redirect()->route('login');
});

require __DIR__.'/auth.php';

// Authenticated routes: dashboard and profile (Breeze standard).
Route::middleware(['auth'])->group(function () {
    // Role-based dashboard: each role sees a different view with placeholder content.
    Route::get('/dashboard', function () {
        $user = auth()->user();
        $user->load('role');
        $roleName = $user->role?->name;

        $view = match ($roleName) {
            \App\Enums\RoleName::FLEET_MANAGER => 'dashboard.manager',
            \App\Enums\RoleName::DISPATCHER => 'dashboard.dispatcher',
            \App\Enums\RoleName::SAFETY_OFFICER => 'dashboard.safety',
            \App\Enums\RoleName::FINANCIAL_ANALYST => 'dashboard.finance',
            default => 'dashboard.manager',
        };

        return view($view, ['user' => $user]);
    })->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
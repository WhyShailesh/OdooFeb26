<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $fleetManager = Role::where('name', RoleName::FLEET_MANAGER)->first();
        if (!$fleetManager) {
            return;
        }

        User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'role_id' => $fleetManager->id,
                'name' => 'Fleet Manager',
                'password' => Hash::make('password'),
            ]
        );
    }
}

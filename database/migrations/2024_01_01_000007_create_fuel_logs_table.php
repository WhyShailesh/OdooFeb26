<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fuel_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trip_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('liters', 10, 2);
            $table->decimal('cost_per_liter', 8, 2)->default(0);
            $table->decimal('odometer_km', 10, 2)->nullable();
            $table->date('fueled_at');
            $table->string('station')->nullable();
            $table->timestamps();

            $table->index(['vehicle_id', 'fueled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fuel_logs');
    }
};

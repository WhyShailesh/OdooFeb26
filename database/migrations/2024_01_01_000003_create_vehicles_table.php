<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('plate_number')->unique();
            $table->string('make');
            $table->string('model');
            $table->unsignedInteger('year');
            $table->decimal('max_capacity_kg', 12, 2); // cargo max in kg
            $table->decimal('acquisition_cost', 14, 2)->default(0);
            $table->string('status')->default('available'); // enum: available, in_use, in_shop, out_of_service
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};

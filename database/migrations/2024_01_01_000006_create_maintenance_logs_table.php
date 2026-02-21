<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // enum: oil_change, repair, inspection, tire_rotation, other
            $table->text('description')->nullable();
            $table->decimal('cost', 12, 2)->default(0);
            $table->date('performed_at');
            $table->date('due_at')->nullable();
            $table->string('vendor')->nullable();
            $table->timestamps();

            $table->index(['vehicle_id', 'performed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_logs');
    }
};

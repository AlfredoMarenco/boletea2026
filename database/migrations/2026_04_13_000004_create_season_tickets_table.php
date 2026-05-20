<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('season_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seating_map_id')->constrained()->onDelete('cascade');
            $table->uuid('seat_uuid')->index();
            $table->string('season_name')->nullable();
            $table->string('buyer_name')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['seating_map_id', 'seat_uuid']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('season_tickets');
    }
};

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
        Schema::create('seat_inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_map_id')->constrained()->onDelete('cascade');
            $table->uuid('seat_uuid')->index();
            $table->string('status')->default('available'); // available, sold, blocked, season_reserved
            $table->decimal('price', 10, 2)->nullable();
            $table->string('category')->nullable();
            $table->string('section')->nullable();
            $table->string('row')->nullable();
            $table->string('number')->nullable();
            $table->timestamps();

            $table->unique(['event_map_id', 'seat_uuid']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seat_inventories');
    }
};

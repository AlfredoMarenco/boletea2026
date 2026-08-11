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
        Schema::create('seat_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seat_inventory_id')->constrained('seat_inventories')->onDelete('cascade');
            $table->string('reservation_number')->unique();
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
            $table->timestamp('reserved_at');
            $table->timestamp('expires_at')->nullable();
            $table->unsignedBigInteger('user_id')->nullable(); // optional link to user
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seat_reservations');
    }
};

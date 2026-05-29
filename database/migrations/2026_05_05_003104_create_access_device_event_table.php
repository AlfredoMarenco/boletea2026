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
        Schema::create('access_device_event', function (Blueprint $table) {
            $table->id();
            $table->foreignId('access_event_id')->constrained()->onDelete('cascade');
            $table->foreignId('access_device_id')->constrained()->onDelete('cascade');
            $table->json('allowed_sections')->nullable();
            $table->timestamps();

            $table->unique(['access_event_id', 'access_device_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_device_event');
    }
};

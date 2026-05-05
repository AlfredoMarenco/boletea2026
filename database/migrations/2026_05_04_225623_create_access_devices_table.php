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
        Schema::create('access_devices', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('device_identifier')->unique(); // UUID/MAC
            $table->string('api_token')->nullable(); // Optional, if not using Sanctum table directly
            $table->string('status')->default('active');
            $table->dateTime('last_sync_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_devices');
    }
};

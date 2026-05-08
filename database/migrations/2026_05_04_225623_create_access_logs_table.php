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
        Schema::create('access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('access_event_id')->constrained('access_events')->onDelete('cascade');
            $table->foreignId('access_code_id')->nullable()->constrained('access_codes')->onDelete('set null');
            $table->foreignId('access_device_id')->constrained('access_devices')->onDelete('cascade');
            $table->string('scanned_code');
            $table->string('result'); // 'success', 'duplicate', 'invalid', 'error'
            $table->dateTime('scanned_at'); // From device
            $table->dateTime('sync_at')->useCurrent(); // When received by server
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_logs');
    }
};

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
        Schema::create('access_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('access_event_id')->constrained('access_events')->onDelete('cascade');
            $table->string('code')->index();
            $table->string('type')->nullable(); // e.g. 'General', 'VIP'
            $table->string('status')->default('pending'); // 'pending', 'used', 'cancelled'
            $table->dateTime('scanned_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_codes');
    }
};

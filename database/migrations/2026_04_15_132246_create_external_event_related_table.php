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
        Schema::create('external_event_related', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('external_events')->onDelete('cascade');
            $table->foreignId('child_id')->constrained('external_events')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['parent_id', 'child_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_event_related');
    }
};

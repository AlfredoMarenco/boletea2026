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
        Schema::table('external_events', function (Blueprint $table) {
            $table->boolean('show_calendar')->default(true);
            $table->text('calendar_description')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('external_events', function (Blueprint $table) {
            $table->dropColumn(['show_calendar', 'calendar_description']);
        });
    }
};

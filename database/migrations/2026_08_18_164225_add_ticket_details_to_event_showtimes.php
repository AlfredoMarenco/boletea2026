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
        Schema::table('event_showtimes', function (Blueprint $table) {
            $table->text('ticket_notes')->nullable()->after('seat_overrides');
            $table->text('ticket_terms')->nullable()->after('ticket_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_showtimes', function (Blueprint $table) {
            $table->dropColumn(['ticket_notes', 'ticket_terms']);
        });
    }
};

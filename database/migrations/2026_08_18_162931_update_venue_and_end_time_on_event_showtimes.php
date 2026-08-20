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
        Schema::table('events', function (Blueprint $table) {
            $table->unsignedBigInteger('venue_id')->nullable()->change();
        });

        Schema::table('event_showtimes', function (Blueprint $table) {
            $table->foreignId('venue_id')->nullable()->after('event_id')->constrained('venues')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_showtimes', function (Blueprint $table) {
            $table->dropForeign(['venue_id']);
            $table->dropColumn('venue_id');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->unsignedBigInteger('venue_id')->nullable(false)->change();
        });
    }
};

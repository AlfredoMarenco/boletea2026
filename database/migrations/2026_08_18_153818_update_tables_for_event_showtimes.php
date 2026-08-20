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
        Schema::table('event_prices', function (Blueprint $table) {
            $table->foreignId('event_showtime_id')->nullable()->after('id')->constrained('event_showtimes')->onDelete('cascade');
            $table->unsignedBigInteger('event_id')->nullable()->change();
        });

        Schema::table('seat_inventories', function (Blueprint $table) {
            $table->foreignId('event_showtime_id')->nullable()->after('id')->constrained('event_showtimes')->onDelete('cascade');
            $table->unsignedBigInteger('event_map_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_prices', function (Blueprint $table) {
            $table->dropForeign(['event_showtime_id']);
            $table->dropColumn('event_showtime_id');
        });

        Schema::table('seat_inventories', function (Blueprint $table) {
            $table->dropForeign(['event_showtime_id']);
            $table->dropColumn('event_showtime_id');
        });
    }
};

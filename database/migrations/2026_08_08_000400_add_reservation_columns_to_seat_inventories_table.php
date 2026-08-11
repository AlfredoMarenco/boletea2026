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
        Schema::table('seat_inventories', function (Blueprint $table) {
            $table->timestamp('reserved_expires_at')->nullable()->index();
            $table->string('session_id')->nullable()->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seat_inventories', function (Blueprint $table) {
            $table->dropColumn(['reserved_expires_at', 'session_id']);
        });
    }
};

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
        Schema::table('access_device_event', function (Blueprint $table) {
            $table->foreignId('access_device_group_id')
                ->nullable()
                ->constrained('access_device_groups')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_device_event', function (Blueprint $table) {
            $table->dropForeign(['access_device_group_id']);
            $table->dropColumn('access_device_group_id');
        });
    }
};

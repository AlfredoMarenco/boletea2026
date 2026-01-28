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
            $table->string('secondary_image_path')->nullable()->after('image_path');
            $table->dateTime('sales_start_date')->nullable()->after('category');
            $table->text('ticket_text')->nullable()->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('external_events', function (Blueprint $table) {
            $table->dropColumn(['secondary_image_path', 'sales_start_date', 'ticket_text']);
        });
    }
};

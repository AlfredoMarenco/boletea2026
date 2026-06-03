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
            $table->dropColumn('capacity');
            $table->boolean('web_sales_enabled')->default(true)->after('bank_commission');
            $table->boolean('box_office_sales_enabled')->default(true)->after('web_sales_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_prices', function (Blueprint $table) {
            $table->integer('capacity')->nullable();
            $table->dropColumn(['web_sales_enabled', 'box_office_sales_enabled']);
        });
    }
};

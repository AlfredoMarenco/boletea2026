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
        Schema::table('sales_centers', function (Blueprint $table) {
            $table->boolean('is_digital_only')->default(false);
            $table->boolean('payment_methods_cash')->default(false);
            $table->boolean('payment_methods_card')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_centers', function (Blueprint $table) {
            $table->dropColumn(['is_digital_only', 'payment_methods_cash', 'payment_methods_card']);
        });
    }
};

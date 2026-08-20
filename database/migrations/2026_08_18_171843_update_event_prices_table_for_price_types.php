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
            $table->foreignId('price_type_id')->nullable()->after('event_showtime_id')->constrained('price_types')->onDelete('cascade');
            $table->decimal('printed_price', 10, 2)->default(0)->after('price');
            $table->decimal('admin_fee', 10, 2)->default(0)->after('bank_commission');
            $table->boolean('is_enabled')->default(true)->after('admin_fee');
            $table->boolean('is_web_default')->default(false)->after('web_sales_enabled');
            $table->boolean('is_pos_default')->default(false)->after('box_office_sales_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_prices', function (Blueprint $table) {
            $table->dropForeign(['price_type_id']);
            $table->dropColumn([
                'price_type_id',
                'printed_price',
                'admin_fee',
                'is_enabled',
                'is_web_default',
                'is_pos_default',
            ]);
        });
    }
};

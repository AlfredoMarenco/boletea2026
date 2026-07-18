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
        Schema::table('refund_purchases', function (Blueprint $table) {
            $table->string('card_last_four')->nullable()->after('payment_method');
        });

        Schema::table('refund_requests', function (Blueprint $table) {
            $table->string('card_last_four')->nullable()->after('clabe');
            $table->json('validated_tickets')->nullable()->after('tickets_path');
            $table->string('ine_path')->nullable()->change(); // Let's make ine_path nullable just in case or keep it as is.
            $table->string('tickets_path')->nullable()->change(); // This needs to be nullable because web/card orders won't require tickets file.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('refund_purchases', function (Blueprint $table) {
            $table->dropColumn('card_last_four');
        });

        Schema::table('refund_requests', function (Blueprint $table) {
            $table->dropColumn(['card_last_four', 'validated_tickets']);
            $table->string('tickets_path')->nullable(false)->change();
        });
    }
};

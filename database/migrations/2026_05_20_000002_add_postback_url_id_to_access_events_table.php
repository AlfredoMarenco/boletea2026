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
        Schema::table('access_events', function (Blueprint $table) {
            if (Schema::hasColumn('access_events', 'postback_url')) {
                $table->dropColumn('postback_url');
            }
            $table->foreignId('postback_url_id')->nullable()->constrained('postback_urls')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_events', function (Blueprint $table) {
            $table->dropForeign(['postback_url_id']);
            $table->dropColumn('postback_url_id');
            $table->string('postback_url')->nullable();
        });
    }
};

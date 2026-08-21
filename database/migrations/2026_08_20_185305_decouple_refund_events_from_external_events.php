<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('refund_events', 'title')) {
            Schema::table('refund_events', function (Blueprint $table) {
                $table->string('title')->nullable()->after('external_event_id');
            });
        }

        // Backfill title for existing refund_events using standard SQL
        DB::statement('
            UPDATE refund_events
            SET title = (SELECT title FROM external_events WHERE external_events.id = refund_events.external_event_id)
            WHERE (title IS NULL OR title = "") AND external_event_id IS NOT NULL
        ');

        // Safely drop foreign key if it exists
        try {
            Schema::table('refund_events', function (Blueprint $table) {
                $table->dropForeign(['external_event_id']);
            });
        } catch (Throwable $e) {
            // Ignore if foreign key did not exist
        }

        // Drop unique constraint to allow nulls and soft decoupling
        try {
            Schema::table('refund_events', function (Blueprint $table) {
                $table->dropUnique('refund_events_external_event_id_unique');
            });
        } catch (Throwable $e) {
            // Ignore if unique index was already dropped
        }

        // Nullify external_event_id for any orphaned records whose external_event no longer exists
        DB::statement('
            UPDATE refund_events
            SET external_event_id = NULL
            WHERE external_event_id IS NOT NULL
              AND external_event_id NOT IN (SELECT id FROM external_events)
        ');

        Schema::table('refund_events', function (Blueprint $table) {
            $table->foreignId('external_event_id')->nullable()->change();
            $table->foreign('external_event_id')->references('id')->on('external_events')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            Schema::table('refund_events', function (Blueprint $table) {
                $table->dropForeign(['external_event_id']);
            });
        } catch (Throwable $e) {
        }

        Schema::table('refund_events', function (Blueprint $table) {
            $table->foreign('external_event_id')->references('id')->on('external_events')->cascadeOnDelete();
            $table->dropColumn('title');
        });
    }
};

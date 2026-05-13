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
        Schema::create('access_postback_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('access_event_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('barcode');
            $table->string('status')->nullable();
            $table->json('payload')->nullable();
            $table->text('response')->nullable();
            $table->integer('status_code')->nullable();
            $table->timestamp('scanned_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_postback_logs');
    }
};

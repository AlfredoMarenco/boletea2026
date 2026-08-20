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
        Schema::create('showtime_promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_showtime_id')->constrained('event_showtimes')->onDelete('cascade');
            $table->string('code')->nullable();
            $table->string('name');
            $table->string('type')->default('percentage_discount'); // percentage_discount, fixed_discount, 2x1, access_code
            $table->decimal('value', 10, 2)->default(0.00);
            $table->dateTime('start_at')->nullable();
            $table->dateTime('end_at')->nullable();
            $table->integer('usage_limit')->nullable();
            $table->integer('times_used')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('showtime_promotions');
    }
};

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
        Schema::create('event_showtimes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->foreignId('seating_map_id')->constrained()->onDelete('restrict');
            $table->string('name');
            $table->dateTime('date_time');
            $table->dateTime('doors_open_at')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->dateTime('web_sales_start_at')->nullable();
            $table->dateTime('web_sales_end_at')->nullable();
            $table->dateTime('box_office_sales_start_at')->nullable();
            $table->dateTime('box_office_sales_end_at')->nullable();
            $table->integer('max_tickets_per_cart')->default(6);
            $table->string('status')->default('draft');
            $table->json('layout_snapshot')->nullable();
            $table->json('seat_overrides')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_showtimes');
    }
};

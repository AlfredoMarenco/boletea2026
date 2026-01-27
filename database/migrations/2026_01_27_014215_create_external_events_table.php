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
        Schema::create('external_events', function (Blueprint $table) {
            $table->id();
            $table->string('external_id')->unique();
            $table->string('title');
            $table->string('city')->nullable();
            $table->string('category')->nullable();
            $table->longText('description')->nullable();
            $table->string('image_path')->nullable();
            $table->json('sales_centers')->nullable();
            $table->string('status')->default('draft'); // draft, published
            $table->json('raw_data')->nullable(); // Store original API response just in case
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_events');
    }
};

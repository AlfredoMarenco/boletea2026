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
        Schema::create('sales_centers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('logo_path')->nullable();
            $table->text('address');
            $table->text('google_map_url')->nullable();
            $table->json('opening_hours')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_centers');
    }
};

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
        Schema::create('external_event_sales_center_group', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_event_id')->constrained()->onDelete('cascade');
            $table->foreignId('sales_center_group_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_event_sales_center_group');
    }
};

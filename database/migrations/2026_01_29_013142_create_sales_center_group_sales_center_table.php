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
        Schema::create('sales_center_group_sales_center', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_center_group_id')->constrained()->onDelete('cascade');
            $table->foreignId('sales_center_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_center_group_sales_center');
    }
};

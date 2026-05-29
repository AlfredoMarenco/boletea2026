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
        Schema::create('mailing_audience_contact', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mailing_audience_id')->constrained()->onDelete('cascade');
            $table->foreignId('mailing_list_id')->constrained('mailing_lists')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mailing_audience_contact');
    }
};

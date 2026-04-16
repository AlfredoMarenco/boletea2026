<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mailing_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');                         // Nombre interno de la campaña
            $table->string('subject');                      // Asunto del correo
            $table->text('message');                        // Cuerpo del mensaje
            $table->string('image_path')->nullable();       // Imagen adjunta / inline
            $table->string('event_name')->nullable();       // Nombre del evento (p.ej. "Gala con causa")
            $table->enum('status', ['draft', 'queued', 'sending', 'sent', 'failed'])->default('draft');
            $table->integer('total_recipients')->default(0);
            $table->integer('sent_count')->default(0);
            $table->integer('failed_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mailing_campaigns');
    }
};

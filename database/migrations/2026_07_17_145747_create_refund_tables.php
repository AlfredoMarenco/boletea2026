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
        // 1. refund_events (link to external_events)
        Schema::create('refund_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_event_id')->unique()->constrained('external_events')->onDelete('cascade');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        // 2. refund_purchases (imported data from CSV)
        Schema::create('refund_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('refund_event_id')->constrained('refund_events')->onDelete('cascade');
            $table->string('order_number');
            $table->string('email')->nullable(); // Can be null for cash payments
            $table->string('buyer_name')->nullable();
            $table->string('payment_method')->nullable();
            $table->decimal('amount', 12, 2)->default(0.00);
            $table->json('tickets_details')->nullable(); // Detailed info (barcodes, seats)
            $table->timestamps();

            // Indexes for fast lookup
            $table->index(['refund_event_id', 'order_number']);
            $table->index(['refund_event_id', 'email']);
        });

        // 3. refund_requests (customer refund requests)
        Schema::create('refund_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('refund_event_id')->constrained('refund_events')->onDelete('cascade');
            $table->foreignId('refund_purchase_id')->nullable()->constrained('refund_purchases')->onDelete('set null');
            $table->string('order_number');
            $table->string('email')->nullable();
            $table->string('buyer_name');
            $table->string('clabe', 18);
            $table->string('ine_path');
            $table->string('proof_of_payment_path')->nullable();
            $table->string('tickets_path');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['refund_event_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refund_requests');
        Schema::dropIfExists('refund_purchases');
        Schema::dropIfExists('refund_events');
    }
};

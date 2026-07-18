<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefundRequest extends Model
{
    protected $fillable = [
        'refund_event_id',
        'refund_purchase_id',
        'order_number',
        'email',
        'buyer_name',
        'clabe',
        'bank_name',
        'card_last_four',
        'ine_path',
        'proof_of_payment_path',
        'tickets_path',
        'validated_tickets',
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'validated_tickets' => 'array',
    ];

    public function refundEvent(): BelongsTo
    {
        return $this->belongsTo(RefundEvent::class);
    }

    public function refundPurchase(): BelongsTo
    {
        return $this->belongsTo(RefundPurchase::class);
    }
}

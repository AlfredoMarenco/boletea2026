<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefundPurchase extends Model
{
    protected $fillable = [
        'refund_event_id',
        'order_number',
        'email',
        'buyer_name',
        'payment_method',
        'card_last_four',
        'amount',
        'tickets_details',
    ];

    protected $casts = [
        'tickets_details' => 'array',
        'amount' => 'decimal:2',
    ];

    public function refundEvent(): BelongsTo
    {
        return $this->belongsTo(RefundEvent::class);
    }
}

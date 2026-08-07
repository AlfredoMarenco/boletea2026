<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefundRequestHistory extends Model
{
    protected $fillable = [
        'refund_request_id',
        'user_id',
        'action',
        'description',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    public function refundRequest(): BelongsTo
    {
        return $this->belongsTo(RefundRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

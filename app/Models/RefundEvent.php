<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RefundEvent extends Model
{
    protected $fillable = [
        'external_event_id',
        'status',
    ];

    public function externalEvent(): BelongsTo
    {
        return $this->belongsTo(ExternalEvent::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(RefundPurchase::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(RefundRequest::class);
    }
}

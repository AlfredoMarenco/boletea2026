<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShowtimePromotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_showtime_id',
        'code',
        'name',
        'type',
        'value',
        'start_at',
        'end_at',
        'usage_limit',
        'times_used',
        'is_active',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'value' => 'decimal:2',
        'is_active' => 'boolean',
        'usage_limit' => 'integer',
        'times_used' => 'integer',
    ];

    public function showtime()
    {
        return $this->belongsTo(EventShowtime::class, 'event_showtime_id');
    }
}

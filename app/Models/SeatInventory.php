<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeatInventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_map_id',
        'event_showtime_id',
        'seat_uuid',
        'status',
        'price',
        'category',
        'section',
        'row',
        'number',
        'reserved_expires_at',
        'session_id',
    ];

    protected $casts = [
        'reserved_expires_at' => 'datetime',
        'price' => 'decimal:2',
    ];

    public function eventMap()
    {
        return $this->belongsTo(EventMap::class);
    }

    public function showtime()
    {
        return $this->belongsTo(EventShowtime::class, 'event_showtime_id');
    }
}

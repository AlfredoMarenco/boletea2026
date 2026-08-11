<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeatInventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_map_id',
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
    ];

    public function eventMap()
    {
        return $this->belongsTo(EventMap::class);
    }
}

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
    ];

    public function eventMap()
    {
        return $this->belongsTo(EventMap::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventMap extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'seating_map_id',
        'settings_json',
    ];

    protected $casts = [
        'settings_json' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function seatingMap()
    {
        return $this->belongsTo(SeatingMap::class);
    }

    public function seatInventories()
    {
        return $this->hasMany(SeatInventory::class);
    }
}

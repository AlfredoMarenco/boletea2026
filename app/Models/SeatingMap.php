<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeatingMap extends Model
{
    use HasFactory;

    protected $fillable = [
        'venue_id',
        'name',
        'layout_json',
        'is_active',
    ];

    protected $casts = [
        'layout_json' => 'array',
        'is_active' => 'boolean',
    ];

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function eventMaps()
    {
        return $this->hasMany(EventMap::class);
    }

    public function seasonTickets()
    {
        return $this->hasMany(SeasonTicket::class);
    }
}

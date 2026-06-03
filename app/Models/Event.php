<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'start_date',
        'end_date',
        'venue_id',
        'status',
        'image_path',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function eventMaps()
    {
        return $this->hasMany(EventMap::class);
    }

    public function prices()
    {
        return $this->hasMany(EventPrice::class);
    }
}

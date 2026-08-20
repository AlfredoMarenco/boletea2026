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

    public function showtimes()
    {
        return $this->hasMany(EventShowtime::class);
    }

    public function canBeDeleted(): bool
    {
        foreach ($this->showtimes as $showtime) {
            if (! $showtime->canBeDeleted()) {
                return false;
            }
        }

        return true;
    }
}

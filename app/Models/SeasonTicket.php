<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeasonTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'seating_map_id',
        'seat_uuid',
        'season_name',
        'buyer_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function seatingMap()
    {
        return $this->belongsTo(SeatingMap::class);
    }
}

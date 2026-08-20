<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventShowtime extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'venue_id',
        'seating_map_id',
        'name',
        'date_time',
        'doors_open_at',
        'end_time',
        'web_sales_start_at',
        'web_sales_end_at',
        'box_office_sales_start_at',
        'box_office_sales_end_at',
        'max_tickets_per_cart',
        'status',
        'layout_snapshot',
        'seat_overrides',
        'ticket_notes',
        'ticket_terms',
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'doors_open_at' => 'datetime',
        'end_time' => 'datetime',
        'web_sales_start_at' => 'datetime',
        'web_sales_end_at' => 'datetime',
        'box_office_sales_start_at' => 'datetime',
        'box_office_sales_end_at' => 'datetime',
        'max_tickets_per_cart' => 'integer',
        'layout_snapshot' => 'array',
        'seat_overrides' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function seatingMap()
    {
        return $this->belongsTo(SeatingMap::class);
    }

    public function prices()
    {
        return $this->hasMany(EventPrice::class, 'event_showtime_id');
    }

    public function seatInventories()
    {
        return $this->hasMany(SeatInventory::class, 'event_showtime_id');
    }

    public function promotions()
    {
        return $this->hasMany(ShowtimePromotion::class, 'event_showtime_id');
    }

    public function canBeDeleted(): bool
    {
        return ! $this->seatInventories()->whereIn('status', ['sold', 'reserved'])->exists();
    }
}

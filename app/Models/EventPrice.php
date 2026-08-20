<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'event_showtime_id',
        'price_type_id',
        'name',
        'price',
        'printed_price',
        'service_charge',
        'bank_commission',
        'admin_fee',
        'is_enabled',
        'web_sales_enabled',
        'box_office_sales_enabled',
        'is_web_default',
        'is_pos_default',
        'color',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'web_sales_enabled' => 'boolean',
        'box_office_sales_enabled' => 'boolean',
        'is_web_default' => 'boolean',
        'is_pos_default' => 'boolean',
        'price' => 'decimal:2',
        'printed_price' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'bank_commission' => 'decimal:2',
        'admin_fee' => 'decimal:2',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function showtime()
    {
        return $this->belongsTo(EventShowtime::class, 'event_showtime_id');
    }

    public function priceType()
    {
        return $this->belongsTo(PriceType::class);
    }
}

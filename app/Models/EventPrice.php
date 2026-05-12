<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventPrice extends Model
{
    protected $fillable = [
        'event_id',
        'name',
        'price',
        'service_charge',
        'bank_commission',
        'web_sales_enabled',
        'box_office_sales_enabled',
        'color',
    ];

    protected $casts = [
        'web_sales_enabled' => 'boolean',
        'box_office_sales_enabled' => 'boolean',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}

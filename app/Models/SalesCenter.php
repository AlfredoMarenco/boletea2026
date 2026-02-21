<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesCenter extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'name',
        'logo_path',
        'address',
        'latitude',
        'longitude',
        'google_map_url',
        'opening_hours',
        'is_active',
        'is_digital_only',
        'payment_methods_cash',
        'payment_methods_card',
    ];

    protected $casts = [
        'opening_hours' => 'array',
        'is_active' => 'boolean',
        'is_digital_only' => 'boolean',
        'payment_methods_cash' => 'boolean',
        'payment_methods_card' => 'boolean',
        'latitude' => 'double',
        'longitude' => 'double',
    ];

    public function externalEvents()
    {
        return $this->belongsToMany(ExternalEvent::class, 'external_event_sales_center');
    }

    public function states()
    {
        return $this->belongsToMany(State::class, 'sales_center_state');
    }

    public function groups()
    {
        return $this->belongsToMany(SalesCenterGroup::class, 'sales_center_group_sales_center');
    }
}

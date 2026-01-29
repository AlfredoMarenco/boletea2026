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
        'google_map_url',
        'opening_hours',
        'is_active',
    ];

    protected $casts = [
        'opening_hours' => 'array',
        'is_active' => 'boolean',
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

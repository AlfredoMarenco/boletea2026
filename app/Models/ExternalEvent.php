<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternalEvent extends Model
{
    protected $fillable = [
        'external_id',
        'title',
        'city',
        'category',
        'description',
        'image_path',
        'secondary_image_path',
        'sales_start_date',
        'start_date',
        'end_date',
        'button_text',
        'state_id',
        'city_id',
        'venue_id',
        'status',
        'raw_data',
        'sales_centers',
        'performance_url',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'sales_centers' => 'array',
        'sales_start_date' => 'datetime',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function salesCenters()
    {
        return $this->belongsToMany(SalesCenter::class , 'external_event_sales_center');
    }

    public function salesCenterGroups()
    {
        return $this->belongsToMany(SalesCenterGroup::class , 'external_event_sales_center_group');
    }

    public function state()
    {
        return $this->belongsTo(State::class);
    }

    public function cityLocation()
    {
        return $this->belongsTo(City::class , 'city_id');
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class);
    }

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }
}

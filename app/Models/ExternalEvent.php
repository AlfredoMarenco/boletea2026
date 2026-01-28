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
        'button_text',
        'button_text',
        'status',
        'raw_data',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'sales_start_date' => 'datetime',
    ];

    public function salesCenters()
    {
        return $this->belongsToMany(SalesCenter::class, 'external_event_sales_center');
    }
}

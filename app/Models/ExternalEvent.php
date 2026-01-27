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
        'sales_centers',
        'status',
        'raw_data',
    ];

    protected $casts = [
        'sales_centers' => 'array',
        'raw_data' => 'array',
    ];
}

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
}

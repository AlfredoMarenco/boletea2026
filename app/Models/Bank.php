<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bank extends Model
{
    protected $fillable = [
        'code',
        'name',
        'enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];
}

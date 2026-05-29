<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostbackUrl extends Model
{
    protected $fillable = [
        'name',
        'url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function accessEvents()
    {
        return $this->hasMany(AccessEvent::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class State extends Model
{
    protected $fillable = ['name', 'latitude', 'longitude'];

    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }

    public function salesCenters(): BelongsToMany
    {
        return $this->belongsToMany(SalesCenter::class, 'sales_center_state');
    }

    public function externalEvents(): HasMany
    {
        return $this->hasMany(ExternalEvent::class);
    }
}

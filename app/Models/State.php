<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class State extends Model
{
    protected $fillable = ['name'];

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

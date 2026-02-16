<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class City extends Model
{
    protected $fillable = ['name', 'state_id', 'latitude', 'longitude'];

    public function state(): BelongsTo
    {
        return $this->belongsTo(State::class);
    }

    public function externalEvents(): HasMany
    {
        return $this->hasMany(ExternalEvent::class);
    }
}

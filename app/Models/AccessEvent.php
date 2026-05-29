<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccessEvent extends Model
{
    protected $fillable = [
        'external_event_id',
        'name',
        'date',
        'description',
        'postback_url_id',
        'status',
    ];

    protected $casts = [
        'date' => 'datetime',
    ];

    public function externalEvent()
    {
        return $this->belongsTo(ExternalEvent::class);
    }

    public function codes()
    {
        return $this->hasMany(AccessCode::class);
    }

    public function logs()
    {
        return $this->hasMany(AccessLog::class);
    }

    public function devices()
    {
        return $this->belongsToMany(AccessDevice::class, 'access_device_event')
            ->withPivot('allowed_sections')
            ->withTimestamps()
            ->as('configuration');
    }

    public function postback()
    {
        return $this->belongsTo(PostbackUrl::class, 'postback_url_id');
    }
}

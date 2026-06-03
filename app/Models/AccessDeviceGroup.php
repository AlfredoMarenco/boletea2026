<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccessDeviceGroup extends Model
{
    protected $fillable = [
        'access_event_id',
        'name',
        'description',
        'allowed_sections',
    ];

    protected $casts = [
        'allowed_sections' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(AccessEvent::class, 'access_event_id');
    }

    public function devices()
    {
        return $this->belongsToMany(AccessDevice::class, 'access_device_event', 'access_device_group_id', 'access_device_id')
            ->withPivot('allowed_sections')
            ->withTimestamps()
            ->as('configuration');
    }
}

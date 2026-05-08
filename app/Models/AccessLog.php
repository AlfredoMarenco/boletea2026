<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccessLog extends Model
{
    protected $fillable = [
        'access_event_id',
        'access_code_id',
        'access_device_id',
        'scanned_code',
        'result',
        'metadata',
        'scanned_at',
        'sync_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'scanned_at' => 'datetime',
        'sync_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(AccessEvent::class, 'access_event_id');
    }

    public function code()
    {
        return $this->belongsTo(AccessCode::class, 'access_code_id');
    }

    public function device()
    {
        return $this->belongsTo(AccessDevice::class, 'access_device_id');
    }
}

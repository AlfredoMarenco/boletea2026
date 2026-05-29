<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccessCode extends Model
{
    protected $fillable = [
        'access_event_id',
        'code',
        'type',
        'metadata',
        'status',
        'scanned_at',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(AccessEvent::class, 'access_event_id');
    }

    public function logs()
    {
        return $this->hasMany(AccessLog::class);
    }
}

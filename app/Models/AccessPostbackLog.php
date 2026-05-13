<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccessPostbackLog extends Model
{
    protected $fillable = [
        'access_event_id',
        'barcode',
        'status',
        'payload',
        'response',
        'status_code',
        'scanned_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'scanned_at' => 'datetime',
        ];
    }

    public function event()
    {
        return $this->belongsTo(AccessEvent::class, 'access_event_id');
    }
}

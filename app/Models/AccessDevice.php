<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class AccessDevice extends Model implements AuthenticatableContract
{
    use Authenticatable, HasApiTokens;

    protected $fillable = [
        'name',
        'device_identifier',
        'api_token',
        'status',
        'last_sync_at',
    ];

    protected $casts = [
        'last_sync_at' => 'datetime',
    ];

    public function logs()
    {
        return $this->hasMany(AccessLog::class);
    }

    public function events()
    {
        return $this->belongsToMany(AccessEvent::class, 'access_device_event')
            ->withPivot('allowed_sections')
            ->withTimestamps()
            ->as('configuration');
    }
}

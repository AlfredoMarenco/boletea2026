<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApkVersion extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'version_name',
        'version_code',
        'apk_path',
        'force_update',
        'description',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'force_update' => 'boolean',
            'is_active' => 'boolean',
            'version_code' => 'integer',
        ];
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MailingList extends Model
{
    protected $fillable = [
        'name',
        'email',
        'zone',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Scope: solo destinatarios activos.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
}

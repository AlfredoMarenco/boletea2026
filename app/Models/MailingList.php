<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Audiencias a las que pertenece este contacto.
     */
    public function audiences(): BelongsToMany
    {
        return $this->belongsToMany(MailingAudience::class, 'mailing_audience_contact', 'mailing_list_id', 'mailing_audience_id')
            ->withTimestamps();
    }
}

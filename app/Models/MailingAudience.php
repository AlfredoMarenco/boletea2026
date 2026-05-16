<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MailingAudience extends Model
{
    protected $fillable = ['name', 'description'];

    /**
     * Contactos que pertenecen a esta audiencia.
     */
    public function contacts(): BelongsToMany
    {
        return $this->belongsToMany(MailingList::class, 'mailing_audience_contact', 'mailing_audience_id', 'mailing_list_id')
            ->withTimestamps();
    }
}

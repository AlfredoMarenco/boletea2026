<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MailingCampaign extends Model
{
    protected $fillable = [
        'name',
        'subject',
        'message',
        'image_path',
        'event_name',
        'status',
        'total_recipients',
        'mailing_audience_id',
        'sent_count',
        'failed_count',
        'sent_at',
    ];

    public function audience(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(MailingAudience::class, 'mailing_audience_id');
    }

    protected $casts = [
        'sent_at' => 'datetime',
    ];
}

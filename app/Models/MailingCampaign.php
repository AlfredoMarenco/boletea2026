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
        'sent_count',
        'failed_count',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];
}

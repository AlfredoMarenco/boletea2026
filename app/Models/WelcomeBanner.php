<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WelcomeBanner extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'image_path',
        'external_link',
        'external_event_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function event()
    {
        return $this->belongsTo(ExternalEvent::class, 'external_event_id');
    }

    public function getResolvedImageAttribute()
    {
        if ($this->image_path) {
            return $this->image_path;
        }

        if ($this->event && $this->event->image_path) {
            return $this->event->image_path;
        }

        return null;
    }

    public function getResolvedLinkAttribute()
    {
        if ($this->external_link) {
            return $this->external_link;
        }

        if ($this->event) {
            if ($this->event->redirect_external && $this->event->performance_url) {
                return $this->event->performance_url;
            }

            return route('event.show', $this->event->slug ?? $this->event->id);
        }

        return '#'; // Fallback
    }

    public function getResolvedTitleAttribute()
    {
        if ($this->title) {
            return $this->title;
        }

        if ($this->event) {
            return $this->event->title;
        }

        return 'Recomendado';
    }

    // Virtual attribute appends for frontend convenience
    protected $appends = ['resolved_image', 'resolved_link', 'resolved_title'];
}

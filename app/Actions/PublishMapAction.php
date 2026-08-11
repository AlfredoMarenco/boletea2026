<?php

namespace App\Actions;

use App\Models\EventMap;
use Illuminate\Support\Str;

class PublishMapAction
{
    /**
     * Publish the given EventMap and generate a public URL.
     */
    public function execute(EventMap $eventMap): string
    {
        // Mark as published
        $eventMap->update(['status' => 'published']);

        // Generate a public slug if missing
        if (empty($eventMap->slug)) {
            $eventMap->slug = Str::slug($eventMap->id . '-' . now()->timestamp);
            $eventMap->save();
        }

        // Assume route name "maps.show" is defined for public view
        return route('maps.show', ['slug' => $eventMap->slug]);
    }
}

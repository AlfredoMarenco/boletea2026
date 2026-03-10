<?php

namespace App\Http\Controllers;

use App\Models\ExternalEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function show($slug)
    {
        $event = ExternalEvent::with(['venue', 'salesCenters', 'salesCenterGroups.salesCenters', 'state', 'cityLocation', 'categories'])
            ->where('slug', $slug)
            ->orWhere('id', $slug)
            ->firstOrFail();

        if ($event->status !== 'published') {
            return redirect()->route('home');
        }

        $id = $event->id; // for related events logic
        $directSalesCenters = $event->salesCenters;
        $groupSalesCenters = $event->salesCenterGroups->flatMap(function ($group) {
            return $group->salesCenters;
        });

        // Merge and unique by ID, re-index values
        $salesCentersDetails = $directSalesCenters->merge($groupSalesCenters)->unique('id')->values();

        // Related Events Logic
        $relatedEvents = ExternalEvent::with(['venue', 'state', 'cityLocation', 'categories'])->where('id', '!=', $id)
            ->where('status', 'published')
            ->where(function ($query) use ($event) {
                if ($event->category) {
                    $query->where('category', $event->category);
                }
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->inRandomOrder()
            ->take(3)
            ->get();

        // Fallback if not enough related events
        if ($relatedEvents->count() < 3) {
            $moreEvents = ExternalEvent::with(['venue', 'state', 'cityLocation', 'categories'])->where('id', '!=', $id)
                ->whereNotIn('id', $relatedEvents->pluck('id'))
                ->where('status', 'published')
                ->where(function ($q) {
                    $q->whereNull('end_date')
                        ->orWhere('end_date', '>=', now());
                })
                ->inRandomOrder()
                ->take(3 - $relatedEvents->count())
                ->get();
            $relatedEvents = $relatedEvents->merge($moreEvents);
        }

        $title = trim(preg_replace('/^[A-Z0-9]+\s+/', '', $event->title));
        $description = $event->description ? substr(strip_tags($event->description), 0, 160) . '...' : "Boletos para {$title} en Boletea.";
        $image = $event->image_path ? asset($event->image_path) : null;

        return Inertia::render('Event/Show', [
            'event' => $event,
            'salesCentersDetails' => $salesCentersDetails,
            'relatedEvents' => $relatedEvents
        ])->withViewData([
            'meta' => [
                'title' => $title . ' - Boletea',
                'description' => $description,
                'image' => $image,
                'url' => route('event.show', $slug)
            ]
        ]);
    }
}

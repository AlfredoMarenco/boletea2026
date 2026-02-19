<?php

namespace App\Http\Controllers;

use App\Models\ExternalEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function show($id)
    {
        $event = ExternalEvent::with(['venue', 'salesCenters', 'salesCenterGroups.salesCenters'])->findOrFail($id);

        $directSalesCenters = $event->salesCenters;
        $groupSalesCenters = $event->salesCenterGroups->flatMap(function ($group) {
            return $group->salesCenters;
        });

        // Merge and unique by ID, re-index values
        $salesCentersDetails = $directSalesCenters->merge($groupSalesCenters)->unique('id')->values();

        // Related Events Logic
        $relatedEvents = ExternalEvent::where('id', '!=', $id)
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
            $moreEvents = ExternalEvent::where('id', '!=', $id)
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

        return Inertia::render('Event/Show', [
            'event' => $event,
            'salesCentersDetails' => $salesCentersDetails,
            'relatedEvents' => $relatedEvents
        ]);
    }
}

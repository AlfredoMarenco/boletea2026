<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\SeatInventory;
use Inertia\Inertia;

class LocalEventBookingController extends Controller
{
    public function show($slug)
    {
        $event = Event::with(['venue', 'eventMaps.seatingMap', 'prices'])
            ->where('slug', $slug)
            ->firstOrFail();

        // Check if event is published
        if ($event->status !== 'published' && ! auth()->check()) {
            return redirect()->route('home');
        }

        $eventMap = $event->eventMaps->first();

        if (! $eventMap || ! $eventMap->seatingMap) {
            abort(404, 'Este evento no tiene un mapa de asientos configurado.');
        }

        // Get seat inventories to map their current status
        $inventories = SeatInventory::where('event_map_id', $eventMap->id)
            ->select('seat_uuid', 'status', 'price', 'category', 'section', 'row', 'number')
            ->get()
            ->keyBy('seat_uuid');

        return Inertia::render('Public/EventBooking', [
            'event' => $event,
            'seatingMap' => $eventMap->seatingMap,
            'inventories' => $inventories,
        ]);
    }
}

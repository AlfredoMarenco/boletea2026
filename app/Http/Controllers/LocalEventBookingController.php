<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\SeatInventory;
use Inertia\Inertia;

class LocalEventBookingController extends Controller
{
    public function show($slug)
    {
        $event = Event::with(['venue', 'showtimes.prices', 'showtimes.seatingMap'])
            ->where('slug', $slug)
            ->firstOrFail();

        // Check if event is published
        if ($event->status !== 'published' && ! auth()->check()) {
            return redirect()->route('home');
        }

        $showtime = $event->showtimes->first();

        if (! $showtime || ! $showtime->seatingMap) {
            abort(404, 'Este evento no tiene una función o mapa de asientos configurado.');
        }

        // Auto clean expired reservations before rendering
        SeatInventory::where('status', 'reserved')
            ->where('reserved_expires_at', '<', now())
            ->update([
                'status' => 'available',
                'reserved_expires_at' => null,
                'session_id' => null,
            ]);

        // Get seat inventories to map their current status for this showtime
        $inventories = SeatInventory::where('event_showtime_id', $showtime->id)
            ->select('seat_uuid', 'status', 'price', 'category', 'section', 'row', 'number', 'reserved_expires_at', 'session_id')
            ->get()
            ->keyBy('seat_uuid');

        return Inertia::render('Public/EventBooking', [
            'event' => $event,
            'showtime' => $showtime,
            'seatingMap' => $showtime->seatingMap,
            'inventories' => $inventories,
        ]);
    }
}

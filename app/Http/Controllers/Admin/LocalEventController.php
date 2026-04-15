<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\SeatingMap;
use App\Models\Venue;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class LocalEventController extends Controller
{
    public function index()
    {
        $events = Event::with('venue')->latest()->get();
        return Inertia::render('Admin/LocalEvents/Index', [
            'events' => $events
        ]);
    }

    public function create()
    {
        $venues = Venue::all();
        $seatingMaps = SeatingMap::all();
        return Inertia::render('Admin/LocalEvents/Create', [
            'venues' => $venues,
            'seatingMaps' => $seatingMaps
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'venue_id' => 'required|exists:venues,id',
            'seating_map_id' => 'required|exists:seating_maps,id',
        ]);

        $event = Event::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . uniqid(),
            'description' => $validated['description'],
            'start_date' => $validated['start_date'],
            'venue_id' => $validated['venue_id'],
            'status' => 'draft',
        ]);

        // Create the EventMap instance
        $event->eventMaps()->create([
            'seating_map_id' => $validated['seating_map_id'],
            'settings_json' => []
        ]);

        return redirect()->route('admin.local-events.index');
    }

    public function edit(Event $event)
    {
        $event->load(['venue', 'eventMaps.seatingMap']);
        return Inertia::render('Admin/LocalEvents/Edit', [
            'event' => $event,
            'venues' => Venue::all(),
            'seatingMaps' => SeatingMap::all()
        ]);
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'venue_id' => 'required|exists:venues,id',
        ]);

        $event->update($validated);

        return redirect()->route('admin.local-events.index');
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return redirect()->route('admin.local-events.index');
    }
}

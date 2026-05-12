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
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'venue_id' => 'required|exists:venues,id',
            'seating_map_id' => 'required|exists:seating_maps,id',
            'image' => 'nullable|image|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('events', 'public');
        }

        $event = Event::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . uniqid(),
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'venue_id' => $validated['venue_id'],
            'status' => 'draft',
            'image_path' => $imagePath,
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
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'venue_id' => 'required|exists:venues,id',
            'status' => 'required|in:draft,published,cancelled',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($event->image_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($event->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('events', 'public');
        }

        $event->update($validated);

        return redirect()->route('admin.local-events.index');
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return redirect()->route('admin.local-events.index');
    }

    public function prices(Event $event)
    {
        $event->load(['prices', 'eventMaps.seatingMap']);
        
        $mapCategories = [];
        $eventMap = $event->eventMaps->first();
        if ($eventMap && $eventMap->seatingMap) {
            $layout = $eventMap->seatingMap->layout_json;
            $nodes = $layout['nodes'] ?? [];
            foreach ($nodes as $node) {
                if (isset($node['section']) && trim($node['section']) !== '') {
                    $mapCategories[$node['section']] = true;
                }
            }
        }

        return Inertia::render('Admin/LocalEvents/Prices', [
            'event' => $event,
            'mapCategories' => array_keys($mapCategories),
        ]);
    }

    public function updatePrices(Request $request, Event $event)
    {
        $validated = $request->validate([
            'prices' => 'array',
            'prices.*.id' => 'nullable|exists:event_prices,id',
            'prices.*.name' => 'required|string|max:255',
            'prices.*.price' => 'required|numeric|min:0',
            'prices.*.service_charge' => 'nullable|numeric|min:0',
            'prices.*.bank_commission' => 'nullable|numeric|min:0',
            'prices.*.web_sales_enabled' => 'boolean',
            'prices.*.box_office_sales_enabled' => 'boolean',
        ]);

        $existingIds = [];
        foreach ($validated['prices'] ?? [] as $priceData) {
            if (isset($priceData['id'])) {
                $price = $event->prices()->find($priceData['id']);
                if ($price) {
                    $price->update($priceData);
                    $existingIds[] = $price->id;
                }
            } else {
                $price = $event->prices()->create($priceData);
                $existingIds[] = $price->id;
            }
        }
        
        $event->prices()->whereNotIn('id', $existingIds)->delete();

        return back()->with('success', 'Precios actualizados correctamente.');
    }

    public function generateInventory(Event $event)
    {
        $event->load(['prices', 'eventMaps.seatingMap']);
        $eventMap = $event->eventMaps->first();
        
        if (!$eventMap || !$eventMap->seatingMap) {
            return back()->withErrors(['error' => 'El evento no tiene un mapa asignado.']);
        }

        $layout = $eventMap->seatingMap->layout_json;
        $nodes = $layout['nodes'] ?? [];
        
        $prices = $event->prices->keyBy('name');

        $inventories = [];
        $now = now();

        // 1. Generate Numbered Seats from Map Nodes
        foreach ($nodes as $node) {
            if (isset($node['type']) && $node['type'] === 'seat') {
                $sectionName = $node['section'] ?? 'General';
                $priceModel = $prices->get($sectionName);

                $inventories[] = [
                    'event_map_id' => $eventMap->id,
                    'seat_uuid' => $node['id'] ?? $node['permanent_uuid'] ?? (string) \Illuminate\Support\Str::uuid(),
                    'status' => 'available',
                    'price' => $priceModel ? $priceModel->price : 0,
                    'category' => $sectionName,
                    'section' => $sectionName,
                    'row' => $node['row'] ?? null,
                    'number' => $node['number'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // Clear existing available inventory and insert the new one
        \App\Models\SeatInventory::where('event_map_id', $eventMap->id)
            ->where('status', 'available')
            ->delete();

        // Chunk insert to prevent memory limit issues with thousands of seats
        foreach (array_chunk($inventories, 500) as $chunk) {
            \App\Models\SeatInventory::insert($chunk);
        }

        $event->update(['status' => 'published']);
        
        return back()->with('success', 'Inventario generado exitosamente con ' . count($inventories) . ' asientos. Evento publicado.');
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventShowtime;
use App\Models\PriceType;
use App\Models\SeatingMap;
use App\Models\SeatInventory;
use App\Models\ShowtimePromotion;
use App\Models\Venue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LocalEventController extends Controller
{
    public function index()
    {
        $events = Event::with(['showtimes' => function ($query) {
            $query->with(['venue', 'seatingMap'])->withCount(['seatInventories as total_seats', 'seatInventories as sold_seats' => function ($q) {
                $q->where('status', 'sold');
            }]);
        }])->latest()->get();

        return Inertia::render('Admin/LocalEvents/Index', [
            'events' => $events,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/LocalEvents/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('events', 'public');
        }

        $event = Event::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']).'-'.uniqid(),
            'description' => $validated['description'] ?? null,
            'status' => 'draft',
            'image_path' => $imagePath,
        ]);

        return redirect()->route('admin.local-events.showtimes.index', $event);
    }

    public function edit(Event $event)
    {
        return Inertia::render('Admin/LocalEvents/Edit', [
            'event' => $event,
        ]);
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,published,cancelled',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($event->image_path) {
                Storage::disk('public')->delete($event->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('events', 'public');
        }

        $event->update($validated);

        return redirect()->route('admin.local-events.index')->with('success', 'Evento actualizado.');
    }

    public function destroy(Event $event)
    {
        if (! $event->canBeDeleted()) {
            return back()->withErrors(['error' => 'No se puede eliminar el evento porque una o más funciones tienen boletos vendidos o reservados.']);
        }

        $event->delete();

        return redirect()->route('admin.local-events.index')->with('success', 'Evento eliminado.');
    }

    // --- Showtimes (Funciones) --- //

    public function showtimesIndex(Event $event)
    {
        $event->load([
            'showtimes.venue',
            'showtimes.seatingMap',
            'showtimes.seatInventories' => function ($q) {
                $q->select('id', 'event_showtime_id', 'status');
            },
        ]);

        $venues = Venue::whereHas('seatingMaps', function ($query) {
            $query->where('is_active', true);
        })->with(['seatingMaps' => function ($q) {
            $q->where('is_active', true);
        }])->get();

        $seatingMaps = SeatingMap::where('is_active', true)->get();
        $priceTypes = PriceType::where('is_active', true)->get();

        return Inertia::render('Admin/LocalEvents/Showtimes/Index', [
            'event' => $event,
            'venues' => $venues,
            'seatingMaps' => $seatingMaps,
            'priceTypes' => $priceTypes,
        ]);
    }

    public function showtimeShow(Event $event, EventShowtime $showtime)
    {
        $showtime->load([
            'venue',
            'seatingMap',
            'prices.priceType',
            'promotions',
            'seatInventories' => function ($q) {
                $q->select('id', 'event_showtime_id', 'seat_uuid', 'status', 'price', 'category', 'section', 'row', 'number');
            },
        ]);

        $venues = Venue::whereHas('seatingMaps', function ($query) {
            $query->where('is_active', true);
        })->with(['seatingMaps' => function ($q) {
            $q->where('is_active', true);
        }])->get();

        $seatingMaps = SeatingMap::where('is_active', true)->get();
        $priceTypes = PriceType::where('is_active', true)->get();

        return Inertia::render('Admin/LocalEvents/Showtimes/Show', [
            'event' => $event,
            'showtime' => $showtime,
            'venues' => $venues,
            'seatingMaps' => $seatingMaps,
            'priceTypes' => $priceTypes,
        ]);
    }

    public function storeShowtime(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'venue_id' => 'required|exists:venues,id',
            'seating_map_id' => 'required|exists:seating_maps,id',
            'date_time' => 'required|date',
            'end_time' => 'required|date|after:date_time',
            'web_sales_start_at' => 'nullable|date',
            'web_sales_end_at' => 'nullable|date',
            'box_office_sales_start_at' => 'nullable|date',
            'box_office_sales_end_at' => 'nullable|date',
            'max_tickets_per_cart' => 'required|integer|min:1|max:50',
            'status' => 'required|string|in:draft,on_sale,coming_soon,web_only,box_office_only,sold_out,cancelled,completed',
            'ticket_notes' => 'nullable|string',
            'ticket_terms' => 'nullable|string',
        ]);

        $seatingMap = SeatingMap::findOrFail($validated['seating_map_id']);

        DB::transaction(function () use ($event, $validated, $seatingMap) {
            $showtime = $event->showtimes()->create([
                'venue_id' => $validated['venue_id'],
                'seating_map_id' => $seatingMap->id,
                'name' => $validated['name'],
                'date_time' => $validated['date_time'],
                'end_time' => $validated['end_time'],
                'web_sales_start_at' => $validated['web_sales_start_at'] ?? null,
                'web_sales_end_at' => $validated['web_sales_end_at'] ?? null,
                'box_office_sales_start_at' => $validated['box_office_sales_start_at'] ?? null,
                'box_office_sales_end_at' => $validated['box_office_sales_end_at'] ?? null,
                'max_tickets_per_cart' => $validated['max_tickets_per_cart'],
                'status' => $validated['status'],
                'ticket_notes' => $validated['ticket_notes'] ?? null,
                'ticket_terms' => $validated['ticket_terms'] ?? null,
                'layout_snapshot' => $seatingMap->layout_json,
                'seat_overrides' => [],
            ]);

            $this->generateShowtimeInventory($showtime);
        });

        return back()->with('success', 'Función creada e inventario generado correctamente.');
    }

    public function updateShowtime(Request $request, Event $event, EventShowtime $showtime)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'venue_id' => 'required|exists:venues,id',
            'seating_map_id' => 'required|exists:seating_maps,id',
            'date_time' => 'required|date',
            'end_time' => 'required|date|after:date_time',
            'web_sales_start_at' => 'nullable|date',
            'web_sales_end_at' => 'nullable|date',
            'box_office_sales_start_at' => 'nullable|date',
            'box_office_sales_end_at' => 'nullable|date',
            'max_tickets_per_cart' => 'required|integer|min:1|max:50',
            'status' => 'required|string|in:draft,on_sale,coming_soon,web_only,box_office_only,sold_out,cancelled,completed',
            'ticket_notes' => 'nullable|string',
            'ticket_terms' => 'nullable|string',
        ]);

        DB::transaction(function () use ($showtime, $validated) {
            $showtime->update([
                'venue_id' => $validated['venue_id'],
                'seating_map_id' => $validated['seating_map_id'],
                'name' => $validated['name'],
                'date_time' => $validated['date_time'],
                'end_time' => $validated['end_time'],
                'web_sales_start_at' => $validated['web_sales_start_at'] ?? null,
                'web_sales_end_at' => $validated['web_sales_end_at'] ?? null,
                'box_office_sales_start_at' => $validated['box_office_sales_start_at'] ?? null,
                'box_office_sales_end_at' => $validated['box_office_sales_end_at'] ?? null,
                'max_tickets_per_cart' => $validated['max_tickets_per_cart'],
                'status' => $validated['status'],
                'ticket_notes' => $validated['ticket_notes'] ?? null,
                'ticket_terms' => $validated['ticket_terms'] ?? null,
            ]);

            // Regenerar inventario manteniendo el layout_snapshot inmutable de la función
            $this->generateShowtimeInventory($showtime);
        });

        return back()->with('success', 'Configuración de la función e inventario actualizados.');
    }

    public function syncInventory(Event $event, EventShowtime $showtime)
    {
        $this->generateShowtimeInventory($showtime);

        return back()->with('success', 'Inventario de asientos resincronizado correctamente.');
    }

    public function destroyShowtime(Event $event, EventShowtime $showtime)
    {
        if (! $showtime->canBeDeleted()) {
            return back()->withErrors(['error' => 'No se puede eliminar esta función porque contiene boletos vendidos o reservados.']);
        }

        $showtime->delete();

        return back()->with('success', 'Función eliminada.');
    }

    public function updateShowtimePrices(Request $request, Event $event, EventShowtime $showtime)
    {
        $validated = $request->validate([
            'prices' => 'array',
            'prices.*.id' => 'nullable|exists:event_prices,id',
            'prices.*.price_type_id' => 'required|exists:price_types,id',
            'prices.*.name' => 'required|string|max:255',
            'prices.*.price' => 'required|numeric|min:0',
            'prices.*.printed_price' => 'nullable|numeric|min:0',
            'prices.*.service_charge' => 'nullable|numeric|min:0',
            'prices.*.bank_commission' => 'nullable|numeric|min:0',
            'prices.*.admin_fee' => 'nullable|numeric|min:0',
            'prices.*.is_enabled' => 'boolean',
            'prices.*.web_sales_enabled' => 'boolean',
            'prices.*.box_office_sales_enabled' => 'boolean',
            'prices.*.is_web_default' => 'boolean',
            'prices.*.is_pos_default' => 'boolean',
            'prices.*.color' => 'nullable|string',
        ]);

        $existingIds = [];
        foreach ($validated['prices'] ?? [] as $priceData) {
            if (isset($priceData['id'])) {
                $price = $showtime->prices()->find($priceData['id']);
                if ($price) {
                    $price->update($priceData);
                    $existingIds[] = $price->id;
                }
            } else {
                $priceData['event_id'] = $event->id;
                $price = $showtime->prices()->create($priceData);
                $existingIds[] = $price->id;
            }
        }

        $showtime->prices()->whereNotIn('id', $existingIds)->delete();

        // Actualizar el precio base por defecto del inventario usando el precio de la categoría donde is_web_default o is_pos_default o el primer tipo habilitado
        $categories = $showtime->prices->groupBy('name');
        foreach ($categories as $catName => $catPrices) {
            $defaultPrice = $catPrices->where('is_web_default', true)->first()
                ?? $catPrices->where('is_pos_default', true)->first()
                ?? $catPrices->where('is_enabled', true)->first();

            if ($defaultPrice) {
                SeatInventory::where('event_showtime_id', $showtime->id)
                    ->where('category', $catName)
                    ->where('status', 'available')
                    ->update(['price' => $defaultPrice->price]);
            }
        }

        return back()->with('success', 'Fijación de precios por categoría y tipo de precio actualizada correctamente.');
    }

    public function updateGeneralCapacity(Request $request, Event $event, EventShowtime $showtime)
    {
        $validated = $request->validate([
            'section_node_id' => 'required|string',
            'capacity' => 'required|integer|min:0',
        ]);

        $snapshot = $showtime->layout_snapshot ?? [];
        $nodes = $snapshot['nodes'] ?? [];

        $targetNodeIndex = null;
        foreach ($nodes as $index => $node) {
            if (($node['id'] ?? '') === $validated['section_node_id']) {
                $targetNodeIndex = $index;
                break;
            }
        }

        if ($targetNodeIndex === null) {
            return back()->withErrors(['section_node_id' => 'La sección seleccionada no existe en el mapa de esta función.']);
        }

        $targetNode = $nodes[$targetNodeIndex];
        $nodeBaseId = $targetNode['id'];
        $sectionName = $targetNode['section'] ?? $targetNode['name'] ?? 'General';

        // Validar que la nueva capacidad no sea inferior a los boletos ya vendidos o en transacción (reservados / bloqueados)
        $committedCount = SeatInventory::where('event_showtime_id', $showtime->id)
            ->where(function ($query) use ($nodeBaseId, $sectionName) {
                $query->where('seat_uuid', 'LIKE', "gen-{$nodeBaseId}-%")
                    ->orWhere('section', $sectionName);
            })
            ->whereIn('status', ['sold', 'reserved', 'hold_courtesy'])
            ->count();

        if ($validated['capacity'] < $committedCount) {
            return back()->withErrors([
                'capacity' => "El aforo de \"{$sectionName}\" no puede ser menor a {$committedCount} personas, ya que existen boletos vendidos o en transacción.",
            ]);
        }

        $nodes[$targetNodeIndex]['capacity'] = $validated['capacity'];
        $snapshot['nodes'] = $nodes;
        $showtime->update(['layout_snapshot' => $snapshot]);

        // Regenerar el inventario de esta función para sincronizar el aforo
        $this->generateShowtimeInventory($showtime);

        return back()->with('success', "Aforo de la sección \"{$sectionName}\" actualizado correctamente.");
    }

    public function updateSeatStatus(Request $request, Event $event, EventShowtime $showtime)
    {
        $validated = $request->validate([
            'seat_uuids' => 'required|array',
            'seat_uuids.*' => 'string',
            'status' => 'required|string|in:available,disabled,hidden,box_office_only,web_only,hold_courtesy',
        ]);

        $overrides = $showtime->seat_overrides ?? [];
        foreach ($validated['seat_uuids'] as $uuid) {
            if ($validated['status'] === 'available') {
                unset($overrides[$uuid]);
            } else {
                $overrides[$uuid] = $validated['status'];
            }
        }

        $showtime->update(['seat_overrides' => $overrides]);

        SeatInventory::where('event_showtime_id', $showtime->id)
            ->whereIn('seat_uuid', $validated['seat_uuids'])
            ->whereNotIn('status', ['sold', 'reserved'])
            ->update(['status' => $validated['status']]);

        return back()->with('success', 'Estatus de asientos actualizado.');
    }

    public function updateSeatCategory(Request $request, Event $event, EventShowtime $showtime)
    {
        $validated = $request->validate([
            'seat_uuids' => 'required|array',
            'seat_uuids.*' => 'string',
            'category' => 'required|string',
        ]);

        $priceModel = $showtime->prices->where('name', $validated['category'])->first();
        $price = $priceModel ? $priceModel->price : 0;

        SeatInventory::where('event_showtime_id', $showtime->id)
            ->whereIn('seat_uuid', $validated['seat_uuids'])
            ->whereNotIn('status', ['sold', 'reserved'])
            ->update([
                'category' => $validated['category'],
                'section' => $validated['category'],
                'price' => $price,
            ]);

        return back()->with('success', 'Categoría de precios actualizada para los asientos seleccionados.');
    }

    public function storePromotion(Request $request, Event $event, EventShowtime $showtime)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'type' => 'required|string|in:percentage_discount,fixed_discount,2x1,access_code',
            'value' => 'required|numeric|min:0',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date',
            'usage_limit' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $showtime->promotions()->create($validated);

        return back()->with('success', 'Promoción agregada a la función.');
    }

    public function destroyPromotion(Event $event, EventShowtime $showtime, ShowtimePromotion $promotion)
    {
        $promotion->delete();

        return back()->with('success', 'Promoción eliminada.');
    }

    protected function generateShowtimeInventory(EventShowtime $showtime): void
    {
        $layout = $showtime->layout_snapshot ?? [];
        $nodes = $layout['nodes'] ?? [];
        $categoriesById = collect($layout['config']['categories'] ?? [])->keyBy('id');
        $prices = $showtime->prices->keyBy('name');
        $overrides = $showtime->seat_overrides ?? [];

        $inventories = [];
        $now = now();

        $existingNonAvailableUuids = SeatInventory::where('event_showtime_id', $showtime->id)
            ->whereIn('status', ['sold', 'reserved'])
            ->pluck('seat_uuid')
            ->toArray();

        foreach ($nodes as $node) {
            // 1. Asientos numerados/individuales (`type === 'seat'`)
            if (isset($node['type']) && $node['type'] === 'seat') {
                $uuid = $node['id'] ?? $node['permanent_uuid'] ?? (string) Str::uuid();

                if (in_array($uuid, $existingNonAvailableUuids)) {
                    continue;
                }

                $catObj = isset($node['category_id']) ? $categoriesById->get($node['category_id']) : null;
                $categoryName = $catObj['name'] ?? $node['category'] ?? $node['section'] ?? 'General';
                $sectionName = $node['section'] ?? 'Zona General';

                $priceModel = $prices->get($categoryName);

                $status = $overrides[$uuid] ?? 'available';

                $inventories[] = [
                    'event_showtime_id' => $showtime->id,
                    'seat_uuid' => $uuid,
                    'status' => $status,
                    'price' => $priceModel ? $priceModel->price : 0,
                    'category' => $categoryName,
                    'section' => $sectionName,
                    'row' => $node['row'] ?? null,
                    'number' => $node['number'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // 2. Secciones Generales (Aforo sin asientos numerados, ej: rectángulos, círculos, zonas con `sectionType === 'general'` o `capacity > 0`)
            $capacity = (int) ($node['capacity'] ?? 0);
            if ($capacity > 0 && (isset($node['sectionType']) && $node['sectionType'] === 'general' || isset($node['type']) && in_array($node['type'], ['rect', 'zone', 'circle_zone', 'section_container']))) {
                $catObj = isset($node['category_id']) ? $categoriesById->get($node['category_id']) : null;
                $categoryName = $catObj['name'] ?? $node['category'] ?? $node['section'] ?? $node['name'] ?? 'General';
                $sectionName = $node['section'] ?? $node['name'] ?? 'General';

                $priceModel = $prices->get($categoryName);
                $nodeBaseId = $node['id'] ?? (string) Str::uuid();

                for ($i = 1; $i <= $capacity; $i++) {
                    $uuid = "gen-{$nodeBaseId}-{$i}";

                    if (in_array($uuid, $existingNonAvailableUuids)) {
                        continue;
                    }

                    $status = $overrides[$uuid] ?? 'available';

                    $inventories[] = [
                        'event_showtime_id' => $showtime->id,
                        'seat_uuid' => $uuid,
                        'status' => $status,
                        'price' => $priceModel ? $priceModel->price : 0,
                        'category' => $categoryName,
                        'section' => $sectionName,
                        'row' => null,
                        'number' => (string) $i,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        SeatInventory::where('event_showtime_id', $showtime->id)
            ->whereNotIn('status', ['sold', 'reserved'])
            ->delete();

        foreach (array_chunk($inventories, 500) as $chunk) {
            SeatInventory::insert($chunk);
        }
    }
}

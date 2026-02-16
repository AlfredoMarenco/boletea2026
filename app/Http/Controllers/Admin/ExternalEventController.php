<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ExternalEvent;
use App\Models\SalesCenter;
use App\Models\SalesCenterGroup;
use App\Models\State;
use App\Models\City;
use App\Models\Category;
use App\Models\Venue;
use App\Services\EventImportService;
use Inertia\Inertia;

class ExternalEventController extends Controller
{
    public function index()
    {
        $events = ExternalEvent::orderBy('start_date', 'asc')->paginate(10);
        return Inertia::render('Admin/Events/Index', [
            'events' => $events
        ]);
    }

    public function edit(ExternalEvent $event)
    {
        $salesCenters = SalesCenter::where('is_active', true)->get();
        $salesCenterGroups = SalesCenterGroup::orderBy('name')->get();
        $states = State::orderBy('name')->get();
        $cities = City::orderBy('name')->get();
        $categories = Category::orderBy('name')->get();
        $venues = Venue::orderBy('name')->get();

        // Load relationship IDs for the form
        $event->sales_centers = $event->salesCenters()->pluck('sales_centers.id');
        $event->sales_center_groups = $event->salesCenterGroups()->pluck('sales_center_groups.id');
        $event->categories = $event->categories()->pluck('categories.id');

        return Inertia::render('Admin/Events/Edit', [
            'event' => $event,
            'salesCenters' => $salesCenters,
            'salesCenterGroups' => $salesCenterGroups,
            'states' => $states,
            'cities' => $cities,
            'categories' => $categories,
            'venues' => $venues,
        ]);
    }

    public function update(Request $request, ExternalEvent $event)
    {
        $validated = $request->validate([
            'image_path' => 'nullable|string',
            'sales_start_date' => 'nullable|date',
            'button_text' => 'nullable|string',
            'city' => 'nullable|string', // Keep legacy for now
            'state_id' => 'nullable|exists:states,id',
            'city_id' => 'nullable|exists:cities,id',
            'venue_id' => 'nullable|exists:venues,id',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'sales_centers' => 'nullable|array',
            'sales_center_groups' => 'nullable|array',
            'categories' => 'nullable|array',
            'status' => 'required|in:draft,published',
        ]);

        if ($request->hasFile('secondary_image_path')) {
            $request->validate([
                'secondary_image_path' => 'image|max:2048',
            ]);
            $path = $request->file('secondary_image_path')->store('events', 'public');
            $validated['secondary_image_path'] = '/storage/' . $path;
        }
        else {
            // If not uploading a new file, do not update this field
            unset($validated['secondary_image_path']);
        }

        // Separate relationships for sync
        $salesCenterIds = $validated['sales_centers'] ?? [];
        $salesCenterGroupIds = $validated['sales_center_groups'] ?? [];
        $categoryIds = $validated['categories'] ?? [];

        unset($validated['sales_centers']);
        unset($validated['sales_center_groups']);
        unset($validated['categories']);

        $event->update($validated);
        $event->salesCenters()->sync($salesCenterIds);
        $event->salesCenterGroups()->sync($salesCenterGroupIds);
        $event->categories()->sync($categoryIds);

        return redirect()->route('admin.events.index')->with('success', 'Evento actualizado correctamente.');
    }

    public function sync(EventImportService $service)
    {
        $count = $service->importEvents();
        return redirect()->back()->with('success', "Se han sincronizado $count eventos.");
    }
}
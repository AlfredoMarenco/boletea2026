<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ExternalEvent;
use App\Services\EventImportService;
use Inertia\Inertia;

class ExternalEventController extends Controller
{
    public function index()
    {
        $events = ExternalEvent::orderBy('created_at', 'desc')->paginate(10);
        return Inertia::render('Admin/Events/Index', [
            'events' => $events
        ]);
    }

    public function edit(ExternalEvent $event)
    {
        $salesCenters = \App\Models\SalesCenter::where('is_active', true)->get();
        return Inertia::render('Admin/Events/Edit', [
            'event' => $event,
            'salesCenters' => $salesCenters
        ]);
    }

    public function update(Request $request, ExternalEvent $event)
    {
        $validated = $request->validate([
            'image_path' => 'nullable|string',
            'secondary_image_path' => 'nullable|image|max:2048', // Validate as image
            'sales_start_date' => 'nullable|date',
            'button_text' => 'nullable|string',
            'city' => 'nullable|string',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'sales_centers' => 'nullable|array',
            'status' => 'required|in:draft,published',
        ]);

        if ($request->hasFile('secondary_image_path')) {
            $path = $request->file('secondary_image_path')->store('events', 'public');
            $validated['secondary_image_path'] = '/storage/' . $path;
        }

        $event->update($validated);

        return redirect()->route('admin.events.index')->with('success', 'Evento actualizado correctamente.');
    }

    public function sync(EventImportService $service)
    {
        $count = $service->importEvents();
        return redirect()->back()->with('success', "Se han sincronizado $count eventos.");
    }
}

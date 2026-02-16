<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VenueController extends Controller
{
    public function index()
    {
        $venues = Venue::paginate(10);
        return Inertia::render('Admin/Venues/Index', [
            'venues' => $venues
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Venues/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        Venue::create($validated);

        return redirect()->route('admin.venues.index');
    }

    public function edit(Venue $venue)
    {
        return Inertia::render('Admin/Venues/Edit', [
            'venue' => $venue
        ]);
    }

    public function update(Request $request, Venue $venue)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $venue->update($validated);

        return redirect()->route('admin.venues.index');
    }

    public function destroy(Venue $venue)
    {
        $venue->delete();
        return redirect()->route('admin.venues.index');
    }
}
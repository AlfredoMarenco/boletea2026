<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SeatingMap;
use App\Models\Venue;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SeatingMapController extends Controller
{
    public function index()
    {
        $seatingMaps = SeatingMap::with('venue')
            ->select('id', 'name', 'venue_id', 'is_active', 'created_at', 'updated_at')
            ->latest()
            ->get();

        return Inertia::render('Admin/SeatingMaps/Index', [
            'seatingMaps' => $seatingMaps,
        ]);
    }

    public function create()
    {
        $venues = Venue::all();

        return Inertia::render('Admin/SeatingMaps/Create', [
            'venues' => $venues,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'venue_id' => 'required|exists:venues,id',
        ]);

        $seatingMap = SeatingMap::create([
            'name' => $validated['name'],
            'venue_id' => $validated['venue_id'],
            'layout_json' => [
                'nodes' => [],
                'config' => [
                    'width' => 1200,
                    'height' => 800,
                    'gridSize' => 20,
                ],
            ],
        ]);

        return redirect()->route('admin.seating-maps.edit', $seatingMap->id);
    }

    public function edit(SeatingMap $seatingMap)
    {
        $seatingMap->load('venue');

        return Inertia::render('Admin/SeatingMaps/Builder', [
            'seatingMap' => $seatingMap,
        ]);
    }

    public function update(Request $request, SeatingMap $seatingMap)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'layout_json' => 'sometimes|required|array',
        ]);

        $seatingMap->update($validated);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Map updated successfully']);
        }

        return back();
    }

    public function destroy(SeatingMap $seatingMap)
    {
        $seatingMap->delete();

        return redirect()->route('admin.seating-maps.index');
    }
}

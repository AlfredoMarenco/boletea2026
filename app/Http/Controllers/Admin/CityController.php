<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\State;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CityController extends Controller
{
    public function index()
    {
        $cities = City::with('state')->orderBy('name')->get();
        return Inertia::render('Admin/Cities/Index', [
            'cities' => $cities
        ]);
    }

    public function create()
    {
        $states = State::orderBy('name')->get();
        return Inertia::render('Admin/Cities/Create', [
            'states' => $states
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'state_id' => 'required|exists:states,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        City::create($validated);

        return redirect()->route('admin.cities.index')->with('success', 'Ciudad creada correctamente.');
    }

    public function edit(City $city)
    {
        $states = State::orderBy('name')->get();
        return Inertia::render('Admin/Cities/Edit', [
            'city' => $city,
            'states' => $states
        ]);
    }

    public function update(Request $request, City $city)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'state_id' => 'required|exists:states,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $city->update($validated);

        return redirect()->route('admin.cities.index')->with('success', 'Ciudad actualizada correctamente.');
    }

    public function destroy(City $city)
    {
        if ($city->externalEvents()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar la ciudad porque tiene eventos asociados.');
        }

        $city->delete();
        return redirect()->route('admin.cities.index')->with('success', 'Ciudad eliminada correctamente.');
    }
}

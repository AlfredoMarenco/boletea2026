<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\State;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StateController extends Controller
{
    public function index()
    {
        $states = State::orderBy('name')->get();
        return Inertia::render('Admin/States/Index', [
            'states' => $states
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/States/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:states,name',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        State::create($validated);

        return redirect()->route('admin.states.index')->with('success', 'Estado creado correctamente.');
    }

    public function edit(State $state)
    {
        return Inertia::render('Admin/States/Edit', [
            'state' => $state
        ]);
    }

    public function update(Request $request, State $state)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:states,name,' . $state->id,
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $state->update($validated);

        return redirect()->route('admin.states.index')->with('success', 'Estado actualizado correctamente.');
    }

    public function destroy(State $state)
    {
        if ($state->cities()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar el estado porque tiene ciudades asociadas.');
        }

        if ($state->salesCenters()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar el estado porque tiene puntos de venta asociados.');
        }

        if ($state->externalEvents()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar el estado porque tiene eventos asociados.');
        }

        $state->delete();
        return redirect()->route('admin.states.index')->with('success', 'Estado eliminado correctamente.');
    }
}

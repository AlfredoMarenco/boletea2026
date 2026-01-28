<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\SalesCenter;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SalesCenterController extends Controller
{
    public function index()
    {
        $salesCenters = SalesCenter::latest()->get();
        return Inertia::render('Admin/SalesCenters/Index', [
            'salesCenters' => $salesCenters
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/SalesCenters/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo_path' => 'nullable|image|max:2048', // 2MB max
            'address' => 'required|string',
            'google_map_url' => 'nullable|url',
            'opening_hours' => 'nullable', // Can be array or JSON string
            'is_active' => 'boolean'
        ]);

        if ($request->hasFile('logo_path')) {
            $path = $request->file('logo_path')->store('sales_centers', 'public');
            $validated['logo_path'] = '/storage/' . $path;
        }

        if (isset($validated['opening_hours']) && is_string($validated['opening_hours'])) {
            $validated['opening_hours'] = json_decode($validated['opening_hours'], true);
        }

        SalesCenter::create($validated);

        return redirect()->route('admin.sales-centers.index')->with('success', 'Punto de venta creado correctamente.');
    }

    public function edit(SalesCenter $salesCenter)
    {
        return Inertia::render('Admin/SalesCenters/Edit', [
            'salesCenter' => $salesCenter
        ]);
    }

    public function update(Request $request, SalesCenter $salesCenter)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo_path' => 'nullable', // allow string (existing) or file (new)
            'address' => 'required|string',
            'google_map_url' => 'nullable|string', // URL validation might fail on strict map embeds sometimes
            'opening_hours' => 'nullable',
            'is_active' => 'boolean'
        ]);

        if ($request->hasFile('logo_path')) {
            $path = $request->file('logo_path')->store('sales_centers', 'public');
            $validated['logo_path'] = '/storage/' . $path;
        } else {
            // If no new file uploaded, do not overwrite existing path with null
            unset($validated['logo_path']);
        }

        if (isset($validated['opening_hours']) && is_string($validated['opening_hours'])) {
            $validated['opening_hours'] = json_decode($validated['opening_hours'], true);
        }

        $salesCenter->update($validated);

        return redirect()->route('admin.sales-centers.index')->with('success', 'Punto de venta actualizado.');
    }

    public function destroy(SalesCenter $salesCenter)
    {
        $salesCenter->delete();
        return redirect()->route('admin.sales-centers.index')->with('success', 'Punto de venta eliminado.');
    }
}

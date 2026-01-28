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
            'opening_hours' => 'nullable|array', // JSON/Array of hours
            'is_active' => 'boolean'
        ]);

        if ($request->hasFile('logo_path')) {
            $path = $request->file('logo_path')->store('sales_centers', 'public');
            $validated['logo_path'] = Storage::disk('public')->url($path);
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
            'opening_hours' => 'nullable|array',
            'is_active' => 'boolean'
        ]);

        if ($request->hasFile('logo_path')) {
            // Delete old logo if exists and not default?
            // if ($salesCenter->logo_path) ... (optional cleanup)

            $path = $request->file('logo_path')->store('sales_centers', 'public');
            $validated['logo_path'] = Storage::disk('public')->url($path);
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

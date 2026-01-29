<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SalesCenter;
use App\Models\SalesCenterGroup;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesCenterGroupController extends Controller
{
    public function index()
    {
        $groups = SalesCenterGroup::withCount('salesCenters')->orderBy('name')->get();
        return Inertia::render('Admin/SalesCenterGroups/Index', [
            'groups' => $groups
        ]);
    }

    public function create()
    {
        $salesCenters = SalesCenter::where('is_active', true)->orderBy('name')->get();
        return Inertia::render('Admin/SalesCenterGroups/Create', [
            'salesCenters' => $salesCenters
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:sales_center_groups,name',
            'description' => 'nullable|string',
            'sales_centers' => 'array',
            'sales_centers.*' => 'exists:sales_centers,id',
        ]);

        $group = SalesCenterGroup::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        if (isset($validated['sales_centers'])) {
            $group->salesCenters()->sync($validated['sales_centers']);
        }

        return redirect()->route('admin.sales-center-groups.index')->with('success', 'Grupo creado correctamente.');
    }

    public function edit(SalesCenterGroup $salesCenterGroup)
    {
        $salesCenterGroup->load('salesCenters');
        $salesCenters = SalesCenter::where('is_active', true)->orderBy('name')->get();
        
        return Inertia::render('Admin/SalesCenterGroups/Edit', [
            'group' => $salesCenterGroup,
            'salesCenters' => $salesCenters,
            'assignedSalesCenters' => $salesCenterGroup->salesCenters->pluck('id')
        ]);
    }

    public function update(Request $request, SalesCenterGroup $salesCenterGroup)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:sales_center_groups,name,' . $salesCenterGroup->id,
            'description' => 'nullable|string',
            'sales_centers' => 'array',
            'sales_centers.*' => 'exists:sales_centers,id',
        ]);

        $salesCenterGroup->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        if (isset($validated['sales_centers'])) {
            $salesCenterGroup->salesCenters()->sync($validated['sales_centers']);
        } else {
            $salesCenterGroup->salesCenters()->detach();
        }

        return redirect()->route('admin.sales-center-groups.index')->with('success', 'Grupo actualizado correctamente.');
    }

    public function destroy(SalesCenterGroup $salesCenterGroup)
    {
        if ($salesCenterGroup->externalEvents()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar el grupo porque está asignado a eventos.');
        }

        $salesCenterGroup->delete();
        return redirect()->route('admin.sales-center-groups.index')->with('success', 'Grupo eliminado correctamente.');
    }
}

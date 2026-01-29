<?php

namespace App\Http\Controllers;

use App\Models\ExternalEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function show($id)
    {
        $event = ExternalEvent::with(['salesCenters', 'salesCenterGroups.salesCenters'])->findOrFail($id);

        $directSalesCenters = $event->salesCenters;
        $groupSalesCenters = $event->salesCenterGroups->flatMap(function ($group) {
            return $group->salesCenters;
        });

        // Merge and unique by ID, re-index values
        $salesCentersDetails = $directSalesCenters->merge($groupSalesCenters)->unique('id')->values();

        return Inertia::render('Event/Show', [
            'event' => $event,
            'salesCentersDetails' => $salesCentersDetails
        ]);
    }
}

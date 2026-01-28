<?php

namespace App\Http\Controllers;

use App\Models\ExternalEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function show($id)
    {
        $event = ExternalEvent::findOrFail($id);

        // Eager load sales centers
        $salesCentersDetails = $event->salesCenters()->get();

        return Inertia::render('Event/Show', [
            'event' => $event,
            'salesCentersDetails' => $salesCentersDetails
        ]);
    }
}

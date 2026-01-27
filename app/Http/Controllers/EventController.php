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

        return Inertia::render('Event/Show', [
            'event' => $event
        ]);
    }
}

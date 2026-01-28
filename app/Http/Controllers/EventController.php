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

        $salesCentersDetails = [];
        if (!empty($event->sales_centers)) {
            $ids = [];
            $legacyNames = [];

            foreach ($event->sales_centers as $center) {
                if (is_numeric($center)) {
                    $ids[] = $center;
                } else {
                    $legacyNames[] = $center;
                }
            }

            if (!empty($ids)) {
                $models = \App\Models\SalesCenter::whereIn('id', $ids)->get();
                foreach ($models as $model) {
                    $salesCentersDetails[] = $model;
                }
            }

            foreach ($legacyNames as $name) {
                $salesCentersDetails[] = ['name' => $name, 'is_legacy' => true];
            }
        }

        return Inertia::render('Event/Show', [
            'event' => $event,
            'salesCentersDetails' => $salesCentersDetails
        ]);
    }
}

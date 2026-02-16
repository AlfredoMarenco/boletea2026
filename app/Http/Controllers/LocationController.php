<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'country' => 'nullable|string',
        ]);

        session([
            'user_location' => [
                'lat' => $request->lat,
                'lng' => $request->lng,
                'city' => $request->city,
                'state' => $request->state,
                'country' => $request->country,
            ]
        ]);

        return response()->json(['status' => 'success']);
    }
}

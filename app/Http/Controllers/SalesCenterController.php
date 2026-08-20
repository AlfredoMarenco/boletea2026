<?php

namespace App\Http\Controllers;

use App\Models\State;
use Inertia\Inertia;

class SalesCenterController extends Controller
{
    public function index()
    {
        $states = State::whereHas('salesCenters', function ($query) {
            $query->where('is_active', true);
        })->with(['salesCenters' => function ($query) {
            $query->where('is_active', true);
        }])->get();

        return Inertia::render('Static/SalesCenters', [
            'states' => $states,
        ]);
    }
}

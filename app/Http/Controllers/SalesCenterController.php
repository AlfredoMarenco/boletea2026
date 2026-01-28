<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\SalesCenter;
use Inertia\Inertia;

class SalesCenterController extends Controller
{
    public function index()
    {
        $salesCenters = SalesCenter::where('is_active', true)->get();
        return Inertia::render('Static/SalesCenters', [
            'salesCenters' => $salesCenters
        ]);
    }
}

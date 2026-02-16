<?php

use App\Http\Controllers\SalesCenterController;
use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function (Illuminate\Http\Request $request) {
    // Base query for upcoming events
    $baseQuery = \App\Models\ExternalEvent::with(['venue', 'categories'])
        ->where('status', 'published')
        ->where(function ($q) {
            $q->whereNull('end_date')
                ->orWhere('end_date', '>=', now());
        }
        );

        // 1. Carousel Events (Always upcoming, sorted by start_date)
        $carouselEvents = (clone $baseQuery)
            ->orderBy('start_date', 'asc')
            ->take(5)
            ->get();

        // 2. Filtered Events (Main Grid - "Todos los eventos" or Search Results)
        $query = clone $baseQuery;

        // Apply Filters
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }
        if ($request->filled('venue_id')) {
            $query->where('venue_id', $request->venue_id);
        }
        if ($request->filled('category') && $request->category !== 'all') {
            $query->whereHas('categories', function ($q) use ($request) {
                    $q->where('name', $request->category);
                }
                );
            }
            if ($request->filled('date_start') && $request->filled('date_end')) {
                $start = $request->date_start;
                $end = $request->date_end;
                $query->where(function ($q) use ($start, $end) {
                    $q->where(function ($sq) use ($start, $end) {
                            $sq->whereNotNull('end_date')
                                ->where('start_date', '<=', $end)
                                ->where('end_date', '>=', $start);
                        }
                        )->orWhere(function ($sq) use ($start, $end) {
                            $sq->whereNull('end_date')
                                ->whereBetween('start_date', [$start, $end]);
                        }
                        );
                    }
                    );
                }

                $allEvents = $query->orderBy('start_date', 'asc')->get();

                // 3. Nearby Events (Strict 40km from VENUE)
                $nearbyEvents = collect();
                $userLocation = session('user_location');

                $hasFilters = $request->filled('search') ||
                    $request->filled('city') ||
                    $request->filled('venue_id') ||
                    ($request->filled('category') && $request->category !== 'all') ||
                    ($request->filled('date_start') && $request->filled('date_end'));

                if (!$hasFilters && $userLocation) {
                    $userLat = $userLocation['lat'] ?? null;
                    $userLng = $userLocation['lng'] ?? null;

                    if ($userLat && $userLng) {
                        // Get all upcoming events to filter by distance
                        // We use the base query (unfiltered)
                        $potentialNearby = (clone $baseQuery)->get();

                        $nearbyEvents = $potentialNearby->filter(function ($event) use ($userLat, $userLng) {
                            // STRICT VENUE LOCATION
                            $lat = $event->venue->latitude ?? null;
                            $lng = $event->venue->longitude ?? null;

                            if ($lat && $lng) {
                                $distance = \App\Helpers\DistanceCalculator::haversine($userLat, $userLng, $lat, $lng);
                                $event->distance_km = round($distance, 1);
                                return $distance <= 40; // Strict 40km radius
                            }
                            return false;
                        }
                        )->sortBy('distance_km')->values();
                    }
                }

                // Options for filters
                $cities = \App\Models\ExternalEvent::where('status', 'published')->distinct()->pluck('city')->filter();
                $venues = \App\Models\Venue::select('id', 'name')->get();
                $categories = \App\Models\Category::has('externalEvents')->pluck('name');

                return Inertia::render('Welcome', [
                'canRegister' => Features::enabled(Features::registration()),
                'events' => $allEvents, // "Todos los eventos" / Filtered results
                'nearbyEvents' => $nearbyEvents, // "Eventos cerca de ti"
                'carouselEvents' => $carouselEvents, // "Próximos eventos" (Carousel)
                'filters' => $request->all(['search', 'city', 'venue_id', 'category', 'date_start', 'date_end']),
                'options' => [
                'cities' => $cities,
                'venues' => $venues,
                'categories' => $categories,
                ]
                ]);            })->name('home');

Route::post('/location', [\App\Http\Controllers\LocationController::class , 'store'])->name('location.store');

Route::get('/event/{id}', [EventController::class , 'show'])->name('event.show');

Route::get('/quienessomos', function () {
    return Inertia::render('Static/About');
})->name('static.quienessomos');

Route::get('/terminosycondiciones', function () {
    return Inertia::render('Static/Terms');
})->name('static.terminosycondiciones');

Route::get('/avisodeprivacidad', function () {
    return Inertia::render('Static/Privacy');
})->name('static.avisodeprivacidad');

Route::get('/terminos-ticketassist', function () {
    return Inertia::render('Static/TicketAssist');
})->name('static.ticketassist');

Route::get('/bolepay', function () {
    return Inertia::render('Static/Bolepay');
})->name('static.bolepay');

Route::get('/puntos-de-venta', [SalesCenterController::class , 'index'])->name('sales-centers.public');


require __DIR__ . '/settings.php';
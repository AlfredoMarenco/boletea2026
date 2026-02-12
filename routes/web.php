<?php

use App\Http\Controllers\SalesCenterController;
use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function (Illuminate\Http\Request $request) {
    $publishedEvents = \App\Models\ExternalEvent::where('status', 'published')->get();

    // Get user coordinates from query parameters
    $userLat = $request->query('lat');
    $userLng = $request->query('lng');

    // If user location is provided, calculate distances and sort by proximity
    if ($userLat !== null && $userLng !== null) {
        $publishedEvents = $publishedEvents->map(function ($event) use ($userLat, $userLng) {
            // Parse event coordinates (assuming they're stored in a location field or similar)
            // For now, we'll check if the event has latitude/longitude fields
            if (isset($event->latitude) && isset($event->longitude)) {
                $distance = \App\Helpers\DistanceCalculator::haversine(
                    $userLat,
                    $userLng,
                    $event->latitude,
                    $event->longitude
                );
                $event->distance_km = round($distance, 1);
            } else {
                $event->distance_km = null; // No location data
            }
            return $event;
        })->sortBy(function ($event) {
            // Sort by distance, putting events without location at the end
            return $event->distance_km ?? PHP_INT_MAX;
        })->values();
    }

    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'events' => $publishedEvents,
    ]);
})->name('home');

Route::get('/event/{id}', [EventController::class, 'show'])->name('event.show');

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

Route::get('/puntos-de-venta', [SalesCenterController::class, 'index'])->name('sales-centers.public');


require __DIR__ . '/settings.php';

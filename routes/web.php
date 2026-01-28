<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    $publishedEvents = \App\Models\ExternalEvent::where('status', 'published')->get();
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'events' => $publishedEvents,
    ]);
})->name('home');

Route::get('/event/{id}', [App\Http\Controllers\EventController::class, 'show'])->name('event.show');

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

Route::get('/puntos-de-venta', [App\Http\Controllers\SalesCenterController::class, 'index'])->name('sales-centers.public');


require __DIR__ . '/settings.php';

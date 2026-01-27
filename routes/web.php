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





require __DIR__ . '/settings.php';

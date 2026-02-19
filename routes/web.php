<?php

use App\Http\Controllers\SalesCenterController;
use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', [\App\Http\Controllers\HomeController::class, 'index'])->name('home');

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
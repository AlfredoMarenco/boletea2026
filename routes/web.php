<?php

use App\Http\Controllers\SalesCenterController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LocationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', [HomeController::class, 'index'])->name('home');

Route::post('/location', [LocationController::class , 'store'])->name('location.store');

Route::get('/evento/{slug}', [EventController::class , 'show'])->name('event.show');

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

Route::get('/app-scanner/download', function () {
    $path = storage_path('app/public/scanner/boleteaccessos.apk');
    if (!file_exists($path)) {
        abort(404, 'La aplicación no está disponible aún.');
    }
    return response()->download($path, 'boleteaccessos.apk', [
        'Content-Type' => 'application/vnd.android.package-archive',
    ]);
})->name('scanner.download');


require __DIR__ . '/settings.php';
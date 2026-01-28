<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ExternalEventController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

Route::get('/events', [ExternalEventController::class, 'index'])->name('events.index');
Route::get('/events/{event}/edit', [ExternalEventController::class, 'edit'])->name('events.edit');
Route::put('/events/{event}', [ExternalEventController::class, 'update'])->name('events.update');
Route::post('/events/sync', [ExternalEventController::class, 'sync'])->name('events.sync');

use App\Http\Controllers\Admin\SalesCenterController;

Route::resource('sales-centers', SalesCenterController::class);

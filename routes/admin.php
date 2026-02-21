<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ExternalEventController;
use Inertia\Inertia;
use App\Http\Controllers\Admin\SalesCenterController;
use App\Http\Controllers\Admin\StateController;
use App\Http\Controllers\Admin\CityController;
use App\Http\Controllers\Admin\SalesCenterGroupController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VenueController;

Route::get('/', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

Route::get('/events', [ExternalEventController::class , 'index'])->name('events.index');
Route::get('/events/create', [ExternalEventController::class , 'create'])->name('events.create');
Route::post('/events', [ExternalEventController::class , 'store'])->name('events.store');
Route::get('/events/{event}/edit', [ExternalEventController::class , 'edit'])->name('events.edit');
Route::put('/events/{event}', [ExternalEventController::class , 'update'])->name('events.update');
Route::post('/events/sync', [ExternalEventController::class , 'sync'])->name('events.sync');

Route::resource('sales-centers', SalesCenterController::class);
Route::resource('states', StateController::class);
Route::resource('cities', CityController::class);
Route::resource('sales-center-groups', SalesCenterGroupController::class);
Route::resource('categories', CategoryController::class);
Route::resource('venues', VenueController::class);
Route::resource('users', UserController::class);

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ExternalEventController;
use Inertia\Inertia;
use App\Http\Controllers\Admin\SalesCenterController;
use App\Http\Controllers\Admin\StateController;
use App\Http\Controllers\Admin\CityController;
use App\Http\Controllers\Admin\ImageController; // Added this line
use App\Http\Controllers\Admin\SalesCenterGroupController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VenueController;
use App\Http\Controllers\Admin\SiteSettingController;
use App\Http\Controllers\Admin\SeatingMapController;
use App\Http\Controllers\Admin\LocalEventController;

Route::get('/', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

// --- Image Library --- //
Route::get('images', [ImageController::class, 'index'])->name('images.index');
Route::post('images', [ImageController::class, 'store'])->name('images.store');
Route::delete('images/{image}', [ImageController::class, 'destroy'])->name('images.destroy');

Route::get('/events', [ExternalEventController::class , 'index'])->name('events.index');
Route::get('/events/create', [ExternalEventController::class , 'create'])->name('events.create');
Route::post('/events', [ExternalEventController::class , 'store'])->name('events.store');
Route::get('/events/{event}/edit', [ExternalEventController::class , 'edit'])->name('events.edit');
Route::put('/events/{event}', [ExternalEventController::class , 'update'])->name('events.update');
Route::delete('/events/{event}', [ExternalEventController::class , 'destroy'])->name('events.destroy');
Route::post('/events/sync', [ExternalEventController::class , 'sync'])->name('events.sync');

Route::resource('sales-centers', SalesCenterController::class);
Route::resource('states', StateController::class);
Route::resource('cities', CityController::class);
Route::resource('sales-center-groups', SalesCenterGroupController::class);
Route::resource('categories', CategoryController::class);
Route::resource('venues', VenueController::class);
Route::resource('users', UserController::class);
Route::resource('seating-maps', SeatingMapController::class);
Route::resource('local-events', LocalEventController::class);

Route::get('settings', [SiteSettingController::class, 'index'])->name('settings.index');
Route::post('settings', [SiteSettingController::class, 'update'])->name('settings.update');

use App\Http\Controllers\Admin\WelcomeBannerController;
Route::resource('banners', WelcomeBannerController::class)->except(['index', 'create', 'show', 'edit']);

// ─── Mailing ──────────────────────────────────────────────────────────────────
use App\Http\Controllers\Admin\MailingController;

// Contactos / Lista de correos
Route::prefix('mailing')->name('mailing.')->group(function () {
    Route::get('contacts', [MailingController::class, 'contactsIndex'])->name('contacts.index');
    Route::post('contacts', [MailingController::class, 'contactsStore'])->name('contacts.store');
    Route::post('contacts/import', [MailingController::class, 'contactsImport'])->name('contacts.import');
    Route::delete('contacts/{contact}', [MailingController::class, 'contactsDestroy'])->name('contacts.destroy');
    Route::patch('contacts/{contact}/toggle', [MailingController::class, 'contactsToggle'])->name('contacts.toggle');

    // Campañas
    Route::get('campaigns', [MailingController::class, 'campaignsIndex'])->name('campaigns.index');
    Route::get('campaigns/create', [MailingController::class, 'campaignsCreate'])->name('campaigns.create');
    Route::post('campaigns', [MailingController::class, 'campaignsStore'])->name('campaigns.store');
    Route::get('campaigns/{campaign}', [MailingController::class, 'campaignsShow'])->name('campaigns.show');
    Route::post('campaigns/{campaign}/send', [MailingController::class, 'campaignsSend'])->name('campaigns.send');
    Route::delete('campaigns/{campaign}', [MailingController::class, 'campaignsDestroy'])->name('campaigns.destroy');
});

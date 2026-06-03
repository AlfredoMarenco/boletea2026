<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CityController;
use App\Http\Controllers\Admin\ExternalEventController;
use App\Http\Controllers\Admin\ImageController;
use App\Http\Controllers\Admin\LocalEventController;
use App\Http\Controllers\Admin\SalesCenterController;
use App\Http\Controllers\Admin\SalesCenterGroupController; // Added this line
use App\Http\Controllers\Admin\SeatingMapController;
use App\Http\Controllers\Admin\SiteSettingController;
use App\Http\Controllers\Admin\StateController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\VenueController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

// --- Image Library --- //
Route::get('images', [ImageController::class, 'index'])->name('images.index');
Route::post('images', [ImageController::class, 'store'])->name('images.store');
Route::delete('images/{image}', [ImageController::class, 'destroy'])->name('images.destroy');

Route::get('/events', [ExternalEventController::class, 'index'])->name('events.index');
Route::get('/events/create', [ExternalEventController::class, 'create'])->name('events.create');
Route::post('/events', [ExternalEventController::class, 'store'])->name('events.store');
Route::get('/events/{event}/edit', [ExternalEventController::class, 'edit'])->name('events.edit');
Route::put('/events/{event}', [ExternalEventController::class, 'update'])->name('events.update');
Route::delete('/events/{event}', [ExternalEventController::class, 'destroy'])->name('events.destroy');
Route::post('/events/sync', [ExternalEventController::class, 'sync'])->name('events.sync');

Route::resource('sales-centers', SalesCenterController::class);
Route::resource('states', StateController::class);
Route::resource('cities', CityController::class);
Route::resource('sales-center-groups', SalesCenterGroupController::class);
Route::resource('categories', CategoryController::class);
Route::resource('venues', VenueController::class);
Route::resource('users', UserController::class);
Route::resource('seating-maps', SeatingMapController::class);
Route::get('local-events/{event}/prices', [LocalEventController::class, 'prices'])->name('local-events.prices');
Route::post('local-events/{event}/prices', [LocalEventController::class, 'updatePrices'])->name('local-events.prices.update');
Route::post('local-events/{event}/inventory', [LocalEventController::class, 'generateInventory'])->name('local-events.inventory');
Route::resource('local-events', LocalEventController::class)->parameters(['local-events' => 'event']);

Route::get('settings', [SiteSettingController::class, 'index'])->name('settings.index');
Route::post('settings', [SiteSettingController::class, 'update'])->name('settings.update');

use App\Http\Controllers\Admin\WelcomeBannerController;

Route::resource('banners', WelcomeBannerController::class)->except(['index', 'create', 'show', 'edit']);

use App\Http\Controllers\Admin\PostbackUrlController;

Route::resource('postback-urls', PostbackUrlController::class)->only(['store', 'update', 'destroy']);
// ─── Mailing ──────────────────────────────────────────────────────────────────
use App\Http\Controllers\Admin\MailingController;

// Contactos / Lista de correos
Route::prefix('mailing')->name('mailing.')->group(function () {
    Route::get('contacts', [MailingController::class, 'contactsIndex'])->name('contacts.index');
    Route::post('contacts', [MailingController::class, 'contactsStore'])->name('contacts.store');
    Route::post('contacts/import', [MailingController::class, 'contactsImport'])->name('contacts.import');
    Route::delete('contacts/{contact}', [MailingController::class, 'contactsDestroy'])->name('contacts.destroy');
    Route::patch('contacts/{contact}/toggle', [MailingController::class, 'contactsToggle'])->name('contacts.toggle');

    // Acciones masivas
    Route::post('contacts/bulk-destroy', [MailingController::class, 'contactsBulkDestroy'])->name('contacts.bulk-destroy');
    Route::post('contacts/bulk-assign', [MailingController::class, 'contactsBulkAssign'])->name('contacts.bulk-assign');

    // Audiencias (Listas)
    Route::get('audiences', [MailingController::class, 'audiencesIndex'])->name('audiences.index');
    Route::post('audiences', [MailingController::class, 'audiencesStore'])->name('audiences.store');
    Route::delete('audiences/{audience}', [MailingController::class, 'audiencesDestroy'])->name('audiences.destroy');

    // Campañas
    Route::get('campaigns', [MailingController::class, 'campaignsIndex'])->name('campaigns.index');
    Route::get('campaigns/create', [MailingController::class, 'campaignsCreate'])->name('campaigns.create');
    Route::post('campaigns', [MailingController::class, 'campaignsStore'])->name('campaigns.store');
    Route::get('campaigns/{campaign}', [MailingController::class, 'campaignsShow'])->name('campaigns.show');
    Route::post('campaigns/{campaign}/send', [MailingController::class, 'campaignsSend'])->name('campaigns.send');
    Route::delete('campaigns/{campaign}', [MailingController::class, 'campaignsDestroy'])->name('campaigns.destroy');
});

// ─── Access Control ───────────────────────────────────────────────────────────
use App\Http\Controllers\Admin\AccessDeviceController;
use App\Http\Controllers\Admin\AccessEventController;

Route::prefix('access')->name('access.')->group(function () {
    Route::resource('events', AccessEventController::class);
    Route::post('events/{event}/import', [AccessEventController::class, 'import'])->name('events.import');
    Route::get('events/{event}/codes', [AccessEventController::class, 'codes'])->name('events.codes');
    Route::get('events/{event}/stats', [AccessEventController::class, 'stats'])->name('events.stats');
    Route::get('events/{event}/logs', [AccessEventController::class, 'logs'])->name('events.logs');
    Route::get('events/{event}/postback-logs', [AccessEventController::class, 'postbackLogs'])->name('events.postback-logs');
    Route::post('events/{event}/codes', [AccessEventController::class, 'storeCode'])->name('events.codes.store');
    Route::get('events/{event}/devices', [AccessEventController::class, 'devices'])->name('events.devices');
    Route::post('events/{event}/devices', [AccessEventController::class, 'assignDevice'])->name('events.devices.assign');
    Route::delete('events/{event}/clear', [AccessEventController::class, 'clearCodes'])->name('events.clear');
    Route::patch('events/{event}/codes/{code}/status', [AccessEventController::class, 'updateCodeStatus'])->name('events.codes.status');
    Route::delete('events/{event}/codes/{code}', [AccessEventController::class, 'deleteCode'])->name('events.codes.delete');

    Route::resource('devices', AccessDeviceController::class);
    Route::post('devices/{device}/toggle', [AccessDeviceController::class, 'toggle'])->name('devices.toggle');
    Route::post('apk/upload', [AccessDeviceController::class, 'uploadApk'])->name('apk.upload');
});

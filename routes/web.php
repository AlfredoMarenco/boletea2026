<?php

use App\Http\Controllers\EventController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\SalesCenterController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::post('/location', [LocationController::class, 'store'])->name('location.store');

Route::get('/evento/{slug}', [EventController::class, 'show'])->name('event.show');

use App\Http\Controllers\LocalEventBookingController;

Route::get('/compra/{slug}', [LocalEventBookingController::class, 'show'])->name('local-event.booking');

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

Route::get('/app-scanner/download', function () {
    $latest = ApkVersion::where('is_active', true)->orderBy('version_code', 'desc')->first();

    if (! $latest) {
        // Fallback for old way or if no version in DB
        $path = storage_path('app/public/scanner/boleteaccessos.apk');
        if (! file_exists($path)) {
            abort(404, 'La aplicación no está disponible aún.');
        }

        return response()->download($path, 'boleteaccessos.apk', [
            'Content-Type' => 'application/vnd.android.package-archive',
        ]);
    }

    $relativePath = str_replace('storage/', '', $latest->apk_path);
    $path = storage_path('app/public/'.$relativePath);

    if (! file_exists($path)) {
        abort(404, 'La aplicación no está disponible aún. Path: '.$path);
    }

    return response()->download($path, 'boleteaccessos_'.$latest->version_code.'.apk', [
        'Content-Type' => 'application/vnd.android.package-archive',
    ]);
})->name('scanner.download');

Route::get('/world-cup/status', function () {
    $service = app(WorldCupScoreService::class);

    return response()->json($service->updateScore());
})->name('world-cup.status');

// --- Public Refund Routes --- //
Route::get('/reembolsos', [RefundController::class, 'showForm'])->name('refund.form');
Route::post('/reembolsos/validar-orden', [RefundController::class, 'validateOrder'])->name('refund.validate_order');
Route::post('/reembolsos/validar-seguridad', [RefundController::class, 'validateSecondary'])->name('refund.validate_secondary');
Route::post('/reembolsos/validar-boleto', [RefundController::class, 'validateTicket'])->name('refund.validate_ticket');
Route::post('/reembolsos/solicitar', [RefundController::class, 'submitRequest'])->name('refund.submit');
Route::get('/reembolsos/exito', [RefundController::class, 'showSuccess'])->name('refund.success');
Route::get('/reembolsos/estatus', [RefundController::class, 'showTrackingForm'])->name('refund.track_form');
Route::post('/reembolsos/estatus', [RefundController::class, 'trackStatus'])->name('refund.track_status');
Route::get('/reembolsos/actualizar-documentos/{refundRequest}', [RefundController::class, 'showUpdateDocumentsForm'])
    ->name('refund.update_documents')
    ->middleware('signed');
Route::post('/reembolsos/actualizar-documentos/{refundRequest}', [RefundController::class, 'updateDocuments'])
    ->name('refund.submit_update_documents')
    ->middleware('signed');

use App\Http\Controllers\RefundController;
use App\Http\Controllers\SeatReservationController;
use App\Models\ApkVersion;
use App\Services\WorldCupScoreService;

Route::post('/reservar-asientos', [SeatReservationController::class, 'reserve'])->name('seats.reserve');
Route::post('/liberar-asientos', [SeatReservationController::class, 'release'])->name('seats.release');

require __DIR__.'/settings.php';

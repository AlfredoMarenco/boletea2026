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
    $latest = \App\Models\ApkVersion::where('is_active', true)->orderBy('version_code', 'desc')->first();

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
    $service = app(\App\Services\WorldCupScoreService::class);

    return response()->json($service->updateScore());
})->name('world-cup.status');

// --- Public Refund Routes --- //
Route::get('/reembolsos', [\App\Http\Controllers\RefundController::class, 'showForm'])->name('refund.form');
Route::post('/reembolsos/validar-orden', [\App\Http\Controllers\RefundController::class, 'validateOrder'])->name('refund.validate_order');
Route::post('/reembolsos/validar-seguridad', [\App\Http\Controllers\RefundController::class, 'validateSecondary'])->name('refund.validate_secondary');
Route::post('/reembolsos/validar-boleto', [\App\Http\Controllers\RefundController::class, 'validateTicket'])->name('refund.validate_ticket');
Route::post('/reembolsos/solicitar', [\App\Http\Controllers\RefundController::class, 'submitRequest'])->name('refund.submit');
Route::get('/reembolsos/exito', [\App\Http\Controllers\RefundController::class, 'showSuccess'])->name('refund.success');
Route::get('/reembolsos/estatus', [\App\Http\Controllers\RefundController::class, 'showTrackingForm'])->name('refund.track_form');
Route::post('/reembolsos/estatus', [\App\Http\Controllers\RefundController::class, 'trackStatus'])->name('refund.track_status');
Route::get('/reembolsos/actualizar-documentos/{refundRequest}', [\App\Http\Controllers\RefundController::class, 'showUpdateDocumentsForm'])
    ->name('refund.update_documents')
    ->middleware('signed');
Route::post('/reembolsos/actualizar-documentos/{refundRequest}', [\App\Http\Controllers\RefundController::class, 'updateDocuments'])
    ->name('refund.submit_update_documents')
    ->middleware('signed');

require __DIR__.'/settings.php';

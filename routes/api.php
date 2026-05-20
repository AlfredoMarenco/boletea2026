<?php

use App\Http\Controllers\Api\AccessControlController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ─── Access Control API ───────────────────────────────────────────────────────
Route::prefix('v1/access')->group(function () {
    // Debug route to check headers
    Route::get('/debug-headers', function (Illuminate\Http\Request $request) {
        return response()->json([
            'headers' => $request->headers->all(),
            'has_auth' => $request->hasHeader('Authorization'),
            'auth_header' => $request->header('Authorization'),
        ]);
    });

    // Endpoints públicos o con autenticación básica de dispositivo
    Route::post('/login-device', [AccessControlController::class, 'loginDevice']);
    Route::get('/check-apk', [\App\Http\Controllers\Api\ApkUpdateController::class, 'check']);

    // Endpoints protegidos por Sanctum (Dispositivos registrados)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/events', [AccessControlController::class, 'getEvents']);
        Route::get('/sync/{event}', [AccessControlController::class, 'syncCodes']);
        Route::get('/sync-deltas/{event}', [AccessControlController::class, 'getDeltas']);
        Route::post('/validate', [AccessControlController::class, 'validateCode']);
        Route::post('/sync-logs', [AccessControlController::class, 'syncLogs']);
    });
});

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApkVersion;
use Illuminate\Http\JsonResponse;

class ApkUpdateController extends Controller
{
    /**
     * Check for the latest APK version
     */
    public function check(): JsonResponse
    {
        $latest = ApkVersion::where('is_active', true)
            ->orderBy('version_code', 'desc')
            ->first();

        if (! $latest) {
            return response()->json([
                'error' => 'No active APK version found',
            ], 404);
        }

        return response()->json([
            'versionName' => $latest->version_name,
            'versionCode' => (string) $latest->version_code,
            'apkUrl' => url($latest->apk_path),
            'forceUpdate' => $latest->force_update,
            'description' => $latest->description,
        ]);
    }
}

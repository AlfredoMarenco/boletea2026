<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendAccessPostback;
use App\Models\AccessCode;
use App\Models\AccessDevice;
use App\Models\AccessEvent;
use App\Models\AccessLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccessControlController extends Controller
{
    public function loginDevice(Request $request)
    {
        $request->validate([
            'device_identifier' => 'required|string',
            'api_token' => 'required|string',
        ]);

        $device = AccessDevice::where('device_identifier', $request->device_identifier)
            ->where('api_token', $request->api_token)
            ->where('status', 'active')
            ->first();

        if (! $device) {
            return response()->json(['message' => 'Dispositivo no autorizado o inválido.'], 403);
        }

        $token = $device->createToken('scanner_access')->plainTextToken;

        return response()->json([
            'token' => $token,
            'device' => $device,
        ]);
    }

    public function getEvents(Request $request)
    {
        $events = AccessEvent::where('status', 'active')->get(['id', 'name', 'date']);

        return response()->json($events);
    }

    public function syncCodes(AccessEvent $event, Request $request)
    {
        $device = $request->user();
        $allowedSections = $this->getAllowedSections($device->id, $event->id);
        $since = $request->input('since'); // Expected format: Y-m-d H:i:s

        $query = $event->codes();

        if ($since) {
            // Only download codes updated after the last sync
            $query->where('updated_at', '>', Carbon::parse($since));
        } else {
            // Initial sync: don't download cancelled ones to save space
            $query->where('status', '!=', 'cancelled');
        }

        $codes = $query->get(['code', 'type', 'status', 'metadata', 'updated_at']);

        // Update last sync for the device in the pivot table
        DB::table('access_device_event')
            ->where('access_device_id', $device->id)
            ->where('access_event_id', $event->id)
            ->update(['updated_at' => now()]);

        return response()->json([
            'event' => $event->name,
            'codes' => $codes,
            'allowed_sections' => $allowedSections,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function getDeltas(AccessEvent $event, Request $request)
    {
        $since = $request->query('since');

        $query = $event->codes()
            ->whereIn('status', ['used', 'cancelled']);

        if ($since) {
            $query->where('updated_at', '>', Carbon::parse($since));
        }

        $deltas = $query->get(['code', 'status', 'updated_at']);

        return response()->json([
            'deltas' => $deltas,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    public function validateCode(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:access_events,id',
            'code' => 'required|string',
            'scanned_at' => 'nullable|date',
        ]);

        $device = $request->user();
        $event = AccessEvent::findOrFail($request->event_id);
        $scannedAt = $request->scanned_at ? Carbon::parse($request->scanned_at)->setTimezone(config('app.timezone')) : now();

        $accessCode = AccessCode::where('access_event_id', $event->id)
            ->where('code', $request->code)
            ->first();

        if (! $accessCode) {
            AccessLog::create([
                'access_event_id' => $event->id,
                'access_device_id' => $device->id,
                'scanned_code' => $request->code,
                'result' => 'invalid',
                'scanned_at' => $scannedAt,
            ]);

            SendAccessPostback::dispatch(
                $event->id,
                $request->code,
                'invalid',
                'Desconocido',
                $device->id,
                $scannedAt->toDateTimeString()
            );

            return response()->json(['status' => 'invalid', 'message' => 'Código no encontrado.'], 422);
        }

        if ($accessCode->status === 'used') {
            $lastLog = AccessLog::where('access_code_id', $accessCode->id)
                ->where('result', 'success')
                ->with('device')
                ->latest('scanned_at')
                ->first();

            $deviceName = $lastLog && $lastLog->device ? $lastLog->device->name : 'Dispositivo Desconocido';

            AccessLog::create([
                'access_event_id' => $event->id,
                'access_code_id' => $accessCode->id,
                'access_device_id' => $device->id,
                'scanned_code' => $request->code,
                'result' => 'duplicate',
                'scanned_at' => $scannedAt,
            ]);

            SendAccessPostback::dispatch(
                $event->id,
                $request->code,
                'duplicate',
                $accessCode->type ?? 'Desconocido',
                $device->id,
                $scannedAt->toDateTimeString()
            );

            return response()->json([
                'status' => 'duplicate',
                'message' => 'Código ya utilizado.',
                'duplicate_info' => [
                    'scanned_at' => $accessCode->scanned_at,
                    'device_name' => $deviceName,
                ],
            ], 422);
        }

        if ($accessCode->status === 'cancelled') {
            return response()->json(['status' => 'cancelled', 'message' => 'Código cancelado.'], 422);
        }

        $config = $this->getAllowedSections($device->id, $event->id);
        $allowedSections = $config;

        if (! empty($allowedSections)) {
            $codeSection = $accessCode->metadata['details'] ?? 'Desconocida';
            if (! in_array($codeSection, $allowedSections)) {
                AccessLog::create([
                    'access_event_id' => $event->id,
                    'access_device_id' => $device->id,
                    'scanned_code' => $request->code,
                    'result' => 'invalid_zone',
                    'scanned_at' => $scannedAt,
                ]);

                SendAccessPostback::dispatch(
                    $event->id,
                    $request->code,
                    'invalid_zone',
                    $accessCode->type ?? 'Desconocido',
                    $device->id,
                    $scannedAt->toDateTimeString()
                );

                return response()->json([
                    'status' => 'invalid_zone',
                    'message' => "Acceso denegado. Este código pertenece a la zona '{$codeSection}', la cual no está habilitada para esta puerta.",
                ], 403);
            }
        }

        // Success
        $accessCode->update([
            'status' => 'used',
            'scanned_at' => $scannedAt,
        ]);

        AccessLog::create([
            'access_event_id' => $event->id,
            'access_code_id' => $accessCode->id,
            'access_device_id' => $device->id,
            'scanned_code' => $request->code,
            'result' => 'success',
            'metadata' => $accessCode->metadata,
            'scanned_at' => $scannedAt,
        ]);

        SendAccessPostback::dispatch(
            $event->id,
            $request->code,
            'success',
            $accessCode->type ?? 'Desconocido',
            $device->id,
            $scannedAt->toDateTimeString()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Acceso concedido.',
            'type' => $accessCode->type,
            'metadata' => $accessCode->metadata,
        ]);
    }

    public function syncLogs(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:access_events,id',
            'logs' => 'required|array',
        ]);

        $device = $request->user();
        $event = AccessEvent::findOrFail($request->event_id);
        $syncedCount = 0;

        $allowedSections = $this->getAllowedSections($device->id, $event->id);

        foreach ($request->logs as $logData) {
            $codeStr = $logData['code'];
            $scannedAt = Carbon::parse($logData['scanned_at'])->setTimezone(config('app.timezone'));

            $accessCode = AccessCode::where('access_event_id', $event->id)
                ->where('code', $codeStr)
                ->first();

            $result = 'success';
            $codeId = null;

            if (! $accessCode) {
                $result = 'invalid';
            } elseif ($accessCode->status === 'used') {
                $result = 'duplicate';
                $codeId = $accessCode->id;
            } elseif ($accessCode->status === 'cancelled') {
                $result = 'cancelled';
                $codeId = $accessCode->id;
            } else {
                if (! empty($allowedSections)) {
                    $codeSection = $accessCode->metadata['details'] ?? '';
                    if (! in_array($codeSection, $allowedSections)) {
                        $result = 'invalid_zone';
                        $codeId = $accessCode->id;
                    }
                }

                if ($result === 'success') {
                    $accessCode->update([
                        'status' => 'used',
                        'scanned_at' => $scannedAt,
                    ]);
                    $codeId = $accessCode->id;
                    $syncedCount++;
                }
            }

            AccessLog::create([
                'access_event_id' => $event->id,
                'access_code_id' => $codeId,
                'access_device_id' => $device->id,
                'scanned_code' => $codeStr,
                'result' => $result,
                'metadata' => $accessCode ? $accessCode->metadata : null,
                'scanned_at' => $scannedAt,
            ]);

            SendAccessPostback::dispatch(
                $event->id,
                $codeStr,
                $result,
                $accessCode ? ($accessCode->type ?? 'Desconocido') : 'Desconocido',
                $device->id,
                $scannedAt->toDateTimeString()
            );
        }

        return response()->json([
            'message' => 'Sincronización completada.',
            'synced_count' => $syncedCount,
        ]);
    }

    /**
     * Get allowed sections for a device+event directly from the pivot table.
     * Returns null if no restriction (full access).
     */
    private function getAllowedSections(int $deviceId, int $eventId): ?array
    {
        $row = DB::table('access_device_event')
            ->where('access_device_id', $deviceId)
            ->where('access_event_id', $eventId)
            ->first();

        if (! $row || empty($row->allowed_sections)) {
            return null;
        }

        $decoded = json_decode($row->allowed_sections, true);

        return (is_array($decoded) && count($decoded) > 0) ? $decoded : null;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\SeatInventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SeatReservationController extends Controller
{
    /**
     * Reserve seats temporarily.
     */
    public function reserve(Request $request)
    {
        $validated = $request->validate([
            'event_map_id' => 'required|integer',
            'seat_uuids' => 'required|array',
            'seat_uuids.*' => 'required|string',
        ]);

        $eventMapId = $validated['event_map_id'];
        $seatUuids = $validated['seat_uuids'];
        $sessionId = app()->environment('testing') && $request->hasHeader('X-Session-ID')
            ? $request->header('X-Session-ID')
            : session()->getId();
        $expiresAt = now()->addMinutes(10);

        try {
            DB::beginTransaction();

            // Lock the seats for update to prevent concurrent reservation requests
            $seats = SeatInventory::where('event_map_id', $eventMapId)
                ->whereIn('seat_uuid', $seatUuids)
                ->lockForUpdate()
                ->get();

            // Verify all requested seats exist
            if ($seats->count() !== count($seatUuids)) {
                DB::rollBack();

                return response()->json(['message' => 'Algunos asientos no pudieron ser encontrados.'], 404);
            }

            // Verify availability
            foreach ($seats as $seat) {
                $isAvailable = $seat->status === 'available' ||
                    ($seat->status === 'reserved' && $seat->reserved_expires_at && $seat->reserved_expires_at->isPast());

                if (! $isAvailable) {
                    DB::rollBack();

                    return response()->json(['message' => "El asiento {$seat->row}-{$seat->number} ya no está disponible."], 422);
                }
            }

            // Update reservations
            foreach ($seats as $seat) {
                $seat->update([
                    'status' => 'reserved',
                    'reserved_expires_at' => $expiresAt,
                    'session_id' => $sessionId,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Asientos reservados exitosamente.',
                'expires_at' => $expiresAt->toIso8601String(),
                'seat_uuids' => $seatUuids,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Ocurrió un error al reservar los asientos: '.$e->getMessage()], 500);
        }
    }

    /**
     * Release seats reserved by the current session.
     */
    public function release(Request $request)
    {
        $validated = $request->validate([
            'event_map_id' => 'required|integer',
            'seat_uuids' => 'required|array',
            'seat_uuids.*' => 'required|string',
        ]);

        $eventMapId = $validated['event_map_id'];
        $seatUuids = $validated['seat_uuids'];
        $sessionId = app()->environment('testing') && $request->hasHeader('X-Session-ID')
            ? $request->header('X-Session-ID')
            : session()->getId();

        DB::transaction(function () use ($eventMapId, $seatUuids, $sessionId) {
            SeatInventory::where('event_map_id', $eventMapId)
                ->whereIn('seat_uuid', $seatUuids)
                ->where('session_id', $sessionId)
                ->where('status', 'reserved')
                ->lockForUpdate()
                ->update([
                    'status' => 'available',
                    'reserved_expires_at' => null,
                    'session_id' => null,
                ]);
        });

        return response()->json(['message' => 'Asientos liberados exitosamente.']);
    }
}

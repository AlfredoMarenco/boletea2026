<?php

namespace App\Http\Controllers;

use App\Models\SeatInventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SeatReservationController extends Controller
{
    /**
     * Reserve seats temporarily for web checkout.
     */
    public function reserve(Request $request)
    {
        $validated = $request->validate([
            'event_showtime_id' => 'nullable|integer|exists:event_showtimes,id',
            'event_map_id' => 'nullable|integer',
            'seat_uuids' => 'required|array',
            'seat_uuids.*' => 'required|string',
        ]);

        $showtimeId = $validated['event_showtime_id'] ?? null;
        $eventMapId = $validated['event_map_id'] ?? null;

        if (! $showtimeId && ! $eventMapId) {
            return response()->json(['message' => 'Se requiere el ID de la función (event_showtime_id) o del mapa.'], 422);
        }

        $seatUuids = $validated['seat_uuids'];
        $sessionId = app()->environment('testing') && $request->hasHeader('X-Session-ID')
            ? $request->header('X-Session-ID')
            : session()->getId();
        $expiresAt = now()->addMinutes(10);

        try {
            DB::beginTransaction();

            $query = SeatInventory::query();
            if ($showtimeId) {
                $query->where('event_showtime_id', $showtimeId);
            } else {
                $query->where('event_map_id', $eventMapId);
            }

            // Lock the seats for update to prevent concurrent reservation requests
            $seats = $query->whereIn('seat_uuid', $seatUuids)
                ->lockForUpdate()
                ->get();

            // Verify all requested seats exist
            if ($seats->count() !== count($seatUuids)) {
                DB::rollBack();

                return response()->json(['message' => 'Algunos asientos no pudieron ser encontrados o fueron modificados.'], 404);
            }

            // Verify availability
            foreach ($seats as $seat) {
                $isAvailable = $seat->status === 'available' ||
                    ($seat->status === 'reserved' && $seat->reserved_expires_at && $seat->reserved_expires_at->isPast()) ||
                    ($seat->status === 'reserved' && $seat->session_id === $sessionId);

                if (! $isAvailable) {
                    DB::rollBack();

                    $seatLabel = $seat->row ? "{$seat->row}-{$seat->number}" : ($seat->section ?: $seat->seat_uuid);

                    return response()->json(['message' => "El asiento/boleto {$seatLabel} ya no está disponible para selección."], 422);
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
                'reserved_count' => $seats->count(),
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
            'event_showtime_id' => 'nullable|integer',
            'event_map_id' => 'nullable|integer',
            'seat_uuids' => 'required|array',
            'seat_uuids.*' => 'required|string',
        ]);

        $showtimeId = $validated['event_showtime_id'] ?? null;
        $eventMapId = $validated['event_map_id'] ?? null;
        $seatUuids = $validated['seat_uuids'];
        $sessionId = app()->environment('testing') && $request->hasHeader('X-Session-ID')
            ? $request->header('X-Session-ID')
            : session()->getId();

        DB::transaction(function () use ($showtimeId, $eventMapId, $seatUuids, $sessionId) {
            $query = SeatInventory::query();
            if ($showtimeId) {
                $query->where('event_showtime_id', $showtimeId);
            } elseif ($eventMapId) {
                $query->where('event_map_id', $eventMapId);
            }

            $query->whereIn('seat_uuid', $seatUuids)
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

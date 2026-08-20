<?php

use App\Models\Event;
use App\Models\SeatingMap;
use App\Models\SeatInventory;
use App\Models\Venue;
use Illuminate\Support\Facades\Artisan;

test('a user can temporarily reserve available seats', function () {
    $venue = Venue::create(['name' => 'Venue A', 'address' => 'Addr 1']);
    $seatingMap = SeatingMap::create([
        'name' => 'Map A',
        'venue_id' => $venue->id,
        'layout_json' => ['nodes' => []],
    ]);
    $event = Event::create([
        'name' => 'Concert',
        'slug' => 'concert',
        'start_date' => now()->addDays(2),
        'venue_id' => $venue->id,
        'status' => 'draft',
    ]);
    $showtime = $event->showtimes()->create([
        'name' => 'Función 1',
        'date_time' => now()->addDays(2),
        'seating_map_id' => $seatingMap->id,
    ]);

    $seat1 = SeatInventory::create([
        'event_showtime_id' => $showtime->id,
        'seat_uuid' => 'uuid-1',
        'status' => 'available',
        'price' => 100,
        'row' => 'A',
        'number' => '1',
    ]);

    $seat2 = SeatInventory::create([
        'event_showtime_id' => $showtime->id,
        'seat_uuid' => 'uuid-2',
        'status' => 'available',
        'price' => 100,
        'row' => 'A',
        'number' => '2',
    ]);

    $response = $this->post(route('seats.reserve'), [
        'event_showtime_id' => $showtime->id,
        'seat_uuids' => ['uuid-1', 'uuid-2'],
    ]);

    $response->assertOk();
    $response->assertJsonStructure(['message', 'expires_at', 'seat_uuids']);

    // Check database
    expect($seat1->fresh()->status)->toBe('reserved');
    expect($seat1->fresh()->session_id)->not->toBeNull();
    expect($seat2->fresh()->status)->toBe('reserved');
});

test('a user cannot reserve already reserved or sold seats', function () {
    $venue = Venue::create(['name' => 'Venue B', 'address' => 'Addr 2']);
    $seatingMap = SeatingMap::create([
        'name' => 'Map B',
        'venue_id' => $venue->id,
        'layout_json' => ['nodes' => []],
    ]);
    $event = Event::create([
        'name' => 'Concert B',
        'slug' => 'concert-b',
        'start_date' => now()->addDays(2),
        'venue_id' => $venue->id,
        'status' => 'draft',
    ]);
    $showtime = $event->showtimes()->create([
        'name' => 'Función 1',
        'date_time' => now()->addDays(2),
        'seating_map_id' => $seatingMap->id,
    ]);

    // Pre-create a sold seat
    $soldSeat = SeatInventory::create([
        'event_showtime_id' => $showtime->id,
        'seat_uuid' => 'uuid-sold',
        'status' => 'sold',
        'price' => 100,
        'row' => 'A',
        'number' => '1',
    ]);

    // Pre-create an actively reserved seat
    $reservedSeat = SeatInventory::create([
        'event_showtime_id' => $showtime->id,
        'seat_uuid' => 'uuid-reserved',
        'status' => 'reserved',
        'reserved_expires_at' => now()->addMinutes(5),
        'session_id' => 'other-session-id',
        'price' => 100,
        'row' => 'A',
        'number' => '2',
    ]);

    // Try to reserve the sold seat
    $response = $this->post(route('seats.reserve'), [
        'event_showtime_id' => $showtime->id,
        'seat_uuids' => ['uuid-sold'],
    ]);
    $response->assertStatus(422);

    // Try to reserve the active reserved seat
    $response2 = $this->post(route('seats.reserve'), [
        'event_showtime_id' => $showtime->id,
        'seat_uuids' => ['uuid-reserved'],
    ]);
    $response2->assertStatus(422);
});

test('a user can reserve an expired reservation seat', function () {
    $venue = Venue::create(['name' => 'Venue C', 'address' => 'Addr 3']);
    $seatingMap = SeatingMap::create([
        'name' => 'Map C',
        'venue_id' => $venue->id,
        'layout_json' => ['nodes' => []],
    ]);
    $event = Event::create([
        'name' => 'Concert C',
        'slug' => 'concert-c',
        'start_date' => now()->addDays(2),
        'venue_id' => $venue->id,
        'status' => 'draft',
    ]);
    $showtime = $event->showtimes()->create([
        'name' => 'Función 1',
        'date_time' => now()->addDays(2),
        'seating_map_id' => $seatingMap->id,
    ]);

    // Pre-create an expired reserved seat
    $expiredSeat = SeatInventory::create([
        'event_showtime_id' => $showtime->id,
        'seat_uuid' => 'uuid-expired',
        'status' => 'reserved',
        'reserved_expires_at' => now()->subMinutes(1),
        'session_id' => 'old-session-id',
        'price' => 100,
        'row' => 'A',
        'number' => '1',
    ]);

    $response = $this->post(route('seats.reserve'), [
        'event_showtime_id' => $showtime->id,
        'seat_uuids' => ['uuid-expired'],
    ], [
        'X-Session-ID' => 'test-session-expired',
    ]);

    $response->assertOk();
    expect($expiredSeat->fresh()->status)->toBe('reserved');
    expect($expiredSeat->fresh()->session_id)->toBe('test-session-expired');
});

test('a user can release their own reserved seats', function () {
    $venue = Venue::create(['name' => 'Venue D', 'address' => 'Addr 4']);
    $seatingMap = SeatingMap::create([
        'name' => 'Map D',
        'venue_id' => $venue->id,
        'layout_json' => ['nodes' => []],
    ]);
    $event = Event::create([
        'name' => 'Concert D',
        'slug' => 'concert-d',
        'start_date' => now()->addDays(2),
        'venue_id' => $venue->id,
        'status' => 'draft',
    ]);
    $showtime = $event->showtimes()->create([
        'name' => 'Función 1',
        'date_time' => now()->addDays(2),
        'seating_map_id' => $seatingMap->id,
    ]);

    $seat = SeatInventory::create([
        'event_showtime_id' => $showtime->id,
        'seat_uuid' => 'uuid-rel',
        'status' => 'available',
        'price' => 100,
        'row' => 'A',
        'number' => '1',
    ]);

    // 1. Reserve it via HTTP request with a fixed session header
    $this->post(route('seats.reserve'), [
        'event_showtime_id' => $showtime->id,
        'seat_uuids' => ['uuid-rel'],
    ], [
        'X-Session-ID' => 'test-session-release',
    ])->assertOk();

    expect($seat->fresh()->status)->toBe('reserved');

    // 2. Release it via HTTP request using the same session header
    $response = $this->post(route('seats.release'), [
        'event_showtime_id' => $showtime->id,
        'seat_uuids' => ['uuid-rel'],
    ], [
        'X-Session-ID' => 'test-session-release',
    ]);

    $response->assertOk();
    expect($seat->fresh()->status)->toBe('available');
    expect($seat->fresh()->session_id)->toBeNull();
});

test('cleanup artisan command releases all expired seat reservations', function () {
    $venue = Venue::create(['name' => 'Venue E', 'address' => 'Addr 5']);
    $seatingMap = SeatingMap::create([
        'name' => 'Map E',
        'venue_id' => $venue->id,
        'layout_json' => ['nodes' => []],
    ]);
    $event = Event::create([
        'name' => 'Concert E',
        'slug' => 'concert-e',
        'start_date' => now()->addDays(2),
        'venue_id' => $venue->id,
        'status' => 'draft',
    ]);
    $showtime = $event->showtimes()->create([
        'name' => 'Función 1',
        'date_time' => now()->addDays(2),
        'seating_map_id' => $seatingMap->id,
    ]);

    $expiredSeat = SeatInventory::create([
        'event_showtime_id' => $showtime->id,
        'seat_uuid' => 'uuid-expired-cmd',
        'status' => 'reserved',
        'reserved_expires_at' => now()->subSeconds(1),
        'session_id' => 'some-session',
        'price' => 100,
        'row' => 'A',
        'number' => '1',
    ]);

    $activeSeat = SeatInventory::create([
        'event_showtime_id' => $showtime->id,
        'seat_uuid' => 'uuid-active-cmd',
        'status' => 'reserved',
        'reserved_expires_at' => now()->addMinutes(10),
        'session_id' => 'some-session',
        'price' => 100,
        'row' => 'A',
        'number' => '2',
    ]);

    Artisan::call('reservations:cleanup');

    expect($expiredSeat->fresh()->status)->toBe('available');
    expect($expiredSeat->fresh()->session_id)->toBeNull();

    expect($activeSeat->fresh()->status)->toBe('reserved');
    expect($activeSeat->fresh()->session_id)->toBe('some-session');
});

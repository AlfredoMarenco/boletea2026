<?php

use App\Models\Event;
use App\Models\EventShowtime;
use App\Models\SeatingMap;
use App\Models\SeatInventory;
use App\Models\Venue;

test('it creates event showtime and checks deletion rules', function () {
    $venue = Venue::create(['name' => 'Arena Test']);
    $map = SeatingMap::create([
        'venue_id' => $venue->id,
        'name' => 'Mapa Test',
        'layout_json' => ['nodes' => []],
        'is_active' => true,
    ]);

    $event = Event::create([
        'name' => 'Concierto Test',
        'slug' => 'concierto-test',
        'venue_id' => $venue->id,
        'status' => 'published',
    ]);

    $showtime = EventShowtime::create([
        'event_id' => $event->id,
        'seating_map_id' => $map->id,
        'name' => 'Función 1',
        'date_time' => now()->addDays(2),
        'status' => 'on_sale',
        'layout_snapshot' => ['nodes' => []],
    ]);

    expect($showtime->canBeDeleted())->toBeTrue();

    // Create a sold seat in inventory
    SeatInventory::create([
        'event_showtime_id' => $showtime->id,
        'seat_uuid' => 'seat-uuid-1',
        'status' => 'sold',
        'price' => 100.00,
    ]);

    expect($showtime->canBeDeleted())->toBeFalse();
    expect($event->canBeDeleted())->toBeFalse();
});

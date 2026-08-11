<?php

use App\Models\Event;
use App\Models\SeatingMap;
use App\Models\Venue;
use Inertia\Testing\AssertableInertia as Assert;

test('guests can view public booking page for a published local event', function () {
    $venue = Venue::create(['name' => 'Recinto X', 'address' => 'Direccion X']);
    $seatingMap = SeatingMap::create([
        'name' => 'Layout X',
        'venue_id' => $venue->id,
        'layout_json' => ['nodes' => []],
    ]);
    $event = Event::create([
        'name' => 'Gran Concierto',
        'slug' => 'gran-concierto',
        'start_date' => now()->addDays(5),
        'venue_id' => $venue->id,
        'status' => 'published',
    ]);
    $eventMap = $event->eventMaps()->create([
        'seating_map_id' => $seatingMap->id,
    ]);

    $response = $this->get(route('local-event.booking', $event->slug));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Public/EventBooking')
        ->has('event')
        ->has('seatingMap')
        ->has('inventories')
    );
});

test('booking page returns 404 if seating map is not configured', function () {
    $venue = Venue::create(['name' => 'Recinto Y', 'address' => 'Direccion Y']);
    $event = Event::create([
        'name' => 'Concierto Sin Mapa',
        'slug' => 'concierto-sin-mapa',
        'start_date' => now()->addDays(5),
        'venue_id' => $venue->id,
        'status' => 'published',
    ]);

    $response = $this->get(route('local-event.booking', $event->slug));

    $response->assertStatus(404);
});

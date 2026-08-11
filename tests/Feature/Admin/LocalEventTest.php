<?php

use App\Models\Event;
use App\Models\EventMap;
use App\Models\SeatingMap;
use App\Models\SeatInventory;
use App\Models\User;
use App\Models\Venue;

test('authenticated users can create a local event with an associated seating map', function () {
    $user = User::factory()->create();
    $venue = Venue::create([
        'name' => 'Auditorium A',
        'address' => 'Street 1',
    ]);
    $seatingMap = SeatingMap::create([
        'name' => 'Auditorium Map',
        'venue_id' => $venue->id,
        'layout_json' => ['nodes' => []],
    ]);

    $response = $this->actingAs($user)
        ->post(route('admin.local-events.store'), [
            'name' => 'Rock Night 2026',
            'description' => 'A local rock concert',
            'start_date' => now()->addDays(5)->toDateTimeString(),
            'venue_id' => $venue->id,
            'seating_map_id' => $seatingMap->id,
        ]);

    $response->assertRedirect(route('admin.local-events.index'));

    $event = Event::first();
    expect($event->name)->toBe('Rock Night 2026');
    expect($event->venue_id)->toBe($venue->id);

    $eventMap = EventMap::where('event_id', $event->id)->first();
    expect($eventMap)->not->toBeNull();
    expect($eventMap->seating_map_id)->toBe($seatingMap->id);
});

test('authenticated users can configure event category prices', function () {
    $user = User::factory()->create();
    $venue = Venue::create([
        'name' => 'Auditorium B',
        'address' => 'Street 2',
    ]);
    $seatingMap = SeatingMap::create([
        'name' => 'Auditorium Map B',
        'venue_id' => $venue->id,
        'layout_json' => [
            'nodes' => [
                ['id' => 'seat-1', 'type' => 'seat', 'section' => 'VIP', 'row' => 'A', 'number' => '1'],
                ['id' => 'seat-2', 'type' => 'seat', 'section' => 'General', 'row' => 'B', 'number' => '1'],
            ],
        ],
    ]);
    $event = Event::create([
        'name' => 'Jazz Night',
        'slug' => 'jazz-night',
        'start_date' => now()->addDays(2),
        'venue_id' => $venue->id,
        'status' => 'draft',
    ]);
    $eventMap = $event->eventMaps()->create([
        'seating_map_id' => $seatingMap->id,
        'settings_json' => [],
    ]);

    $response = $this->actingAs($user)
        ->post(route('admin.local-events.prices.update', $event->id), [
            'prices' => [
                ['name' => 'VIP', 'price' => 150.00, 'service_charge' => 15.00, 'web_sales_enabled' => true, 'box_office_sales_enabled' => true],
                ['name' => 'General', 'price' => 50.00, 'service_charge' => 5.00, 'web_sales_enabled' => true, 'box_office_sales_enabled' => true],
            ],
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('event_prices', [
        'event_id' => $event->id,
        'name' => 'VIP',
        'price' => 150.00,
    ]);
    $this->assertDatabaseHas('event_prices', [
        'event_id' => $event->id,
        'name' => 'General',
        'price' => 50.00,
    ]);
});

test('generating inventory maps seating nodes to database seat_inventories and preserves sold seats', function () {
    $user = User::factory()->create();
    $venue = Venue::create([
        'name' => 'Auditorium C',
        'address' => 'Street 3',
    ]);
    $seatingMap = SeatingMap::create([
        'name' => 'Auditorium Map C',
        'venue_id' => $venue->id,
        'layout_json' => [
            'nodes' => [
                ['id' => 'seat-1', 'type' => 'seat', 'section' => 'VIP', 'row' => 'A', 'number' => '1'],
                ['id' => 'seat-2', 'type' => 'seat', 'section' => 'General', 'row' => 'B', 'number' => '1'],
                ['id' => 'label-1', 'type' => 'text', 'text' => 'Stage'], // non-seat node
            ],
        ],
    ]);
    $event = Event::create([
        'name' => 'Opera Night',
        'slug' => 'opera-night',
        'start_date' => now()->addDays(3),
        'venue_id' => $venue->id,
        'status' => 'draft',
    ]);
    $eventMap = $event->eventMaps()->create([
        'seating_map_id' => $seatingMap->id,
        'settings_json' => [],
    ]);

    // Setup prices
    $event->prices()->create(['name' => 'VIP', 'price' => 200.00]);
    $event->prices()->create(['name' => 'General', 'price' => 80.00]);

    // Generate inventory
    $response = $this->actingAs($user)
        ->post(route('admin.local-events.inventory', $event->id));

    $response->assertRedirect();
    $event->refresh();
    expect($event->status)->toBe('published');

    // Should create 2 seats (seat-1 and seat-2), ignoring text labels
    expect(SeatInventory::count())->toBe(2);

    $vipSeat = SeatInventory::where('seat_uuid', 'seat-1')->first();
    expect($vipSeat->price)->toEqual(200.00);
    expect($vipSeat->status)->toBe('available');
    expect($vipSeat->category)->toBe('VIP');

    // Simulate purchasing one seat
    $vipSeat->update(['status' => 'sold']);

    // Regenerate inventory (e.g. if map layout was modified or updated)
    $response = $this->actingAs($user)
        ->post(route('admin.local-events.inventory', $event->id));

    // The sold seat should NOT be deleted or reset, but the general seat should be recreated
    expect(SeatInventory::count())->toBe(2);
    expect($vipSeat->fresh()->status)->toBe('sold');
    expect(SeatInventory::where('seat_uuid', 'seat-2')->first()->status)->toBe('available');
});

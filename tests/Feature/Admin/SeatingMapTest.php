<?php

use App\Models\SeatingMap;
use App\Models\User;
use App\Models\Venue;

test('authenticated users can view seating maps index page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('admin.seating-maps.index'));

    $response->assertOk();
});

test('authenticated users can access seating map creation page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('admin.seating-maps.create'));

    $response->assertOk();
});

test('authenticated users can store a new seating map', function () {
    $user = User::factory()->create();
    $venue = Venue::create([
        'name' => 'Stadium A',
        'address' => '123 Main St',
    ]);

    $response = $this->actingAs($user)
        ->post(route('admin.seating-maps.store'), [
            'name' => 'Main Seating Layout',
            'venue_id' => $venue->id,
        ]);

    $seatingMap = SeatingMap::first();

    $response->assertRedirect(route('admin.seating-maps.edit', $seatingMap->id));
    expect($seatingMap->name)->toBe('Main Seating Layout');
    expect($seatingMap->venue_id)->toBe($venue->id);
    expect($seatingMap->layout_json)->toBeArray();
});

test('authenticated users can edit and update seating map details', function () {
    $user = User::factory()->create();
    $venue = Venue::create([
        'name' => 'Stadium B',
        'address' => '456 Main St',
    ]);
    $seatingMap = SeatingMap::create([
        'name' => 'Old Seating Map',
        'venue_id' => $venue->id,
        'layout_json' => ['nodes' => []],
    ]);

    // View edit page
    $response = $this->actingAs($user)
        ->get(route('admin.seating-maps.edit', $seatingMap->id));
    $response->assertOk();

    // Update layout_json and name
    $newLayout = [
        'nodes' => [
            ['id' => 'seat-1', 'type' => 'seat', 'section' => 'VIP', 'row' => 'A', 'number' => '1'],
        ],
    ];

    $response = $this->actingAs($user)
        ->put(route('admin.seating-maps.update', $seatingMap->id), [
            'name' => 'Updated Seating Map',
            'layout_json' => $newLayout,
        ]);

    $response->assertRedirect();
    $seatingMap->refresh();
    expect($seatingMap->name)->toBe('Updated Seating Map');
    expect($seatingMap->layout_json)->toBe($newLayout);
});

test('authenticated users can delete a seating map', function () {
    $user = User::factory()->create();
    $venue = Venue::create([
        'name' => 'Stadium C',
        'address' => '789 Main St',
    ]);
    $seatingMap = SeatingMap::create([
        'name' => 'Temporary Map',
        'venue_id' => $venue->id,
        'layout_json' => ['nodes' => []],
    ]);

    $response = $this->actingAs($user)
        ->delete(route('admin.seating-maps.destroy', $seatingMap->id));

    $response->assertRedirect(route('admin.seating-maps.index'));
    expect(SeatingMap::find($seatingMap->id))->toBeNull();
});

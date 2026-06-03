<?php

use App\Models\AccessCode;
use App\Models\AccessEvent;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated users can view access codes with filters', function () {
    $user = User::factory()->create();
    $event = AccessEvent::create([
        'name' => 'Event A',
        'status' => 'active',
    ]);

    // Create some codes with different types and statuses
    AccessCode::create([
        'access_event_id' => $event->id,
        'code' => 'ABC111',
        'type' => 'General',
        'status' => 'pending',
    ]);

    AccessCode::create([
        'access_event_id' => $event->id,
        'code' => 'VIP222',
        'type' => 'VIP',
        'status' => 'used',
    ]);

    AccessCode::create([
        'access_event_id' => $event->id,
        'code' => 'VIP333',
        'type' => 'VIP',
        'status' => 'cancelled',
    ]);

    $response = $this->actingAs($user)
        ->get(route('admin.access.events.codes', $event->id));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Access/Events/Codes')
        ->has('event')
        ->has('codes.data', 3)
        ->where('types', fn ($types) => $types->contains('General') && $types->contains('VIP'))
    );

    // Test search filter
    $response = $this->actingAs($user)
        ->get(route('admin.access.events.codes', [
            'event' => $event->id,
            'search' => 'ABC',
        ]));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Access/Events/Codes')
        ->has('codes.data', 1)
        ->where('codes.data.0.code', 'ABC111')
    );

    // Test type filter
    $response = $this->actingAs($user)
        ->get(route('admin.access.events.codes', [
            'event' => $event->id,
            'type' => 'VIP',
        ]));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Access/Events/Codes')
        ->has('codes.data', 2)
    );

    // Test status filter
    $response = $this->actingAs($user)
        ->get(route('admin.access.events.codes', [
            'event' => $event->id,
            'status' => 'used',
        ]));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Admin/Access/Events/Codes')
        ->has('codes.data', 1)
        ->where('codes.data.0.code', 'VIP222')
    );
});

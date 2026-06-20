<?php

use App\Models\ExternalEvent;
use App\Models\User;

test('guests can view published events', function () {
    $event = ExternalEvent::create([
        'title' => 'Test Published Event',
        'slug' => 'test-published-event',
        'status' => 'published',
        'external_id' => 'EXT_TEST_1',
    ]);

    $response = $this->get(route('event.show', $event->slug));

    $response->assertOk();
    $response->assertSee('Test Published Event');
});

test('guests are redirected when viewing draft events', function () {
    $event = ExternalEvent::create([
        'title' => 'Test Draft Event',
        'slug' => 'test-draft-event',
        'status' => 'draft',
        'external_id' => 'EXT_TEST_2',
    ]);

    $response = $this->get(route('event.show', $event->slug));

    $response->assertRedirect(route('home'));
});

test('authenticated users can preview draft events', function () {
    $user = User::factory()->create();

    $event = ExternalEvent::create([
        'title' => 'Test Draft Event Preview',
        'slug' => 'test-draft-event-preview',
        'status' => 'draft',
        'external_id' => 'EXT_TEST_3',
    ]);

    $response = $this->actingAs($user)
        ->get(route('event.show', $event->slug));

    $response->assertOk();
    $response->assertSee('Test Draft Event Preview');
});

test('updating an event redirects back instead of index', function () {
    $user = User::factory()->create();

    $event = ExternalEvent::create([
        'title' => 'Original Title',
        'slug' => 'original-slug',
        'status' => 'published',
        'external_id' => 'EXT_TEST_4',
    ]);

    // Send PUT request to update event
    $response = $this->actingAs($user)
        ->from(route('admin.events.edit', $event->id))
        ->put(route('admin.events.update', $event->id), [
            'title' => 'Updated Title',
            'slug' => 'original-slug',
            'status' => 'published',
        ]);

    // Should redirect back to the edit page
    $response->assertRedirect(route('admin.events.edit', $event->id));

    // Verify title was updated in database
    expect($event->refresh()->title)->toBe('Updated Title');
});

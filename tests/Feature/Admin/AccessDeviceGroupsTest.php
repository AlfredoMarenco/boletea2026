<?php

use App\Models\AccessDevice;
use App\Models\AccessDeviceGroup;
use App\Models\AccessEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

test('authenticated users can create a device group scoped to an event', function () {
    $user = User::factory()->create();
    $event = AccessEvent::create([
        'name' => 'Event A',
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)
        ->post(route('admin.access.events.groups.store', $event->id), [
            'name' => 'Main Gate Scanners',
            'description' => 'Scanners located at the main entry point',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('access_device_groups', [
        'access_event_id' => $event->id,
        'name' => 'Main Gate Scanners',
        'description' => 'Scanners located at the main entry point',
    ]);
});

test('updating a group updates its details and propagates allowed sections to member devices', function () {
    $user = User::factory()->create();

    $event = AccessEvent::create([
        'name' => 'Mega Concert 2026',
        'status' => 'active',
    ]);

    $group = AccessDeviceGroup::create([
        'access_event_id' => $event->id,
        'name' => 'VIP Scanners',
        'allowed_sections' => ['VIP Zone'],
    ]);

    $device = AccessDevice::create([
        'name' => 'Scanner 1',
        'device_identifier' => 'scan-1',
        'api_token' => 'token-1',
        'status' => 'active',
    ]);

    // Put device inside the group for this event
    DB::table('access_device_event')->insert([
        'access_event_id' => $event->id,
        'access_device_id' => $device->id,
        'access_device_group_id' => $group->id,
        'allowed_sections' => json_encode(['VIP Zone']),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Update group details and permissions
    $response = $this->actingAs($user)
        ->put(route('admin.access.events.groups.update', ['event' => $event->id, 'group' => $group->id]), [
            'name' => 'VIP Scanners Updated',
            'description' => 'All VIP entries',
            'allowed_sections' => ['VIP Zone', 'Backstage'],
        ]);

    $response->assertRedirect();

    // Check group was updated
    $group->refresh();
    expect($group->name)->toBe('VIP Scanners Updated');
    expect($group->allowed_sections)->toBe(['VIP Zone', 'Backstage']);

    // Verify that the device's configuration updated as well
    $this->assertDatabaseHas('access_device_event', [
        'access_event_id' => $event->id,
        'access_device_id' => $device->id,
        'access_device_group_id' => $group->id,
        'allowed_sections' => json_encode(['VIP Zone', 'Backstage']),
    ]);
});

test('moving a device to a group updates its group assignment and copies group sections', function () {
    $user = User::factory()->create();

    $event = AccessEvent::create([
        'name' => 'Rock Festival',
        'status' => 'active',
    ]);

    $group = AccessDeviceGroup::create([
        'access_event_id' => $event->id,
        'name' => 'General Admission',
        'allowed_sections' => ['General North', 'General South'],
    ]);

    $device = AccessDevice::create([
        'name' => 'Scanner A',
        'device_identifier' => 'scan-a',
        'status' => 'active',
    ]);

    // Move device to group via Drag and Drop route
    $response = $this->actingAs($user)
        ->post(route('admin.access.events.devices.move', $event->id), [
            'device_id' => $device->id,
            'group_id' => $group->id,
        ]);

    $response->assertRedirect();

    // Check device is linked to group and inherited sections
    $this->assertDatabaseHas('access_device_event', [
        'access_event_id' => $event->id,
        'access_device_id' => $device->id,
        'access_device_group_id' => $group->id,
        'allowed_sections' => json_encode(['General North', 'General South']),
    ]);
});

test('moving a device to null ungrouped state updates group assignment to null', function () {
    $user = User::factory()->create();

    $event = AccessEvent::create([
        'name' => 'Rock Festival',
        'status' => 'active',
    ]);

    $group = AccessDeviceGroup::create([
        'access_event_id' => $event->id,
        'name' => 'General Admission',
        'allowed_sections' => ['General North'],
    ]);

    $device = AccessDevice::create([
        'name' => 'Scanner A',
        'device_identifier' => 'scan-a',
        'status' => 'active',
    ]);

    // Initial assignment
    DB::table('access_device_event')->insert([
        'access_event_id' => $event->id,
        'access_device_id' => $device->id,
        'access_device_group_id' => $group->id,
        'allowed_sections' => json_encode(['General North']),
    ]);

    // Move device out of group (drag to ungrouped)
    $response = $this->actingAs($user)
        ->post(route('admin.access.events.devices.move', $event->id), [
            'device_id' => $device->id,
            'group_id' => null,
        ]);

    $response->assertRedirect();

    // Check group is set to null
    $this->assertDatabaseHas('access_device_event', [
        'access_event_id' => $event->id,
        'access_device_id' => $device->id,
        'access_device_group_id' => null,
        'allowed_sections' => json_encode(['General North']), // Allowed sections preserved for individual tweaking
    ]);
});

test('deleting a group sets member devices access_device_group_id to null', function () {
    $user = User::factory()->create();

    $event = AccessEvent::create([
        'name' => 'Mega Concert 2026',
        'status' => 'active',
    ]);

    $group = AccessDeviceGroup::create([
        'access_event_id' => $event->id,
        'name' => 'VIP Scanners',
    ]);

    $device = AccessDevice::create([
        'name' => 'Scanner 1',
        'device_identifier' => 'scan-1',
        'status' => 'active',
    ]);

    DB::table('access_device_event')->insert([
        'access_event_id' => $event->id,
        'access_device_id' => $device->id,
        'access_device_group_id' => $group->id,
        'allowed_sections' => json_encode(['VIP Zone']),
    ]);

    $response = $this->actingAs($user)
        ->delete(route('admin.access.events.groups.destroy', ['event' => $event->id, 'group' => $group->id]));

    $response->assertRedirect();
    $this->assertDatabaseMissing('access_device_groups', ['id' => $group->id]);

    // Verify access_device_group_id was set to null on delete constraint
    $this->assertDatabaseHas('access_device_event', [
        'access_event_id' => $event->id,
        'access_device_id' => $device->id,
        'access_device_group_id' => null,
    ]);
});

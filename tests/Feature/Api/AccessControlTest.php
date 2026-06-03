<?php

use App\Jobs\SendAccessPostback;
use App\Models\AccessCode;
use App\Models\AccessDevice;
use App\Models\AccessEvent;
use App\Models\AccessLog;
use App\Models\PostbackUrl;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Queue::fake();

    $this->device = AccessDevice::create([
        'name' => 'Test Scanner',
        'device_identifier' => 'test-device-id',
        'api_token' => 'test-token',
        'status' => 'active',
    ]);

    $this->event = AccessEvent::create([
        'name' => 'Test Access Event',
        'status' => 'active',
    ]);

    DB::table('access_device_event')->insert([
        'access_device_id' => $this->device->id,
        'access_event_id' => $this->event->id,
        'allowed_sections' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->code = AccessCode::create([
        'access_event_id' => $this->event->id,
        'code' => 'TESTCODE123',
        'type' => 'General',
        'status' => 'pending',
        'metadata' => ['details' => 'VIP'],
    ]);
});

test('online validation converts UTC scanned_at timestamp to America/Mexico_City', function () {
    Sanctum::actingAs($this->device);

    $utcTimestamp = '2026-05-30T00:16:19.000Z';

    $response = $this->postJson('/api/v1/access/validate', [
        'event_id' => $this->event->id,
        'code' => 'TESTCODE123',
        'scanned_at' => $utcTimestamp,
    ]);

    $response->assertOk();

    $this->code->refresh();
    expect($this->code->status)->toBe('used');
    expect($this->code->scanned_at->format('Y-m-d H:i:s'))->toBe('2026-05-29 18:16:19');

    $log = AccessLog::where('access_code_id', $this->code->id)->first();
    expect($log)->not->toBeNull();
    expect(Carbon::parse($log->scanned_at)->format('Y-m-d H:i:s'))->toBe('2026-05-29 18:16:19');
});

test('offline logs sync converts UTC scanned_at timestamps to America/Mexico_City', function () {
    Sanctum::actingAs($this->device);

    $utcTimestamp = '2026-05-30T00:16:19.000Z';

    $response = $this->postJson('/api/v1/access/sync-logs', [
        'event_id' => $this->event->id,
        'logs' => [
            [
                'code' => 'TESTCODE123',
                'scanned_at' => $utcTimestamp,
            ],
        ],
    ]);

    $response->assertOk();

    $this->code->refresh();
    expect($this->code->status)->toBe('used');
    expect($this->code->scanned_at->format('Y-m-d H:i:s'))->toBe('2026-05-29 18:16:19');

    $log = AccessLog::where('access_code_id', $this->code->id)->first();
    expect($log)->not->toBeNull();
    expect(Carbon::parse($log->scanned_at)->format('Y-m-d H:i:s'))->toBe('2026-05-29 18:16:19');
});

test('postback job is dispatched when event has a postback URL', function () {
    Sanctum::actingAs($this->device);

    $postback = PostbackUrl::create([
        'name' => 'Active Postback Server',
        'url' => 'https://test-server.com/postback',
        'is_active' => true,
    ]);
    $this->event->update(['postback_url_id' => $postback->id]);

    $response = $this->postJson('/api/v1/access/validate', [
        'event_id' => $this->event->id,
        'code' => 'TESTCODE123',
    ]);

    $response->assertOk();
    Queue::assertPushed(SendAccessPostback::class);
});

test('postback job is not dispatched when event has no postback URL', function () {
    Sanctum::actingAs($this->device);

    $response = $this->postJson('/api/v1/access/validate', [
        'event_id' => $this->event->id,
        'code' => 'TESTCODE123',
    ]);

    $response->assertOk();
    Queue::assertNotPushed(SendAccessPostback::class);
});

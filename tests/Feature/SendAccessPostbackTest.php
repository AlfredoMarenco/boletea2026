<?php

use App\Jobs\SendAccessPostback;
use App\Models\AccessEvent;
use App\Models\PostbackUrl;
use Illuminate\Support\Facades\Http;

test('postback is sent if event has active postback url', function () {
    Http::fake();

    $postback = PostbackUrl::create([
        'name' => 'Test Postback Server',
        'url' => 'https://test-server.com/postback',
        'is_active' => true,
    ]);

    $event = AccessEvent::create([
        'name' => 'Active Postback Event',
        'status' => 'active',
        'postback_url_id' => $postback->id,
    ]);

    $job = new SendAccessPostback(
        eventId: $event->id,
        barcode: 'TICKET123',
        result: 'success',
        section: 'VIP',
        scannerId: 1,
        scannedAt: now()->toIso8601String()
    );

    $job->handle();

    Http::assertSent(function (\Illuminate\Http\Client\Request $request) {
        return $request->url() === 'https://test-server.com/postback';
    });
});

test('postback is not sent if event has no postback url configured', function () {
    Http::fake();

    $event = AccessEvent::create([
        'name' => 'No Postback Event',
        'status' => 'active',
        'postback_url_id' => null,
    ]);

    $job = new SendAccessPostback(
        eventId: $event->id,
        barcode: 'TICKET123',
        result: 'success',
        section: 'VIP',
        scannerId: 1,
        scannedAt: now()->toIso8601String()
    );

    $job->handle();

    Http::assertNothingSent();
});

test('postback is not sent if event has inactive postback url', function () {
    Http::fake();

    $postback = PostbackUrl::create([
        'name' => 'Inactive Postback Server',
        'url' => 'https://inactive-server.com/postback',
        'is_active' => false,
    ]);

    $event = AccessEvent::create([
        'name' => 'Inactive Postback Event',
        'status' => 'active',
        'postback_url_id' => $postback->id,
    ]);

    $job = new SendAccessPostback(
        eventId: $event->id,
        barcode: 'TICKET123',
        result: 'success',
        section: 'VIP',
        scannerId: 1,
        scannedAt: now()->toIso8601String()
    );

    $job->handle();

    Http::assertNothingSent();
});

<?php

use App\Models\AccessDevice;

beforeEach(function () {
    // Create an active access device
    $this->device = AccessDevice::create([
        'name' => 'Test Device',
        'device_identifier' => 'test-device-uuid',
        'api_token' => 'test-api-token',
        'status' => 'active',
    ]);

    // Create a personal access token for this device
    $this->token = $this->device->createToken('scanner_access')->plainTextToken;
});

test('it authenticates with standard Authorization Bearer token header', function () {
    $response = $this->withHeaders([
        'Authorization' => 'Bearer '.$this->token,
    ])->getJson('/api/v1/access/events');

    $response->assertOk();
});

test('it authenticates with X-Authorization Bearer token header', function () {
    // Make request without Authorization header but with X-Authorization header
    $response = $this->withHeaders([
        'X-Authorization' => 'Bearer '.$this->token,
    ])->getJson('/api/v1/access/events');

    $response->assertOk();
});

test('it authenticates with token query parameter', function () {
    $response = $this->getJson('/api/v1/access/events?token='.$this->token);

    $response->assertOk();
});

test('it authenticates with token post parameter', function () {
    // Since getEvents is a GET request, we pass the parameter as a query/request parameter
    $response = $this->call('GET', '/api/v1/access/events', ['token' => $this->token]);

    $response->assertOk();
});

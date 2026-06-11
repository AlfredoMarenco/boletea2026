<?php

use App\Models\SiteSetting;
use App\Models\User;
use App\Services\WorldCupScoreService;
use Illuminate\Support\Facades\Http;

test('authenticated admin user can update world cup match datetime', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $this->actingAs($user)
        ->post(route('admin.settings.update'), [
            'world_cup_theme_enabled' => true,
            'world_cup_score_mode' => 'manual',
            'world_cup_match_opponent' => 'Argentina',
            'world_cup_match_status' => 'countdown',
            'world_cup_match_datetime' => '2026-06-15T15:30',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('site_settings', [
        'key' => 'world_cup_match_datetime',
        'value' => '2026-06-15T15:30',
    ]);

    $service = app(WorldCupScoreService::class);
    $settings = $service->getLocalSettings();

    expect($settings['match_datetime'])->toBe('2026-06-15T15:30');
});

test('service converts upcoming match utc datetime to mexico city timezone', function () {
    SiteSetting::updateOrCreate(['key' => 'world_cup_theme_enabled'], ['value' => '1']);
    SiteSetting::updateOrCreate(['key' => 'world_cup_score_mode'], ['value' => 'auto']);

    $match = [
        'home_team' => ['name' => 'Mexico', 'goals' => 0],
        'away_team' => ['name' => 'Poland', 'goals' => 0],
        'datetime' => '2026-06-11T17:00:00Z', // 5:00 PM UTC
    ];

    Http::fake([
        'https://worldcupjson.net/matches/current' => Http::response([]),
        'https://worldcupjson.net/matches/today' => Http::response([$match]),
    ]);

    $service = app(WorldCupScoreService::class);
    $result = $service->updateScore();

    // 17:00:00 UTC becomes 11:00:00 local time in America/Mexico_City (UTC-6)
    expect($result['match_datetime'])->toBe('2026-06-11T11:00:00');

    $this->assertDatabaseHas('site_settings', [
        'key' => 'world_cup_match_datetime',
        'value' => '2026-06-11T11:00:00',
    ]);
});

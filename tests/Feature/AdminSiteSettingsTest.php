<?php

use App\Models\SiteSetting;
use App\Models\User;
use App\Services\WorldCupScoreService;

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


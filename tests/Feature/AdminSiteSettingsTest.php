<?php

use App\Models\Bank;
use App\Models\User;

test('authenticated admin user can toggle bank status', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $bank = Bank::create([
        'code' => '012',
        'name' => 'BBVA',
        'enabled' => true,
    ]);

    $response = $this->actingAs($user)
        ->post(route('admin.settings.banks.toggle', $bank));

    $response->assertRedirect();
    expect($bank->fresh()->enabled)->toBeFalse();

    // Toggle again
    $this->actingAs($user)
        ->post(route('admin.settings.banks.toggle', $bank));
    expect($bank->fresh()->enabled)->toBeTrue();
});

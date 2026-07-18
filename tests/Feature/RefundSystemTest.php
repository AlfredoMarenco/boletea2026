<?php

use App\Models\ExternalEvent;
use App\Models\RefundEvent;
use App\Models\RefundPurchase;
use App\Models\RefundRequest;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');

    // Create an external event and link it to refunds
    $this->externalEvent = ExternalEvent::create([
        'external_id' => 'ext-12345',
        'title' => 'Test Concert',
        'slug' => 'test-concert',
        'status' => 'active',
    ]);

    $this->refundEvent = RefundEvent::create([
        'external_event_id' => $this->externalEvent->id,
        'status' => 'active',
    ]);

    // Create a cash purchase in system
    $this->cashPurchase = RefundPurchase::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '12345',
        'email' => null,
        'buyer_name' => 'Cash Buyer',
        'payment_method' => 'Box Office Payment',
        'amount' => 500.00,
        'tickets_details' => [['barcode' => 'BC111', 'area' => 'General', 'seat' => 'A1', 'price' => 500.00]],
    ]);

    // Create a card purchase in system
    $this->cardPurchase = RefundPurchase::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'email' => 'cardbuyer@example.com',
        'buyer_name' => 'Card Buyer',
        'payment_method' => 'Credit Card',
        'card_last_four' => '4321',
        'amount' => 1200.00,
        'tickets_details' => [['barcode' => 'BC222', 'area' => 'VIP', 'seat' => 'B2', 'price' => 1200.00]],
    ]);
});

test('public can access refund page', function () {
    $response = $this->get('/reembolsos');
    $response->assertStatus(200);
});

test('validating a cash order allows direct transition without email', function () {
    $response = $this->postJson('/reembolsos/validar-orden', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '12345',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'status' => 'matched',
            'requires_email' => false,
            'requires_card' => false,
            'buyer_name' => 'Cash Buyer',
        ]);
});

test('validating a card order requests email and card verification', function () {
    $response = $this->postJson('/reembolsos/validar-orden', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'status' => 'requires_email',
            'requires_email' => true,
            'requires_card' => true,
        ]);
});

test('validating card order secondary info fails on wrong email', function () {
    $response = $this->postJson('/reembolsos/validar-seguridad', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'email' => 'wrongemail@example.com',
        'card_last_four' => '4321',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('status', 'email_mismatch');
});

test('validating card order secondary info fails on wrong card digits', function () {
    $response = $this->postJson('/reembolsos/validar-seguridad', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'email' => 'cardbuyer@example.com',
        'card_last_four' => '9999',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('status', 'card_mismatch');
});

test('validating card order succeeds on correct secondary info', function () {
    $response = $this->postJson('/reembolsos/validar-seguridad', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'email' => 'cardbuyer@example.com',
        'card_last_four' => '4321',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'status' => 'matched',
            'buyer_name' => 'Card Buyer',
        ]);
});

test('submitting card refund request with wrong card digits fails validation', function () {
    $ine = UploadedFile::fake()->image('ine.jpg');

    $response = $this->post('/reembolsos/solicitar', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'buyer_name' => 'Card Buyer',
        'email' => 'cardbuyer@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'ine' => $ine,
        'card_last_four' => '9999', // wrong card last four
    ]);

    $response->assertSessionHasErrors(['card_last_four']);
});

test('validating ticket barcode for cash order', function () {
    // Valid barcode
    $response = $this->postJson('/reembolsos/validar-boleto', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '12345',
        'barcode' => 'BC111',
    ]);
    $response->assertStatus(200)->assertJsonPath('ticket.seat', 'A1');

    // Invalid barcode
    $responseInvalid = $this->postJson('/reembolsos/validar-boleto', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '12345',
        'barcode' => 'WRONG_BC',
    ]);
    $responseInvalid->assertStatus(422);
});

test('can submit cash refund request with tickets photo and validated tickets list', function () {
    $ine = UploadedFile::fake()->image('ine.jpg');
    $tickets = UploadedFile::fake()->image('tickets.jpg');

    $response = $this->post('/reembolsos/solicitar', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '12345',
        'buyer_name' => 'Cash Buyer Modified',
        'email' => 'cashcontact@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'ine' => $ine,
        'ticket_photos' => ['BC111' => $tickets],
        'validated_tickets' => ['BC111'],
    ]);

    $response->assertRedirect(route('refund.success'));
    $followResponse = $this->get(route('refund.success'));
    $followResponse->assertStatus(200);

    $this->assertDatabaseHas('refund_requests', [
        'order_number' => '12345',
        'buyer_name' => 'Cash Buyer Modified',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
    ]);

    $request = RefundRequest::first();
    Storage::disk('local')->assertExists($request->ine_path);
    $photosMap = json_decode($request->tickets_path, true);
    expect($photosMap)->toHaveKey('BC111');
    Storage::disk('local')->assertExists($photosMap['BC111']);
    expect($request->validated_tickets)->toBe(['BC111']);
});

test('can submit card refund request without tickets photo', function () {
    $ine = UploadedFile::fake()->image('ine.jpg');

    $response = $this->post('/reembolsos/solicitar', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'buyer_name' => 'Card Buyer',
        'email' => 'cardbuyer@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'ine' => $ine,
        'card_last_four' => '4321',
    ]);

    $response->assertRedirect(route('refund.success'));

    $request = RefundRequest::where('order_number', '67890')->first();
    expect($request->tickets_path)->toBeNull();
    expect($request->card_last_four)->toBe('4321');
});

test('admin can change request status and download files', function () {
    $user = User::factory()->create(); // Admin user
    $this->actingAs($user);

    $ine = UploadedFile::fake()->image('ine.jpg');

    $refundRequest = RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'buyer_name' => 'Card Buyer',
        'email' => 'cardbuyer@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'card_last_four' => '4321',
        'ine_path' => $ine->store('refunds/ine'),
        'status' => 'pending',
    ]);

    // Test changing status to processing first
    $response = $this->post(route('admin.refunds.requests.status', ['refundRequest' => $refundRequest->id]), [
        'status' => 'processing',
        'admin_notes' => 'Checking with bank.',
        'validated_documents' => ['ine' => true],
    ]);

    $response->assertStatus(302);
    expect($refundRequest->fresh()->status)->toBe('processing');

    // Test changing status to approved with proof of payment
    $proof = UploadedFile::fake()->image('proof.jpg');
    $response = $this->post(route('admin.refunds.requests.status', ['refundRequest' => $refundRequest->id]), [
        'status' => 'approved',
        'admin_notes' => 'CLABE and INE verified.',
        'validated_documents' => ['ine' => true, 'proof' => true],
        'proof_of_payment' => $proof,
    ]);

    $response->assertStatus(302);
    expect($refundRequest->fresh()->status)->toBe('approved');
    expect($refundRequest->fresh()->admin_notes)->toBe('CLABE and INE verified.');

    // Test secure download of INE
    $downloadResponse = $this->get(route('admin.refunds.requests.file', [
        'refundRequest' => $refundRequest->id,
        'type' => 'ine',
    ]));

    $downloadResponse->assertStatus(200);
});

test('admin can export refund requests to csv matching accounting format', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('admin.refunds.requests.export_csv', ['status' => 'processing']));
    $response->assertStatus(200);
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
});

test('admin can toggle include_charges and it reflects in csv export as CC or SC', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $ine = UploadedFile::fake()->image('ine.jpg');

    $refundRequest = RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'refund_purchase_id' => $this->cardPurchase->id,
        'order_number' => '67890',
        'buyer_name' => 'Card Buyer',
        'email' => 'cardbuyer@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'card_last_four' => '4321',
        'ine_path' => $ine->store('refunds/ine'),
        'status' => 'processing',
        'include_charges' => true,
    ]);

    $response = $this->post(route('admin.refunds.requests.status', ['refundRequest' => $refundRequest->id]), [
        'status' => 'processing',
        'include_charges' => true,
        'validated_documents' => ['ine' => true],
    ]);

    $response->assertStatus(302);
    expect($refundRequest->fresh()->include_charges)->toBeTrue();

    $csvResponse = $this->get(route('admin.refunds.requests.export_csv', ['status' => 'processing']));
    $csvResponse->assertStatus(200);
    expect($csvResponse->streamedContent())->toContain('CC');
});

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

    // Seed test banks
    \App\Models\Bank::create(['code' => '012', 'name' => 'BBVA', 'enabled' => true]);
    \App\Models\Bank::create(['code' => '002', 'name' => 'BANAMEX', 'enabled' => false]);

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
        'buyer_name' => 'CASH BUYER MODIFIED',
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
        'validated_documents' => ['clabe' => true, 'ine' => true],
    ]);

    $response->assertStatus(302);
    expect($refundRequest->fresh()->status)->toBe('processing');

    // Test changing status to approved with proof of payment
    $proof = UploadedFile::fake()->image('proof.jpg');
    $response = $this->post(route('admin.refunds.requests.status', ['refundRequest' => $refundRequest->id]), [
        'status' => 'approved',
        'admin_notes' => 'CLABE and INE verified.',
        'validated_documents' => ['clabe' => true, 'ine' => true, 'proof' => true],
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
        'validated_documents' => ['clabe' => true, 'ine' => true],
    ]);

    $response->assertStatus(302);
    expect($refundRequest->fresh()->include_charges)->toBeTrue();

    $csvResponse = $this->get(route('admin.refunds.requests.export_csv', ['status' => 'processing']));
    $csvResponse->assertStatus(200);
    expect($csvResponse->streamedContent())->toContain('CC');
});

test('submitting refund request validates CLABE bank code', function () {
    $ine = UploadedFile::fake()->image('ine.jpg');

    // Case 1: Valid and enabled bank (BBVA - 012)
    $response = $this->post('/reembolsos/solicitar', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'buyer_name' => 'Card Buyer',
        'email' => 'cardbuyer@example.com',
        'clabe' => '012345678901234567', // Starts with 012
        'bank_name' => 'BBVA',
        'ine' => $ine,
        'card_last_four' => '4321',
    ]);
    $response->assertRedirect(route('refund.success'));

    // Case 2: Disabled bank (BANAMEX - 002)
    $responseDisabled = $this->post('/reembolsos/solicitar', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'buyer_name' => 'Card Buyer',
        'email' => 'cardbuyer@example.com',
        'clabe' => '002345678901234567', // Starts with 002
        'bank_name' => 'BANAMEX',
        'ine' => $ine,
        'card_last_four' => '4321',
    ]);
    $responseDisabled->assertSessionHasErrors(['clabe']);

    // Case 3: Non-existent bank (999)
    $responseInvalid = $this->post('/reembolsos/solicitar', [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'buyer_name' => 'Card Buyer',
        'email' => 'cardbuyer@example.com',
        'clabe' => '999345678901234567', // Starts with 999
        'bank_name' => 'DESCONOCIDO',
        'ine' => $ine,
        'card_last_four' => '4321',
    ]);
    $responseInvalid->assertSessionHasErrors(['clabe']);
});

test('admin can access event orders report', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('admin.refunds.events.orders', ['event' => $this->refundEvent->id]));
    $response->assertStatus(200);
});

test('admin can export event orders report to csv', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('admin.refunds.events.orders.export_csv', ['event' => $this->refundEvent->id]));
    $response->assertStatus(200);
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    expect($response->streamedContent())->toContain('ID ORDEN');
    expect($response->streamedContent())->toContain('12345');
});

test('requests are ordered by oldest first by default', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Create requests with different created_at using manual assignment
    $req1 = new RefundRequest([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'ORD001',
        'buyer_name' => 'BUYER ONE',
        'email' => 'buyer1@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'status' => 'pending',
    ]);
    $req1->created_at = now()->subDays(2);
    $req1->save();

    $req2 = new RefundRequest([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'ORD002',
        'buyer_name' => 'BUYER TWO',
        'email' => 'buyer2@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'status' => 'pending',
    ]);
    $req2->created_at = now()->subDay();
    $req2->save();

    // Default sorting is asc (oldest first)
    $response = $this->get(route('admin.refunds.requests'));
    $response->assertStatus(200);

    $inertiaData = $response->original->getData()['page']['props']['requests']['data'];

    // First should be the oldest (req1)
    expect($inertiaData[0]['order_number'])->toBe('ORD001');

    // If direction desc is specified, first should be newest (req2)
    $responseDesc = $this->get(route('admin.refunds.requests', ['sort_direction' => 'desc']));
    $responseDesc->assertStatus(200);
    $inertiaDataDesc = $responseDesc->original->getData()['page']['props']['requests']['data'];
    expect($inertiaDataDesc[0]['order_number'])->toBe('ORD002');
});

test('admin can update request status and modify buyer_name', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $request = RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'ORD999',
        'buyer_name' => 'OLD NAME',
        'email' => 'old@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'status' => 'pending',
    ]);

    $response = $this->post(route('admin.refunds.requests.status', ['refundRequest' => $request->id]), [
        'status' => 'processing',
        'buyer_name' => 'NEW MODIFIED NAME',
        'validated_documents' => ['clabe' => true],
    ]);

    $response->assertStatus(302);
    $request->refresh();
    expect($request->buyer_name)->toBe('NEW MODIFIED NAME');
    expect($request->status)->toBe('processing');
});

test('admin cannot transition to processing or approved without validating clabe', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $request = RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'ORD888',
        'buyer_name' => 'TEST USER',
        'email' => 'test@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'status' => 'pending',
    ]);

    // Attempting processing without clabe in validated_documents fails
    $response = $this->post(route('admin.refunds.requests.status', ['refundRequest' => $request->id]), [
        'status' => 'processing',
        'validated_documents' => [],
    ]);

    $response->assertSessionHasErrors(['status']);
    expect($request->fresh()->status)->toBe('pending');
});

test('customer must confirm card last four digits and can update rejected clabe', function () {
    $ine = UploadedFile::fake()->image('ine.jpg');

    $request = RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => '67890',
        'tracking_id' => 'REF-SEC12345',
        'buyer_name' => 'Card Buyer',
        'email' => 'cardbuyer@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'card_last_four' => '4321',
        'ine_path' => $ine->store('refunds/ine'),
        'status' => 'rejected',
        'validated_documents' => ['ine' => true], // clabe is false / unvalidated
        'admin_notes' => 'CLABE incorrecta',
    ]);

    $signedUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
        'refund.update_documents',
        now()->addHours(48),
        ['refundRequest' => $request->id]
    );

    // Case 1: Wrong card digits fails validation
    $responseWrongCard = $this->post($signedUrl, [
        'card_last_four' => '9999',
        'clabe' => '012999999999999999',
        'bank_name' => 'BBVA',
    ]);
    $responseWrongCard->assertSessionHasErrors(['card_last_four']);

    // Case 2: Submitting same rejected CLABE fails validation
    $responseSameClabe = $this->post($signedUrl, [
        'card_last_four' => '4321',
        'clabe' => '012345678901234567', // Same as $request->clabe
        'bank_name' => 'BBVA',
    ]);
    $responseSameClabe->assertSessionHasErrors(['clabe']);

    // Case 3: Correct card digits and new CLABE updates successfully
    $responseSuccess = $this->post($signedUrl, [
        'card_last_four' => '4321',
        'clabe' => '012999999999999999',
        'bank_name' => 'BBVA',
    ]);

    $responseSuccess->assertRedirect(route('refund.success'));
    $request->refresh();
    expect($request->clabe)->toBe('012999999999999999');
    expect($request->status)->toBe('pending');
    expect($request->admin_notes)->toBeNull();
});

test('canceled web purchases in CSV return web_auto_refund status and automatic refund message', function () {
    $purchase = \App\Models\RefundPurchase::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'AUTO999',
        'buyer_name' => 'Web Customer',
        'email' => 'webcustomer@example.com',
        'payment_method' => 'Tarjeta Web',
        'card_last_four' => '9999',
        'amount' => 1500.00,
        'tickets_details' => [
            ['ticket_id' => 'TK1', 'status' => 'cancelado', 'barcode' => 'BAR1'],
        ],
    ]);

    $response = $this->post(route('refund.validate_order'), [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'AUTO999',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'status' => 'web_auto_refund',
        ]);

    expect($response->json('message'))->toContain('Su compra web ya está en trámite automático de reembolso');
});

test('existing requests in database return already_requested status with explicit existing request message', function () {
    $purchase = \App\Models\RefundPurchase::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'EXISTING123',
        'buyer_name' => 'Existing Customer',
        'email' => 'existing@example.com',
        'payment_method' => 'Tarjeta Web',
        'card_last_four' => '1234',
        'amount' => 2000.00,
        'tickets_details' => [
            ['ticket_id' => 'TK2', 'status' => 'activo', 'barcode' => 'BAR2'],
        ],
    ]);

    \App\Models\RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'EXISTING123',
        'buyer_name' => 'Existing Customer',
        'email' => 'existing@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'status' => 'pending',
    ]);

    $response = $this->post(route('refund.validate_order'), [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'EXISTING123',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'status' => 'already_requested',
        ]);

    expect($response->json('message'))->toContain('Esta orden ya cuenta con una solicitud de reembolso registrada');
});

test('rejected request with pending document corrections blocks new request for same order', function () {
    $purchase = \App\Models\RefundPurchase::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'REJCORR123',
        'buyer_name' => 'Rejected Customer',
        'email' => 'rejected@example.com',
        'payment_method' => 'Tarjeta Web',
        'card_last_four' => '5555',
        'amount' => 1000.00,
        'tickets_details' => [
            ['ticket_id' => 'TK3', 'status' => 'activo', 'barcode' => 'BAR3'],
        ],
    ]);

    $req = \App\Models\RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'REJCORR123',
        'buyer_name' => 'Rejected Customer',
        'email' => 'rejected@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'status' => 'rejected',
        'validated_documents' => [], // CLABE unvalidated -> requires correction
    ]);

    expect($req->hasPendingCorrections())->toBeTrue();
    expect($req->isActiveOrPendingCorrection())->toBeTrue();

    $response = $this->post(route('refund.validate_order'), [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'REJCORR123',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'status' => 'already_requested',
        ]);
});

test('rejected request with all documents validated (final rejection) allows re-submitting order', function () {
    $purchase = \App\Models\RefundPurchase::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'FINALREJ456',
        'buyer_name' => 'Final Rejected Customer',
        'email' => 'finalrej@example.com',
        'payment_method' => 'Tarjeta Web',
        'card_last_four' => '7777',
        'amount' => 1000.00,
        'tickets_details' => [
            ['ticket_id' => 'TK4', 'status' => 'activo', 'barcode' => 'BAR4'],
        ],
    ]);

    $req = \App\Models\RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'FINALREJ456',
        'buyer_name' => 'Final Rejected Customer',
        'email' => 'finalrej@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'status' => 'rejected',
        'validated_documents' => ['clabe' => true], // All docs validated -> final rejection
    ]);

    $response = $this->post(route('refund.validate_order'), [
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'FINALREJ456',
    ]);

    $response->assertStatus(200);
});

test('admin cannot modify a totally rejected request', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $req = RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'FINALREJ789',
        'buyer_name' => 'Totally Rejected Customer',
        'email' => 'totallyrejected@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'status' => 'rejected',
        'validated_documents' => ['clabe' => true], // No pending corrections -> isTotallyRejected is true
    ]);

    expect($req->isTotallyRejected())->toBeTrue();

    $response = $this->post(route('admin.refunds.requests.status', ['refundRequest' => $req->id]), [
        'status' => 'processing',
        'validated_documents' => ['clabe' => true],
    ]);

    $response->assertSessionHasErrors(['status']);
    expect($req->fresh()->status)->toBe('rejected');
});

test('customer cannot view or submit update documents for a totally rejected request', function () {
    $req = RefundRequest::create([
        'refund_event_id' => $this->refundEvent->id,
        'order_number' => 'FINALREJ999',
        'buyer_name' => 'Totally Rejected Customer',
        'email' => 'totallyrejected@example.com',
        'clabe' => '012345678901234567',
        'bank_name' => 'BBVA',
        'status' => 'rejected',
        'validated_documents' => ['clabe' => true],
    ]);

    $signedUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
        'refund.update_documents',
        now()->addHours(48),
        ['refundRequest' => $req->id]
    );

    // View form fails with 403
    $responseGet = $this->get($signedUrl);
    $responseGet->assertStatus(403);

    // Post update documents fails with 403
    $responsePost = $this->post($signedUrl, [
        'clabe' => '012999999999999999',
        'bank_name' => 'BBVA',
    ]);
    $responsePost->assertStatus(403);
});

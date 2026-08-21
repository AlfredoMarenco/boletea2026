<?php

namespace Tests\Feature\Admin;

use App\Models\RefundEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class RefundRecoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_import_recovered_requests_from_tracking_csv(): void
    {
        $user = User::factory()->create([
            'email' => 'alfredomarenco@boletea.com',
        ]);
        $refundEvent = RefundEvent::create([
            'title' => 'TCCC260808 RAMON AYALA - EL REY POR SIEMPRE',
            'status' => 'active',
        ]);

        $csvContent = <<<'CSV'
1252,2111854,TCCC260808 RAMON AYALA - EL REY POR SIEMPRE,PAOLA ELENA GARCÍA ROJAS,012975674996473753,CLABE,BBVA,SC,4,"$900,00","$3.600,00",paolaelena.rojas@gmail.com,Rafael PR,07/08/2026,,,,CANCELADA,PEND X DEP
1253,2117123,TCCC260808 RAMON AYALA - EL REY POR SIEMPRE,SUSANA MEZA RAMÍREZ,012180015213739485,CLABE,BBVA,SC,2,"$2.100,00","$4.200,00",susi.meza24@gmail.com,Rafael PR,07/08/2026,11/08/2026,BBVA,54427042,CANCELADA,TRANSFERENCIA
CSV;

        $file = UploadedFile::fake()->createWithContent('seguimiento.csv', $csvContent);

        $response = $this->actingAs($user)
            ->post(route('admin.refunds.events.import_recovered', ['event' => $refundEvent->id]), [
                'file' => $file,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Check purchase 1
        $this->assertDatabaseHas('refund_purchases', [
            'refund_event_id' => $refundEvent->id,
            'order_number' => '2111854',
            'buyer_name' => 'PAOLA ELENA GARCÍA ROJAS',
            'email' => 'paolaelena.rojas@gmail.com',
            'amount' => 3600.00,
        ]);

        // Check request 1 (PEND X DEP -> pending)
        $this->assertDatabaseHas('refund_requests', [
            'refund_event_id' => $refundEvent->id,
            'order_number' => '2111854',
            'buyer_name' => 'PAOLA ELENA GARCÍA ROJAS',
            'email' => 'paolaelena.rojas@gmail.com',
            'clabe' => '012975674996473753',
            'bank_name' => 'BBVA',
            'status' => 'pending',
        ]);

        // Check purchase 2
        $this->assertDatabaseHas('refund_purchases', [
            'refund_event_id' => $refundEvent->id,
            'order_number' => '2117123',
            'buyer_name' => 'SUSANA MEZA RAMÍREZ',
            'email' => 'susi.meza24@gmail.com',
            'amount' => 4200.00,
        ]);

        // Check request 2 (TRANSFERENCIA -> approved)
        $this->assertDatabaseHas('refund_requests', [
            'refund_event_id' => $refundEvent->id,
            'order_number' => '2117123',
            'buyer_name' => 'SUSANA MEZA RAMÍREZ',
            'email' => 'susi.meza24@gmail.com',
            'clabe' => '012180015213739485',
            'bank_name' => 'BBVA',
            'status' => 'approved',
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\Bank;
use App\Models\ExternalEvent;
use App\Models\RefundEvent;
use App\Models\RefundPurchase;
use App\Models\RefundRequest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FakeRefundRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ensure we have banks in the database
        if (Bank::count() === 0) {
            $this->call(BankSeeder::class);
        }

        // 2. Ensure we have an ExternalEvent
        $externalEvent = ExternalEvent::firstOrCreate(
            ['slug' => 'evento-de-prueba-reembolsos'],
            [
                'external_id' => 999999,
                'title' => 'Concierto de Rock en Vivo 2026',
                'description' => 'Evento masivo de prueba para validar el sistema de reembolsos.',
                'city' => 'Torreón',
                'start_date' => now()->addMonth(),
                'status' => 'active',
            ]
        );

        // 3. Ensure we have a RefundEvent linked to it
        $refundEvent = RefundEvent::firstOrCreate(
            ['external_event_id' => $externalEvent->id],
            ['status' => 'active']
        );

        // 4. Create some RefundPurchases (Mock CSV imports)
        $purchasesData = [
            [
                'order_number' => 'BLT-1001',
                'email' => 'juan.perez@example.com',
                'buyer_name' => 'JUAN PEREZ GOMEZ',
                'payment_method' => 'CreditCard',
                'amount' => 1500.00,
                'card_last_four' => '4321',
                'tickets_details' => [
                    [
                        'ticket_id' => 'T1001A',
                        'barcode' => '987654321001',
                        'area' => 'V.I.P.',
                        'seat' => 'A-12',
                        'price' => 1200.00,
                        'cxs' => 150.00,
                        'tc' => 50.00,
                        'cxadm' => 100.00,
                        'total' => 1500.00,
                        'status' => 'Vendido',
                    ],
                ],
            ],
            [
                'order_number' => 'BLT-1002',
                'email' => 'maria.lopez@example.com',
                'buyer_name' => 'MARIA LOPEZ DIAZ',
                'payment_method' => 'Box Office Payment',
                'amount' => 850.00,
                'card_last_four' => null,
                'tickets_details' => [
                    [
                        'ticket_id' => 'T1002A',
                        'barcode' => '987654321002',
                        'area' => 'General',
                        'seat' => 'B-30',
                        'price' => 700.00,
                        'cxs' => 80.00,
                        'tc' => 0.00,
                        'cxadm' => 70.00,
                        'total' => 850.00,
                        'status' => 'Vendido',
                    ],
                ],
            ],
            [
                'order_number' => 'BLT-1003',
                'email' => 'carlos.sanchez@example.com',
                'buyer_name' => 'CARLOS SANCHEZ HERNANDEZ',
                'payment_method' => 'CreditCard',
                'amount' => 3000.00,
                'card_last_four' => '9876',
                'tickets_details' => [
                    [
                        'ticket_id' => 'T1003A',
                        'barcode' => '987654321003',
                        'area' => 'V.I.P.',
                        'seat' => 'A-14',
                        'price' => 1200.00,
                        'cxs' => 150.00,
                        'tc' => 50.00,
                        'cxadm' => 100.00,
                        'total' => 1500.00,
                        'status' => 'Vendido',
                    ],
                    [
                        'ticket_id' => 'T1003B',
                        'barcode' => '987654321004',
                        'area' => 'V.I.P.',
                        'seat' => 'A-15',
                        'price' => 1200.00,
                        'cxs' => 150.00,
                        'tc' => 50.00,
                        'cxadm' => 100.00,
                        'total' => 1500.00,
                        'status' => 'Vendido',
                    ],
                ],
            ],
        ];

        $createdPurchases = [];
        foreach ($purchasesData as $pData) {
            $createdPurchases[$pData['order_number']] = RefundPurchase::updateOrCreate(
                [
                    'refund_event_id' => $refundEvent->id,
                    'order_number' => $pData['order_number'],
                ],
                [
                    'email' => $pData['email'],
                    'buyer_name' => $pData['buyer_name'],
                    'payment_method' => $pData['payment_method'],
                    'amount' => $pData['amount'],
                    'card_last_four' => $pData['card_last_four'],
                    'tickets_details' => $pData['tickets_details'],
                ]
            );
        }

        // 5. Create some RefundRequests matching the purchases

        // Request 1: Pending (CreditCard / Web order)
        RefundRequest::updateOrCreate(
            [
                'refund_event_id' => $refundEvent->id,
                'order_number' => 'BLT-1001',
            ],
            [
                'refund_purchase_id' => $createdPurchases['BLT-1001']->id,
                'tracking_id' => 'RFD-'.strtoupper(Str::random(8)),
                'email' => 'juan.perez@example.com',
                'buyer_name' => 'JUAN PEREZ GOMEZ',
                'clabe' => '012180012345678901', // BBVA (012)
                'bank_name' => 'BBVA',
                'card_last_four' => '4321',
                'ine_path' => 'refunds/ines/fake_ine_1.jpg',
                'tickets_path' => json_encode(['T1001A' => 'refunds/tickets/fake_ticket_1.jpg']),
                'validated_tickets' => ['T1001A'],
                'validated_documents' => [
                    'clabe' => false,
                    'ine' => false,
                    'ticket_T1001A' => false,
                ],
                'include_charges' => false,
                'status' => 'pending',
                'admin_notes' => null,
            ]
        );

        // Request 2: Rejected requiring correction (Box Office / Cash order)
        RefundRequest::updateOrCreate(
            [
                'refund_event_id' => $refundEvent->id,
                'order_number' => 'BLT-1002',
            ],
            [
                'refund_purchase_id' => $createdPurchases['BLT-1002']->id,
                'tracking_id' => 'RFD-'.strtoupper(Str::random(8)),
                'email' => 'maria.lopez@example.com',
                'buyer_name' => 'MARIA LOPEZ DIAZ',
                'clabe' => '002180098765432109', // BANAMEX (002)
                'bank_name' => 'BANAMEX',
                'card_last_four' => null,
                'ine_path' => 'refunds/ines/fake_ine_2.jpg',
                'tickets_path' => json_encode(['T1002A' => 'refunds/tickets/fake_ticket_2.jpg']),
                'validated_tickets' => ['T1002A'],
                // Let's validate the CLABE and ticket, but NOT the INE, so it requires correction (status rejected with pending corrections)
                'validated_documents' => [
                    'clabe' => true,
                    'ine' => false,
                    'ticket_T1002A' => true,
                ],
                'include_charges' => false,
                'status' => 'rejected',
                'admin_notes' => 'La foto del INE es borrosa y no se aprecian las firmas. Por favor suba una foto clara.',
            ]
        );

        // Request 3: Approved with Proof of Payment
        RefundRequest::updateOrCreate(
            [
                'refund_event_id' => $refundEvent->id,
                'order_number' => 'BLT-1003',
            ],
            [
                'refund_purchase_id' => $createdPurchases['BLT-1003']->id,
                'tracking_id' => 'RFD-'.strtoupper(Str::random(8)),
                'email' => 'carlos.sanchez@example.com',
                'buyer_name' => 'CARLOS SANCHEZ HERNANDEZ',
                'clabe' => '014180055555555555', // SANTANDER (014)
                'bank_name' => 'SANTANDER',
                'card_last_four' => '9876',
                'ine_path' => 'refunds/ines/fake_ine_3.jpg',
                'tickets_path' => json_encode([
                    'T1003A' => 'refunds/tickets/fake_ticket_3a.jpg',
                    'T1003B' => 'refunds/tickets/fake_ticket_3b.jpg',
                ]),
                'validated_tickets' => ['T1003A', 'T1003B'],
                'validated_documents' => [
                    'clabe' => true,
                    'ine' => true,
                    'ticket_T1003A' => true,
                    'ticket_T1003B' => true,
                    'proof' => true,
                ],
                'include_charges' => true,
                'status' => 'approved',
                'proof_of_payment_path' => 'refunds/proofs/fake_proof_3.jpg',
                'admin_notes' => 'Reembolso aprobado y transferido exitosamente.',
            ]
        );

        $this->command->info('Fake Refund Request seeders executed successfully.');
    }
}

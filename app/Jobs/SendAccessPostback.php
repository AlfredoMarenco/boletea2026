<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendAccessPostback implements ShouldQueue
{
    use Queueable, \Illuminate\Foundation\Bus\Dispatchable, \Illuminate\Queue\InteractsWithQueue, \Illuminate\Queue\SerializesModels;

    public function __construct(
        public int $eventId,
        public string $barcode,
        public string $result,
        public string $deviceName,
        public string $scannerId,
        public string $scannedAt
    ) {
    }

    public function handle(): void
    {
        $status = $this->result === 'success' ? '1' : '0';
        $postbackUrl = config('services.postback.url', 'https://boletea.com.mx/AccessControl_PostbackScan.asp');

        $payload = [
            'Resultado' => $this->deviceName,
            'HoraPostback' => now()->format('Y-m-d H:i:s'),
            'EstatusEscaneo' => $status,
            'Barcode' => $this->barcode,
            'HoraEscaneo' => \Carbon\Carbon::parse($this->scannedAt)->format('Y-m-d H:i:s'),
            'EscanerID' => $this->scannerId,
        ];

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(10)->post($postbackUrl, $payload);
            
            \App\Models\AccessPostbackLog::create([
                'access_event_id' => $this->eventId,
                'barcode' => $this->barcode,
                'status' => $this->result,
                'payload' => $payload,
                'response' => $response->body(),
                'status_code' => $response->status(),
                'scanned_at' => $this->scannedAt,
            ]);
        } catch (\Exception $e) {
            \App\Models\AccessPostbackLog::create([
                'access_event_id' => $this->eventId,
                'barcode' => $this->barcode,
                'status' => $this->result,
                'payload' => $payload,
                'response' => $e->getMessage(),
                'status_code' => 500,
                'scanned_at' => $this->scannedAt,
            ]);
        }
    }
}

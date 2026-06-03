<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendAccessPostback implements ShouldQueue
{
    use \Illuminate\Foundation\Bus\Dispatchable, \Illuminate\Queue\InteractsWithQueue, \Illuminate\Queue\SerializesModels, Queueable;

    public function __construct(
        public int $eventId,
        public string $barcode,
        public string $result,
        public string $section,
        public int $scannerId,
        public string $scannedAt
    ) {}

    public function handle(): void
    {
        $event = \App\Models\AccessEvent::with('postback')->find($this->eventId);
        if (! $event || ! $event->postback || ! $event->postback->is_active) {
            return;
        }

        $postbackUrl = $event->postback->url;

        $status = $this->result === 'success' ? '1' : '0';

        $payload = [
            'Resultado' => $this->section,
            'HoraPostback' => now()->format('Y-m-d H:i:s'),
            'EstatusEscaneo' => $status,
            'Barcode' => $this->barcode,
            'HoraEscaneo' => \Carbon\Carbon::parse($this->scannedAt)->format('Y-m-d H:i:s'),
            'EscanerID' => $this->scannerId,
        ];

        try {
            $response = \Illuminate\Support\Facades\Http::asForm()
                ->timeout(15)
                ->post($postbackUrl, $payload);

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

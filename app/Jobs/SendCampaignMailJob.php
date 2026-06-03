<?php

namespace App\Jobs;

use App\Mail\GenericHtmlMail;
use App\Models\MailingCampaign;
use App\Models\MailingList;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendCampaignMailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Número de intentos antes de marcar como fallido.
     */
    public int $tries = 3;

    /**
     * Tiempo de espera entre reintentos (segundos).
     */
    public int $backoff = 60;

    public function __construct(
        public MailingCampaign $campaign,
        public MailingList $recipient,
    ) {}

    public function handle(): void
    {
        try {
            Mail::to($this->recipient->email, $this->recipient->name)
                ->send(new GenericHtmlMail($this->campaign, $this->recipient->name));

            // Incrementar contador de enviados
            $this->campaign->increment('sent_count');

            // Si ya enviamos a todos, marcar como "sent"
            $this->checkCompletion();
        } catch (\Throwable $e) {
            $this->campaign->increment('failed_count');
            $this->checkCompletion();

            Log::error("SendCampaignMailJob failed for recipient [{$this->recipient->email}]: ".$e->getMessage());

            throw $e; // Dejar que la cola reintente
        }
    }

    private function checkCompletion(): void
    {
        $this->campaign->refresh();
        $processed = $this->campaign->sent_count + $this->campaign->failed_count;

        if ($processed >= $this->campaign->total_recipients) {
            $this->campaign->update([
                'status' => $this->campaign->failed_count > 0 && $this->campaign->sent_count === 0
                    ? 'failed'
                    : 'sent',
                'sent_at' => now(),
            ]);
        }
    }

    /**
     * Cuando se agotan todos los intentos.
     */
    public function failed(\Throwable $exception): void
    {
        $this->campaign->increment('failed_count');
        $this->checkCompletion();

        Log::error("SendCampaignMailJob permanently failed for [{$this->recipient->email}]: ".$exception->getMessage());
    }
}

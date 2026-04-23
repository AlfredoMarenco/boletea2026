<?php

namespace App\Mail;

use App\Models\MailingCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GenericHtmlMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public MailingCampaign $campaign,
        public string $recipientName,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->campaign->subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // Reemplazar variables dinámicas básicas
        $html = str_replace(
            ['[Nombre]', '[Evento]', '[Nombre del Destinatario]'],
            [$this->recipientName, $this->campaign->event_name, $this->recipientName],
            $this->campaign->message
        );

        return new Content(
            htmlString: $html,
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];

        if ($this->campaign->image_path && file_exists(storage_path('app/public/' . $this->campaign->image_path))) {
            $attachments[] = Attachment::fromStorageDisk('public', $this->campaign->image_path)
                ->as('adjunto-campana.jpg');
        }

        return $attachments;
    }
}

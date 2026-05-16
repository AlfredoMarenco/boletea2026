<?php

namespace App\Mail;

use App\Models\MailingCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DressCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public MailingCampaign $campaign,
        public string $recipientName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->campaign->subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.dress-code',
            with: [
                'recipientName' => $this->recipientName,
                'message' => $this->campaign->message,
                'eventName' => $this->campaign->event_name,
                'imagePath' => $this->campaign->image_path,
            ],
        );
    }

    public function attachments(): array
    {
        $attachments = [];

        if ($this->campaign->image_path && file_exists(storage_path('app/public/'.$this->campaign->image_path))) {
            $attachments[] = Attachment::fromStorageDisk('public', $this->campaign->image_path)
                ->as('dress-code.jpg')
                ->withMime('image/jpeg');
        }

        return $attachments;
    }
}

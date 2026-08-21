<?php

namespace App\Mail;

use App\Models\RefundRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class RecoveredRefundEvidenceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public RefundRequest $request
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Requerimiento de Evidencia Fotográfica - Orden #'.$this->request->order_number,
        );
    }

    public function content(): Content
    {
        $eventName = $this->request->refundEvent->externalEvent->title ?? 'Evento';
        $invalidDocs = [];
        $validated = $this->request->validated_documents ?? [];

        if (empty($validated['ine'])) {
            $invalidDocs[] = 'Identificación Oficial (INE / Pasaporte)';
        }

        if (! empty($this->request->tickets_path)) {
            $parsed = json_decode($this->request->tickets_path, true);
            if (is_array($parsed)) {
                foreach ($parsed as $subId => $path) {
                    if (empty($validated['ticket_'.$subId])) {
                        $invalidDocs[] = 'Foto de Boleto #'.$subId;
                    }
                }
            } else {
                if (empty($validated['tickets'])) {
                    $invalidDocs[] = 'Fotos de Boletos Físicos';
                }
            }
        }

        $updateUrl = URL::temporarySignedRoute(
            'refund.update_documents',
            now()->addHours(72),
            ['refundRequest' => $this->request->id]
        );

        $html = "
        <div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff;\">
            <div style=\"background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #f3f4f6;\">
                <img src=\"https://boletea.com/img/logoBoletea.png\" alt=\"Boletea\" style=\"height: 40px; width: auto; display: inline-block; vertical-align: middle;\" />
            </div>
            <div style=\"padding: 32px; color: #1f2937; line-height: 1.6;\">
                <h2 style=\"margin-top: 0; font-size: 20px; font-weight: 700; color: #111827;\">Recepción y Seguimiento de Reembolso</h2>
                <p style=\"font-size: 15px; color: #4b5563; margin-bottom: 20px;\">
                    Estimado(a) <strong>{$this->request->buyer_name}</strong>,
                </p>
                <p style=\"font-size: 15px; color: #4b5563; margin-bottom: 24px;\">
                    Su solicitud de reembolso y datos bancarios para la orden <strong>#{$this->request->order_number}</strong> han sido registrados correctamente en nuestro sistema. Para proceder con la liberación de su trámite, únicamente requerimos que nos proporcione la evidencia fotográfica de su identificación y de sus boletos.
                </p>

                <!-- Information Card -->
                <div style=\"background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 28px;\">
                    <table style=\"width: 100%; border-collapse: collapse;\">
                        <tr>
                            <td style=\"font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; padding-bottom: 4px;\">Evento</td>
                            <td style=\"font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; padding-bottom: 4px; text-align: right;\">Orden de Compra</td>
                        </tr>
                        <tr>
                            <td style=\"font-size: 15px; font-weight: bold; color: #111827;\">{$eventName}</td>
                            <td style=\"font-size: 15px; font-weight: bold; color: #111827; text-align: right;\">#{$this->request->order_number}</td>
                        </tr>
                        <tr>
                            <td style=\"font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; padding-top: 14px; padding-bottom: 4px;\">Código de Seguimiento</td>
                            <td style=\"font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; padding-top: 14px; padding-bottom: 4px; text-align: right;\">Estatus</td>
                        </tr>
                        <tr>
                            <td style=\"font-size: 14px; font-weight: bold; color: #374151; font-family: monospace;\">{$this->request->tracking_id}</td>
                            <td style=\"text-align: right;\">
                                <div style=\"display: inline-block; padding: 4px 12px; border-radius: 50px; background-color: #f59e0b20; color: #d97706; font-size: 12px; font-weight: bold;\">
                                    ● Pendiente de Evidencia
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Document List Card -->
                <div style=\"background-color: #fef2f2; border: 1px solid #fee2e2; padding: 18px; border-radius: 12px; margin-bottom: 28px;\">
                    <p style=\"margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #b91c1c;\">Fotografías requeridas a adjuntar:</p>
                    <ul style=\"margin: 0 0 12px 0; padding-left: 20px; font-size: 14px; color: #991b1b;\">
        ";

        foreach ($invalidDocs as $docName) {
            $html .= "<li style=\"margin-bottom: 4px;\"><strong>{$docName}</strong></li>";
        }

        $html .= "
                    </ul>
                </div>

                <div style=\"text-align: center; margin-top: 32px; margin-bottom: 32px;\">
                    <a href=\"{$updateUrl}\" style=\"background-color: #c90000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);\">
                        Adjuntar Evidencia Fotográfica Aquí
                    </a>
                    <p style=\"font-size: 11px; color: #9ca3af; margin-top: 8px; margin-bottom: 0;\">Este enlace es seguro y de uso exclusivo para su solicitud (válido por 72h).</p>
                </div>

                <hr style=\"border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;\" />

                <p style=\"font-size: 12px; color: #9ca3af; text-align: center; margin: 0;\">
                    Este es un correo automático de seguimiento para solicitudes recuperadas. Por favor no responda directamente a este mensaje.
                </p>
            </div>
        </div>
        ";

        return new Content(
            htmlString: $html,
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

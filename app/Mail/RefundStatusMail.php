<?php

namespace App\Mail;

use App\Models\RefundRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RefundStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public RefundRequest $request
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = match ($this->request->status) {
            'pending' => 'Solicitud de reembolso recibida - Orden #'.$this->request->order_number,
            'processing' => 'Su reembolso está en trámite - Orden #'.$this->request->order_number,
            'approved' => 'Reembolso Aprobado - Orden #'.$this->request->order_number,
            'rejected' => 'Actualización de solicitud de reembolso - Orden #'.$this->request->order_number,
            default => 'Actualización de reembolso - Orden #'.$this->request->order_number,
        };

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $statusLabel = match ($this->request->status) {
            'pending' => 'Recibido / Pendiente',
            'processing' => 'En Trámite',
            'approved' => 'Aprobado',
            'rejected' => 'Rechazado',
        };

        $statusColor = match ($this->request->status) {
            'pending' => '#f59e0b', // Amber
            'processing' => '#3b82f6', // Blue
            'approved' => '#10b981', // Green
            'rejected' => '#ef4444', // Red
        };

        $eventName = $this->request->refundEvent->externalEvent->title ?? 'Evento';

        $invalidDocs = [];
        $validated = $this->request->validated_documents ?? [];

        // CLABE check
        if (! empty($this->request->clabe) && empty($validated['clabe'])) {
            $invalidDocs[] = 'Cuenta CLABE Interbancaria';
        }

        // INE check
        if (! empty($this->request->ine_path) && empty($validated['ine'])) {
            $invalidDocs[] = 'Identificación Oficial (INE / Pasaporte)';
        }

        // Proof of payment check
        if (! empty($this->request->proof_of_payment_path) && empty($validated['proof'])) {
            $invalidDocs[] = 'Comprobante de Pago';
        }

        // Tickets check
        if (! empty($this->request->tickets_path)) {
            $parsed = null;
            try {
                $parsed = json_decode($this->request->tickets_path, true);
            } catch (\Exception $e) {
            }

            if (is_array($parsed)) {
                foreach ($parsed as $subId => $path) {
                    if (empty($validated['ticket_'.$subId])) {
                        $invalidDocs[] = 'Foto de Boleto '.$subId;
                    }
                }
            } else {
                if (empty($validated['tickets'])) {
                    $invalidDocs[] = 'Fotos de Boletos Físicos';
                }
            }
        }

        $bodyText = match ($this->request->status) {
            'pending' => 'Hemos recibido su solicitud de reembolso de manera correcta. Nuestro equipo revisará la información y los documentos proporcionados.',
            'processing' => 'Su solicitud ha sido revisada y ahora se encuentra **en trámite**. Estamos procesando la verificación bancaria correspondiente.',
            'approved' => '¡Buenas noticias! Su reembolso ha sido **Aprobado**. Se ha procedido a realizar la transferencia interbancaria a la cuenta CLABE registrada a nombre de: **'.$this->request->buyer_name.'**.',
            'rejected' => ! empty($invalidDocs)
                ? 'Le informamos que su solicitud requiere corrección debido a inconsistencias o archivos ilegibles en su información o documentos adjuntos. Es necesario que corrija los puntos listados abajo para poder continuar.'
                : 'Lamentamos informarle que su solicitud ha sido **Rechazada** tras la revisión de nuestros administradores.',
        };

        $html = "
        <div style=\"font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; background-color: #ffffff;\">
            <div style=\"background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #f3f4f6;\">
                <img src=\"https://boletea.com/img/logoBoletea.png\" alt=\"Boletea\" style=\"height: 40px; width: auto; display: inline-block; vertical-align: middle;\" />
            </div>
            <div style=\"padding: 32px; color: #1f2937; line-height: 1.6;\">
                <h2 style=\"margin-top: 0; font-size: 20px; font-weight: 700; color: #111827;\">Actualización de su Trámite</h2>
                <p style=\"font-size: 15px; color: #4b5563; margin-bottom: 24px;\">
                    Hola <strong>{$this->request->buyer_name}</strong>,
                </p>
                <p style=\"font-size: 15px; color: #4b5563; margin-bottom: 24px;\">
                    Le informamos que el estatus de su solicitud de reembolso ha sido actualizado:
                </p>

                <!-- Status Card -->
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
                            <td style=\"font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; padding-top: 14px; padding-bottom: 4px;\">Referencia de Seguimiento</td>
                            <td style=\"font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; padding-top: 14px; padding-bottom: 4px; text-align: right;\">Estatus</td>
                        </tr>
                        <tr>
                            <td style=\"font-size: 14px; font-weight: bold; color: #374151; font-family: monospace;\">{$this->request->tracking_id}</td>
                            <td style=\"text-align: right;\">
                                <div style=\"display: inline-block; padding: 4px 12px; border-radius: 50px; background-color: {$statusColor}20; color: {$statusColor}; font-size: 12px; font-weight: bold;\">
                                    ● {$statusLabel}
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>

                <p style=\"font-size: 15px; color: #374151; margin-bottom: 20px;\">
                    {$bodyText}
                </p>
        ";

        if ($this->request->status === 'rejected') {
            if (! empty($invalidDocs)) {
                $updateUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                    'refund.update_documents',
                    now()->addHours(48),
                    ['refundRequest' => $this->request->id]
                );

                $html .= '
                    <!-- Correction Docs -->
                    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 18px; border-radius: 12px; margin-bottom: 28px;">
                        <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #b91c1c;">Información / Documentos requeridos para corregir:</p>
                        <ul style="margin: 0 0 12px 0; padding-left: 20px; font-size: 14px; color: #991b1b;">
                ';
                foreach ($invalidDocs as $docName) {
                    $html .= "<li style=\"margin-bottom: 4px;\"><strong>{$docName}</strong></li>";
                }
                $html .= '
                        </ul>
                ';
                if ($this->request->admin_notes) {
                    $html .= "
                        <p style=\"margin: 10px 0 0 0; font-size: 13px; font-weight: bold; color: #b91c1c;\">Motivo / Indicaciones:</p>
                        <p style=\"margin: 4px 0 0 0; font-size: 14px; color: #991b1b; font-style: italic;\">\"{$this->request->admin_notes}\"</p>
                    ";
                }
                $html .= "
                    </div>
                    <div style=\"text-align: center; margin-top: 32px; margin-bottom: 32px;\">
                        <a href=\"{$updateUrl}\" style=\"background-color: #c90000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);\">
                            Corregir Información / Documentos Aquí
                        </a>
                        <p style=\"font-size: 11px; color: #9ca3af; margin-top: 8px; margin-bottom: 0;\">Este enlace es seguro y expirará en 48 horas.</p>
                    </div>
                ";
            } elseif ($this->request->admin_notes) {
                $html .= "
                    <!-- Rejection Notes -->
                    <div style=\"background-color: #fef2f2; border: 1px solid #fee2e2; padding: 18px; border-radius: 12px; margin-bottom: 28px;\">
                        <p style=\"margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #b91c1c;\">Motivo del Rechazo:</p>
                        <p style=\"margin: 0; font-size: 14px; color: #991b1b; font-style: italic;\">
                            \"{$this->request->admin_notes}\"
                        </p>
                    </div>
                    <p style=\"font-size: 14px; color: #6b7280; margin-bottom: 24px;\">
                        Puede volver a ingresar al formulario de reembolso para realizar una nueva solicitud si lo considera pertinente.
                    </p>
                ";
            }
        }

        $trackingUrl = url('/reembolsos/estatus?code='.$this->request->tracking_id);

        $html .= "
                <div style=\"text-align: center; margin-top: 32px; margin-bottom: 16px;\">
                    <p style=\"font-size: 12px; color: #6b7280; margin-bottom: 10px;\">
                        Si accede directamente a nuestro portal, utilice su código de referencia: <strong style=\"color: #111827; font-family: monospace; font-size: 13px;\">{$this->request->tracking_id}</strong>
                    </p>
                    <a href=\"{$trackingUrl}\" style=\"background-color: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);\">
                        Consultar Estatus en Línea
                    </a>
                </div>

                <hr style=\"border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;\" />

                <p style=\"font-size: 12px; color: #9ca3af; text-align: center; margin: 0;\">
                    Este es un correo automático, por favor no responda directamente a este mensaje.
                </p>
            </div>
        </div>
        ";

        return new Content(
            htmlString: $html,
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}

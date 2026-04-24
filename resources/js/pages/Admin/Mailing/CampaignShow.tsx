import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Campaign {
    id: number;
    name: string;
    subject: string;
    message: string;
    event_name: string | null;
    image_path: string | null;
    status: 'draft' | 'queued' | 'sending' | 'sent' | 'failed';
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    sent_at: string | null;
    created_at: string;
}

interface Props {
    campaign: Campaign;
    totalContacts: number;
}

const statusConfig: Record<Campaign['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
    draft:   { label: 'Borrador',    variant: 'secondary',    color: 'text-gray-600 dark:text-gray-400' },
    queued:  { label: 'En cola',     variant: 'outline',      color: 'text-blue-600 dark:text-blue-400' },
    sending: { label: 'Enviando…',   variant: 'default',      color: 'text-indigo-600 dark:text-indigo-400' },
    sent:    { label: 'Enviado ✓',   variant: 'default',      color: 'text-green-600 dark:text-green-400' },
    failed:  { label: 'Con fallas',  variant: 'destructive',  color: 'text-red-600 dark:text-red-400' },
};

export default function CampaignShow({ campaign, totalContacts }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [sending, setSending] = useState(false);

    const cfg = statusConfig[campaign.status];
    const canSend = ['draft', 'failed'].includes(campaign.status);

    const handleSend = () => {
        if (!confirm(`¿Enviar esta campaña a ${totalContacts} contacto${totalContacts !== 1 ? 's' : ''} activo${totalContacts !== 1 ? 's' : ''}?\n\nEsta acción encolará todos los correos. No se puede deshacer.`)) return;
        setSending(true);
        router.post(route('admin.mailing.campaigns.send', campaign.id), {}, {
            onFinish: () => setSending(false),
        });
    };

    const progress = campaign.total_recipients > 0
        ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100)
        : 0;

    return (
        <AppLayout breadcrumbs={[
            { title: 'Mailing', href: route('admin.mailing.campaigns.index') },
            { title: 'Campañas', href: route('admin.mailing.campaigns.index') },
            { title: campaign.name, href: '#' },
        ]}>
            <Head title={`Campaña: ${campaign.name}`} />

            <div className="p-6 max-w-3xl mx-auto space-y-6">

                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 text-green-800 dark:text-green-300 text-sm">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 text-red-800 dark:text-red-300 text-sm">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{campaign.name}</h1>
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                            Evento: <strong>{campaign.event_name ?? '—'}</strong>
                            {campaign.sent_at && (
                                <> · Enviado el{' '}
                                    <strong>{new Date(campaign.sent_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                                </>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <Button asChild variant="outline" size="sm">
                            <Link href={route('admin.mailing.campaigns.index')}>← Volver</Link>
                        </Button>
                        {canSend && (
                            <Button
                                size="sm"
                                onClick={handleSend}
                                disabled={sending || totalContacts === 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {sending ? 'Encolando…' : `Enviar a ${totalContacts} contactos`}
                            </Button>
                        )}
                    </div>
                </div>

                {/* No contacts warning */}
                {totalContacts === 0 && canSend && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 text-amber-800 dark:text-amber-300 text-sm">
                        ⚠️ No hay contactos activos.{' '}
                        <Link href={route('admin.mailing.contacts.index')} className="underline font-medium">Agrega contactos</Link> para poder enviar.
                    </div>
                )}

                {/* Progress */}
                {campaign.total_recipients > 0 && (
                    <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg p-5">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Progreso de envío</h2>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{campaign.sent_count}</div>
                                <div className="text-xs text-gray-500 mt-1">Enviados</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-500">{campaign.failed_count}</div>
                                <div className="text-xs text-gray-500 mt-1">Fallidos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{campaign.total_recipients}</div>
                                <div className="text-xs text-gray-500 mt-1">Total</div>
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-right">{progress}% completado</p>
                    </div>
                )}

                {/* Detalles */}
                <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg p-5 space-y-4">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-100">Contenido del correo</h2>

                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Asunto</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{campaign.subject}</p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Mensaje</p>
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-100 dark:border-gray-800">
                            {campaign.message}
                        </pre>
                    </div>

                    {campaign.image_path && (
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Imagen adjunta</p>
                            <img
                                src={`/storage/${campaign.image_path}`}
                                alt="Imagen de campaña"
                                className="max-h-80 rounded-lg border border-gray-200 dark:border-border object-contain"
                            />
                        </div>
                    )}
                </div>

                {/* Danger zone */}
                <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Zona peligrosa</h3>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            if (confirm(`¿Eliminar la campaña "${campaign.name}"? Esta acción no se puede deshacer.`)) {
                                router.delete(route('admin.mailing.campaigns.destroy', campaign.id));
                            }
                        }}
                    >
                        Eliminar campaña
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}

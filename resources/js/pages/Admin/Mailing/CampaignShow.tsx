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

const statusConfig: Record<
    Campaign['status'],
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        color: string;
    }
> = {
    draft: {
        label: 'Borrador',
        variant: 'secondary',
        color: 'text-gray-600 dark:text-gray-400',
    },
    queued: {
        label: 'En cola',
        variant: 'outline',
        color: 'text-blue-600 dark:text-blue-400',
    },
    sending: {
        label: 'Enviando…',
        variant: 'default',
        color: 'text-indigo-600 dark:text-indigo-400',
    },
    sent: {
        label: 'Enviado ✓',
        variant: 'default',
        color: 'text-green-600 dark:text-green-400',
    },
    failed: {
        label: 'Con fallas',
        variant: 'destructive',
        color: 'text-red-600 dark:text-red-400',
    },
};

export default function CampaignShow({ campaign, totalContacts }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    const getPreviewHtml = () => {
        return campaign.message
            .replace(/\[Nombre\]/g, 'Juan Pérez')
            .replace(/\[Evento\]/g, campaign.event_name || 'Evento de Prueba')
            .replace(/\[Nombre del Destinatario\]/g, 'Juan Pérez');
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Mailing',
                    href: route('admin.mailing.campaigns.index'),
                },
                {
                    title: 'Campañas',
                    href: route('admin.mailing.campaigns.index'),
                },
                { title: campaign.name, href: '#' },
            ]}
        >
            <Head title={`Campaña: ${campaign.name}`} />

            <div className="mx-auto max-w-5xl space-y-6 p-6">
                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <div className="mb-1 flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {campaign.name}
                            </h1>
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                            Evento:{' '}
                            <strong>{campaign.event_name ?? '—'}</strong>
                            {campaign.sent_at && (
                                <>
                                    {' '}
                                    · Enviado el{' '}
                                    <strong>
                                        {new Date(
                                            campaign.sent_at,
                                        ).toLocaleDateString('es-MX', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </strong>
                                </>
                            )}
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-3">
                        <Button asChild variant="outline" size="sm">
                            <Link href={route('admin.mailing.campaigns.index')}>
                                ← Volver
                            </Link>
                        </Button>
                        {canSend && (
                            <Button
                                size="sm"
                                onClick={handleSend}
                                disabled={sending || totalContacts === 0}
                                className="bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-700"
                            >
                                {sending
                                    ? 'Encolando…'
                                    : `Enviar a ${totalContacts} contactos`}
                            </Button>
                        )}
                    </div>
                </div>

                {/* No contacts warning */}
                {totalContacts === 0 && canSend && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        ⚠️ No hay contactos activos en la audiencia
                        seleccionada.{' '}
                        <Link
                            href={route('admin.mailing.contacts.index')}
                            className="font-medium underline"
                        >
                            Agrega contactos
                        </Link>{' '}
                        para poder enviar.
                    </div>
                )}

                {/* Progress */}
                {campaign.total_recipients > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-border dark:bg-background">
                        <h2 className="mb-3 font-semibold text-gray-800 dark:text-gray-100">
                            Progreso de envío
                        </h2>
                        <div className="mb-4 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">
                                    {campaign.sent_count}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                    Enviados
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-500">
                                    {campaign.failed_count}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                    Fallidos
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                                    {campaign.total_recipients}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                    Total
                                </div>
                            </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                                className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="mt-1 text-right text-xs text-gray-400">
                            {progress}% completado
                        </p>
                    </div>
                )}

                {/* Detalles y Preview */}
                <div className="flex min-h-[700px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-border dark:bg-background">
                    <div className="flex items-center justify-between border-b border-border bg-gray-50 p-4 dark:bg-muted/30">
                        <div>
                            <p className="mb-1 text-xs tracking-wide text-gray-400 uppercase">
                                Cuerpo del correo
                            </p>
                            <p className="border-l-2 border-primary pl-2 text-sm font-medium">
                                {campaign.subject}
                            </p>
                        </div>
                        <div className="flex gap-1 rounded-md bg-muted p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('desktop')}
                                className={`rounded p-1.5 transition-all ${viewMode === 'desktop' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'opacity-50 hover:opacity-100'}`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect
                                        width="20"
                                        height="14"
                                        x="2"
                                        y="3"
                                        rx="2"
                                    />
                                    <line x1="8" x2="16" y1="21" y2="21" />
                                    <line x1="12" x2="12" y1="17" y2="21" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('mobile')}
                                className={`rounded p-1.5 transition-all ${viewMode === 'mobile' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'opacity-50 hover:opacity-100'}`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect
                                        width="14"
                                        height="20"
                                        x="5"
                                        y="2"
                                        rx="2"
                                    />
                                    <path d="M12 18h.01" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-1 justify-center overflow-auto bg-gray-50 p-0 sm:p-4 dark:bg-gray-950">
                        <div
                            className={`bg-white shadow-2xl transition-all duration-300 ${viewMode === 'desktop' ? 'h-full min-h-[600px] w-full' : 'my-4 h-[667px] w-[375px] overflow-hidden rounded-3xl border-4 border-gray-900 ring-8 ring-gray-200 dark:ring-gray-800'}`}
                        >
                            <iframe
                                title="Final Preview"
                                srcDoc={getPreviewHtml()}
                                className="h-full w-full border-0"
                                sandbox="allow-popups allow-popups-to-escape-sandbox"
                            />
                        </div>
                    </div>

                    {campaign.image_path && (
                        <div className="border-t border-border bg-gray-50/50 p-4">
                            <p className="mb-2 text-xs tracking-wide text-gray-400 uppercase">
                                Imagen adjunta
                            </p>
                            <img
                                src={`/storage/${campaign.image_path}`}
                                alt="Imagen de campaña"
                                className="max-h-60 rounded-lg border border-gray-200 object-contain shadow-sm dark:border-border"
                            />
                        </div>
                    )}
                </div>

                {/* Danger zone */}
                <div className="rounded-lg border border-red-200 p-4 dark:border-red-800">
                    <h3 className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
                        Zona peligrosa
                    </h3>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            if (
                                confirm(
                                    `¿Eliminar la campaña "${campaign.name}"? Esta acción no se puede deshacer.`,
                                )
                            ) {
                                router.delete(
                                    route(
                                        'admin.mailing.campaigns.destroy',
                                        campaign.id,
                                    ),
                                );
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

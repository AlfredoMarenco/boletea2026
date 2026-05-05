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
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    const getPreviewHtml = () => {
        return campaign.message
            .replace(/\[Nombre\]/g, 'Juan Pérez')
            .replace(/\[Evento\]/g, campaign.event_name || 'Evento de Prueba')
            .replace(/\[Nombre del Destinatario\]/g, 'Juan Pérez');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Mailing', href: route('admin.mailing.campaigns.index') },
            { title: 'Campañas', href: route('admin.mailing.campaigns.index') },
            { title: campaign.name, href: '#' },
        ]}>
            <Head title={`Campaña: ${campaign.name}`} />

            <div className="p-6 max-w-5xl mx-auto space-y-6">

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
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                            >
                                {sending ? 'Encolando…' : `Enviar a ${totalContacts} contactos`}
                            </Button>
                        )}
                    </div>
                </div>

                {/* No contacts warning */}
                {totalContacts === 0 && canSend && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 text-amber-800 dark:text-amber-300 text-sm">
                        ⚠️ No hay contactos activos en la audiencia seleccionada.{' '}
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

                {/* Detalles y Preview */}
                <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg overflow-hidden flex flex-col min-h-[700px]">
                    <div className="p-4 border-b border-border bg-gray-50 dark:bg-muted/30 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cuerpo del correo</p>
                            <p className="text-sm font-medium border-l-2 border-primary pl-2">{campaign.subject}</p>
                        </div>
                        <div className="flex bg-muted rounded-md p-1 gap-1">
                            <button 
                                type="button"
                                onClick={() => setViewMode('desktop')}
                                className={`p-1.5 rounded transition-all ${viewMode === 'desktop' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'opacity-50 hover:opacity-100'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setViewMode('mobile')}
                                className={`p-1.5 rounded transition-all ${viewMode === 'mobile' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'opacity-50 hover:opacity-100'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-50 dark:bg-gray-950 flex justify-center overflow-auto p-0 sm:p-4">
                        <div className={`transition-all duration-300 bg-white shadow-2xl ${viewMode === 'desktop' ? 'w-full h-full min-h-[600px]' : 'w-[375px] h-[667px] my-4 rounded-3xl ring-8 ring-gray-200 dark:ring-gray-800 border-4 border-gray-900 overflow-hidden'}`}>
                            <iframe
                                title="Final Preview"
                                srcDoc={getPreviewHtml()}
                                className="w-full h-full border-0"
                                sandbox="allow-popups allow-popups-to-escape-sandbox"
                            />
                        </div>
                    </div>

                    {campaign.image_path && (
                        <div className="p-4 border-t border-border bg-gray-50/50">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Imagen adjunta</p>
                            <img
                                src={`/storage/${campaign.image_path}`}
                                alt="Imagen de campaña"
                                className="max-h-60 rounded-lg border border-gray-200 dark:border-border object-contain shadow-sm"
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

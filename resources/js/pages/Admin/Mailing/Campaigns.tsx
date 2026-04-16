import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Campaign {
    id: number;
    name: string;
    subject: string;
    event_name: string | null;
    status: 'draft' | 'queued' | 'sending' | 'sent' | 'failed';
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    sent_at: string | null;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
}

interface Props {
    campaigns: PaginatedData<Campaign>;
    totalContacts: number;
}

const statusConfig: Record<Campaign['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft:   { label: 'Borrador',  variant: 'secondary' },
    queued:  { label: 'En cola',   variant: 'outline' },
    sending: { label: 'Enviando',  variant: 'default' },
    sent:    { label: 'Enviado',   variant: 'default' },
    failed:  { label: 'Con fallas', variant: 'destructive' },
};

export default function Campaigns({ campaigns, totalContacts }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    return (
        <AppLayout breadcrumbs={[
            { title: 'Mailing', href: route('admin.mailing.campaigns.index') },
            { title: 'Campañas', href: route('admin.mailing.campaigns.index') },
        ]}>
            <Head title="Campañas de Mailing" />

            <div className="p-6 space-y-6">

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Campañas de Mailing</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {totalContacts} contacto{totalContacts !== 1 ? 's' : ''} activo{totalContacts !== 1 ? 's' : ''} disponibles para envío
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="outline">
                            <Link href={route('admin.mailing.contacts.index')}>Gestionar Contactos</Link>
                        </Button>
                        <Button asChild>
                            <Link href={route('admin.mailing.campaigns.create')}>+ Nueva Campaña</Link>
                        </Button>
                    </div>
                </div>

                {/* No contacts warning */}
                {totalContacts === 0 && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 text-amber-800 dark:text-amber-300 text-sm">
                        ⚠️ No tienes contactos activos. <Link href={route('admin.mailing.contacts.index')} className="underline font-medium">Agrega contactos</Link> antes de enviar una campaña.
                    </div>
                )}

                {/* Tabla */}
                <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Enviados</TableHead>
                                    <TableHead>Enviado el</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.data.length > 0 ? campaigns.data.map(c => {
                                    const cfg = statusConfig[c.status];
                                    return (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell>{c.event_name ?? <span className="text-gray-400">—</span>}</TableCell>
                                            <TableCell>
                                                <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {c.total_recipients > 0 ? (
                                                    <span className="text-sm">
                                                        <span className="text-green-600 font-medium">{c.sent_count}</span>
                                                        {c.failed_count > 0 && <span className="text-red-500"> / {c.failed_count} fallas</span>}
                                                        <span className="text-gray-400"> de {c.total_recipients}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {c.sent_at ? new Date(c.sent_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button asChild size="sm" variant="ghost">
                                                    <Link href={route('admin.mailing.campaigns.show', c.id)}>Ver</Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm(`¿Eliminar campaña "${c.name}"?`)) {
                                                            router.delete(route('admin.mailing.campaigns.destroy', c.id));
                                                        }
                                                    }}
                                                >
                                                    Eliminar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                                            No hay campañas creadas.{' '}
                                            <Link href={route('admin.mailing.campaigns.create')} className="underline">Crea la primera</Link>.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {campaigns.total > 0 && (
                        <div className="p-4 border-t border-gray-200 dark:border-border flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Mostrando {campaigns.from} a {campaigns.to} de {campaigns.total}
                            </div>
                            <div className="flex gap-1">
                                {campaigns.links.map((link, i) => (
                                    link.url ? (
                                        <Link key={i} href={link.url}
                                            className={`px-3 py-1 text-sm rounded-md ${link.active ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-accent'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span key={i} className="px-3 py-1 text-sm text-gray-400"
                                            dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

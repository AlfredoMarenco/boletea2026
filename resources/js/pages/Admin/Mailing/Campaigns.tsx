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

const statusConfig: Record<
    Campaign['status'],
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
> = {
    draft: { label: 'Borrador', variant: 'secondary' },
    queued: { label: 'En cola', variant: 'outline' },
    sending: { label: 'Enviando', variant: 'default' },
    sent: { label: 'Enviado', variant: 'default' },
    failed: { label: 'Con fallas', variant: 'destructive' },
};

export default function Campaigns({ campaigns, totalContacts }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;

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
            ]}
        >
            <Head title="Campañas de Mailing" />

            <div className="space-y-6 p-6">
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
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Campañas de Mailing
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {totalContacts} contacto
                            {totalContacts !== 1 ? 's' : ''} activo
                            {totalContacts !== 1 ? 's' : ''} disponibles para
                            envío
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="outline">
                            <Link href={route('admin.mailing.contacts.index')}>
                                Gestionar Contactos
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link
                                href={route('admin.mailing.campaigns.create')}
                            >
                                + Nueva Campaña
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* No contacts warning */}
                {totalContacts === 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        ⚠️ No tienes contactos activos.{' '}
                        <Link
                            href={route('admin.mailing.contacts.index')}
                            className="font-medium underline"
                        >
                            Agrega contactos
                        </Link>{' '}
                        antes de enviar una campaña.
                    </div>
                )}

                {/* Tabla */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-border dark:bg-background">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Enviados</TableHead>
                                    <TableHead>Enviado el</TableHead>
                                    <TableHead className="text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.data.length > 0 ? (
                                    campaigns.data.map((c) => {
                                        const cfg = statusConfig[c.status];
                                        return (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">
                                                    {c.name}
                                                </TableCell>
                                                <TableCell>
                                                    {c.event_name ?? (
                                                        <span className="text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={cfg.variant}
                                                    >
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {c.total_recipients > 0 ? (
                                                        <span className="text-sm">
                                                            <span className="font-medium text-green-600">
                                                                {c.sent_count}
                                                            </span>
                                                            {c.failed_count >
                                                                0 && (
                                                                <span className="text-red-500">
                                                                    {' '}
                                                                    /{' '}
                                                                    {
                                                                        c.failed_count
                                                                    }{' '}
                                                                    fallas
                                                                </span>
                                                            )}
                                                            <span className="text-gray-400">
                                                                {' '}
                                                                de{' '}
                                                                {
                                                                    c.total_recipients
                                                                }
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">
                                                    {c.sent_at
                                                        ? new Date(
                                                              c.sent_at,
                                                          ).toLocaleDateString(
                                                              'es-MX',
                                                              {
                                                                  day: '2-digit',
                                                                  month: 'short',
                                                                  year: 'numeric',
                                                              },
                                                          )
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="space-x-2 text-right">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="ghost"
                                                    >
                                                        <Link
                                                            href={route(
                                                                'admin.mailing.campaigns.show',
                                                                c.id,
                                                            )}
                                                        >
                                                            Ver
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    `¿Eliminar campaña "${c.name}"?`,
                                                                )
                                                            ) {
                                                                router.delete(
                                                                    route(
                                                                        'admin.mailing.campaigns.destroy',
                                                                        c.id,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-12 text-center text-gray-400"
                                        >
                                            No hay campañas creadas.{' '}
                                            <Link
                                                href={route(
                                                    'admin.mailing.campaigns.create',
                                                )}
                                                className="underline"
                                            >
                                                Crea la primera
                                            </Link>
                                            .
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {campaigns.total > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-border">
                            <div className="text-sm text-gray-500">
                                Mostrando {campaigns.from} a {campaigns.to} de{' '}
                                {campaigns.total}
                            </div>
                            <div className="flex gap-1">
                                {campaigns.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`rounded-md px-3 py-1 text-sm ${link.active ? 'bg-primary font-medium text-primary-foreground' : 'hover:bg-accent'}`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="px-3 py-1 text-sm text-gray-400"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

import AppLayout from '@/layouts/app-layout';
import React from 'react';
import { Head, Link } from '@inertiajs/react';
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
import {
    Smartphone,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
} from 'lucide-react';

interface AccessLog {
    id: number;
    scanned_code: string;
    result: string;
    metadata: any;
    scanned_at: string;
    device: {
        name: string;
    };
    code?: {
        type: string;
    } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    links: PaginationLink[];
    total: number;
}

interface Props {
    event: {
        id: number;
        name: string;
    };
    logs: PaginatedData<AccessLog>;
}

export default function Logs({ event, logs }: Props) {
    const getResultBadge = (result: string) => {
        switch (result) {
            case 'success':
                return (
                    <Badge className="border-none bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="mr-1 size-3" /> Éxito
                    </Badge>
                );
            case 'duplicate':
                return (
                    <Badge className="border-none bg-orange-100 text-orange-700 hover:bg-orange-100">
                        <AlertTriangle className="mr-1 size-3" /> Duplicado
                    </Badge>
                );
            case 'invalid_zone':
                return (
                    <Badge className="border-none bg-purple-100 text-purple-700 hover:bg-purple-100">
                        <XCircle className="mr-1 size-3" /> Zona Inválida
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 size-3" /> Cancelado
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        <AlertTriangle className="mr-1 size-3" /> No Encontrado
                    </Badge>
                );
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Control de Acceso',
                    href: route('admin.access.events.index'),
                },
                {
                    title: event.name,
                    href: route('admin.access.events.stats', event.id),
                },
                { title: 'Reporte de Escaneos', href: '#' },
            ]}
        >
            <Head title={`Reporte - ${event.name}`} />

            <div className="p-6">
                <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Reporte de Escaneos: {event.name}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Historial permanente de validaciones (independiente
                            de la base de códigos)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'admin.access.events.stats',
                                    event.id,
                                )}
                            >
                                Estadísticas
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'admin.access.events.codes',
                                    event.id,
                                )}
                            >
                                Ver Códigos Actuales
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow dark:border-border dark:bg-background">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-white/5">
                                    <TableHead className="w-[140px]">
                                        Escaneo
                                    </TableHead>
                                    <TableHead>Código / Tipo</TableHead>
                                    <TableHead className="w-[120px]">
                                        Estado
                                    </TableHead>
                                    <TableHead>
                                        Información del Cliente
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data && logs.data.length > 0 ? (
                                    logs.data.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                                        >
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                        {new Date(
                                                            log.scanned_at,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-500">
                                                        {new Date(
                                                            log.scanned_at,
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}
                                                    </span>
                                                    <div className="mt-1 flex max-w-[100px] items-center gap-1 truncate text-[9px] font-bold text-primary/70 uppercase">
                                                        <Smartphone className="size-2" />
                                                        {log.device.name}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex min-w-0 flex-col">
                                                    <span
                                                        className="max-w-[120px] truncate font-mono text-xs font-black tracking-tight"
                                                        title={log.scanned_code}
                                                    >
                                                        {log.scanned_code}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        {log.code?.type ||
                                                            'Acceso General'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getResultBadge(log.result)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex max-w-[200px] min-w-0 flex-col">
                                                    <span
                                                        className="truncate text-xs font-bold text-gray-700 dark:text-gray-300"
                                                        title={
                                                            log.metadata?.owner
                                                        }
                                                    >
                                                        {log.metadata?.owner ||
                                                            'S/N'}
                                                    </span>
                                                    <span
                                                        className="truncate text-[10px] font-medium text-primary italic"
                                                        title={
                                                            log.metadata
                                                                ?.details
                                                        }
                                                    >
                                                        {log.metadata
                                                            ?.details || '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-8 text-center text-gray-500"
                                        >
                                            Aún no hay registros de escaneo para
                                            este evento.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {logs.total > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-border">
                            <div className="text-sm text-gray-500">
                                Total: {logs.total} registros
                            </div>
                            <div className="flex gap-1">
                                {logs.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`rounded-md px-3 py-1 text-sm transition-colors ${
                                                link.active
                                                    ? 'bg-primary font-medium text-primary-foreground'
                                                    : 'text-foreground hover:bg-accent'
                                            }`}
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

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
import { CheckCircle2, XCircle, AlertTriangle, CloudRain, ShieldAlert } from 'lucide-react';

interface AccessPostbackLog {
    id: number;
    access_event_id: number;
    barcode: string;
    status: string;
    payload: any;
    response: string;
    status_code: number;
    scanned_at: string;
    created_at: string;
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
    logs: PaginatedData<AccessPostbackLog>;
}

export default function PostbackLogs({ event, logs }: Props) {
    const getResultBadge = (result: string) => {
        switch (result) {
            case 'success':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle2 className="size-3 mr-1" /> Éxito</Badge>;
            case 'duplicate':
                return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none"><AlertTriangle className="size-3 mr-1" /> Duplicado</Badge>;
            case 'invalid_zone':
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none"><XCircle className="size-3 mr-1" /> Zona Inválida</Badge>;
            case 'cancelled':
                return <Badge variant="destructive"><XCircle className="size-3 mr-1" /> Cancelado</Badge>;
            default:
                return <Badge variant="secondary"><AlertTriangle className="size-3 mr-1" /> Inválido</Badge>;
        }
    };

    const getStatusBadge = (statusCode: number) => {
        if (statusCode >= 200 && statusCode < 300) {
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">{statusCode} OK</Badge>;
        }
        if (statusCode >= 400 && statusCode < 500) {
            return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">{statusCode} Error</Badge>;
        }
        return <Badge variant="destructive">{statusCode} Server Error</Badge>;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Control de Acceso', href: route('admin.access.events.index') },
            { title: event.name, href: route('admin.access.events.stats', event.id) },
            { title: 'Logs de Postback', href: '#' }
        ]}>
            <Head title={`Postback Logs - ${event.name}`} />

            <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <CloudRain className="size-6 text-blue-500" />
                            Logs de Postback: {event.name}
                        </h1>
                        <p className="text-sm text-gray-500">Historial de envíos webhooks a servidores externos</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('admin.access.events.stats', event.id)}>
                                Estadísticas
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={route('admin.access.events.logs', event.id)}>
                                Logs de Acceso Locales
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-md shadow overflow-hidden dark:bg-background border border-gray-200 dark:border-border flex flex-col">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-white/5">
                                    <TableHead className="w-[140px]">Envío</TableHead>
                                    <TableHead>Código</TableHead>
                                    <TableHead className="w-[120px]">Estado Lógico</TableHead>
                                    <TableHead>Respuesta HTTP</TableHead>
                                    <TableHead>Payload Enviado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data && logs.data.length > 0 ? (
                                    logs.data.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                        {new Date(log.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium">
                                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs font-black tracking-tight truncate max-w-[120px]" title={log.barcode}>
                                                    {log.barcode}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {getResultBadge(log.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    {getStatusBadge(log.status_code)}
                                                    <div className="text-[10px] text-gray-500 max-w-[150px] truncate" title={log.response}>
                                                        {log.response || 'Sin respuesta'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <pre className="text-[9px] bg-gray-100 dark:bg-gray-800 p-2 rounded max-w-[250px] overflow-x-auto">
                                                    {JSON.stringify(log.payload, null, 2)}
                                                </pre>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            Aún no hay registros de postback para este evento.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {logs.total > 0 && (
                        <div className="p-4 border-t border-gray-200 dark:border-border flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Total: {logs.total} registros
                            </div>
                            <div className="flex gap-1">
                                {logs.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${link.active
                                                ? 'bg-primary text-primary-foreground font-medium'
                                                : 'hover:bg-accent text-foreground'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="px-3 py-1 text-sm text-gray-400"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
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

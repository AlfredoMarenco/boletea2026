import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface RefundEvent {
    id: number;
    external_event_id: number | null;
    title?: string | null;
    display_title?: string;
    status: 'active' | 'inactive';
    purchases_count: number;
    requests_count: number;
    external_event?: {
        id: number;
        title: string;
        start_date: string | null;
    };
}

interface AvailableEvent {
    id: number;
    title: string;
}

interface Props {
    refundEvents: RefundEvent[];
    availableEvents: AvailableEvent[];
}

export default function EventsIndex({ refundEvents, availableEvents }: Props) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.email === 'alfredomarenco@boletea.com';

    const [selectedEventId, setSelectedEventId] = useState('');
    const [uploadingEventId, setUploadingEventId] = useState<number | null>(
        null,
    );
    const [sendingNotifEventId, setSendingNotifEventId] = useState<number | null>(null);

    const handleCreateLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEventId) return;

        router.post(
            route('admin.refunds.events.store'),
            {
                external_event_id: selectedEventId,
                status: 'active',
            },
            {
                onSuccess: () => {
                    setSelectedEventId('');
                },
            },
        );
    };

    const handleToggleStatus = (id: number) => {
        router.post(route('admin.refunds.events.toggle', { event: id }), {});
    };

    const handleDelete = (id: number) => {
        const word = window.prompt(
            'ADVERTENCIA: Esta acción borrará el evento, todas sus órdenes y todas las solicitudes de los clientes asociadas a él.\n\nEscribe ELIMINAR para confirmar:',
        );
        if (word === 'ELIMINAR') {
            router.delete(route('admin.refunds.events.destroy', { event: id }));
        } else if (word !== null) {
            alert(
                'Palabra de confirmación incorrecta. No se realizó ninguna acción.',
            );
        }
    };

    const handleCsvUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        id: number,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingEventId(id);

        const formData = new FormData();
        formData.append('file', file);

        router.post(
            route('admin.refunds.events.upload_csv', { event: id }),
            formData,
            {
                forceFormData: true,
                onFinish: () => {
                    setUploadingEventId(null);
                    e.target.value = '';
                },
            },
        );
    };

    const handleRecoveredCsvUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        id: number,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingEventId(id);

        const formData = new FormData();
        formData.append('file', file);

        router.post(
            route('admin.refunds.events.import_recovered', { event: id }),
            formData,
            {
                forceFormData: true,
                onFinish: () => {
                    setUploadingEventId(null);
                    e.target.value = '';
                },
            },
        );
    };

    const handleSendPendingNotifications = (id: number) => {
        if (!confirm('¿Deseas enviar por correo la solicitud de fotos/evidencia a todos los clientes que están en estatus PENDIENTE de este evento?')) {
            return;
        }

        setSendingNotifEventId(id);
        router.post(
            route('admin.refunds.events.send_pending_notifications', { event: id }),
            {},
            {
                onFinish: () => setSendingNotifEventId(null),
            },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Gestión de Reembolsos',
                    href: route('admin.refunds.events'),
                },
            ]}
        >
            <Head title="Eventos en Reembolso" />

            <div className="p-6">
                {/* Header */}
                <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Eventos Autorizados para Reembolso
                        </h1>
                        <p className="text-sm text-gray-500">
                            Gestione los eventos con reembolsos activos e
                            importe los reportes de taquilla/boleto
                            personalizado.
                        </p>
                    </div>
                </div>

                {/* Add Event Form Section */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-border dark:bg-card">
                    <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Habilitar Evento para Solicitudes de Reembolso
                    </h2>
                    <form
                        onSubmit={handleCreateLink}
                        className="flex max-w-xl flex-col items-end gap-4 sm:flex-row"
                    >
                        <div className="w-full flex-1">
                            <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                Seleccionar Evento de Cartelera
                            </label>
                            <select
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:ring-1 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                            >
                                <option value="">
                                    -- Seleccionar Evento --
                                </option>
                                {availableEvents.map((ev) => (
                                    <option key={ev.id} value={ev.id}>
                                        {ev.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button
                            type="submit"
                            disabled={!selectedEventId}
                            className="bg-[#c90000] text-white hover:bg-[#a60000]"
                        >
                            Habilitar Reembolso
                        </Button>
                    </form>
                </div>

                {/* Table of Enabled Refund Events */}
                <div className="flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow dark:border-border dark:bg-background">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Título del Evento</TableHead>
                                    <TableHead className="text-center">
                                        Órdenes Cargadas
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Solicitudes Clientes
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Estado
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Cargar CSV de Compras
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {refundEvents.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-8 text-center text-gray-500"
                                        >
                                            No hay eventos configurados para
                                            reembolsos.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    refundEvents.map((ev) => (
                                        <TableRow key={ev.id}>
                                            <TableCell className="font-medium">
                                                {ev.id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                                    <span>
                                                        {ev.display_title ||
                                                            ev.external_event?.title ||
                                                            ev.title ||
                                                            'Evento Archivado'}
                                                    </span>
                                                    {!ev.external_event && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-amber-300 text-[10px] text-amber-600 dark:border-amber-700 dark:text-amber-400"
                                                        >
                                                            Archivado
                                                        </Badge>
                                                    )}
                                                </div>
                                                {ev.external_event
                                                    ?.start_date && (
                                                    <div className="text-xs text-gray-400">
                                                        Fecha:{' '}
                                                        {new Date(
                                                            ev.external_event
                                                                .start_date,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className="px-2.5 py-0.5"
                                                >
                                                    {ev.purchases_count} órdenes
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className="border-blue-200 px-2.5 py-0.5 text-blue-600 dark:text-blue-400"
                                                >
                                                    {ev.requests_count}{' '}
                                                    solicitudes
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <button
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            ev.id,
                                                        )
                                                    }
                                                    className="focus:outline-none"
                                                >
                                                    <Badge
                                                        className={`cursor-pointer px-2 py-0.5 capitalize ${ev.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-400'}`}
                                                    >
                                                        {ev.status === 'active'
                                                            ? 'Activo'
                                                            : 'Inactivo'}
                                                    </Badge>
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center justify-center space-y-1.5">
                                                    <label className="inline-flex cursor-pointer items-center space-x-1.5 rounded-md border border-gray-300 bg-gray-50 p-2 py-1 text-xs font-semibold hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-900">
                                                        <span>
                                                            {uploadingEventId === ev.id
                                                                ? 'Subiendo...'
                                                                : 'Seleccionar Archivo'}
                                                        </span>
                                                        <input
                                                            type="file"
                                                            accept=".csv,text/plain"
                                                            onChange={(e) =>
                                                                handleCsvUpload(
                                                                    e,
                                                                    ev.id,
                                                                )
                                                            }
                                                            className="hidden"
                                                            disabled={
                                                                uploadingEventId !== null
                                                            }
                                                        />
                                                    </label>
                                                    <span className="text-[10px] text-gray-400">
                                                        Soporta: CSV (.csv)
                                                    </span>

                                                    {isSuperAdmin && (
                                                        <>
                                                            <label className="inline-flex cursor-pointer items-center space-x-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                <span>
                                                                    {uploadingEventId === ev.id
                                                                        ? 'Restaurando...'
                                                                        : 'Recuperar Solicitudes CSV'}
                                                                </span>
                                                                <input
                                                                    type="file"
                                                                    accept=".csv,text/plain"
                                                                    onChange={(e) =>
                                                                        handleRecoveredCsvUpload(
                                                                            e,
                                                                            ev.id,
                                                                        )
                                                                    }
                                                                    className="hidden"
                                                                    disabled={
                                                                        uploadingEventId !== null
                                                                    }
                                                                />
                                                            </label>

                                                            <Button
                                                                onClick={() => handleSendPendingNotifications(ev.id)}
                                                                disabled={sendingNotifEventId === ev.id}
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-amber-400 bg-amber-50 text-[11px] text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                                            >
                                                                {sendingNotifEventId === ev.id
                                                                    ? 'Enviando...'
                                                                    : 'Notificar Evidencia a Pendientes'}
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                ev.id,
                                                            )
                                                        }
                                                        variant={
                                                            ev.status ===
                                                            'active'
                                                                ? 'destructive'
                                                                : 'default'
                                                        }
                                                        size="sm"
                                                    >
                                                        {ev.status === 'active'
                                                            ? 'Desactivar'
                                                            : 'Activar'}
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={route(
                                                                'admin.refunds.requests',
                                                                {
                                                                    refund_event_id:
                                                                        ev.id,
                                                                },
                                                            )}
                                                        >
                                                            Ver Trámites
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                                                    >
                                                        <Link
                                                            href={route(
                                                                'admin.refunds.events.orders',
                                                                {
                                                                    event: ev.id,
                                                                },
                                                            )}
                                                        >
                                                            Ver Reporte
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            handleDelete(ev.id)
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                                        title="Eliminar Evento y Órdenes"
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
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
import {
    ArrowLeft,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Layers,
    DollarSign,
    Percent,
} from 'lucide-react';

interface TicketDetail {
    ticket_id: string;
    barcode: string;
    area: string;
    seat: string;
    price: number;
    cxs: number;
    tc: number;
    cxadm: number;
    total: number;
    status: string;
}

interface Purchase {
    id: number;
    order_number: string;
    email: string | null;
    buyer_name: string;
    payment_method: string;
    card_last_four: string | null;
    amount: string;
    tickets_details: TicketDetail[];
    is_cancelled: boolean;
    request_status: 'pending' | 'processing' | 'approved' | 'rejected' | null;
    request_id: number | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
}

interface RefundEvent {
    id: number;
    external_event_id: number;
    status: 'active' | 'inactive';
    external_event?: {
        id: number;
        title: string;
        start_date: string | null;
    };
}

interface Stats {
    total_orders: number;
    cancelled_orders: number;
    valid_orders: number;
    total_requests: number;
    approved_requests: number;
    pending_processing_requests: number;
    rejected_requests: number;
    pending_registration: number;
    amount_refunded: number;
    amount_pending: number;
    amount_rejected: number;
    amount_remaining: number;
    count_with_charges: number;
    count_without_charges: number;
    amount_with_charges: number;
    amount_without_charges: number;
}

interface Props {
    event: RefundEvent;
    purchases: PaginatedData<Purchase>;
    stats: Stats;
    filters: {
        search?: string | null;
        filter_type?:
            | 'all'
            | 'valid'
            | 'cancelled'
            | 'with_request'
            | 'without_request'
            | null;
    };
}

export default function OrdersReport({
    event,
    purchases,
    stats,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [filterType, setFilterType] = useState(filters?.filter_type || 'all');
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [splitNames, setSplitNames] = useState(false);

    const handleFilterChange = (type: string) => {
        setFilterType(type);
        router.get(
            route('admin.refunds.events.orders', { event: event.id }),
            {
                search,
                filter_type: type,
                page: 1,
            },
            { preserveState: true },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.refunds.events.orders', { event: event.id }),
            {
                search,
                filter_type: filterType,
                page: 1,
            },
            { preserveState: true },
        );
    };

    const totalValid = stats.valid_orders || 1;
    const requestedPercent = Math.round(
        (stats.total_requests / totalValid) * 100,
    );

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
        circumference - (requestedPercent / 100) * circumference;

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Gestión de Reembolsos',
                    href: route('admin.refunds.events'),
                },
                {
                    title: 'Reporte de Órdenes',
                    href: route('admin.refunds.events.orders', {
                        event: event.id,
                    }),
                },
            ]}
        >
            <Head
                title={`Reporte - ${event.external_event?.title || 'Evento'}`}
            />

            <div className="max-w-full space-y-6 p-6 lg:px-8">
                <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center dark:border-border">
                    <div className="flex items-center space-x-3">
                        <Link
                            href={route('admin.refunds.events')}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-600 transition hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-400 dark:hover:bg-neutral-800"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                                Reporte de Órdenes
                                <Badge className="bg-emerald-500 font-medium text-white hover:bg-emerald-600">
                                    Reembolsos Habilitados
                                </Badge>
                            </h1>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {event.external_event?.title || 'Evento'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Resumen de Cantidades */}
                <div className="border-gray-150 rounded-xl border bg-gray-50/50 p-4 dark:border-border dark:bg-neutral-900/30">
                    <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-neutral-500">
                        <Layers className="h-3.5 w-3.5" /> Estado de Órdenes
                        (Cantidades)
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-white p-4 shadow-xs dark:border-border dark:bg-card">
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
                                <Layers className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-gray-450 block text-[10px] font-semibold tracking-wider uppercase">
                                    Órdenes Cargadas
                                </span>
                                <span className="text-xl font-bold text-gray-950 dark:text-white">
                                    {stats.total_orders}{' '}
                                    <span className="text-xs font-normal text-gray-400">
                                        ord.
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-white p-4 shadow-xs dark:border-border dark:bg-card">
                            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/20 dark:text-red-400">
                                <XCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-gray-450 block text-[10px] font-semibold tracking-wider uppercase">
                                    Órdenes Canceladas
                                </span>
                                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                                    {stats.cancelled_orders}{' '}
                                    <span className="text-xs font-normal text-gray-400">
                                        ord.
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-white p-4 shadow-xs dark:border-border dark:bg-card">
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-gray-450 block text-[10px] font-semibold tracking-wider uppercase">
                                    Órdenes Elegibles
                                </span>
                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {stats.valid_orders}{' '}
                                    <span className="text-xs font-normal text-gray-400">
                                        ord.
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-white p-4 shadow-xs dark:border-border dark:bg-card">
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-gray-450 block text-[10px] font-semibold tracking-wider uppercase">
                                    Pendientes Trámite
                                </span>
                                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                    {stats.pending_registration}{' '}
                                    <span className="text-xs font-normal text-gray-400">
                                        ord.
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen Financiero */}
                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 dark:bg-emerald-500/5">
                    <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                        <DollarSign className="h-3.5 w-3.5" /> Resumen
                        Financiero y Contabilidad
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Reembolsado */}
                        <div className="flex items-center space-x-3 rounded-lg border border-emerald-500/15 bg-white p-4 shadow-xs dark:bg-card">
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                                    Monto Reembolsado
                                </span>
                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    $
                                    {stats.amount_refunded.toLocaleString(
                                        'es-MX',
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    )}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-gray-400">
                                    {stats.approved_requests} solicitudes
                                    aprobadas
                                </span>
                            </div>
                        </div>

                        {/* En Trámite */}
                        <div className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-white p-4 shadow-xs dark:border-border dark:bg-card">
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                                    Monto en Trámite
                                </span>
                                <span className="text-xl font-bold text-amber-500 dark:text-amber-400">
                                    $
                                    {stats.amount_pending.toLocaleString(
                                        'es-MX',
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    )}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-gray-400">
                                    {stats.pending_processing_requests}{' '}
                                    solicitudes en proceso
                                </span>
                            </div>
                        </div>

                        {/* Falta por Reembolsar */}
                        <div className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-white p-4 shadow-xs dark:border-border dark:bg-card">
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                                    Falta por Reembolsar
                                </span>
                                <span className="text-xl font-bold text-gray-700 dark:text-gray-200">
                                    $
                                    {stats.amount_remaining.toLocaleString(
                                        'es-MX',
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    )}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-gray-400">
                                    {stats.pending_registration} órdenes sin
                                    registrar
                                </span>
                            </div>
                        </div>

                        {/* Cargos vs Sin Cargos */}
                        <div className="flex flex-col justify-center space-y-1 rounded-lg border border-gray-200 bg-white p-3 shadow-xs dark:border-border dark:bg-card">
                            <span className="text-gray-450 block text-[9px] font-semibold tracking-wider uppercase">
                                Cargos (Aprobado/En Trámite)
                            </span>
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-500">
                                    Con Cargos ({stats.count_with_charges}):
                                </span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                    $
                                    {stats.amount_with_charges.toLocaleString(
                                        'es-MX',
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-500">
                                    Sin Cargos ({stats.count_without_charges}):
                                </span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                    $
                                    {stats.amount_without_charges.toLocaleString(
                                        'es-MX',
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        },
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-border dark:bg-card">
                        <div>
                            <h2 className="text-md font-bold text-gray-900 dark:text-white">
                                Avance de Trámites de Reembolso
                            </h2>
                            <p className="mt-1 text-xs text-gray-400">
                                Comparativa de órdenes elegibles con trámite
                                iniciado contra pendientes.
                            </p>
                        </div>
                        <div className="flex flex-col items-center justify-around gap-6 py-6 sm:flex-row">
                            <div className="relative flex h-36 w-36 items-center justify-center">
                                <svg className="h-full w-full -rotate-90 transform">
                                    <circle
                                        cx="72"
                                        cy="72"
                                        r={radius}
                                        className="stroke-gray-100 dark:stroke-neutral-800"
                                        strokeWidth="12"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="72"
                                        cy="72"
                                        r={radius}
                                        className="stroke-[#c90000] dark:stroke-[#e53e3e]"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={
                                            isNaN(strokeDashoffset)
                                                ? 0
                                                : strokeDashoffset
                                        }
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute text-center">
                                    <span className="text-2xl font-black text-gray-800 dark:text-white">
                                        {isNaN(requestedPercent)
                                            ? 0
                                            : requestedPercent}
                                        %
                                    </span>
                                    <span className="block text-[10px] font-semibold text-gray-400 uppercase">
                                        Iniciados
                                    </span>
                                </div>
                            </div>

                            <div className="max-w-xs flex-grow space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className="block h-3.5 w-3.5 rounded-full bg-[#c90000]"></span>
                                        <span className="font-medium text-gray-600 dark:text-gray-300">
                                            Trámites Solicitados
                                        </span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {stats.total_requests}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className="block h-3.5 w-3.5 rounded-full bg-gray-200 dark:bg-neutral-700"></span>
                                        <span className="font-medium text-gray-600 dark:text-gray-300">
                                            Faltan por hacerse
                                        </span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {stats.pending_registration}
                                    </span>
                                </div>
                                <div className="border-gray-150 flex justify-between border-t pt-2 text-xs text-gray-400 dark:border-border">
                                    <span>Total Elegibles:</span>
                                    <span className="font-bold">
                                        {stats.valid_orders}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-border dark:bg-card">
                        <div>
                            <h2 className="text-md font-bold text-gray-900 dark:text-white">
                                Distribución por Estatus de Trámite
                            </h2>
                            <p className="mt-1 text-xs text-gray-400">
                                Estado actual de las solicitudes de reembolso
                                que ya han sido registradas.
                            </p>
                        </div>

                        <div className="space-y-4 py-6">
                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle className="h-3.5 w-3.5" />{' '}
                                        Aprobadas
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {stats.approved_requests} (
                                        {stats.total_requests > 0
                                            ? Math.round(
                                                  (stats.approved_requests /
                                                      stats.total_requests) *
                                                      100,
                                              )
                                            : 0}
                                        %)
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                        style={{
                                            width: `${stats.total_requests > 0 ? (stats.approved_requests / stats.total_requests) * 100 : 0}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                        <Clock className="h-3.5 w-3.5" />{' '}
                                        Pendientes / En Proceso
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {stats.pending_processing_requests} (
                                        {stats.total_requests > 0
                                            ? Math.round(
                                                  (stats.pending_processing_requests /
                                                      stats.total_requests) *
                                                      100,
                                              )
                                            : 0}
                                        %)
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                                    <div
                                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                        style={{
                                            width: `${stats.total_requests > 0 ? (stats.pending_processing_requests / stats.total_requests) * 100 : 0}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                                        <XCircle className="h-3.5 w-3.5" />{' '}
                                        Rechazadas
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {stats.rejected_requests} (
                                        {stats.total_requests > 0
                                            ? Math.round(
                                                  (stats.rejected_requests /
                                                      stats.total_requests) *
                                                      100,
                                              )
                                            : 0}
                                        %)
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                                    <div
                                        className="h-full rounded-full bg-red-500 transition-all duration-500"
                                        style={{
                                            width: `${stats.total_requests > 0 ? (stats.rejected_requests / stats.total_requests) * 100 : 0}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-xs dark:border-border dark:bg-neutral-900">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Listado de Órdenes Cargadas
                            </h2>
                            <p className="text-xs text-gray-400">
                                Visualice y busque de forma detallada las
                                órdenes de compra cargadas.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-950">
                            {[
                                { id: 'all', label: 'Todas' },
                                { id: 'valid', label: 'Elegibles' },
                                { id: 'cancelled', label: 'Canceladas' },
                                { id: 'with_request', label: 'Con Trámite' },
                                { id: 'without_request', label: 'Sin Trámite' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleFilterChange(tab.id)}
                                    className={`rounded-md px-3 py-1 text-xs font-semibold transition ${filterType === tab.id ? 'bg-[#c90000] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex w-full max-w-md gap-2"
                        >
                            <div className="relative flex-grow">
                                <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por número de orden, correo o comprador..."
                                    className="bg-white pl-9 text-sm focus-visible:ring-[#c90000] dark:bg-neutral-950"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="bg-[#c90000] text-white hover:bg-[#a60000]"
                            >
                                Buscar
                            </Button>
                        </form>

                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-600 select-none dark:text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={splitNames}
                                    onChange={(e) =>
                                        setSplitNames(e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>Separar nombres en columnas</span>
                            </label>
                            <a
                                href={route(
                                    'admin.refunds.events.orders.export_csv',
                                    {
                                        event: event.id,
                                        search: search || undefined,
                                        filter_type: filterType,
                                        split_names: splitNames
                                            ? '1'
                                            : undefined,
                                    },
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                    stroke="currentColor"
                                    className="h-4 w-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                    />
                                </svg>
                                Exportar CSV Contable
                            </a>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-border">
                        <Table>
                            <TableHeader className="bg-gray-50 dark:bg-neutral-950">
                                <TableRow>
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead>Órden</TableHead>
                                    <TableHead>Comprador / Email</TableHead>
                                    <TableHead>Método de Pago</TableHead>
                                    <TableHead className="text-right">
                                        Monto Total
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Estado
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Trámite
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Tickets
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-8 text-center text-gray-500"
                                        >
                                            No se encontraron órdenes que
                                            coincidan con la búsqueda o filtro.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.data.map((p) => {
                                        const isExpanded =
                                            expandedOrder === p.id;
                                        return (
                                            <>
                                                <TableRow
                                                    key={p.id}
                                                    className={`hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 ${p.is_cancelled ? 'bg-red-50/20 dark:bg-red-950/5' : ''}`}
                                                >
                                                    <TableCell>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedOrder(
                                                                    isExpanded
                                                                        ? null
                                                                        : p.id,
                                                                )
                                                            }
                                                            className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-gray-800 dark:text-gray-100">
                                                        #{p.order_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {p.buyer_name}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {p.email ||
                                                                'Sin correo registrado'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <span className="capitalize">
                                                            {p.payment_method ||
                                                                'Desconocido'}
                                                        </span>
                                                        {p.card_last_four && (
                                                            <span className="ml-1 text-gray-400">
                                                                (**
                                                                {
                                                                    p.card_last_four
                                                                }
                                                                )
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                                                        $
                                                        {parseFloat(
                                                            p.amount,
                                                        ).toLocaleString(
                                                            'es-MX',
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            },
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {p.is_cancelled ? (
                                                            <Badge className="hover:bg-red-150 bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">
                                                                Cancelada
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="hover:bg-emerald-150 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                                Válida
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {p.request_status ===
                                                            'approved' && (
                                                            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
                                                                Aprobado
                                                            </Badge>
                                                        )}
                                                        {(p.request_status ===
                                                            'pending' ||
                                                            p.request_status ===
                                                                'processing') && (
                                                            <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                                                                En Trámite
                                                            </Badge>
                                                        )}
                                                        {p.request_status ===
                                                            'rejected' && (
                                                            <Badge className="bg-red-500 text-white hover:bg-red-600">
                                                                Rechazado
                                                            </Badge>
                                                        )}
                                                        {p.request_status ===
                                                            null && (
                                                            <span className="text-xs text-gray-400">
                                                                Sin Solicitud
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-medium text-gray-400">
                                                        {p.tickets_details
                                                            ?.length || 0}{' '}
                                                        boleto(s)
                                                    </TableCell>
                                                </TableRow>

                                                {isExpanded && (
                                                    <TableRow className="bg-gray-50/40 dark:bg-neutral-900/40">
                                                        <TableCell
                                                            colSpan={8}
                                                            className="border-t border-gray-100 p-4 dark:border-border"
                                                        >
                                                            <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                                                <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                                                                    Desglose de
                                                                    Boletos /
                                                                    Asientos
                                                                </h3>
                                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                                    {p.tickets_details?.map(
                                                                        (
                                                                            t,
                                                                            idx,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50/30 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/30"
                                                                            >
                                                                                <div>
                                                                                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                                                                                        {t.area ||
                                                                                            'General'}{' '}
                                                                                        {t.seat
                                                                                            ? `- Asiento ${t.seat}`
                                                                                            : ''}
                                                                                    </div>
                                                                                    <div className="mt-0.5 text-[10px] text-gray-400">
                                                                                        ID:{' '}
                                                                                        {t.ticket_id ||
                                                                                            'N/A'}{' '}
                                                                                        |
                                                                                        CB:{' '}
                                                                                        {t.barcode ||
                                                                                            'N/A'}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <div className="font-bold text-gray-900 dark:text-white">
                                                                                        $
                                                                                        {parseFloat(
                                                                                            String(
                                                                                                t.total ||
                                                                                                    0,
                                                                                            ),
                                                                                        ).toFixed(
                                                                                            2,
                                                                                        )}
                                                                                    </div>
                                                                                    <span
                                                                                        className={`mt-1 inline-block rounded-sm px-1.5 py-0.5 text-[9px] font-semibold capitalize ${['cancelado', 'cancelada'].includes(String(t.status || '').toLowerCase()) ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'}`}
                                                                                    >
                                                                                        {t.status ||
                                                                                            'Pagado'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {purchases.links && purchases.links.length > 3 && (
                        <div className="flex items-center justify-center gap-1.5 pt-4">
                            {purchases.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => {
                                        if (link.url) {
                                            router.get(
                                                link.url,
                                                {
                                                    search,
                                                    filter_type: filterType,
                                                },
                                                { preserveState: true },
                                            );
                                        }
                                    }}
                                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${link.active ? 'border-[#c90000] bg-[#c90000] text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-400 dark:hover:bg-neutral-800'} ${!link.url ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

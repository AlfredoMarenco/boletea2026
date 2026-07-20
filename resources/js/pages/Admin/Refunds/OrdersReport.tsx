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
    Percent
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
        filter_type?: 'all' | 'valid' | 'cancelled' | 'with_request' | 'without_request' | null;
    };
}

export default function OrdersReport({ event, purchases, stats, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [filterType, setFilterType] = useState(filters?.filter_type || 'all');
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

    const handleFilterChange = (type: string) => {
        setFilterType(type);
        router.get(route('admin.refunds.events.orders', { event: event.id }), {
            search,
            filter_type: type,
            page: 1
        }, { preserveState: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.refunds.events.orders', { event: event.id }), {
            search,
            filter_type: filterType,
            page: 1
        }, { preserveState: true });
    };

    const totalValid = stats.valid_orders || 1;
    const requestedPercent = Math.round((stats.total_requests / totalValid) * 100);

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (requestedPercent / 100) * circumference;

    return (
        <AppLayout breadcrumbs={[
            { title: 'Gestión de Reembolsos', href: route('admin.refunds.events') },
            { title: 'Reporte de Órdenes', href: route('admin.refunds.events.orders', { event: event.id }) }
        ]}>
            <Head title={`Reporte - ${event.external_event?.title || 'Evento'}`} />

            <div className="p-6 max-w-full lg:px-8 space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-border pb-5">
                    <div className="flex items-center space-x-3">
                        <Link 
                            href={route('admin.refunds.events')} 
                            className="p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-400 dark:hover:bg-neutral-800 transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Reporte de Órdenes
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">Reembolsos Habilitados</Badge>
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {event.external_event?.title || 'Evento'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Resumen de Cantidades */}
                <div className="bg-gray-50/50 dark:bg-neutral-900/30 p-4 rounded-xl border border-gray-150 dark:border-border">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-3 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" /> Estado de Órdenes (Cantidades)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-card p-4 rounded-lg border border-gray-200 dark:border-border shadow-xs flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-gray-450 uppercase tracking-wider block">Órdenes Cargadas</span>
                                <span className="text-xl font-bold text-gray-950 dark:text-white">{stats.total_orders} <span className="text-xs font-normal text-gray-400">ord.</span></span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-card p-4 rounded-lg border border-gray-200 dark:border-border shadow-xs flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-gray-450 uppercase tracking-wider block">Órdenes Canceladas</span>
                                <span className="text-xl font-bold text-red-600 dark:text-red-400">{stats.cancelled_orders} <span className="text-xs font-normal text-gray-400">ord.</span></span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-card p-4 rounded-lg border border-gray-200 dark:border-border shadow-xs flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-gray-450 uppercase tracking-wider block">Órdenes Elegibles</span>
                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.valid_orders} <span className="text-xs font-normal text-gray-400">ord.</span></span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-card p-4 rounded-lg border border-gray-200 dark:border-border shadow-xs flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-gray-450 uppercase tracking-wider block">Pendientes Trámite</span>
                                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.pending_registration} <span className="text-xs font-normal text-gray-400">ord.</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumen Financiero */}
                <div className="bg-emerald-500/5 dark:bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> Resumen Financiero y Contabilidad
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Reembolsado */}
                        <div className="bg-white dark:bg-card p-4 rounded-lg border border-emerald-500/15 shadow-xs flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Monto Reembolsado</span>
                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    ${stats.amount_refunded.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">{stats.approved_requests} solicitudes aprobadas</span>
                            </div>
                        </div>

                        {/* En Trámite */}
                        <div className="bg-white dark:bg-card p-4 rounded-lg border border-gray-200 dark:border-border shadow-xs flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Monto en Trámite</span>
                                <span className="text-xl font-bold text-amber-500 dark:text-amber-400">
                                    ${stats.amount_pending.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">{stats.pending_processing_requests} solicitudes en proceso</span>
                            </div>
                        </div>

                        {/* Falta por Reembolsar */}
                        <div className="bg-white dark:bg-card p-4 rounded-lg border border-gray-200 dark:border-border shadow-xs flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Falta por Reembolsar</span>
                                <span className="text-xl font-bold text-gray-700 dark:text-gray-200">
                                    ${stats.amount_remaining.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">{stats.pending_registration} órdenes sin registrar</span>
                            </div>
                        </div>

                        {/* Cargos vs Sin Cargos */}
                        <div className="bg-white dark:bg-card p-3 rounded-lg border border-gray-200 dark:border-border shadow-xs flex flex-col justify-center space-y-1">
                            <span className="text-[9px] font-semibold text-gray-450 uppercase tracking-wider block">Cargos (Aprobado/En Trámite)</span>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-medium">Con Cargos ({stats.count_with_charges}):</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                    ${stats.amount_with_charges.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-medium">Sin Cargos ({stats.count_without_charges}):</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                    ${stats.amount_without_charges.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-border shadow-xs flex flex-col justify-between">
                        <div>
                            <h2 className="text-md font-bold text-gray-900 dark:text-white">Avance de Trámites de Reembolso</h2>
                            <p className="text-xs text-gray-400 mt-1">Comparativa de órdenes elegibles con trámite iniciado contra pendientes.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-around py-6 gap-6">
                            <div className="relative w-36 h-36 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
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
                                        strokeDashoffset={isNaN(strokeDashoffset) ? 0 : strokeDashoffset}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute text-center">
                                    <span className="text-2xl font-black text-gray-800 dark:text-white">
                                        {isNaN(requestedPercent) ? 0 : requestedPercent}%
                                    </span>
                                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">Iniciados</span>
                                </div>
                            </div>

                            <div className="space-y-3 flex-grow max-w-xs">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-3.5 h-3.5 rounded-full bg-[#c90000] block"></span>
                                        <span className="text-gray-600 dark:text-gray-300 font-medium">Trámites Solicitados</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">{stats.total_requests}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-neutral-700 block"></span>
                                        <span className="text-gray-600 dark:text-gray-300 font-medium">Faltan por hacerse</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">{stats.pending_registration}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-150 dark:border-border flex justify-between text-xs text-gray-400">
                                    <span>Total Elegibles:</span>
                                    <span className="font-bold">{stats.valid_orders}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-border shadow-xs flex flex-col justify-between">
                        <div>
                            <h2 className="text-md font-bold text-gray-900 dark:text-white">Distribución por Estatus de Trámite</h2>
                            <p className="text-xs text-gray-400 mt-1">Estado actual de las solicitudes de reembolso que ya han sido registradas.</p>
                        </div>
                        
                        <div className="space-y-4 py-6">
                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" /> Aprobadas
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {stats.approved_requests} ({stats.total_requests > 0 ? Math.round((stats.approved_requests / stats.total_requests) * 100) : 0}%)
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${stats.total_requests > 0 ? (stats.approved_requests / stats.total_requests) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> Pendientes / En Proceso
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {stats.pending_processing_requests} ({stats.total_requests > 0 ? Math.round((stats.pending_processing_requests / stats.total_requests) * 100) : 0}%)
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${stats.total_requests > 0 ? (stats.pending_processing_requests / stats.total_requests) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <XCircle className="w-3.5 h-3.5" /> Rechazadas
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {stats.rejected_requests} ({stats.total_requests > 0 ? Math.round((stats.rejected_requests / stats.total_requests) * 100) : 0}%)
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-red-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${stats.total_requests > 0 ? (stats.rejected_requests / stats.total_requests) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-border shadow-xs space-y-4">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Listado de Órdenes Cargadas</h2>
                            <p className="text-xs text-gray-400">Visualice y busque de forma detallada las órdenes de compra cargadas.</p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 bg-gray-50 dark:bg-neutral-950 p-1.5 rounded-lg border border-gray-200 dark:border-neutral-800">
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
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${filterType === tab.id ? 'bg-[#c90000] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-md">
                            <div className="relative flex-grow">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por número de orden, correo o comprador..."
                                    className="pl-9 bg-white dark:bg-neutral-950 text-sm focus-visible:ring-[#c90000]"
                                />
                            </div>
                            <Button type="submit" className="bg-[#c90000] hover:bg-[#a60000] text-white">
                                Buscar
                            </Button>
                        </form>

                        <a
                            href={route('admin.refunds.events.orders.export_csv', {
                                event: event.id,
                                search: search || undefined,
                                filter_type: filterType,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Exportar CSV Contable
                        </a>
                    </div>

                    <div className="rounded-md border border-gray-200 dark:border-border overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50 dark:bg-neutral-950">
                                <TableRow>
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead>Órden</TableHead>
                                    <TableHead>Comprador / Email</TableHead>
                                    <TableHead>Método de Pago</TableHead>
                                    <TableHead className="text-right">Monto Total</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-center">Trámite</TableHead>
                                    <TableHead className="text-right">Tickets</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            No se encontraron órdenes que coincidan con la búsqueda o filtro.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.data.map((p) => {
                                        const isExpanded = expandedOrder === p.id;
                                        return (
                                            <>
                                                <TableRow key={p.id} className={`hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 ${p.is_cancelled ? 'bg-red-50/20 dark:bg-red-950/5' : ''}`}>
                                                    <TableCell>
                                                        <button 
                                                            type="button"
                                                            onClick={() => setExpandedOrder(isExpanded ? null : p.id)}
                                                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 cursor-pointer"
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-gray-800 dark:text-gray-100">
                                                        #{p.order_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{p.buyer_name}</div>
                                                        <div className="text-xs text-gray-400">{p.email || 'Sin correo registrado'}</div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        <span className="capitalize">{p.payment_method || 'Desconocido'}</span>
                                                        {p.card_last_four && <span className="text-gray-400 ml-1">(**{p.card_last_four})</span>}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                                                        ${parseFloat(p.amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {p.is_cancelled ? (
                                                            <Badge className="bg-red-100 text-red-800 hover:bg-red-150 dark:bg-red-950/30 dark:text-red-400">
                                                                Cancelada
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-150 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                                Válida
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {p.request_status === 'approved' && (
                                                            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
                                                                Aprobado
                                                            </Badge>
                                                        )}
                                                        {(p.request_status === 'pending' || p.request_status === 'processing') && (
                                                            <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                                                                En Trámite
                                                            </Badge>
                                                        )}
                                                        {p.request_status === 'rejected' && (
                                                            <Badge className="bg-red-500 text-white hover:bg-red-600">
                                                                Rechazado
                                                            </Badge>
                                                        )}
                                                        {p.request_status === null && (
                                                            <span className="text-xs text-gray-400">Sin Solicitud</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-xs text-gray-400">
                                                        {p.tickets_details?.length || 0} boleto(s)
                                                    </TableCell>
                                                </TableRow>

                                                {isExpanded && (
                                                    <TableRow className="bg-gray-50/40 dark:bg-neutral-900/40">
                                                        <TableCell colSpan={8} className="p-4 border-t border-gray-100 dark:border-border">
                                                            <div className="bg-white dark:bg-neutral-950 p-4 rounded-lg border border-gray-100 dark:border-neutral-800 space-y-3">
                                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Desglose de Boletos / Asientos</h3>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {p.tickets_details?.map((t, idx) => (
                                                                        <div key={idx} className="p-3 rounded-md border border-gray-100 dark:border-neutral-800 bg-gray-50/30 dark:bg-neutral-900/30 flex justify-between items-center text-xs">
                                                                            <div>
                                                                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                                                                                    {t.area || 'General'} {t.seat ? `- Asiento ${t.seat}` : ''}
                                                                                </div>
                                                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                                                    ID: {t.ticket_id || 'N/A'} | CB: {t.barcode || 'N/A'}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="font-bold text-gray-900 dark:text-white">
                                                                                    ${parseFloat(String(t.total || 0)).toFixed(2)}
                                                                                </div>
                                                                                <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-semibold mt-1 capitalize ${['cancelado', 'cancelada'].includes(String(t.status || '').toLowerCase()) ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'}`}>
                                                                                    {t.status || 'Pagado'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
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
                        <div className="flex justify-center items-center gap-1.5 pt-4">
                            {purchases.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => {
                                        if (link.url) {
                                            router.get(link.url, {
                                                search,
                                                filter_type: filterType,
                                            }, { preserveState: true });
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${link.active ? 'bg-[#c90000] border-[#c90000] text-white' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-neutral-900 dark:text-gray-400 dark:border-neutral-800 dark:hover:bg-neutral-800'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface RefundRequest {
    id: number;
    refund_event_id: number;
    order_number: string;
    email: string | null;
    buyer_name: string;
    clabe: string;
    bank_name: string;
    card_last_four: string | null;
    ine_path: string;
    proof_of_payment_path: string | null;
    tickets_path: string | null;
    validated_tickets: string[] | null;
    status: 'pending' | 'processing' | 'approved' | 'rejected';
    admin_notes: string | null;
    validated_documents?: Record<string, boolean> | null;
    include_charges?: boolean;
    created_at: string;
    refund_event?: {
        external_event?: {
            title: string;
        };
    };
    refund_purchase?: {
        buyer_name: string;
        payment_method: string;
        amount: string;
        tickets_details: Array<{
            ticket_id: string;
            barcode: string;
            area: string;
            seat: string;
            price: number;
            cxs: number;
            tc: number;
            cxadm: number;
            total: number;
        }>;
    } | null;
}

interface RefundEvent {
    id: number;
    external_event?: {
        title: string;
    };
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

interface Props {
    requests: PaginatedData<RefundRequest>;
    refundEvents: RefundEvent[];
    filters: {
        search?: string | null;
        status?: string | null;
        refund_event_id?: string | null;
    };
}

export default function RequestsIndex({ requests, refundEvents, filters }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [refundEventId, setRefundEventId] = useState(filters?.refund_event_id || '');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters?.sort_direction || 'asc');

    // Modal/Review states
    const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [editableBuyerName, setEditableBuyerName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [savingName, setSavingName] = useState(false);
    const [nameUpdateSuccess, setNameUpdateSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Document validation and preview states
    const [validatedDocs, setValidatedDocs] = useState<Record<string, boolean>>({});
    const [includeCharges, setIncludeCharges] = useState<boolean>(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string>('');
    const [previewZoom, setPreviewZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [proofFile, setProofFile] = useState<File | null>(null);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Apply filtering
    useEffect(() => {
        if (!isMounted) {
            return;
        }

        // Check if the state actually differs from the filters in props to prevent resetting pagination on mount
        const hasChanged =
            search !== (filters?.search || '') ||
            status !== (filters?.status || '') ||
            refundEventId !== (filters?.refund_event_id || '') ||
            sortDirection !== (filters?.sort_direction || 'asc');

        if (!hasChanged) {
            return;
        }

        const onlySortChanged =
            search === (filters?.search || '') &&
            status === (filters?.status || '') &&
            refundEventId === (filters?.refund_event_id || '') &&
            sortDirection !== (filters?.sort_direction || 'asc');

        const fetchFiltered = () => {
            router.get(
                route('admin.refunds.requests'),
                {
                    search: search || undefined,
                    status: status || undefined,
                    refund_event_id: refundEventId || undefined,
                    sort_direction: sortDirection,
                    page: undefined, // Reset to page 1 when filters change
                },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        };

        if (onlySortChanged) {
            fetchFiltered();
            return;
        }

        const delayDebounceFn = setTimeout(fetchFiltered, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [search, status, refundEventId, sortDirection, isMounted]);

    const handleOpenReview = (req: RefundRequest) => {
        setSelectedRequest(req);
        setAdminNotes(req.admin_notes || '');
        setEditableBuyerName(req.buyer_name || '');
        setValidatedDocs(req.validated_documents || {});
        setIncludeCharges(!!req.include_charges);
        setProofFile(null);
    };

    const handleCloseReview = () => {
        setSelectedRequest(null);
        setAdminNotes('');
        setEditableBuyerName('');
        setIsEditingName(false);
        setSavingName(false);
        setNameUpdateSuccess(false);
        setValidatedDocs({});
        setIncludeCharges(false);
        setPreviewUrl(null);
        setPreviewTitle('');
        setPreviewZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setIsDragging(false);
        setProofFile(null);
    };

    const handleSaveName = () => {
        if (!selectedRequest) return;
        setSavingName(true);
        setNameUpdateSuccess(false);

        router.post(
            route('admin.refunds.requests.status', { refundRequest: selectedRequest.id }),
            {
                status: selectedRequest.status,
                admin_notes: adminNotes,
                validated_documents: validatedDocs,
                include_charges: includeCharges,
                proof_of_payment: undefined,
                buyer_name: editableBuyerName,
            },
            {
                onSuccess: () => {
                    setSavingName(false);
                    setIsEditingName(false);
                    setNameUpdateSuccess(true);
                    setSelectedRequest(prev => prev ? { ...prev, buyer_name: editableBuyerName } : null);
                    setTimeout(() => setNameUpdateSuccess(false), 3000);
                },
                onError: () => setSavingName(false),
                onFinish: () => setSavingName(false),
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const handleUpdateStatus = (newStatus: 'pending' | 'processing' | 'approved' | 'rejected') => {
        if (!selectedRequest) return;

        setLoading(true);
        const docsToSubmit = { ...validatedDocs };
        if (newStatus === 'approved' || proofFile || selectedRequest.proof_of_payment_path) {
            docsToSubmit.proof = true;
        }

        router.post(
            route('admin.refunds.requests.status', { refundRequest: selectedRequest.id }),
            {
                status: newStatus,
                admin_notes: adminNotes,
                validated_documents: docsToSubmit,
                include_charges: includeCharges,
                proof_of_payment: proofFile || undefined,
                buyer_name: editableBuyerName,
            },
            {
                onSuccess: () => {
                    handleCloseReview();
                    setLoading(false);
                },
                onError: () => setLoading(false),
                onFinish: () => setLoading(false),
            }
        );
    };

    const getInvalidDocsList = () => {
        if (!selectedRequest) return [];
        const invalid: string[] = [];
        if (selectedRequest.ine_path && !validatedDocs['ine']) {
            invalid.push('INE / Pasaporte');
        }
        if (selectedRequest.proof_of_payment_path && !validatedDocs['proof']) {
            invalid.push('Comprobante de Pago');
        }
        if (selectedRequest.tickets_path) {
            let parsed = null;
            try {
                parsed = JSON.parse(selectedRequest.tickets_path);
            } catch (e) { }
            if (parsed && typeof parsed === 'object') {
                Object.keys(parsed).forEach(subId => {
                    if (!validatedDocs['ticket_' + subId]) {
                        invalid.push('Boleto ' + subId);
                    }
                });
            } else {
                if (!validatedDocs['tickets']) {
                    invalid.push('Boletos Físicos');
                }
            }
        }
        return invalid;
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            case 'processing':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-400';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'processing': return 'En Trámite';
            case 'approved': return 'Aprobado';
            case 'rejected': return 'Rechazado';
            default: return status;
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Solicitudes de Reembolso', href: route('admin.refunds.requests') }]}>
            <Head title="Solicitudes de Reembolso" />

            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Trámites de Reembolso Recibidos
                        </h1>
                        <p className="text-sm text-gray-500">Valide los datos bancarios y documentos adjuntos de los clientes contra el registro de la orden.</p>
                    </div>
                    <div>
                        <a
                            href={route('admin.refunds.requests.export_csv', {
                                search: search || undefined,
                                status: status || 'processing',
                                refund_event_id: refundEventId || undefined,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Exportar CSV {status ? `(${status === 'processing' ? 'En Trámite' : status === 'pending' ? 'Pendientes' : status === 'approved' ? 'Aprobados' : status === 'rejected' ? 'Rechazados' : status})` : '(En Trámite)'}
                        </a>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-white dark:bg-card p-4 rounded-lg border border-gray-200 dark:border-border">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Buscar</label>
                        <Input
                            type="text"
                            placeholder="Orden, Correo, Titular, CLABE..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Evento</label>
                        <select
                            value={refundEventId}
                            onChange={(e) => setRefundEventId(e.target.value)}
                            className="w-full p-2 h-9 rounded-md border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none"
                        >
                            <option value="">Todos los eventos</option>
                            {refundEvents.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.external_event?.title || `Evento #${ev.id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Estado de Solicitud</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full p-2 h-9 rounded-md border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none"
                        >
                            <option value="">Todos</option>
                            <option value="pending">Pendientes</option>
                            <option value="processing">En Trámite</option>
                            <option value="approved">Aprobados</option>
                            <option value="rejected">Rechazados</option>
                        </select>
                    </div>
                </div>

                {/* Table of Requests */}
                <div className="bg-white rounded-md shadow overflow-hidden dark:bg-background border border-gray-200 dark:border-border">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Orden</TableHead>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Cliente (Solicitado)</TableHead>
                                    <TableHead>CLABE</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-center w-[180px]">
                                        <button
                                            type="button"
                                            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                            className="inline-flex items-center gap-1 hover:text-[#c90000] font-bold justify-center w-full focus:outline-none transition"
                                        >
                                            Fecha Envío
                                            <span className="text-[10px] text-gray-400">
                                                {sortDirection === 'asc' ? '▲' : '▼'}
                                            </span>
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                            No se encontraron solicitudes de reembolso.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.data.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-semibold">#{req.order_number}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {req.refund_event?.external_event?.title || 'Desconocido'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {req.buyer_name?.toUpperCase()}
                                                </div>
                                                {req.email && (
                                                    <div className="text-xs text-gray-400">
                                                        {req.email}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{req.clabe}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`px-2 py-0.5 capitalize ${getStatusBadgeClass(req.status)}`}>
                                                    {getStatusLabel(req.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-gray-500">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button onClick={() => handleOpenReview(req)} size="sm" variant="outline">
                                                    Revisar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Links */}
                    {requests.total > 0 && (
                        <div className="p-4 border-t border-gray-200 dark:border-border flex items-center justify-between text-xs text-gray-500">
                            <div>
                                Mostrando página {requests.current_page} de {requests.last_page} ({requests.total} solicitudes en total)
                            </div>
                            <div className="flex space-x-1">
                                {requests.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (link.url) {
                                                const urlObj = new URL(link.url);
                                                const page = urlObj.searchParams.get('page');
                                                router.get(route('admin.refunds.requests'), {
                                                    search: search || undefined,
                                                    status: status || undefined,
                                                    refund_event_id: refundEventId || undefined,
                                                    sort_direction: sortDirection,
                                                    page: page || undefined
                                                });
                                            }
                                        }}
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 rounded border ${link.active ? 'bg-[#c90000] text-white border-[#c90000]' : 'bg-white dark:bg-neutral-900 border-gray-300 dark:border-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'} disabled:opacity-50`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* REVIEW DETAIL MODAL */}
                {selectedRequest && (
                    <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-5xl my-8 border border-gray-200 dark:border-neutral-800 shadow-2xl">

                            {/* Modal Header */}
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#c90000]/10 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-[#c90000]">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Solicitud #{selectedRequest.order_number}</h2>
                                        <p className="text-xs text-gray-500">{selectedRequest.refund_event?.external_event?.title}</p>
                                    </div>
                                </div>
                                <button onClick={handleCloseReview} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">

                                {/* Stacked layout: CSV record box on top, Client info box below */}
                                <div className="flex flex-col gap-4">

                                    {/* CSV Record Card */}
                                    <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                                            <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300">Registro en CSV Importado</h3>
                                        </div>
                                        {selectedRequest.refund_purchase ? (
                                            <>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs mb-3">
                                                    <div>
                                                        <p className="text-gray-400 mb-0.5">Titular de Compra</p>
                                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedRequest.refund_purchase.buyer_name?.toUpperCase()}</p>
                                                    </div>
                                                    <div>
                                                         <p className="text-gray-400 mb-0.5">Método de Pago</p>
                                                         <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                             {(() => {
                                                                 const method = String(selectedRequest.refund_purchase.payment_method || '').toLowerCase();
                                                                 if (method === 'creditcard') {
                                                                     return 'Tarjeta de Crédito/Débito';
                                                                 }
                                                                 if (method === 'box office payment') {
                                                                     return selectedRequest.card_last_four ? 'Tarjeta de Crédito/Débito' : 'Efectivo';
                                                                 }
                                                                 return selectedRequest.refund_purchase.payment_method;
                                                             })()}
                                                         </p>
                                                     </div>
                                                    <div>
                                                        <p className="text-gray-400 mb-0.5">Monto Total Orden (CSV)</p>
                                                        <p className="font-bold text-base text-gray-900 dark:text-white">${parseFloat(selectedRequest.refund_purchase.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} MXN</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1.5 font-medium">
                                                        {selectedRequest.validated_tickets ? 'Boletos en este trámite:' : 'Boletos de la orden:'}
                                                    </p>
                                                    <div className="max-h-36 overflow-y-auto space-y-1.5 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-blue-100 dark:border-neutral-800 text-xs">
                                                        {selectedRequest.refund_purchase.tickets_details
                                                            .filter((t) => {
                                                                if (!selectedRequest.validated_tickets || selectedRequest.validated_tickets.length === 0) return true;
                                                                const validatedList = selectedRequest.validated_tickets.map(vt => String(vt).trim().toLowerCase());
                                                                return validatedList.includes(String(t.barcode).trim().toLowerCase()) ||
                                                                    validatedList.includes(String(t.ticket_id).trim().toLowerCase());
                                                            })
                                                            .map((t, idx) => {
                                                                const bPrice = parseFloat(String(t.price)) || 0;
                                                                const bCxs = parseFloat(String(t.cxs || 0)) || 0;
                                                                const bTc = parseFloat(String(t.tc || 0)) || 0;
                                                                const bCxadm = parseFloat(String(t.cxadm || 0)) || 0;
                                                                const bCharges = bCxs + bTc + bCxadm;
                                                                const bTotalPaid = t.total ? parseFloat(String(t.total)) : (bPrice + bCharges);

                                                                return (
                                                                    <div key={idx} className="flex justify-between items-center border-b border-gray-50 dark:border-neutral-800 py-1.5 last:border-0">
                                                                        <div>
                                                                            <span className="font-semibold text-gray-800 dark:text-gray-200">{t.area}</span>
                                                                            {t.seat && t.seat !== '0' && <span className="text-gray-400"> · Asiento {t.seat}</span>}
                                                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                                                Boleto: ${bPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} | TC: ${bTc.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                                {bCxs > 0 && <span> | CXS: ${bCxs.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}
                                                                                {bCxadm > 0 && <span> | CXADM: ${bCxadm.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="font-bold text-green-700 dark:text-green-400 block text-xs">
                                                                                A reembolsar: ${bPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-400 block">
                                                                                Pagado: ${bTotalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-red-500 text-xs">No se encontró registro en el CSV importado para esta orden.</p>
                                        )}
                                    </div>

                                    {/* Client Info Card */}
                                    <div className="rounded-xl border border-green-100 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/20 p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                                            <h3 className="font-semibold text-sm text-green-800 dark:text-green-300">Información Capturada por el Cliente</h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-3 text-xs mb-4">
                                            <div className="col-span-2 md:col-span-2">
                                                <p className="text-gray-400 mb-1">Nombre del Titular</p>
                                                {!isEditingName ? (
                                                    <div className="flex items-center gap-1.5 min-h-[32px]">
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200 break-words whitespace-normal">
                                                            {selectedRequest.buyer_name?.toUpperCase()}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditableBuyerName(selectedRequest.buyer_name || '');
                                                                setIsEditingName(true);
                                                                setNameUpdateSuccess(false);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                                                            title="Editar nombre"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                            </svg>
                                                        </button>
                                                        {nameUpdateSuccess && (
                                                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded animate-pulse">
                                                                ✓ ¡Actualizado!
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 min-h-[32px]">
                                                        <input
                                                            type="text"
                                                            value={editableBuyerName}
                                                            onChange={(e) => setEditableBuyerName(e.target.value.toUpperCase())}
                                                            className="flex-grow px-2 py-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md font-semibold text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#c90000] focus:border-[#c90000]"
                                                            placeholder="NOMBRE"
                                                            autoFocus
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveName}
                                                            disabled={savingName}
                                                            className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition disabled:opacity-50"
                                                            title="Guardar cambios"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditingName(false)}
                                                            className="p-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded dark:bg-neutral-800 dark:text-gray-300 transition"
                                                            title="Cancelar"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-gray-400 mb-0.5">Banco</p>
                                                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedRequest.bank_name || 'No especificado'}</p>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1 md:col-span-2">
                                                <p className="text-gray-400 mb-0.5">CLABE Interbancaria</p>
                                                <p className="font-bold text-base font-mono tracking-wide text-[#c90000]">{selectedRequest.clabe}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 mb-0.5">Correo Electrónico</p>
                                                <p className="font-medium text-gray-700 dark:text-gray-300 break-all">{selectedRequest.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 mb-0.5">Fecha de Trámite</p>
                                                <p className="font-medium text-gray-700 dark:text-gray-300">{new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                                            </div>
                                            {selectedRequest.card_last_four && (
                                                <div>
                                                    <p className="text-gray-400 mb-0.5">Últimos 4 dígitos tarjeta</p>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200">···· {selectedRequest.card_last_four}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Amount Breakdown - calculate refund total as base ticket price only */}
                                        {(() => {
                                            const isPartialTaquilla = selectedRequest.validated_tickets && selectedRequest.validated_tickets.length > 0;
                                            const validatedList = isPartialTaquilla ? selectedRequest.validated_tickets!.map(t => String(t).trim().toLowerCase()) : [];
                                            const allTickets = selectedRequest.refund_purchase?.tickets_details || [];

                                            const targetTickets = isPartialTaquilla
                                                ? allTickets.filter(t => validatedList.includes(String(t.barcode).trim().toLowerCase()) || validatedList.includes(String(t.ticket_id).trim().toLowerCase()))
                                                : allTickets;

                                            if (targetTickets.length === 0 && !selectedRequest.refund_purchase) return null;

                                            const priceTotal = targetTickets.length > 0
                                                ? targetTickets.reduce((acc, t) => acc + (parseFloat(String(t.price)) || 0), 0)
                                                : parseFloat(selectedRequest.refund_purchase?.amount || '0');

                                            const cxsTotal = targetTickets.reduce((acc, t) => acc + (parseFloat(String(t.cxs || 0)) || 0), 0);
                                            const tcTotal = targetTickets.reduce((acc, t) => acc + (parseFloat(String(t.tc || 0)) || 0), 0);
                                            const cxadmTotal = targetTickets.reduce((acc, t) => acc + (parseFloat(String(t.cxadm || 0)) || 0), 0);
                                            const chargesTotal = cxsTotal + tcTotal + cxadmTotal;
                                            const grandTotalPaid = priceTotal + chargesTotal;
                                            const finalRefundTotal = includeCharges ? grandTotalPaid : priceTotal;

                                            return (
                                                <div className="rounded-xl bg-white dark:bg-neutral-900 border border-green-200 dark:border-green-900/50 p-4 space-y-3 shadow-xs">
                                                    {/* Toggle option for including charges */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-neutral-950 border border-gray-200/80 dark:border-neutral-800 mb-1">
                                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={includeCharges}
                                                                onChange={(e) => setIncludeCharges(e.target.checked)}
                                                                className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                                            />
                                                            <span>¿Incluir cargos por servicio y tarjeta en el reembolso?</span>
                                                        </label>
                                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto ${includeCharges ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40' : 'bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-gray-300'}`}>
                                                            {includeCharges ? 'CC - Con Cargos' : 'SC - Sin Cargos (Por Defecto)'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-baseline justify-between pb-2.5 border-b border-green-100 dark:border-green-900/40">
                                                        <div>
                                                            <span className="text-xs font-bold text-green-800 dark:text-green-400 uppercase tracking-wider block">
                                                                Total a Reembolsar
                                                            </span>
                                                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                                {includeCharges ? '(Precio base de boletos + cargos incluidos)' : (isPartialTaquilla ? `(${targetTickets.length} boleto${targetTickets.length !== 1 ? 's' : ''} validado${targetTickets.length !== 1 ? 's' : ''} - sin cargos)` : '(Costo base de boletos - sin cargos)')}
                                                            </span>
                                                        </div>
                                                        <span className="text-2xl font-black text-green-700 dark:text-green-400">
                                                            ${finalRefundTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                                                        </span>
                                                    </div>

                                                    <div className="text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
                                                        <div className="flex justify-between font-semibold">
                                                            <span>• Subtotal Boletos:</span>
                                                            <span className="text-gray-900 dark:text-white">${priceTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                        </div>

                                                        <div className="pt-2 pb-1 border-t border-dashed border-gray-200 dark:border-neutral-800 space-y-1">
                                                            <div className="flex justify-between items-center text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                                <span>{includeCharges ? 'Cargos incluidos en reembolso:' : 'Cargos no reembolsables:'}</span>
                                                                <span className={includeCharges ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'line-through'}>
                                                                    ${chargesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            {cxsTotal > 0 && (
                                                                <div className="flex justify-between pl-3 text-[11px] text-gray-500">
                                                                    <span>- Cargo por Servicio (CXS):</span>
                                                                    <span>${cxsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between pl-3 text-[11px] text-gray-500">
                                                                <span>- Cargo Tarjeta (TC):</span>
                                                                <span>${tcTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                            </div>
                                                            {cxadmTotal > 0 && (
                                                                <div className="flex justify-between pl-3 text-[11px] text-gray-500">
                                                                    <span>- Cargo Adm. (CXADM):</span>
                                                                    <span>${cxadmTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {chargesTotal > 0 && (
                                                            <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-neutral-800 text-[11px] text-gray-400 font-medium">
                                                                <span>Total Pagado en Orden (Precio + Cargos):</span>
                                                                <span>${grandTotalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} MXN</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Validated Ticket IDs (Taquilla only) */}
                                {selectedRequest.validated_tickets && selectedRequest.validated_tickets.length > 0 && (
                                    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 p-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">IDs de Boletos Validados ({selectedRequest.validated_tickets.length})</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedRequest.validated_tickets.map((t, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documentos Adjuntos por el Cliente</p>
                                        <span className="text-[11px] text-gray-400">Verifique la validez de cada archivo</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {/* INE / Pasaporte Card */}
                                        <div className={`p-4 rounded-xl border transition flex flex-col justify-between items-center text-center ${validatedDocs['ine'] ? 'border-green-500 bg-green-50/20 dark:border-green-600' : 'border-gray-200 dark:border-neutral-800 bg-gray-50/80 dark:bg-neutral-950 hover:bg-gray-100'}`}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreviewUrl(route('admin.refunds.requests.file', { refundRequest: selectedRequest.id, type: 'ine' }));
                                                    setPreviewTitle('INE / Pasaporte');
                                                }}
                                                className="w-full flex flex-col items-center group mb-2"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-2 group-hover:bg-[#c90000]/10 transition">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-gray-500 group-hover:text-[#c90000] transition">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">INE / Pasaporte</span>
                                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Ver Documento ↗</span>
                                            </button>
                                            <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-200/60 dark:border-neutral-800 w-full justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    checked={!!validatedDocs['ine']}
                                                    onChange={(e) => setValidatedDocs({ ...validatedDocs, ine: e.target.checked })}
                                                    className="rounded border-gray-350 text-green-600 focus:ring-green-500 h-4 w-4 cursor-pointer"
                                                />
                                                ¿INE Válido?
                                            </label>
                                        </div>

                                        {/* Tickets Cards */}
                                        {(() => {
                                            if (!selectedRequest.tickets_path) {
                                                return (
                                                    <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-950/40 opacity-50 flex flex-col items-center justify-center text-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 text-gray-400 mb-1">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="text-xs text-gray-400 font-medium">Sin Boletos Físicos</span>
                                                    </div>
                                                );
                                            }

                                            let parsedTickets = null;
                                            try {
                                                const parsed = JSON.parse(selectedRequest.tickets_path);
                                                if (typeof parsed === 'object' && parsed !== null) {
                                                    parsedTickets = parsed;
                                                }
                                            } catch (e) { }

                                            if (parsedTickets && typeof parsedTickets === 'object') {
                                                return Object.keys(parsedTickets).map(subId => {
                                                    const key = `ticket_${subId}`;
                                                    return (
                                                        <div key={subId} className={`p-4 rounded-xl border transition flex flex-col justify-between items-center text-center ${validatedDocs[key] ? 'border-green-500 bg-green-50/20 dark:border-green-600' : 'border-gray-200 dark:border-neutral-800 bg-gray-50/80 dark:bg-neutral-950 hover:bg-gray-100'}`}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setPreviewUrl(route('admin.refunds.requests.file', { refundRequest: selectedRequest.id, type: 'tickets', subId: subId }));
                                                                    setPreviewTitle(`Boleto ${subId}`);
                                                                }}
                                                                className="w-full flex flex-col items-center group mb-2"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-2 group-hover:bg-[#c90000]/10 transition">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-gray-500 group-hover:text-[#c90000] transition">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                                                                    </svg>
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Boleto {subId}</span>
                                                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Ver Boleto ↗</span>
                                                            </button>
                                                            <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-200/60 dark:border-neutral-800 w-full justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!validatedDocs[key]}
                                                                    onChange={(e) => setValidatedDocs({ ...validatedDocs, [key]: e.target.checked })}
                                                                    className="rounded border-gray-350 text-green-600 focus:ring-green-500 h-4 w-4 cursor-pointer"
                                                                />
                                                                ¿Boleto Válido?
                                                            </label>
                                                        </div>
                                                    );
                                                });
                                            }

                                            return (
                                                <div className={`p-4 rounded-xl border transition flex flex-col justify-between items-center text-center ${validatedDocs['tickets'] ? 'border-green-500 bg-green-50/20 dark:border-green-600' : 'border-gray-200 dark:border-neutral-800 bg-gray-50/80 dark:bg-neutral-950 hover:bg-gray-100'}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPreviewUrl(route('admin.refunds.requests.file', { refundRequest: selectedRequest.id, type: 'tickets' }));
                                                            setPreviewTitle('Boletos Físicos');
                                                        }}
                                                        className="w-full flex flex-col items-center group mb-2"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-2 group-hover:bg-[#c90000]/10 transition">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-gray-500 group-hover:text-[#c90000] transition">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Boletos Físicos</span>
                                                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Ver Boletos ↗</span>
                                                    </button>
                                                    <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-200/60 dark:border-neutral-800 w-full justify-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!validatedDocs['tickets']}
                                                            onChange={(e) => setValidatedDocs({ ...validatedDocs, tickets: e.target.checked })}
                                                            className="rounded border-gray-350 text-green-600 focus:ring-green-500 h-4 w-4 cursor-pointer"
                                                        />
                                                        ¿Boletos Válidos?
                                                    </label>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Dedicated Section: Admin Proof of Transfer Upload */}
                                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start sm:items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                                                    Comprobante de Pago del Reembolso
                                                </h3>
                                                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                                    Adjunte la transferencia realizada al cliente para autorizar el reembolso final.
                                                </p>
                                            </div>
                                        </div>

                                        {selectedRequest.proof_of_payment_path || proofFile ? (
                                            <div className="flex items-center gap-2 self-start sm:self-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (proofFile) {
                                                            setPreviewUrl(URL.createObjectURL(proofFile));
                                                            setPreviewTitle('Comprobante de Pago (Nuevo)');
                                                        } else {
                                                            setPreviewUrl(route('admin.refunds.requests.file', { refundRequest: selectedRequest.id, type: 'proof' }));
                                                            setPreviewTitle('Comprobante de Pago');
                                                        }
                                                    }}
                                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Ver Comprobante
                                                </button>
                                                <label className="px-3 py-2 bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 font-bold text-xs rounded-xl cursor-pointer transition">
                                                    Cambiar
                                                    <input
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                setProofFile(e.target.files[0]);
                                                                setValidatedDocs(prev => ({ ...prev, proof: true }));
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        ) : (
                                            <label className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                </svg>
                                                Subir Comprobante de Pago
                                                <input
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setProofFile(e.target.files[0]);
                                                            setValidatedDocs(prev => ({ ...prev, proof: true }));
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {proofFile && (
                                        <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Archivo seleccionado para guardar: <strong>{proofFile.name}</strong> ({(proofFile.size / 1024).toFixed(1)} KB)
                                        </div>
                                    )}
                                </div>

                                {/* Admin Notes + Actions */}
                                <div className="border-t border-gray-200 dark:border-neutral-800 pt-5">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas del Administrador</label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Motivo de rechazo, observaciones o comentarios internos..."
                                        className="w-full p-3 text-sm border border-gray-200 dark:border-neutral-800 rounded-xl bg-gray-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-[#c90000] mb-4 resize-none"
                                    />

                                    <div className="flex flex-wrap sm:justify-end gap-3 items-center">
                                        <Button onClick={handleCloseReview} variant="outline" disabled={loading} className="w-full sm:w-auto">
                                            Cancelar
                                        </Button>

                                        {(() => {
                                            const invalidList = getInvalidDocsList();
                                            const hasInvalid = invalidList.length > 0;

                                            if (hasInvalid) {
                                                return (
                                                    <Button
                                                        onClick={() => {
                                                            if (!adminNotes.trim()) {
                                                                alert("Por favor escribe en las Notas del Administrador qué documentos son inválidos y por qué.");
                                                                return;
                                                            }
                                                            handleUpdateStatus('rejected');
                                                        }}
                                                        disabled={loading}
                                                        className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
                                                    >
                                                        Solicitar Corrección ({invalidList.length})
                                                    </Button>
                                                );
                                            } else {
                                                return (
                                                    <Button
                                                        onClick={() => handleUpdateStatus('processing')}
                                                        disabled={loading}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                                                    >
                                                        Enviar a Contabilidad
                                                    </Button>
                                                );
                                            }
                                        })()}

                                        <Button
                                            onClick={() => {
                                                if (!adminNotes.trim()) {
                                                    alert("Por favor escribe en las Notas el motivo del rechazo definitivo.");
                                                    return;
                                                }
                                                if (confirm("¿Estás seguro de rechazar definitivamente esta solicitud? El cliente no podrá corregir los documentos.")) {
                                                    const allApproved: Record<string, boolean> = {};
                                                    if (selectedRequest?.ine_path) allApproved.ine = true;
                                                    if (selectedRequest?.proof_of_payment_path) allApproved.proof = true;
                                                    if (selectedRequest?.tickets_path) {
                                                        let parsed = null;
                                                        try {
                                                            parsed = JSON.parse(selectedRequest.tickets_path);
                                                        } catch (e) { }
                                                        if (parsed && typeof parsed === 'object') {
                                                            Object.keys(parsed).forEach(subId => {
                                                                allApproved['ticket_' + subId] = true;
                                                            });
                                                        } else {
                                                            allApproved.tickets = true;
                                                        }
                                                    }
                                                    setValidatedDocs(allApproved);
                                                    setTimeout(() => {
                                                        setLoading(true);
                                                        router.post(
                                                            route('admin.refunds.requests.status', { refundRequest: selectedRequest!.id }),
                                                            {
                                                                status: 'rejected',
                                                                admin_notes: adminNotes,
                                                                validated_documents: allApproved,
                                                            },
                                                            {
                                                                onSuccess: () => {
                                                                    handleCloseReview();
                                                                    setLoading(false);
                                                                },
                                                                onFinish: () => setLoading(false),
                                                            }
                                                        );
                                                    }, 100);
                                                }
                                            }}
                                            variant="destructive"
                                            disabled={loading}
                                            className="w-full sm:w-auto"
                                        >
                                            Rechazar Definitivamente
                                        </Button>

                                        {(() => {
                                            const hasProof = !!selectedRequest.proof_of_payment_path || !!proofFile;
                                            const canApprove = !loading && getInvalidDocsList().length === 0 && hasProof;

                                            return (
                                                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                                    {!hasProof && (
                                                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-1.5">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 text-amber-500 flex-shrink-0">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                                            </svg>
                                                            Adjunte comprobante de pago para aprobar
                                                        </span>
                                                    )}
                                                    <Button
                                                        onClick={() => handleUpdateStatus('approved')}
                                                        disabled={!canApprove}
                                                        className={`w-full sm:w-auto ${canApprove ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
                                                    >
                                                        Aprobar Reembolso
                                                    </Button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {/* LIGHTBOX OVERLAY FOR DOCUMENT PREVIEW */}
                {previewUrl && (
                    <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center p-4 z-[60] backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in-95">
                        <div className="w-full max-w-4xl bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col max-h-[85vh]">
                            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center text-white flex-wrap gap-4">
                                <span className="font-bold text-sm tracking-wide uppercase text-gray-300">{previewTitle}</span>

                                {/* Zoom controls */}
                                <div className="flex items-center gap-3 bg-red-700 px-3 py-1.5 rounded-xl border border-neutral-800">
                                    <span className="text-[10px] text-gray-355 font-bold uppercase tracking-wider select-none">Zoom:</span>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3"
                                        step="0.05"
                                        value={previewZoom}
                                        onChange={(e) => {
                                            const z = parseFloat(e.target.value);
                                            setPreviewZoom(z);
                                            if (z === 1) {
                                                setPanOffset({ x: 0, y: 0 });
                                            }
                                        }}
                                        className="w-24 md:w-36 h-1 bg-white/40 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: '#c90000' }}
                                    />
                                    <span className="text-[11px] font-mono text-gray-100 w-12 text-center select-none font-bold">
                                        {Math.round(previewZoom * 100)}%
                                    </span>
                                    <div className="w-[1px] h-4 bg-neutral-800 mx-1"></div>
                                    <button
                                        type="button"
                                        onClick={() => { setPreviewZoom(1); setPanOffset({ x: 0, y: 0 }); }}
                                        className="px-2 py-0.5 bg-red-700 hover:bg-neutral-750 text-gray-300 hover:text-white rounded-md text-[10px] font-bold transition focus:outline-none"
                                        title="Restablecer a tamaño original"
                                    >
                                        100%
                                    </button>
                                </div>

                                <button
                                    onClick={() => { setPreviewUrl(null); setPreviewZoom(1); setPanOffset({ x: 0, y: 0 }); setIsDragging(false); }}
                                    className="p-1.5 rounded-full hover:bg-neutral-800 text-gray-400 hover:text-white transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-grow overflow-auto p-8 flex items-center justify-center bg-neutral-950 select-none relative min-h-[40vh]">
                                <img
                                    src={previewUrl}
                                    alt={previewTitle}
                                    className="max-w-full max-h-[55vh] object-contain rounded-lg border border-neutral-800 shadow-lg origin-center"
                                    onMouseDown={(e) => {
                                        if (previewZoom <= 1) return;
                                        e.preventDefault();
                                        setIsDragging(true);
                                        setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                                    }}
                                    onMouseMove={(e) => {
                                        if (!isDragging) return;
                                        setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                                    }}
                                    onMouseUp={() => setIsDragging(false)}
                                    onMouseLeave={() => setIsDragging(false)}
                                    style={{
                                        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${previewZoom})`,
                                        transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                                        cursor: previewZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                        const parent = (e.target as HTMLElement).parentElement;
                                        if (parent && !parent.querySelector('.fallback-container')) {
                                            const fallback = document.createElement('div');
                                            fallback.className = 'text-center p-8 fallback-container';
                                            fallback.innerHTML = `
                                                <svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                </svg>
                                                <p class="text-sm text-gray-300 mb-4 font-semibold">El archivo no se puede previsualizar directamente (es PDF o documento).</p>
                                                <a href="${previewUrl}" target="_blank" class="inline-flex items-center gap-2 px-6 py-3 bg-[#c90000] hover:bg-[#a10000] text-white rounded-xl font-bold transition shadow-md">
                                                    Descargar / Abrir Archivo
                                                </a>
                                            `;
                                            parent.appendChild(fallback);
                                        }
                                    }}
                                />
                            </div>
                            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end gap-3">
                                <a
                                    href={previewUrl}
                                    download
                                    className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl font-bold text-xs transition border border-neutral-700"
                                >
                                    Descargar Archivo
                                </a>
                                <button
                                    onClick={() => { setPreviewUrl(null); setPreviewZoom(1); setPanOffset({ x: 0, y: 0 }); setIsDragging(false); }}
                                    className="px-5 py-2.5 bg-[#c90000] hover:bg-[#a10000] text-white rounded-xl font-bold text-xs transition"
                                >
                                    Cerrar Vista Previa
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

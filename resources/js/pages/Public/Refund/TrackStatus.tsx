import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { GeolocationProvider } from '@/contexts/GeolocationProvider';
import { Head, Link } from '@inertiajs/react';
import React, { useState } from 'react';

interface RefundEvent {
    id: number;
    title: string;
}

interface Props {
    events: RefundEvent[];
}

export default function TrackStatus({ events }: Props) {
    const [trackingId, setTrackingId] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [requestData, setRequestData] = useState<any | null>(null);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (code) {
                const cleanCode = code.trim();
                setTrackingId(cleanCode);

                const autoFetch = async () => {
                    setLoading(true);
                    setErrorMessage('');
                    setRequestData(null);
                    try {
                        const response = await fetch(
                            route('refund.track_status'),
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Accept: 'application/json',
                                    'X-CSRF-TOKEN':
                                        (
                                            document.querySelector(
                                                'meta[name="csrf-token"]',
                                            ) as HTMLMetaElement
                                        )?.content || '',
                                },
                                body: JSON.stringify({
                                    tracking_id: cleanCode,
                                }),
                            },
                        );
                        const data = await response.json();
                        if (!response.ok) {
                            setErrorMessage(
                                data.message ||
                                    'No se encontró ningún trámite registrado.',
                            );
                            return;
                        }
                        setRequestData(data);
                    } catch (err) {
                        setErrorMessage(
                            'Error de red al consultar el estatus.',
                        );
                    } finally {
                        setLoading(false);
                    }
                };
                autoFetch();
            }
        }
    }, []);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId.trim()) {
            setErrorMessage('Por favor ingrese su código de seguimiento.');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        setRequestData(null);

        try {
            const response = await fetch(route('refund.track_status'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
                body: JSON.stringify({
                    tracking_id: trackingId.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(
                    data.message || 'No se encontró ningún trámite registrado.',
                );
                setLoading(false);
                return;
            }

            setRequestData(data);
        } catch (err) {
            setErrorMessage(
                'Error de red al consultar el estatus. Intente nuevamente.',
            );
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'pending':
                return 1;
            case 'processing':
            case 'validation_banco_masivo':
                return 2;
            case 'approved':
            case 'rejected':
                return 3;
            default:
                return 1;
        }
    };

    return (
        <GeolocationProvider>
            <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900 dark:bg-[#121212] dark:text-gray-100">
                <Head title="Consultar Estatus de Reembolso - Boletea" />
                <PublicHeader />

                <main className="flex flex-grow items-center justify-center pt-28 pb-20">
                    <div className="container mx-auto max-w-xl px-4">
                        {/* Title Header */}
                        <div className="mb-8 text-center">
                            <span className="mb-3 inline-block rounded-full bg-[#c90000]/10 p-1.5 px-3 text-xs font-bold tracking-wide text-[#c90000] uppercase">
                                Seguimiento de Trámite
                            </span>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                Consultar Estatus
                            </h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Ingrese su código de seguimiento para conocer el
                                avance de su devolución.
                            </p>
                        </div>

                        {/* Card Container */}
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 backdrop-blur-sm md:p-8 dark:border-neutral-800 dark:bg-[#1e1e1e] dark:shadow-none">
                            {errorMessage && (
                                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Tracking Form */}
                            <form
                                onSubmit={handleTrack}
                                className="mb-8 space-y-5"
                            >
                                <div>
                                    <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                        Código de Seguimiento
                                    </label>
                                    <input
                                        type="text"
                                        value={trackingId}
                                        onChange={(e) =>
                                            setTrackingId(e.target.value)
                                        }
                                        placeholder="Ej: REF-A1B2C3D4"
                                        required
                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center font-mono text-lg font-bold tracking-widest uppercase transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="animate-pulse-subtle w-full rounded-2xl bg-gray-900 p-4 font-bold text-white transition hover:bg-black disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                                >
                                    {loading
                                        ? 'Consultando...'
                                        : 'Buscar Trámite'}
                                </button>
                            </form>

                            {/* Tracking Results Area */}
                            {requestData && (
                                <div className="space-y-6 border-t border-gray-100 pt-6 dark:border-neutral-800">
                                    <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">
                                                Beneficiario:
                                            </span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                                {requestData.buyer_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">
                                                Evento:
                                            </span>
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                {requestData.event_title}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">
                                                Orden de Compra:
                                            </span>
                                            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                                                #{requestData.order_number}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">
                                                Registrado el:
                                            </span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {new Date(
                                                    requestData.created_at,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="relative py-4">
                                        <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-100 dark:bg-neutral-800"></div>

                                        <div className="relative space-y-8">
                                            {/* Step 1: Pending */}
                                            <div className="flex items-start space-x-4 pl-2">
                                                <div
                                                    className={`h-4 w-4 rounded-full border-4 ${getStatusStep(requestData.status) >= 1 ? 'dark:border-green-955 border-green-200 bg-green-500' : 'border-gray-100 bg-gray-200 dark:border-neutral-900 dark:bg-neutral-800'} z-10`}
                                                ></div>
                                                <div>
                                                    <h3 className="text-sm font-bold">
                                                        Solicitud Recibida
                                                    </h3>
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        Su documentación se
                                                        encuentra en nuestra
                                                        base de datos.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Step 2: Processing */}
                                            <div className="flex items-start space-x-4 pl-2">
                                                <div
                                                    className={`h-4 w-4 rounded-full border-4 ${getStatusStep(requestData.status) >= 2 ? 'dark:border-blue-955 border-blue-200 bg-blue-500' : 'border-gray-100 bg-gray-200 dark:border-neutral-900 dark:bg-neutral-800'} z-10`}
                                                ></div>
                                                <div>
                                                    <h3 className="text-sm font-bold">
                                                        {requestData.status ===
                                                        'validation_banco_masivo'
                                                            ? 'En Trámite (Validación Banco)'
                                                            : 'En Trámite / Revisión'}
                                                    </h3>
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {requestData.status ===
                                                        'validation_banco_masivo'
                                                            ? 'Documentos validados. En espera de confirmación de transferencia.'
                                                            : 'Validando documentos y cuentas bancarias.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Step 3: Decision */}
                                            <div className="flex items-start space-x-4 pl-2">
                                                <div
                                                    className={`h-4 w-4 rounded-full border-4 ${getStatusStep(requestData.status) >= 3 ? (requestData.status === 'approved' ? 'border-green-200 bg-green-500 dark:border-green-950' : 'border-red-200 bg-red-500 dark:border-red-950') : 'border-gray-100 bg-gray-200 dark:border-neutral-900 dark:bg-neutral-800'} z-10`}
                                                ></div>
                                                <div>
                                                    <h3 className="text-sm font-bold">
                                                        {requestData.status ===
                                                        'approved'
                                                            ? 'Reembolso Aprobado'
                                                            : requestData.status ===
                                                                'rejected'
                                                              ? 'Solicitud Rechazada'
                                                              : 'Resolución final'}
                                                    </h3>
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {requestData.status ===
                                                        'approved'
                                                            ? 'La transferencia interbancaria se ha ordenado.'
                                                            : requestData.status ===
                                                                'rejected'
                                                              ? 'Revisión finalizada con aclaración.'
                                                              : 'Pendiente de concluir validación.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin notes if any */}
                                    {requestData.admin_notes && (
                                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
                                            <span className="mb-1 block font-bold text-amber-800 dark:text-amber-400">
                                                Notas administrativas:
                                            </span>
                                            <p className="text-amber-700 italic dark:text-amber-300">
                                                "{requestData.admin_notes}"
                                            </p>
                                        </div>
                                    )}

                                    {requestData.status === 'rejected' && (
                                        <div className="pt-2 text-center text-xs">
                                            ¿Necesita corregir su trámite?{' '}
                                            <Link
                                                href="/reembolsos"
                                                className="font-bold text-[#c90000] hover:underline"
                                            >
                                                Iniciar nueva solicitud
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <PublicFooter />
            </div>
        </GeolocationProvider>
    );
}

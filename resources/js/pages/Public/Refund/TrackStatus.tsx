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
                        const response = await fetch(route('refund.track_status'), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                            },
                            body: JSON.stringify({
                                tracking_id: cleanCode,
                            }),
                        });
                        const data = await response.json();
                        if (!response.ok) {
                            setErrorMessage(data.message || 'No se encontró ningún trámite registrado.');
                            return;
                        }
                        setRequestData(data);
                    } catch (err) {
                        setErrorMessage('Error de red al consultar el estatus.');
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
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    tracking_id: trackingId.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.message || 'No se encontró ningún trámite registrado.');
                setLoading(false);
                return;
            }

            setRequestData(data);
        } catch (err) {
            setErrorMessage('Error de red al consultar el estatus. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'pending': return 1;
            case 'processing': return 2;
            case 'approved':
            case 'rejected': return 3;
            default: return 1;
        }
    };

    return (
        <GeolocationProvider>
            <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-gray-100 font-sans flex flex-col">
                <Head title="Consultar Estatus de Reembolso - Boletea" />
                <PublicHeader />

                <main className="pt-28 pb-20 flex-grow flex items-center justify-center">
                    <div className="container mx-auto px-4 max-w-xl">
                        {/* Title Header */}
                        <div className="text-center mb-8">
                            <span className="inline-block p-1.5 px-3 rounded-full bg-[#c90000]/10 text-[#c90000] text-xs font-bold tracking-wide uppercase mb-3">
                                Seguimiento de Trámite
                            </span>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                Consultar Estatus
                            </h1>
                            <p className="text-sm text-gray-500 mt-2">
                                Ingrese su código de seguimiento para conocer el avance de su devolución.
                            </p>
                        </div>

                        {/* Card Container */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-6 md:p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-neutral-800 backdrop-blur-sm">
                            
                            {errorMessage && (
                                <div className="p-4 mb-6 rounded-2xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Tracking Form */}
                            <form onSubmit={handleTrack} className="space-y-5 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Código de Seguimiento
                                    </label>
                                    <input
                                        type="text"
                                        value={trackingId}
                                        onChange={(e) => setTrackingId(e.target.value)}
                                        placeholder="Ej: REF-A1B2C3D4"
                                        required
                                        className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition text-center font-mono text-lg font-bold tracking-widest uppercase"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full p-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-2xl font-bold transition disabled:opacity-50 animate-pulse-subtle"
                                >
                                    {loading ? 'Consultando...' : 'Buscar Trámite'}
                                </button>
                            </form>

                            {/* Tracking Results Area */}
                            {requestData && (
                                <div className="pt-6 border-t border-gray-100 dark:border-neutral-800 space-y-6">
                                    <div className="bg-gray-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 text-xs space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Beneficiario:</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{requestData.buyer_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Evento:</span>
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">{requestData.event_title}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Orden de Compra:</span>
                                            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">#{requestData.order_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Registrado el:</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{new Date(requestData.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="relative py-4">
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-neutral-800"></div>

                                        <div className="space-y-8 relative">
                                            {/* Step 1: Pending */}
                                            <div className="flex items-start space-x-4 pl-2">
                                                <div className={`w-4 h-4 rounded-full border-4 ${getStatusStep(requestData.status) >= 1 ? 'bg-green-500 border-green-200 dark:border-green-950' : 'bg-gray-200 border-gray-100 dark:bg-neutral-800 dark:border-neutral-900'} z-10`}></div>
                                                <div>
                                                    <h3 className="text-sm font-bold">Solicitud Recibida</h3>
                                                    <p className="text-xs text-gray-400 mt-0.5">Su documentación se encuentra en nuestra base de datos.</p>
                                                </div>
                                            </div>

                                            {/* Step 2: Processing */}
                                            <div className="flex items-start space-x-4 pl-2">
                                                <div className={`w-4 h-4 rounded-full border-4 ${getStatusStep(requestData.status) >= 2 ? 'bg-blue-500 border-blue-200 dark:border-blue-950' : 'bg-gray-200 border-gray-100 dark:bg-neutral-800 dark:border-neutral-900'} z-10`}></div>
                                                <div>
                                                    <h3 className="text-sm font-bold">En Trámite / Revisión</h3>
                                                    <p className="text-xs text-gray-400 mt-0.5">Validando documentos y cuentas bancarias.</p>
                                                </div>
                                            </div>

                                            {/* Step 3: Decision */}
                                            <div className="flex items-start space-x-4 pl-2">
                                                <div className={`w-4 h-4 rounded-full border-4 ${getStatusStep(requestData.status) >= 3 ? (requestData.status === 'approved' ? 'bg-green-500 border-green-200 dark:border-green-950' : 'bg-red-500 border-red-200 dark:border-red-950') : 'bg-gray-200 border-gray-100 dark:bg-neutral-800 dark:border-neutral-900'} z-10`}></div>
                                                <div>
                                                    <h3 className="text-sm font-bold">
                                                        {requestData.status === 'approved' ? 'Reembolso Aprobado' : requestData.status === 'rejected' ? 'Solicitud Rechazada' : 'Resolución final'}
                                                    </h3>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {requestData.status === 'approved' ? 'La transferencia interbancaria se ha ordenado.' : requestData.status === 'rejected' ? 'Revisión finalizada con aclaración.' : 'Pendiente de concluir validación.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admin notes if any */}
                                    {requestData.admin_notes && (
                                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-xs border border-amber-100 dark:border-amber-900/50">
                                            <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">Notas administrativas:</span>
                                            <p className="text-amber-700 dark:text-amber-300 italic">"{requestData.admin_notes}"</p>
                                        </div>
                                    )}

                                    {requestData.status === 'rejected' && (
                                        <div className="text-center pt-2 text-xs">
                                            ¿Necesita corregir su trámite?{' '}
                                            <Link href="/reembolsos" className="text-[#c90000] font-bold hover:underline">
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

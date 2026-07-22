import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import RefundFaqSection from '@/components/RefundFaqSection';
import { GeolocationProvider } from '@/contexts/GeolocationProvider';
import { Head, Link } from '@inertiajs/react';
import React from 'react';

interface Props {
    order_number: string;
    tracking_id?: string;
}

export default function Success({ order_number, tracking_id }: Props) {
    return (
        <GeolocationProvider>
            <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-gray-100 font-sans flex flex-col">
                <Head title="Solicitud Enviada - Boletea" />
                <PublicHeader />

                <main className="pt-28 pb-20 flex-grow flex items-center justify-center">
                    <div className="container mx-auto px-4 max-w-3xl text-center space-y-12">
                        <div className="bg-white dark:bg-[#1e1e1e] p-8 md:p-12 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-neutral-800 backdrop-blur-sm max-w-lg mx-auto">
                            
                            {/* Checkmark Circle */}
                            <div className="w-20 h-20 bg-green-50 dark:bg-green-950/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100 dark:border-green-900/50">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-10 h-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>

                            <span className="inline-block p-1.5 px-3 rounded-full bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs font-bold tracking-wide uppercase mb-3">
                                ¡Éxito!
                            </span>

                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                                Solicitud Registrada
                            </h1>

                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                                Su solicitud de reembolso para la orden <strong className="text-gray-900 dark:text-white">#{order_number}</strong> ha sido recibida correctamente en nuestro sistema.
                            </p>

                            {tracking_id && (
                                <div className="p-4 mb-6 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-center">
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                                        Código de Seguimiento Único
                                    </p>
                                    <p className="text-2xl font-mono font-black text-[#c90000] tracking-widest select-all">
                                        {tracking_id}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Guarde este código para consultar el estatus de su trámite en línea.
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 rounded-2xl text-left text-xs text-amber-900 dark:text-amber-300 space-y-2 border border-amber-200/80 dark:border-amber-900/50 mb-8">
                                <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200 mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-amber-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                    <span>Recomendaciones Importantes:</span>
                                </div>
                                <p>• <strong>Manténgase al pendiente de su correo electrónico:</strong> Si algún documento o dato requiere corrección, le enviaremos un enlace seguro a su correo.</p>
                                <p>• <strong>Revise su carpeta de Spam / No deseados:</strong> Asegúrese de que nuestras notificaciones no sean desviadas.</p>
                                <p>• <strong>No genere solicitudes duplicadas:</strong> En caso de correcciones, utilice únicamente el enlace recibido por correo.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                {tracking_id && (
                                    <Link
                                        href={`/reembolsos/estatus?code=${tracking_id}`}
                                        className="w-full p-3.5 bg-[#c90000] hover:bg-[#a00000] text-white rounded-2xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
                                    >
                                        <span>Consultar Estatus en Línea</span>
                                    </Link>
                                )}
                                <Link
                                    href="/"
                                    className="w-full p-3.5 bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 rounded-2xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
                                >
                                    <span>Volver al Inicio</span>
                                </Link>
                            </div>
                        </div>

                        {/* FAQs component for post-submission guidance */}
                        <RefundFaqSection
                            title="¿Qué sucede ahora? - Preguntas Frecuentes"
                            subtitle="Resolución de dudas sobre los siguientes pasos de su trámite, revisiones y depósitos."
                            className="text-left"
                        />
                    </div>
                </main>

                <PublicFooter />
            </div>
        </GeolocationProvider>
    );
}

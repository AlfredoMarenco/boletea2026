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
            <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900 dark:bg-[#121212] dark:text-gray-100">
                <Head title="Solicitud Enviada - Boletea" />
                <PublicHeader />

                <main className="flex flex-grow items-center justify-center pt-28 pb-20">
                    <div className="container mx-auto max-w-3xl space-y-12 px-4 text-center">
                        <div className="mx-auto max-w-lg rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm md:p-12 dark:border-neutral-800 dark:bg-[#1e1e1e] dark:shadow-none">
                            {/* Checkmark Circle */}
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-500 dark:border-green-900/50 dark:bg-green-950/20">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="2.5"
                                    stroke="currentColor"
                                    className="h-10 w-10"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.5 12.75l6 6 9-13.5"
                                    />
                                </svg>
                            </div>

                            <span className="mb-3 inline-block rounded-full bg-green-50 p-1.5 px-3 text-xs font-bold tracking-wide text-green-600 uppercase dark:bg-green-950/20 dark:text-green-400">
                                ¡Éxito!
                            </span>

                            <h1 className="mb-4 text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                Solicitud Registrada
                            </h1>

                            <p className="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                Su solicitud de reembolso para la orden{' '}
                                <strong className="text-gray-900 dark:text-white">
                                    #{order_number}
                                </strong>{' '}
                                ha sido recibida correctamente en nuestro
                                sistema.
                            </p>

                            {tracking_id && (
                                <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center dark:border-neutral-800 dark:bg-neutral-900">
                                    <p className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                                        Código de Seguimiento Único
                                    </p>
                                    <p className="font-mono text-2xl font-black tracking-widest text-[#c90000] select-all">
                                        {tracking_id}
                                    </p>
                                    <p className="mt-1 text-[10px] text-gray-400">
                                        Guarde este código para consultar el
                                        estatus de su trámite en línea.
                                    </p>
                                </div>
                            )}

                            <div className="mb-8 space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-left text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                                <div className="mb-1 flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                        stroke="currentColor"
                                        className="h-4 w-4 text-amber-600"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                        />
                                    </svg>
                                    <span>Recomendaciones Importantes:</span>
                                </div>
                                <p>
                                    •{' '}
                                    <strong>
                                        Manténgase al pendiente de su correo
                                        electrónico:
                                    </strong>{' '}
                                    Si algún documento o dato requiere
                                    corrección, le enviaremos un enlace seguro a
                                    su correo.
                                </p>
                                <p>
                                    •{' '}
                                    <strong>
                                        Revise su carpeta de Spam / No deseados:
                                    </strong>{' '}
                                    Asegúrese de que nuestras notificaciones no
                                    sean desviadas.
                                </p>
                                <p>
                                    •{' '}
                                    <strong>
                                        No genere solicitudes duplicadas:
                                    </strong>{' '}
                                    En caso de correcciones, utilice únicamente
                                    el enlace recibido por correo.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                {tracking_id && (
                                    <Link
                                        href={`/reembolsos/estatus?code=${tracking_id}`}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c90000] p-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#a00000]"
                                    >
                                        <span>Consultar Estatus en Línea</span>
                                    </Link>
                                )}
                                <Link
                                    href="/"
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 p-3.5 text-xs font-bold text-white shadow-md transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
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

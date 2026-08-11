import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

export interface FaqItem {
    id: string;
    question: string;
    answer: string;
    category?: 'tramite' | 'documentos' | 'tiempos' | 'seguimiento';
    highlight?: boolean;
}

const defaultFaqs: FaqItem[] = [
    {
        id: 'faq-next-steps',
        question: '¿Qué sucede después de enviar mi solicitud de reembolso?',
        answer: 'Su solicitud entra inmediatamente en revisión por nuestro equipo administrativo. Es muy importante que permanezca al pendiente de su correo electrónico (incluyendo la carpeta de spam o correo no deseado), ya que allí le notificaremos cualquier cambio de estatus, confirmación o aviso en caso de requerirse alguna corrección.',
        category: 'tramite',
        highlight: true,
    },
    {
        id: 'faq-corrections',
        question:
            '¿Qué debo hacer si rechazan alguno de mis documentos o la cuenta CLABE?',
        answer: 'Si un documento (INE, comprobante de pago, foto de boleto) o dato bancario resulta ilegible o inconsistente, recibirá un correo con un enlace seguro de corrección directo (válido por 48 horas). Al dar clic, podrá actualizar únicamente los campos solicitados sin necesidad de crear una nueva solicitud ni volver a llenar todo el formulario.',
        category: 'documentos',
        highlight: true,
    },
    {
        id: 'faq-duplicates',
        question:
            '¿Puedo ingresar un nuevo trámite si mi solicitud ya está en proceso o en corrección?',
        answer: 'No. El sistema detecta automáticamente si su orden de compra o boletos ya cuentan con un trámite activo o pendiente de corrección para prevenir solicitudes duplicadas. Si su trámite requiere actualizar algún documento, debe realizarlo únicamente a través del enlace enviado a su correo electrónico.',
        category: 'tramite',
        highlight: true,
    },
    {
        id: 'faq-timeline',
        question: '¿Cuánto tiempo tarda en acreditarse mi reembolso?',
        answer: 'Una vez que toda la información y documentos son verificados y aprobados por administración, la transferencia interbancaria se programa a la cuenta CLABE registrada a nombre del comprador. El depósito se refleja habitualmente en un lapso de 15 a 30 días hábiles posteriores a la aprobación, dependiendo del tiempo de procesamiento de cada banco.',
        category: 'tiempos',
    },
    {
        id: 'faq-tracking',
        question:
            '¿Cómo puedo consultar el estatus de mi trámite en tiempo real?',
        answer: 'Al finalizar el registro de su solicitud se genera un Código de Seguimiento Único (ejemplo: REF-123456). Con este código y su número de orden puede ingresar en cualquier momento a nuestra sección pública de Seguimiento de Reembolso (/reembolsos/estatus) para consultar el avance.',
        category: 'seguimiento',
    },
    {
        id: 'faq-web-card',
        question:
            '¿Qué pasa si mi compra fue realizada con tarjeta a través de la página web?',
        answer: 'Si el evento cuenta con trámite automático para compras web con tarjeta, el reembolso se procesa directamente a la misma tarjeta de compra en un lapso de 5 a 10 días hábiles sin necesidad de subir documentos. Si el evento requiere validación manual, el sistema le solicitará verificar su correo electrónico registrado y los últimos 4 dígitos de la tarjeta utilizada.',
        category: 'tramite',
    },
    {
        id: 'faq-contact',
        question:
            '¿Qué puedo hacer si tengo dudas adicionales sobre mi reembolso?',
        answer: 'Puede comunicarse directamente con nuestro equipo de atención al cliente vía WhatsApp al 871 102 4187 con su número de orden o código de seguimiento a la mano.',
        category: 'seguimiento',
    },
];

interface Props {
    title?: string;
    subtitle?: string;
    className?: string;
    faqs?: FaqItem[];
    showContactBanner?: boolean;
}

export default function RefundFaqSection({
    title = 'Preguntas Frecuentes y Guía de Trámite',
    subtitle = 'Resuelva de manera rápida sus dudas sobre el proceso de verificación, corrección de documentos y tiempos de reembolso.',
    className = '',
    faqs = defaultFaqs,
    showContactBanner = true,
}: Props) {
    const [openIds, setOpenIds] = useState<string[]>([
        'faq-next-steps',
        'faq-corrections',
    ]);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleFaq = (id: string) => {
        setOpenIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    };

    const filteredFaqs = faqs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className={`mx-auto w-full max-w-4xl ${className}`}>
            {/* Section Header */}
            <div className="mb-8 text-center">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold tracking-wider text-[#c90000] uppercase dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="h-3.5 w-3.5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                        />
                    </svg>
                    Centro de Ayuda Reembolsos
                </span>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl dark:text-white">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {subtitle}
                    </p>
                )}

                {/* Quick Search */}
                {faqs.length > 4 && (
                    <div className="relative mx-auto mt-5 max-w-md">
                        <input
                            type="text"
                            placeholder="Buscar en preguntas frecuentes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 pl-10 text-xs text-gray-900 placeholder-gray-400 shadow-xs transition focus:border-transparent focus:ring-2 focus:ring-[#c90000] focus:outline-none md:text-sm dark:border-neutral-800 dark:bg-[#1e1e1e] dark:text-white"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            className="absolute top-3 left-3.5 h-4 w-4 text-gray-400"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                            />
                        </svg>
                    </div>
                )}
            </div>

            {/* Accordion Container */}
            <div className="space-y-3.5">
                {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq) => {
                        const isOpen = openIds.includes(faq.id);
                        return (
                            <div
                                key={faq.id}
                                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                                    isOpen
                                        ? 'border-gray-300 bg-white shadow-md shadow-gray-200/40 dark:border-neutral-700 dark:bg-[#1e1e1e] dark:shadow-none'
                                        : 'border-gray-200/80 bg-white/80 hover:border-gray-300 dark:border-neutral-800 dark:bg-[#1a1a1a] dark:hover:border-neutral-700'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleFaq(faq.id)}
                                    className="group flex w-full items-start justify-between gap-4 p-4 text-left focus:outline-none md:p-5"
                                    aria-expanded={isOpen}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                                isOpen
                                                    ? 'bg-red-50 text-[#c90000] dark:bg-red-950/50 dark:text-red-400'
                                                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:group-hover:bg-neutral-700'
                                            }`}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="2.5"
                                                stroke="currentColor"
                                                className="h-3.5 w-3.5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="block text-sm leading-snug font-bold tracking-tight text-gray-900 md:text-base dark:text-white">
                                                {faq.question}
                                            </span>
                                            {faq.highlight && (
                                                <span className="mt-1 inline-block rounded border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-amber-700 uppercase dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
                                                    Importante
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={`mt-0.5 shrink-0 rounded-full p-1 text-gray-400 transition-transform duration-200 ${
                                            isOpen
                                                ? 'rotate-180 text-[#c90000] dark:text-red-400'
                                                : ''
                                        }`}
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
                                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                            />
                                        </svg>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="border-t border-gray-100 px-4 pt-3 pb-5 pl-13 text-xs leading-relaxed text-gray-600 md:px-5 md:pb-6 md:pl-14 md:text-sm dark:border-neutral-800/60 dark:text-gray-300">
                                        {faq.answer.includes(
                                            '/reembolsos/estatus',
                                        ) ? (
                                            <p>
                                                {
                                                    faq.answer.split(
                                                        '/reembolsos/estatus',
                                                    )[0]
                                                }
                                                <Link
                                                    href="/reembolsos/estatus"
                                                    className="font-bold text-[#c90000] underline transition hover:text-black dark:text-red-400 dark:hover:text-white"
                                                >
                                                    Seguimiento de Reembolso
                                                </Link>
                                                {
                                                    faq.answer.split(
                                                        '/reembolsos/estatus',
                                                    )[1]
                                                }
                                            </p>
                                        ) : (
                                            <p>{faq.answer}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-[#1e1e1e]">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No se encontraron preguntas que coincidan con la
                            búsqueda.
                        </p>
                    </div>
                )}
            </div>

            {/* Optional Contact Banner */}
            {showContactBanner && (
                <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black p-5 text-white shadow-xl md:flex-row md:p-6 dark:from-neutral-900 dark:to-neutral-950">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                className="h-6 w-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.596.596 0 01-.68-.686.598.598 0 01.122-.29 5.975 5.975 0 00.916-2.544C4.305 16.05 3 14.154 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white md:text-base">
                                ¿Necesita asistencia personalizada con su
                                trámite?
                            </h4>
                            <p className="mt-0.5 text-xs text-gray-400">
                                Nuestro equipo de soporte por WhatsApp le
                                atenderá con su número de orden.
                            </p>
                        </div>
                    </div>
                    <a
                        href="https://wa.me/528711024187?text=Hola,%20necesito%20asistencia%20con%20mi%20tramite%20de%20reembolso"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500"
                    >
                        <span>Contactar por WhatsApp</span>
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
                                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                            />
                        </svg>
                    </a>
                </div>
            )}
        </div>
    );
}

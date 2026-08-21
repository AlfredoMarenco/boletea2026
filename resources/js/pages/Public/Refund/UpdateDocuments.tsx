import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { GeolocationProvider } from '@/contexts/GeolocationProvider';
import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface Bank {
    id: number;
    code: string;
    name: string;
    enabled: boolean;
}

interface RefundRequestData {
    id: number;
    order_number: string;
    buyer_name: string;
    clabe?: string;
    bank_name?: string;
    admin_notes: string | null;
    tracking_id: string;
    invalid_documents: string[];
    requires_card_confirmation?: boolean;
}

interface Props {
    refundRequest: RefundRequestData;
    banks?: Bank[];
}

export default function UpdateDocuments({ refundRequest, banks }: Props) {
    const { data, setData, post, processing, errors } = useForm<
        Record<string, any>
    >(() => {
        const initialForm: Record<string, any> = {};
        if (refundRequest.requires_card_confirmation) {
            initialForm.card_last_four = '';
        }
        if (refundRequest.invalid_documents.includes('clabe')) {
            initialForm.clabe = '';
            initialForm.bank_name = '';
        }
        refundRequest.invalid_documents.forEach((docKey) => {
            if (docKey === 'ine') initialForm.ine = null;
            else if (docKey === 'proof') initialForm.proof = null;
            else if (docKey === 'tickets') initialForm.tickets = null;
            else if (docKey.startsWith('ticket_')) {
                const subId = docKey.substring(7);
                initialForm[`ticket_photo_${subId}`] = null;
                initialForm[`ticket_id_${subId}`] = '';
            }
        });
        return initialForm;
    });

    const handleFileChange = (key: string, file: File | null) => {
        setData(key, file);
    };

    const [confirmClabe, setConfirmClabe] = useState('');
    const [clabeMatchError, setClabeMatchError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (refundRequest.invalid_documents.includes('clabe')) {
            if (data.clabe !== confirmClabe) {
                setClabeMatchError(
                    'La CLABE interbancaria y su confirmación no coinciden. Por favor verifique.',
                );
                return;
            }
            setClabeMatchError('');
        }

        // Post to the current URL which has the signed signature
        post(window.location.href, {
            forceFormData: true,
        });
    };

    const getDocLabel = (docKey: string) => {
        if (docKey === 'clabe') return 'Cuenta CLABE Interbancaria';
        if (docKey === 'ine') return 'Identificación Oficial (INE / Pasaporte)';
        if (docKey === 'proof') return 'Comprobante de Pago';
        if (docKey === 'tickets') return 'Boletos Físicos';
        if (docKey.startsWith('ticket_')) {
            const subId = docKey.substring(7);
            return `Foto de Boleto #${subId}`;
        }
        return docKey;
    };

    return (
        <GeolocationProvider>
            <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900 dark:bg-[#121212] dark:text-gray-100">
                <Head title="Corregir Documentación - Boletea" />
                <PublicHeader />

                <main className="flex flex-grow items-center justify-center pt-28 pb-20">
                    <div className="container mx-auto max-w-xl px-4">
                        {/* Title Header */}
                        <div className="mb-8 text-center">
                            <span className="mb-3 inline-block rounded-full bg-[#c90000]/10 p-1.5 px-3 text-xs font-bold tracking-wide text-[#c90000] uppercase">
                                Acción Requerida
                            </span>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                Corregir Datos / Documentos
                            </h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Ingrese la información solicitada o suba los
                                nuevos documentos para continuar con su trámite.
                            </p>
                        </div>

                        {/* Card Container */}
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 backdrop-blur-sm md:p-8 dark:border-neutral-800 dark:bg-[#1e1e1e] dark:shadow-none">
                            {/* Admin Notes / Explanatory Box */}
                            {refundRequest.admin_notes && (
                                <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-300">
                                    <h4 className="mb-1 text-xs font-bold tracking-wider uppercase">
                                        Notas del Administrador:
                                    </h4>
                                    <p className="text-sm italic">
                                        "{refundRequest.admin_notes}"
                                    </p>
                                </div>
                            )}

                            {/* Mandatory Security Box for Card Last 4 Digits */}
                            {refundRequest.requires_card_confirmation && (
                                <div className="mb-6 space-y-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300">
                                    <div className="flex items-center gap-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="2"
                                            stroke="currentColor"
                                            className="h-5 w-5 text-blue-600 dark:text-blue-400"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                            />
                                        </svg>
                                        <h4 className="text-xs font-bold tracking-wider uppercase">
                                            Verificación de Seguridad
                                            Obligatoria:
                                        </h4>
                                    </div>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Por motivos de seguridad, confirme los
                                        últimos 4 dígitos de la tarjeta
                                        utilizada para la compra:
                                    </p>
                                    <div>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            required
                                            placeholder="Últimos 4 dígitos de tarjeta"
                                            value={data.card_last_four || ''}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 4);
                                                setData('card_last_four', val);
                                            }}
                                            className="w-full rounded-xl border border-blue-200 bg-white px-3.5 py-2.5 font-mono text-sm font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-blue-800 dark:bg-neutral-900"
                                        />
                                        {errors.card_last_four && (
                                            <p className="mt-1 text-xs font-medium text-red-500">
                                                {errors.card_last_four}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500 dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="mb-1.5 flex justify-between">
                                    <span className="font-semibold text-gray-400">
                                        Cliente:
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {refundRequest.buyer_name}
                                    </span>
                                </div>
                                <div className="mb-1.5 flex justify-between">
                                    <span className="font-semibold text-gray-400">
                                        Orden de Compra:
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        #{refundRequest.order_number}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-400">
                                        Código de Seguimiento:
                                    </span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {refundRequest.tracking_id}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* CLABE Correction Inputs */}
                                {refundRequest.invalid_documents.includes(
                                    'clabe',
                                ) && (
                                    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                                            <h3 className="text-xs font-bold tracking-wider text-amber-900 uppercase dark:text-amber-300">
                                                Actualizar CLABE Interbancaria y
                                                Banco
                                            </h3>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Nueva CLABE Interbancaria (18
                                                dígitos){' '}
                                                <span className="text-[#c90000]">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={18}
                                                required
                                                value={data.clabe || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                        .replace(/\D/g, '')
                                                        .slice(0, 18);
                                                    setData('clabe', val);

                                                    // Auto detect bank by 3-digit prefix
                                                    if (
                                                        val.length >= 3 &&
                                                        banks &&
                                                        banks.length > 0
                                                    ) {
                                                        const prefix =
                                                            val.slice(0, 3);
                                                        const matchedBank =
                                                            banks.find(
                                                                (b) =>
                                                                    b.code ===
                                                                    prefix,
                                                            );
                                                        if (matchedBank) {
                                                            setData(
                                                                'bank_name',
                                                                matchedBank.name,
                                                            );
                                                        }
                                                    }
                                                }}
                                                onCopy={(e) =>
                                                    e.preventDefault()
                                                }
                                                onPaste={(e) =>
                                                    e.preventDefault()
                                                }
                                                onCut={(e) =>
                                                    e.preventDefault()
                                                }
                                                onDrag={(e) =>
                                                    e.preventDefault()
                                                }
                                                onDrop={(e) =>
                                                    e.preventDefault()
                                                }
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 font-mono text-sm tracking-wider focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                                                placeholder="012345678901234567"
                                            />
                                            {errors.clabe && (
                                                <p className="mt-1 text-xs font-medium text-red-500">
                                                    {errors.clabe}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Confirmar Nueva CLABE
                                                Interbancaria (18 dígitos){' '}
                                                <span className="text-[#c90000]">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={18}
                                                required
                                                value={confirmClabe}
                                                onChange={(e) =>
                                                    setConfirmClabe(
                                                        e.target.value
                                                            .replace(/\D/g, '')
                                                            .slice(0, 18),
                                                    )
                                                }
                                                onCopy={(e) =>
                                                    e.preventDefault()
                                                }
                                                onPaste={(e) =>
                                                    e.preventDefault()
                                                }
                                                onCut={(e) =>
                                                    e.preventDefault()
                                                }
                                                onDrag={(e) =>
                                                    e.preventDefault()
                                                }
                                                onDrop={(e) =>
                                                    e.preventDefault()
                                                }
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 font-mono text-sm tracking-wider focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                                                placeholder="012345678901234567"
                                            />
                                            {clabeMatchError && (
                                                <p className="mt-1 text-xs font-medium text-red-500">
                                                    {clabeMatchError}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Banco de Destino{' '}
                                                <span className="text-[#c90000]">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                required
                                                value={data.bank_name || ''}
                                                onChange={(e) =>
                                                    setData(
                                                        'bank_name',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                                            >
                                                <option value="">
                                                    Seleccione su banco
                                                </option>
                                                {banks?.map((b) => (
                                                    <option
                                                        key={b.id}
                                                        value={b.name}
                                                        disabled={!b.enabled}
                                                    >
                                                        {b.name}{' '}
                                                        {!b.enabled
                                                            ? '(No Habilitado)'
                                                            : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.bank_name && (
                                                <p className="mt-1 text-xs font-medium text-red-500">
                                                {errors.bank_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* File Upload inputs for other invalid docs */}
                                {refundRequest.invalid_documents
                                    .filter((d) => d !== 'clabe')
                                    .map((docKey) => {
                                        const isTicketItem = docKey.startsWith('ticket_');
                                        const subId = isTicketItem ? docKey.substring(7) : null;
                                        const photoKey = isTicketItem ? `ticket_photo_${subId}` : docKey;
                                        const idKey = isTicketItem ? `ticket_id_${subId}` : null;

                                        return (
                                            <div
                                                key={docKey}
                                                className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                                            >
                                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
                                                    {getDocLabel(docKey)}{' '}
                                                    <span className="text-[#c90000]">
                                                        *
                                                    </span>
                                                </label>

                                                {isTicketItem && idKey && (
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                            Folio / Código de Barras / ID del Boleto #{subId}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="Ingrese el Folio / Código de Barras"
                                                            value={data[idKey] || ''}
                                                            onChange={(e) => setData(idKey, e.target.value)}
                                                            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                                                        />
                                                        {errors[idKey] && (
                                                            <p className="text-xs font-medium text-red-500">
                                                                {errors[idKey]}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="space-y-1.5">
                                                    {isTicketItem && (
                                                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                            Fotografía del Boleto #{subId}
                                                        </label>
                                                    )}
                                                    <div className="group relative">
                                                        <input
                                                            type="file"
                                                            accept="image/jpeg,image/png,application/pdf"
                                                            required
                                                            onChange={(e) =>
                                                                handleFileChange(
                                                                    photoKey,
                                                                    e.target.files
                                                                        ? e.target.files[0]
                                                                        : null,
                                                                )
                                                            }
                                                            className="hover:file:bg-gray-250 dark:hover:file:bg-neutral-750 w-full cursor-pointer rounded-xl border border-dashed border-gray-300 p-2.5 text-xs text-gray-500 transition-colors file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-gray-700 hover:border-gray-400 dark:border-neutral-700 dark:file:bg-neutral-800 dark:file:text-gray-200 dark:hover:border-neutral-600"
                                                        />
                                                    </div>
                                                    {errors[photoKey] && (
                                                        <p className="mt-1 text-xs font-medium text-red-500">
                                                            {errors[photoKey]}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full rounded-2xl bg-[#c90000] px-6 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg transition-all duration-200 hover:bg-[#a70000] hover:shadow-xl disabled:bg-gray-300 dark:disabled:bg-neutral-800"
                                    >
                                        {processing
                                            ? 'Enviando Correcciones...'
                                            : 'Enviar Correcciones'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>

                <PublicFooter />
            </div>
        </GeolocationProvider>
    );
}

import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { GeolocationProvider } from '@/contexts/GeolocationProvider';
import { Head, useForm } from '@inertiajs/react';
import React from 'react';

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
    const { data, setData, post, processing, errors } = useForm<Record<string, any>>(() => {
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
            }
        });
        return initialForm;
    });

    const handleFileChange = (key: string, file: File | null) => {
        setData(key, file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

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
            <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-gray-100 font-sans flex flex-col">
                <Head title="Corregir Documentación - Boletea" />
                <PublicHeader />

                <main className="pt-28 pb-20 flex-grow flex items-center justify-center">
                    <div className="container mx-auto px-4 max-w-xl">
                        {/* Title Header */}
                        <div className="text-center mb-8">
                            <span className="inline-block p-1.5 px-3 rounded-full bg-[#c90000]/10 text-[#c90000] text-xs font-bold tracking-wide uppercase mb-3">
                                Acción Requerida
                            </span>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                Corregir Datos / Documentos
                            </h1>
                            <p className="text-sm text-gray-500 mt-2">
                                Ingrese la información solicitada o suba los nuevos documentos para continuar con su trámite.
                            </p>
                        </div>

                        {/* Card Container */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-6 md:p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-neutral-800 backdrop-blur-sm">

                            {/* Admin Notes / Explanatory Box */}
                            {refundRequest.admin_notes && (
                                <div className="p-4 mb-6 rounded-2xl bg-orange-50 border border-orange-100 text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-300">
                                    <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Notas del Administrador:</h4>
                                    <p className="text-sm italic">"{refundRequest.admin_notes}"</p>
                                </div>
                            )}

                            {/* Mandatory Security Box for Card Last 4 Digits */}
                            {refundRequest.requires_card_confirmation && (
                                <div className="p-4 mb-6 rounded-2xl bg-blue-50 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                        <h4 className="text-xs font-bold uppercase tracking-wider">Verificación de Seguridad Obligatoria:</h4>
                                    </div>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Por motivos de seguridad, confirme los últimos 4 dígitos de la tarjeta utilizada para la compra:
                                    </p>
                                    <div>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            required
                                            placeholder="Últimos 4 dígitos de tarjeta"
                                            value={data.card_last_four || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                setData('card_last_four', val);
                                            }}
                                            className="w-full text-sm font-mono tracking-widest px-3.5 py-2.5 border border-blue-200 dark:border-blue-800 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                        />
                                        {errors.card_last_four && (
                                            <p className="text-xs text-red-500 mt-1 font-medium">{errors.card_last_four}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 text-xs text-gray-500 border border-gray-100 dark:border-neutral-800">
                                <div className="flex justify-between mb-1.5">
                                    <span className="font-semibold text-gray-400">Cliente:</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{refundRequest.buyer_name}</span>
                                </div>
                                <div className="flex justify-between mb-1.5">
                                    <span className="font-semibold text-gray-400">Orden de Compra:</span>
                                    <span className="font-bold text-gray-800 dark:text-white">#{refundRequest.order_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-400">Código de Seguimiento:</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{refundRequest.tracking_id}</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* CLABE Correction Inputs */}
                                {refundRequest.invalid_documents.includes('clabe') && (
                                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                                                Actualizar CLABE Interbancaria y Banco
                                            </h3>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Nueva CLABE Interbancaria (18 dígitos) <span className="text-[#c90000]">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={18}
                                                required
                                                value={data.clabe || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                                                    setData('clabe', val);

                                                    // Auto detect bank by 3-digit prefix
                                                    if (val.length >= 3 && banks && banks.length > 0) {
                                                        const prefix = val.slice(0, 3);
                                                        const matchedBank = banks.find(b => b.code === prefix);
                                                        if (matchedBank) {
                                                            setData('bank_name', matchedBank.name);
                                                        }
                                                    }
                                                }}
                                                className="w-full text-sm font-mono tracking-wider px-3.5 py-2.5 border border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#c90000]"
                                                placeholder="012345678901234567"
                                            />
                                            {errors.clabe && (
                                                <p className="text-xs text-red-500 mt-1 font-medium">{errors.clabe}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                                Banco de Destino <span className="text-[#c90000]">*</span>
                                            </label>
                                            <select
                                                required
                                                value={data.bank_name || ''}
                                                onChange={(e) => setData('bank_name', e.target.value)}
                                                className="w-full text-xs px-3.5 py-2.5 border border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#c90000]"
                                            >
                                                <option value="">Seleccione su banco</option>
                                                {banks?.map(b => (
                                                    <option key={b.id} value={b.name} disabled={!b.enabled}>
                                                        {b.name} {!b.enabled ? '(No Habilitado)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.bank_name && (
                                                <p className="text-xs text-red-500 mt-1 font-medium">{errors.bank_name}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* File Upload inputs for other invalid docs */}
                                {refundRequest.invalid_documents.filter(d => d !== 'clabe').map((docKey) => {
                                    const formKey = docKey.startsWith('ticket_')
                                        ? `ticket_photo_${docKey.substring(7)}`
                                        : docKey;

                                    return (
                                        <div key={docKey} className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                                {getDocLabel(docKey)} <span className="text-[#c90000]">*</span>
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,application/pdf"
                                                    required
                                                    onChange={(e) => handleFileChange(formKey, e.target.files ? e.target.files[0] : null)}
                                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-250 dark:file:bg-neutral-800 dark:file:text-gray-200 dark:hover:file:bg-neutral-750 file:cursor-pointer cursor-pointer border border-dashed border-gray-300 dark:border-neutral-700 p-2.5 rounded-xl hover:border-gray-400 dark:hover:border-neutral-600 transition-colors"
                                                />
                                            </div>
                                            {errors[formKey] && (
                                                <p className="text-xs text-red-500 mt-1 font-medium">{errors[formKey]}</p>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-[#c90000] hover:bg-[#a70000] disabled:bg-gray-300 dark:disabled:bg-neutral-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm tracking-wide"
                                    >
                                        {processing ? 'Enviando Correcciones...' : 'Enviar Correcciones'}
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

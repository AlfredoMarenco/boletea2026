import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { GeolocationProvider } from '@/contexts/GeolocationProvider';
import { Head, useForm } from '@inertiajs/react';
import React from 'react';

interface RefundRequestData {
    id: number;
    order_number: string;
    buyer_name: string;
    admin_notes: string | null;
    tracking_id: string;
    invalid_documents: string[];
}

interface Props {
    refundRequest: RefundRequestData;
}

export default function UpdateDocuments({ refundRequest }: Props) {
    const { data, setData, post, processing, errors } = useForm<Record<string, File | null>>(() => {
        const initialForm: Record<string, File | null> = {};
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
                                Corregir Documentos
                            </h1>
                            <p className="text-sm text-gray-500 mt-2">
                                Suba los nuevos documentos solicitados para continuar con su trámite de reembolso.
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
                                {refundRequest.invalid_documents.map((docKey) => {
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
                                        {processing ? 'Enviando Correcciones...' : 'Enviar Corrección de Documentos'}
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

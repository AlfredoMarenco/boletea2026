import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { GeolocationProvider } from '@/contexts/GeolocationProvider';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

// Client-side image compression utility using HTML5 Canvas
const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1600;
                const MAX_HEIGHT = 1600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    0.75 // 75% quality
                );
            };
            img.onerror = () => resolve(file);
        };
        img.onerror = () => resolve(file);
    });
};

interface RefundEvent {
    id: number;
    title: string;
    start_date: string | null;
}

interface Props {
    events: RefundEvent[];
}

export default function RefundForm({ events }: Props) {
    const [step, setStep] = useState(1);
    const [eventId, setEventId] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [email, setEmail] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [clabe, setClabe] = useState('');
    const [bankName, setBankName] = useState('');
    const [cardLastFour, setCardLastFour] = useState('');

    // Files state
    const [ineFile, setIneFile] = useState<File | null>(null);

    // Compression/loading states
    const [isCompresing, setIsCompressing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requiresEmail, setRequiresEmail] = useState(false);
    const [requiresCard, setRequiresCard] = useState(false);
    const [requiresTickets, setRequiresTickets] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Cash Ticket verification states
    const [barcodeInput, setBarcodeInput] = useState('');
    const [validatedTicketsList, setValidatedTicketsList] = useState<any[]>([]);
    const [ticketVerificationError, setTicketVerificationError] = useState('');
    const [ticketLoading, setTicketLoading] = useState(false);

    const handleVerifyOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !orderNumber) {
            setErrorMessage('Por favor selecciona el evento e ingresa el número de orden.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const response = await fetch(route('refund.validate_order'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    refund_event_id: eventId,
                    order_number: orderNumber,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.message || 'Error al validar la orden.');
                setLoading(false);
                return;
            }

            if (data.requires_email || data.requires_card) {
                setRequiresEmail(data.requires_email || false);
                setRequiresCard(data.requires_card || false);
                setRequiresTickets(data.requires_tickets || false);
                setPaymentMethod(data.payment_method);
            } else {
                // Cash / Taquilla
                setRequiresCard(data.requires_card || false);
                setRequiresTickets(data.requires_tickets || true);
                setBuyerName(data.buyer_name || '');
                setPaymentMethod(data.payment_method || 'Efectivo');
                setStep(2);
            }
        } catch (err) {
            setErrorMessage('Error de red. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySecondary = async (e: React.FormEvent) => {
        e.preventDefault();
        if (requiresEmail && !email) {
            setErrorMessage('Por favor ingresa tu correo electrónico.');
            return;
        }
        if (requiresCard && (!cardLastFour || cardLastFour.length !== 4)) {
            setErrorMessage('Por favor ingresa los 4 dígitos de tu tarjeta.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const response = await fetch(route('refund.validate_secondary'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    refund_event_id: eventId,
                    order_number: orderNumber,
                    email: requiresEmail ? email : undefined,
                    card_last_four: requiresCard ? cardLastFour : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.message || 'La información ingresada no coincide.');
                setLoading(false);
                return;
            }

            setBuyerName(data.buyer_name || '');
            setPaymentMethod(data.payment_method || 'Tarjeta');
            setStep(2);
        } catch (err) {
            setErrorMessage('Error de red. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyIndividualTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput) return;

        setTicketVerificationError('');
        setTicketLoading(true);

        const isAlreadyAdded = validatedTicketsList.some(
            (t) => 
                (t.barcode && t.barcode.toLowerCase() === barcodeInput.trim().toLowerCase()) ||
                (t.ticket_id && String(t.ticket_id).trim().toLowerCase() === barcodeInput.trim().toLowerCase())
        );

        if (isAlreadyAdded) {
            setTicketVerificationError('Este boleto ya fue agregado a la lista.');
            setTicketLoading(false);
            return;
        }

        try {
            const response = await fetch(route('refund.validate_ticket'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    refund_event_id: eventId,
                    order_number: orderNumber,
                    barcode: barcodeInput.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setTicketVerificationError(data.message || 'El código de barras no es válido.');
                setTicketLoading(false);
                return;
            }

            setValidatedTicketsList([...validatedTicketsList, { ...data.ticket, photoFile: null }]);
            setBarcodeInput('');
        } catch (err) {
            setTicketVerificationError('Error de red al validar boleto.');
        } finally {
            setTicketLoading(false);
        }
    };

    const handleRemoveTicket = (barcode: string) => {
        setValidatedTicketsList(validatedTicketsList.filter((t) => t.barcode !== barcode));
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('El archivo no debe pesar más de 10MB.');
            e.target.value = '';
            return;
        }

        setIsCompressing(true);
        try {
            const compressed = await compressImage(file);
            setter(compressed);
        } catch (err) {
            setter(file);
        } finally {
            setIsCompressing(false);
        }
    };

    const handleTicketPhotoInput = async (e: React.ChangeEvent<HTMLInputElement>, barcode: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('El archivo no debe pesar más de 10MB.');
            e.target.value = '';
            return;
        }

        setIsCompressing(true);
        try {
            const compressed = await compressImage(file);
            setValidatedTicketsList(prev => prev.map(t => t.barcode === barcode ? { ...t, photoFile: compressed } : t));
        } catch (err) {
            setValidatedTicketsList(prev => prev.map(t => t.barcode === barcode ? { ...t, photoFile: file } : t));
        } finally {
            setIsCompressing(false);
        }
    };

    const handleSubmitRefund = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Dynamic field requirement validation
        const isCard = requiresCard; // If verified as card purchase
        
        if (!buyerName || !clabe || !bankName || !ineFile || !email) {
            setErrorMessage('Por favor rellene todos los campos requeridos (incluyendo banco y correo) y suba la INE.');
            return;
        }

        if (clabe.length !== 18 || !/^\d+$/.test(clabe)) {
            setErrorMessage('La CLABE interbancaria debe ser de exactamente 18 dígitos numéricos.');
            return;
        }

        if (isCard && cardLastFour.length !== 4) {
            setErrorMessage('Por favor ingrese los 4 dígitos finales de la tarjeta con la que realizó la compra.');
            return;
        }

        if (requiresTickets) {
            // Orders that require tickets (Taquilla cash/card) require validated tickets list and photo of EACH physical ticket
            if (validatedTicketsList.length === 0) {
                setErrorMessage('Debe validar al menos 1 boleto de su orden para proceder con la solicitud.');
                return;
            }
            const missingPhotos = validatedTicketsList.some(t => !t.photoFile);
            if (missingPhotos) {
                setErrorMessage('Debe adjuntar la foto para cada uno de los boletos físicos validados.');
                return;
            }
        }

        setLoading(true);
        setErrorMessage('');

        const formData = new FormData();
        formData.append('refund_event_id', eventId);
        formData.append('order_number', orderNumber);
        formData.append('buyer_name', buyerName);
        formData.append('clabe', clabe);
        formData.append('bank_name', bankName);
        formData.append('email', email);
        formData.append('ine', ineFile);

        if (isCard) {
            if (cardLastFour) {
                formData.append('card_last_four', cardLastFour);
            }
        }
        
        if (requiresTickets) {
            // Taquilla order (cash/card): send validated tickets barcodes and individual photos
            validatedTicketsList.forEach((t) => {
                const uniqueId = t.ticket_id || t.barcode; // Use ticket_id if available, fallback to barcode
                formData.append('validated_tickets[]', uniqueId);
                if (t.photoFile) {
                    formData.append(`ticket_photos[${uniqueId}]`, t.photoFile);
                }
            });
        }

        router.post(route('refund.submit'), formData, {
            forceFormData: true,
            onFinish: () => setLoading(false),
            onError: (errors) => {
                const firstErr = Object.values(errors)[0];
                setErrorMessage(firstErr || 'Error al enviar la solicitud.');
            }
        });
    };

    return (
        <GeolocationProvider>
            <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-gray-100 font-sans flex flex-col">
                <Head title="Trámite de Reembolso - Boletea" />
                <PublicHeader />

                <main className="pt-28 pb-20 flex-grow flex items-center justify-center">
                    <div className="container mx-auto px-4 max-w-4xl">
                        {/* Progress Header */}
                        <div className="text-center mb-8">
                            <span className="inline-block p-1.5 px-3 rounded-full bg-[#c90000]/10 text-[#c90000] text-xs font-bold tracking-wide uppercase mb-3">
                                Devoluciones Oficiales
                            </span>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                Solicitud de Reembolso
                            </h1>
                            <p className="text-sm text-gray-500 mt-2">
                                Complete los pasos para procesar su solicitud de forma ágil y segura.
                            </p>
                        </div>

                        {/* Card Container */}
                        <div className="bg-white dark:bg-[#1e1e1e] p-6 md:p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-neutral-800 backdrop-blur-sm">
                            {/* Step Indicator */}
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-neutral-800">
                                <div className="flex items-center space-x-2">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-[#c90000] text-white' : 'bg-gray-100 text-gray-400 dark:bg-neutral-800'}`}>
                                        1
                                    </span>
                                    <span className={`text-sm font-semibold ${step === 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                        Verificación
                                    </span>
                                </div>
                                <div className="h-0.5 w-12 bg-gray-100 dark:bg-neutral-800 flex-grow mx-4"></div>
                                <div className="flex items-center space-x-2">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-[#c90000] text-white' : 'bg-gray-100 text-gray-400 dark:bg-neutral-800'}`}>
                                        2
                                    </span>
                                    <span className={`text-sm font-semibold ${step === 2 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                        Documentos
                                    </span>
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="p-4 mb-6 rounded-2xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-sm text-blue-800 dark:text-blue-300 space-y-2">
                                <p><strong>Importante:</strong> Para hacer válido el reembolso, la información solicitada debe ser precisa y todos los campos son obligatorios.</p>
                                <p>Boletea Tickets puede hacer contacto vía correo en caso de que exista una aclaración con los datos proporcionados.</p>
                                <p>Los tiempos de devolución pueden tomar entre <strong>15 y 30 días hábiles</strong> una vez teniendo la información necesaria.</p>
                            </div>

                            {/* STEP 1: VERIFY ORDER & EMAIL / CARD */}
                            {step === 1 && (
                                <div>
                                    {!(requiresEmail || requiresCard) ? (
                                        <form onSubmit={handleVerifyOrder} className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                    Selecciona el Evento <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <select
                                                    value={eventId}
                                                    onChange={(e) => setEventId(e.target.value)}
                                                    required
                                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition"
                                                >
                                                    <option value="">-- Elige un evento --</option>
                                                    {events.map((ev) => (
                                                        <option key={ev.id} value={ev.id}>
                                                            {ev.title} {ev.start_date ? `(${ev.start_date})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                    Número de Orden <span className="text-red-500 ml-1">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={orderNumber}
                                                    onChange={(e) => setOrderNumber(e.target.value)}
                                                    placeholder="Ej: 2057100"
                                                    required
                                                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full p-4 bg-[#c90000] hover:bg-[#a60000] text-white rounded-2xl font-bold transition shadow-lg shadow-[#c90000]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Buscando orden...' : 'Verificar Orden'}
                                            </button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleVerifySecondary} className="space-y-5">
                                            <div className="p-4 rounded-2xl bg-amber-50 text-amber-700 text-xs border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">
                                                Esta orden se pagó mediante: <strong>{paymentMethod}</strong>. Para su seguridad, valide la información solicitada a continuación.
                                            </div>

                                            {requiresEmail && (
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                        Correo Electrónico <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="ejemplo@correo.com"
                                                        required
                                                        className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition"
                                                    />
                                                </div>
                                            )}

                                            {requiresCard && (
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                        Últimos 4 dígitos de su Tarjeta <span className="text-red-500 ml-1">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={cardLastFour}
                                                        onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, ''))}
                                                        placeholder="Ej: 1234"
                                                        maxLength={4}
                                                        required
                                                        className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setRequiresEmail(false);
                                                        setRequiresCard(false);
                                                        setEmail('');
                                                        setCardLastFour('');
                                                    }}
                                                    className="w-1/3 p-4 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition"
                                                >
                                                    Atrás
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-2/3 p-4 bg-[#c90000] hover:bg-[#a60000] text-white rounded-2xl font-bold transition shadow-lg shadow-[#c90000]/20 disabled:opacity-50"
                                                >
                                                    {loading ? 'Verificando...' : 'Confirmar Datos'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* STEP 2: DOCUMENTS UPLOAD & BANK INFO */}
                            {step === 2 && (
                                <form onSubmit={handleSubmitRefund} className="space-y-6">
                                    <div className="p-4 rounded-2xl bg-[#c90000]/5 text-sm dark:bg-[#c90000]/10 border border-[#c90000]/10">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            Orden: <strong>#{orderNumber}</strong> ({paymentMethod})
                                        </p>
                                        {buyerName && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Titular en sistema: {buyerName}
                                            </p>
                                        )}
                                    </div>

                                    {requiresTickets && (
                                        <div className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-5">
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 text-sm">Validación de Boletos</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                                Por favor ingrese el código de barras (o el ID) de los boletos físicos de esta orden que desea reembolsar y adjunte la fotografía correspondiente de cada uno.
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                Nombre Completo del Beneficiario <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <p className="text-[11px] text-gray-400 mb-2">
                                                Como aparece en el documento de identificación oficial.
                                            </p>
                                            <input
                                                type="text"
                                                value={buyerName}
                                                onChange={(e) => setBuyerName(e.target.value)}
                                                required
                                                placeholder="Ingrese el nombre completo como aparece en su identificación"
                                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                Correo Electrónico de Contacto <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <p className="text-[11px] text-gray-400 mb-2">
                                                Aquí recibirá las notificaciones del estatus de su reembolso.
                                            </p>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="correo@ejemplo.com"
                                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                CLABE Interbancaria (18 dígitos) <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <p className="text-[11px] text-gray-400 mb-2">
                                                Asegúrese de que la cuenta esté a nombre del titular del reembolso.
                                            </p>
                                            <input
                                                type="text"
                                                value={clabe}
                                                onChange={(e) => setClabe(e.target.value.replace(/\D/g, ''))}
                                                maxLength={18}
                                                required
                                                placeholder="012345678901234567"
                                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                Nombre del Banco <span className="text-red-500 ml-1">*</span>
                                            </label>
                                            <p className="text-[11px] text-gray-400 mb-2">
                                                Ingrese la institución financiera de su cuenta (ej: BBVA, Banamex, Banorte).
                                            </p>
                                            <input
                                                type="text"
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                                required
                                                placeholder="Ej: BBVA"
                                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition"
                                            />
                                        </div>
                                    </div>



                                    {/* Cash tickets verification (Individual Ticket IDs) */}
                                    {!requiresEmail && (
                                        <div className="p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 space-y-4">
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Validación de Boletos Físicos
                                                </h3>
                                                <p className="text-[11px] text-gray-400 mt-1">
                                                    Ingrese los códigos de barras (ID del boleto) uno por uno para certificar que pertenecen a esta orden.
                                                </p>
                                            </div>

                                            {ticketVerificationError && (
                                                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                                    ⚠️ {ticketVerificationError}
                                                </p>
                                            )}

                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    value={barcodeInput}
                                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                                    placeholder="Ej: 0999976175"
                                                    className="flex-grow p-3 text-sm rounded-xl bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#c90000] transition"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={ticketLoading}
                                                    onClick={handleVerifyIndividualTicket}
                                                    className="p-3 px-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold rounded-xl transition"
                                                >
                                                    {ticketLoading ? 'Validando...' : 'Agregar'}
                                                </button>
                                            </div>

                                            {/* List of validated tickets */}
                                            {validatedTicketsList.length > 0 && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[11px] font-semibold text-gray-500 uppercase">Boletos Validados ({validatedTicketsList.length}):</p>
                                                    <div className="max-h-64 overflow-y-auto space-y-2 bg-white dark:bg-neutral-950 p-2 rounded-xl border border-gray-150 dark:border-neutral-850">
                                                        {validatedTicketsList.map((t, idx) => (
                                                            <div key={idx} className="flex flex-col text-xs border-b border-gray-50 dark:border-neutral-800 pb-2 last:border-0 pl-1 space-y-2">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <span className="font-semibold block">{t.area} - Asiento {t.seat}</span>
                                                                        <span className="font-mono text-[10px] text-gray-400">ID/Barcode: {t.ticket_id || t.barcode}</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveTicket(t.barcode)}
                                                                        className="text-red-500 hover:text-red-700 p-1 mr-1 mt-1"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-2 border border-gray-100 dark:border-neutral-800">
                                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                                                        Foto del Boleto <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,application/pdf"
                                                                        required
                                                                        onChange={(e) => handleTicketPhotoInput(e, t.barcode)}
                                                                        className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-gray-200 file:text-gray-700 dark:file:bg-neutral-800 dark:file:text-gray-300 hover:file:bg-gray-300 transition"
                                                                    />
                                                                    {t.photoFile && (
                                                                        <span className="text-[10px] text-green-600 block mt-1">
                                                                            ✓ {t.photoFile.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* INE File */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            Identificación Oficial (INE/Pasaporte) <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <p className="text-[11px] text-gray-400 mb-2">
                                            Adjuntar imagen clara o archivo PDF (Max 10MB).
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            required
                                            onChange={(e) => handleFileInput(e, setIneFile)}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 dark:file:bg-neutral-800 dark:file:text-gray-300 hover:file:bg-gray-200 transition"
                                        />
                                        {ineFile && (
                                            <span className="text-[11px] text-green-600 block mt-1">
                                                ✓ Listo: {ineFile.name} (~{(ineFile.size / 1024).toFixed(0)} KB)
                                            </span>
                                        )}
                                    </div>



                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            type="button"
                                            disabled={loading || isCompresing}
                                            onClick={() => setStep(1)}
                                            className="w-1/3 p-4 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition disabled:opacity-50"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || isCompresing}
                                            className="w-2/3 p-4 bg-[#c90000] hover:bg-[#a60000] text-white rounded-2xl font-bold transition shadow-lg shadow-[#c90000]/20 disabled:opacity-50"
                                        >
                                            {isCompresing ? 'Comprimiendo...' : loading ? 'Enviando...' : 'Enviar Solicitud'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </main>

                <PublicFooter />
            </div>
        </GeolocationProvider>
    );
}

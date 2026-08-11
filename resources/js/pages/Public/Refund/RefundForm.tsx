import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import RefundFaqSection from '@/components/RefundFaqSection';
import { GeolocationProvider } from '@/contexts/GeolocationProvider';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
                            const compressedFile = new File(
                                [blob],
                                file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                                {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                },
                            );
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    0.75, // 75% quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

interface RefundEvent {
    id: number;
    title: string;
    start_date: string | null;
}

interface Bank {
    id: number;
    code: string;
    name: string;
    enabled: boolean;
}

interface Props {
    events: RefundEvent[];
    ticketSampleImage?: string | null;
    banks: Bank[];
}

export default function RefundForm({
    events,
    ticketSampleImage,
    banks = [],
}: Props) {
    const [step, setStep] = useState(1);
    const [eventId, setEventId] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [email, setEmail] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastNamePaternal, setLastNamePaternal] = useState('');
    const [lastNameMaternal, setLastNameMaternal] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [clabe, setClabe] = useState('');
    const [confirmClabe, setConfirmClabe] = useState('');
    const [bankName, setBankName] = useState('');
    const [cardLastFour, setCardLastFour] = useState('');
    const [clabeError, setClabeError] = useState('');

    // Files state
    const [ineFile, setIneFile] = useState<File | null>(null);

    // Compression/loading states
    const [isCompresing, setIsCompressing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requiresEmail, setRequiresEmail] = useState(false);
    const [requiresCard, setRequiresCard] = useState(false);
    const [requiresTickets, setRequiresTickets] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [autoRefundNotice, setAutoRefundNotice] = useState<{
        orderNumber: string;
        message: string;
    } | null>(null);
    const [existingRequestNotice, setExistingRequestNotice] = useState<{
        orderNumber: string;
        message: string;
    } | null>(null);

    // Cash Ticket verification states
    const [barcodeInput, setBarcodeInput] = useState('');
    const [validatedTicketsList, setValidatedTicketsList] = useState<any[]>([]);
    const [ticketVerificationError, setTicketVerificationError] = useState('');
    const [ticketLoading, setTicketLoading] = useState(false);

    // Help and Legal states
    const [showSampleModal, setShowSampleModal] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // New states for tickets warning modal
    const [orderTickets, setOrderTickets] = useState<any[]>([]);
    const [requestedTickets, setRequestedTickets] = useState<string[]>([]);
    const [showTicketsWarningModal, setShowTicketsWarningModal] =
        useState(false);
    const [bypassTicketsWarning, setBypassTicketsWarning] = useState(false);
    const [highlightTicketInput, setHighlightTicketInput] = useState(false);

    const fillNameParts = (fullName: string) => {
        if (!fullName) return;
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) {
            setFirstName(parts[0]);
            setMiddleName('');
            setLastNamePaternal('');
            setLastNameMaternal('');
        } else if (parts.length === 2) {
            setFirstName(parts[0]);
            setMiddleName('');
            setLastNamePaternal(parts[1]);
            setLastNameMaternal('');
        } else if (parts.length === 3) {
            setFirstName(parts[0]);
            setMiddleName('');
            setLastNamePaternal(parts[1]);
            setLastNameMaternal(parts[2]);
        } else if (parts.length >= 4) {
            setFirstName(parts[0]);
            setMiddleName(parts[1]);
            setLastNamePaternal(parts[2]);
            setLastNameMaternal(parts.slice(3).join(' '));
        }
    };

    const handleVerifyOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !orderNumber) {
            setErrorMessage(
                'Por favor selecciona el evento e ingresa el número de orden.',
            );
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const response = await fetch(route('refund.validate_order'), {
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
                    refund_event_id: eventId,
                    order_number: orderNumber,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.status === 'web_auto_refund') {
                    setAutoRefundNotice({
                        orderNumber: orderNumber,
                        message: data.message,
                    });
                    setLoading(false);
                    return;
                }
                if (data.status === 'already_requested') {
                    setExistingRequestNotice({
                        orderNumber: orderNumber,
                        message: data.message,
                    });
                    setLoading(false);
                    return;
                }
                setErrorMessage(data.message || 'Error al validar la orden.');
                setLoading(false);
                return;
            }

            if (data.requires_email || data.requires_card) {
                setRequiresEmail(data.requires_email || false);
                setRequiresCard(data.requires_card || false);
                setRequiresTickets(data.requires_tickets || false);
                setPaymentMethod(data.payment_method);
                if (data.tickets) {
                    setOrderTickets(data.tickets);
                }
                if (data.requested_tickets) {
                    setRequestedTickets(data.requested_tickets);
                }
            } else {
                // Cash / Taquilla
                setRequiresCard(data.requires_card || false);
                setRequiresTickets(data.requires_tickets || true);
                setBuyerName(data.buyer_name || '');
                fillNameParts(data.buyer_name || '');
                setPaymentMethod(data.payment_method || 'Efectivo');
                if (data.tickets) {
                    setOrderTickets(data.tickets);
                }
                if (data.requested_tickets) {
                    setRequestedTickets(data.requested_tickets);
                }
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
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
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
                if (data.status === 'web_auto_refund') {
                    setAutoRefundNotice({
                        orderNumber: orderNumber,
                        message: data.message,
                    });
                    setLoading(false);
                    return;
                }
                if (data.status === 'already_requested') {
                    setExistingRequestNotice({
                        orderNumber: orderNumber,
                        message: data.message,
                    });
                    setLoading(false);
                    return;
                }
                setErrorMessage(
                    data.message || 'La información ingresada no coincide.',
                );
                setLoading(false);
                return;
            }

            setBuyerName(data.buyer_name || '');
            fillNameParts(data.buyer_name || '');
            setPaymentMethod(data.payment_method || 'Tarjeta');
            if (data.tickets) {
                setOrderTickets(data.tickets);
            }
            if (data.requested_tickets) {
                setRequestedTickets(data.requested_tickets);
            }
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
                (t.barcode &&
                    t.barcode.toLowerCase() ===
                        barcodeInput.trim().toLowerCase()) ||
                (t.ticket_id &&
                    String(t.ticket_id).trim().toLowerCase() ===
                        barcodeInput.trim().toLowerCase()),
        );

        if (isAlreadyAdded) {
            setTicketVerificationError(
                'Este boleto ya fue agregado a la lista.',
            );
            setTicketLoading(false);
            return;
        }

        try {
            const response = await fetch(route('refund.validate_ticket'), {
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
                    refund_event_id: eventId,
                    order_number: orderNumber,
                    barcode: barcodeInput.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setTicketVerificationError(
                    data.message || 'El código de barras no es válido.',
                );
                setTicketLoading(false);
                return;
            }

            setValidatedTicketsList([
                ...validatedTicketsList,
                { ...data.ticket, photoFile: null },
            ]);
            setBarcodeInput('');
        } catch (err) {
            setTicketVerificationError('Error de red al validar boleto.');
        } finally {
            setTicketLoading(false);
        }
    };

    const handleRemoveTicket = (barcode: string) => {
        setValidatedTicketsList(
            validatedTicketsList.filter((t) => t.barcode !== barcode),
        );
    };

    const handleFileInput = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (f: File | null) => void,
    ) => {
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

    const handleTicketPhotoInput = async (
        e: React.ChangeEvent<HTMLInputElement>,
        barcode: string,
    ) => {
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
            setValidatedTicketsList((prev) =>
                prev.map((t) =>
                    t.barcode === barcode ? { ...t, photoFile: compressed } : t,
                ),
            );
        } catch (err) {
            setValidatedTicketsList((prev) =>
                prev.map((t) =>
                    t.barcode === barcode ? { ...t, photoFile: file } : t,
                ),
            );
        } finally {
            setIsCompressing(false);
        }
    };

    const performSubmitRefund = (
        buyerNameValue: string,
        isCardValue: boolean,
    ) => {
        setLoading(true);
        setErrorMessage('');

        const formData = new FormData();
        formData.append('refund_event_id', eventId);
        formData.append('order_number', orderNumber);
        formData.append('buyer_name', buyerNameValue);
        formData.append('clabe', clabe);
        formData.append('bank_name', bankName);
        formData.append('email', email);
        formData.append('ine', ineFile!);

        if (isCardValue) {
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
            },
        });
    };

    const handleAddMoreTickets = () => {
        setShowTicketsWarningModal(false);
        setHighlightTicketInput(true);
        const element = document.getElementById('ticket-validation-container');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setTimeout(() => {
            setHighlightTicketInput(false);
        }, 3000);
    };

    const handleConfirmOnlySubmit = () => {
        setShowTicketsWarningModal(false);
        setBypassTicketsWarning(true);
        const constructedBuyerName = [
            firstName,
            middleName,
            lastNamePaternal,
            lastNameMaternal,
        ]
            .map((s) => s.trim())
            .filter(Boolean)
            .join(' ')
            .toUpperCase();
        performSubmitRefund(constructedBuyerName, requiresCard);
    };

    const handleSubmitRefund = (e: React.FormEvent) => {
        e.preventDefault();

        const constructedBuyerName = [
            firstName,
            middleName,
            lastNamePaternal,
            lastNameMaternal,
        ]
            .map((s) => s.trim())
            .filter(Boolean)
            .join(' ')
            .toUpperCase();

        const isCard = requiresCard;

        if (
            !firstName ||
            !lastNamePaternal ||
            !lastNameMaternal ||
            !clabe ||
            !confirmClabe ||
            !bankName ||
            !ineFile ||
            !email
        ) {
            setErrorMessage(
                'Por favor rellene todos los campos requeridos (nombre, apellidos, banco, correo) y suba la INE.',
            );
            return;
        }

        if (clabe !== confirmClabe) {
            setErrorMessage(
                'La CLABE interbancaria y su confirmación no coinciden. Por favor verifique.',
            );
            return;
        }

        if (clabeError) {
            setErrorMessage(clabeError);
            return;
        }

        if (clabe.length !== 18 || !/^\d+$/.test(clabe)) {
            setErrorMessage(
                'La CLABE interbancaria debe ser de exactamente 18 dígitos numéricos.',
            );
            return;
        }

        const prefix = clabe.substring(0, 3);
        const matchedBank = banks.find((b) => b.code === prefix);
        if (!matchedBank) {
            setErrorMessage(
                'El prefijo de su CLABE no coincide con ningún banco registrado.',
            );
            return;
        }
        if (!matchedBank.enabled) {
            setErrorMessage(
                `El banco "${matchedBank.name}" no está habilitado para recibir reembolsos.`,
            );
            return;
        }

        if (isCard && cardLastFour.length !== 4) {
            setErrorMessage(
                'Por favor ingrese los 4 dígitos finales de la tarjeta con la que realizó la compra.',
            );
            return;
        }

        if (requiresTickets) {
            // Orders that require tickets (Taquilla cash/card) require validated tickets list and photo of EACH physical ticket
            if (validatedTicketsList.length === 0) {
                setErrorMessage(
                    'Debe validar al menos 1 boleto de su orden para proceder con la solicitud.',
                );
                return;
            }
            const missingPhotos = validatedTicketsList.some(
                (t) => !t.photoFile,
            );
            if (missingPhotos) {
                setErrorMessage(
                    'Debe adjuntar la foto para cada uno de los boletos físicos validados.',
                );
                return;
            }

            // Check if there are other eligible tickets in the order that are not in validatedTicketsList and not already requested
            if (!bypassTicketsWarning) {
                const activeTickets = orderTickets.filter((t) => {
                    const status = (t.status || '').toLowerCase().trim();
                    return status !== 'cancelado' && status !== 'cancelada';
                });
                const nonRequestedTickets = activeTickets.filter((t) => {
                    const ticketId = String(t.ticket_id || '')
                        .toLowerCase()
                        .trim();
                    const barcode = String(t.barcode || '')
                        .toLowerCase()
                        .trim();
                    const isAlreadyReq = requestedTickets.some((rt) => {
                        const cleanRt = String(rt).toLowerCase().trim();
                        return cleanRt === ticketId || cleanRt === barcode;
                    });
                    return !isAlreadyReq;
                });

                if (nonRequestedTickets.length > validatedTicketsList.length) {
                    setShowTicketsWarningModal(true);
                    return;
                }
            }
        }

        performSubmitRefund(constructedBuyerName, isCard);
    };

    return (
        <GeolocationProvider>
            <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900 dark:bg-[#121212] dark:text-gray-100">
                <Head title="Trámite de Reembolso - Boletea" />
                <PublicHeader />

                <main className="flex flex-grow items-center justify-center pt-28 pb-20">
                    <div className="container mx-auto max-w-4xl px-4">
                        {/* Progress Header */}
                        <div className="mb-8 text-center">
                            <span className="mb-3 inline-block rounded-full bg-[#c90000]/10 p-1.5 px-3 text-xs font-bold tracking-wide text-[#c90000] uppercase">
                                Devoluciones Oficiales
                            </span>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                Solicitud de Reembolso
                            </h1>
                            <p className="mt-2 text-sm text-gray-500">
                                Complete los pasos para procesar su solicitud de
                                forma ágil y segura.
                            </p>
                        </div>

                        {/* Card Container */}
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 backdrop-blur-sm md:p-8 dark:border-neutral-800 dark:bg-[#1e1e1e] dark:shadow-none">
                            {/* Step Indicator */}
                            <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-neutral-800">
                                <div className="flex items-center space-x-2">
                                    <span
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step === 1 ? 'bg-[#c90000] text-white' : 'bg-gray-100 text-gray-400 dark:bg-neutral-800'}`}
                                    >
                                        1
                                    </span>
                                    <span
                                        className={`text-sm font-semibold ${step === 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
                                    >
                                        Verificación
                                    </span>
                                </div>
                                <div className="mx-4 h-0.5 w-12 flex-grow bg-gray-100 dark:bg-neutral-800"></div>
                                <div className="flex items-center space-x-2">
                                    <span
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${step === 2 ? 'bg-[#c90000] text-white' : 'bg-gray-100 text-gray-400 dark:bg-neutral-800'}`}
                                    >
                                        2
                                    </span>
                                    <span
                                        className={`text-sm font-semibold ${step === 2 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
                                    >
                                        Documentos
                                    </span>
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                                    {errorMessage}
                                </div>
                            )}

                            {/* STEP 1: VERIFY ORDER & EMAIL / CARD */}
                            {step === 1 && (
                                <div>
                                    {autoRefundNotice ? (
                                        <div className="animate-in space-y-6 rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-emerald-100/40 px-6 py-8 text-center shadow-xl shadow-emerald-500/5 transition zoom-in-95 fade-in md:px-8 dark:border-emerald-800/50 dark:from-emerald-950/40 dark:to-emerald-900/20">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-300/80 bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-600/10 dark:border-emerald-700/60 dark:bg-emerald-900/60 dark:text-emerald-300">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="1.75"
                                                    stroke="currentColor"
                                                    className="h-10 w-10"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="mx-auto max-w-lg space-y-3">
                                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-extrabold tracking-wider text-white uppercase shadow-xs">
                                                    <span className="h-2 w-2 animate-ping rounded-full bg-white"></span>
                                                    Trámite Automático Activo
                                                </div>

                                                <h3 className="text-xl leading-tight font-black tracking-tight text-gray-900 md:text-2xl dark:text-white">
                                                    Su compra web ya está en
                                                    trámite automático de
                                                    reembolso
                                                </h3>

                                                <div className="inline-block rounded-xl border border-emerald-200 bg-white px-3.5 py-1 font-mono text-xs font-bold text-emerald-800 shadow-xs dark:border-emerald-800 dark:bg-neutral-900 dark:text-emerald-300">
                                                    Orden #
                                                    {
                                                        autoRefundNotice.orderNumber
                                                    }
                                                </div>

                                                <p className="pt-1 text-xs leading-relaxed font-medium text-gray-600 md:text-sm dark:text-gray-300">
                                                    No es necesario realizar
                                                    ningún trámite adicional ni
                                                    subir documentos (INE,
                                                    boletos o estado de cuenta).
                                                    El reembolso se acreditará
                                                    automáticamente en la misma
                                                    cuenta o tarjeta con la que
                                                    realizó su compra.
                                                </p>

                                                <div className="space-y-2.5 rounded-2xl border border-emerald-200/80 bg-white/90 p-4 text-left shadow-xs dark:border-emerald-800/60 dark:bg-neutral-900/90">
                                                    <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth="2"
                                                            stroke="currentColor"
                                                            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        <span>
                                                            Tiempo Estimado de
                                                            Acreditación
                                                        </span>
                                                    </div>
                                                    <p className="pl-6 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                        De{' '}
                                                        <strong className="font-bold text-gray-900 dark:text-white">
                                                            5 a 10 días hábiles
                                                        </strong>
                                                        , dependiendo del tiempo
                                                        de procesamiento de su
                                                        banco.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                                                <a
                                                    href={`https://wa.me/528711024187?text=${encodeURIComponent(`Hola, tengo una duda sobre mi reembolso automático de la orden #${autoRefundNotice.orderNumber}`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                                                >
                                                    <svg
                                                        className="h-4 w-4 fill-current"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                                    </svg>
                                                    Contactar Soporte en
                                                    WhatsApp
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAutoRefundNotice(
                                                            null,
                                                        );
                                                        setOrderNumber('');
                                                        setErrorMessage('');
                                                        setRequiresEmail(false);
                                                        setRequiresCard(false);
                                                    }}
                                                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-100 sm:w-auto dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 dark:hover:bg-neutral-800"
                                                >
                                                    Verificar Otra Orden
                                                </button>
                                            </div>
                                        </div>
                                    ) : existingRequestNotice ? (
                                        <div className="animate-in space-y-6 rounded-3xl border border-blue-200/80 bg-gradient-to-b from-blue-50/90 to-indigo-100/40 px-6 py-8 text-center shadow-xl shadow-blue-500/5 transition zoom-in-95 fade-in md:px-8 dark:border-blue-800/50 dark:from-blue-950/40 dark:to-indigo-900/20">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-300/80 bg-blue-100 text-blue-600 shadow-md shadow-blue-600/10 dark:border-blue-700/60 dark:bg-blue-900/60 dark:text-blue-300">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="1.75"
                                                    stroke="currentColor"
                                                    className="h-10 w-10"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="mx-auto max-w-lg space-y-3">
                                                <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-extrabold tracking-wider text-white uppercase shadow-xs">
                                                    Solicitud Registrada en
                                                    Proceso
                                                </div>

                                                <h3 className="text-xl leading-tight font-black tracking-tight text-gray-900 md:text-2xl dark:text-white">
                                                    Esta orden ya cuenta con una
                                                    solicitud de reembolso
                                                </h3>

                                                <div className="inline-block rounded-xl border border-blue-200 bg-white px-3.5 py-1 font-mono text-xs font-bold text-blue-800 shadow-xs dark:border-blue-800 dark:bg-neutral-900 dark:text-blue-300">
                                                    Orden #
                                                    {
                                                        existingRequestNotice.orderNumber
                                                    }
                                                </div>

                                                <p className="pt-1 text-xs leading-relaxed font-medium text-gray-600 md:text-sm dark:text-gray-300">
                                                    {
                                                        existingRequestNotice.message
                                                    }
                                                </p>

                                                <div className="space-y-2.5 rounded-2xl border border-blue-200/80 bg-white/90 p-4 text-left shadow-xs dark:border-blue-800/60 dark:bg-neutral-900/90">
                                                    <div className="flex items-center gap-2.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth="2"
                                                            stroke="currentColor"
                                                            className="h-4 w-4 text-blue-600 dark:text-blue-400"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                                                            />
                                                        </svg>
                                                        <span>
                                                            ¿Deseas consultar el
                                                            estado de tu
                                                            trámite?
                                                        </span>
                                                    </div>
                                                    <p className="pl-6 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                        Puedes dar seguimiento
                                                        con el código de trámite
                                                        generado al momento de
                                                        tu registro o enviado a
                                                        tu correo electrónico.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                                                <Link
                                                    href={route(
                                                        'refund.track_form',
                                                    )}
                                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth="2"
                                                        stroke="currentColor"
                                                        className="h-4 w-4"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                                        />
                                                    </svg>
                                                    Consultar Estatus de Mi
                                                    Trámite
                                                </Link>
                                                <a
                                                    href={`https://wa.me/528711024187?text=${encodeURIComponent(`Hola, tengo una duda sobre el estatus de mi solicitud existente para la orden #${existingRequestNotice.orderNumber}`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                                                >
                                                    <svg
                                                        className="h-4 w-4 fill-current"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                                    </svg>
                                                    WhatsApp Soporte
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setExistingRequestNotice(
                                                            null,
                                                        );
                                                        setOrderNumber('');
                                                        setErrorMessage('');
                                                        setRequiresEmail(false);
                                                        setRequiresCard(false);
                                                    }}
                                                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-100 sm:w-auto dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300 dark:hover:bg-neutral-800"
                                                >
                                                    Verificar Otra Orden
                                                </button>
                                            </div>
                                        </div>
                                    ) : !events || events.length === 0 ? (
                                        <div className="space-y-6 rounded-3xl border border-gray-200/80 bg-gray-50/80 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/60 bg-amber-50 text-amber-600 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-8 w-8"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="mx-auto max-w-md space-y-3">
                                                <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                                    No hay eventos disponibles
                                                    para trámites
                                                </h3>
                                                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                                    Por el momento no contamos
                                                    con eventos habilitados para
                                                    la recepción de solicitudes
                                                    de reembolso.
                                                </p>

                                                {/* Upcoming Event Notice Callout */}
                                                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 p-4 text-left shadow-xs dark:border-amber-900/50 dark:bg-amber-950/30">
                                                    <div className="mt-0.5 flex-shrink-0 rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5h12v9H6V7z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="block text-[11px] font-bold tracking-wider text-amber-900 uppercase dark:text-amber-300">
                                                            Próxima Apertura de
                                                            Registro
                                                        </span>
                                                        <p className="text-xs leading-snug font-medium text-amber-800 dark:text-amber-200/90">
                                                            Los registros para
                                                            el evento{' '}
                                                            <strong className="font-bold">
                                                                "Juntos en
                                                                Durango"
                                                            </strong>{' '}
                                                            darán inicio el{' '}
                                                            <strong className="font-bold underline decoration-amber-400">
                                                                lunes 20 de
                                                                julio
                                                            </strong>
                                                            .
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                                                <a
                                                    href="https://wa.me/528711024187?text=Hola%20tengo%20una%20duda%20sobre%20reembolsos"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                                                >
                                                    <svg
                                                        className="h-4 w-4 fill-current"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                                    </svg>
                                                    Contactar Soporte
                                                </a>
                                                <Link
                                                    href="/"
                                                    className="w-full rounded-2xl bg-gray-100 px-5 py-3 text-center text-xs font-semibold text-gray-700 transition hover:bg-gray-200 sm:w-auto dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
                                                >
                                                    Volver al Inicio
                                                </Link>
                                            </div>
                                        </div>
                                    ) : !(requiresEmail || requiresCard) ? (
                                        <form
                                            onSubmit={handleVerifyOrder}
                                            className="space-y-5"
                                        >
                                            <div>
                                                <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                                    Selecciona el Evento{' '}
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <Select
                                                    value={eventId}
                                                    onValueChange={(value) =>
                                                        setEventId(value)
                                                    }
                                                >
                                                    <SelectTrigger className="h-auto w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-900 shadow-xs transition focus:ring-2 focus:ring-[#c90000] focus:ring-offset-0 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-100">
                                                        <SelectValue placeholder="-- Elige un evento --" />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-72 rounded-2xl border-gray-200 bg-white p-1.5 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                                                        {events.map((ev) => (
                                                            <SelectItem
                                                                key={ev.id}
                                                                value={String(
                                                                    ev.id,
                                                                )}
                                                                className="cursor-pointer rounded-xl px-3 py-3 text-sm font-medium transition focus:bg-[#c90000]/10 focus:text-[#c90000] dark:focus:bg-[#c90000]/20 dark:focus:text-red-400"
                                                            >
                                                                {ev.title}{' '}
                                                                {ev.start_date
                                                                    ? `(${ev.start_date})`
                                                                    : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                                    Número de Orden{' '}
                                                    <span className="ml-1 text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={orderNumber}
                                                    onChange={(e) =>
                                                        setOrderNumber(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Ej: 2057100"
                                                    required
                                                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-950"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full rounded-2xl bg-[#c90000] p-4 font-bold text-white shadow-lg shadow-[#c90000]/20 transition hover:bg-[#a60000] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {loading
                                                    ? 'Buscando orden...'
                                                    : 'Verificar Orden'}
                                            </button>
                                        </form>
                                    ) : (
                                        <form
                                            onSubmit={handleVerifySecondary}
                                            className="space-y-5"
                                        >
                                            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
                                                Esta orden se pagó mediante:{' '}
                                                <strong>{paymentMethod}</strong>
                                                . Para su seguridad, valide la
                                                información solicitada a
                                                continuación.
                                            </div>

                                            {requiresEmail && (
                                                <div>
                                                    <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                                        Correo Electrónico{' '}
                                                        <span className="ml-1 text-red-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) =>
                                                            setEmail(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="ejemplo@correo.com"
                                                        required
                                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900"
                                                    />
                                                </div>
                                            )}

                                            {requiresCard && (
                                                <div>
                                                    <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                                        Últimos 4 dígitos de su
                                                        Tarjeta{' '}
                                                        <span className="ml-1 text-red-500">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={cardLastFour}
                                                        onChange={(e) =>
                                                            setCardLastFour(
                                                                e.target.value.replace(
                                                                    /\D/g,
                                                                    '',
                                                                ),
                                                            )
                                                        }
                                                        placeholder="Ej: 1234"
                                                        maxLength={4}
                                                        required
                                                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900"
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
                                                    className="w-1/3 rounded-2xl bg-gray-100 p-4 font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
                                                >
                                                    Atrás
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-2/3 rounded-2xl bg-[#c90000] p-4 font-bold text-white shadow-lg shadow-[#c90000]/20 transition hover:bg-[#a60000] disabled:opacity-50"
                                                >
                                                    {loading
                                                        ? 'Verificando...'
                                                        : 'Confirmar Datos'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-300">
                                <p>
                                    <strong>Importante:</strong> Para hacer
                                    válido el reembolso, la información
                                    solicitada debe ser precisa y todos los
                                    campos son obligatorios.
                                </p>
                                <p>
                                    Boletea Tickets puede hacer contacto vía
                                    correo en caso de que exista una aclaración
                                    con los datos proporcionados.
                                </p>
                                <p>
                                    Los tiempos de devolución pueden tomar entre{' '}
                                    <strong>15 y 30 días hábiles</strong> una
                                    vez teniendo la información necesaria.
                                </p>
                                <p>
                                    Para aclaraciones WhatsApp{' '}
                                    <strong>871 102 4187</strong>.
                                </p>
                            </div>

                            {/* STEP 2: DOCUMENTS UPLOAD & BANK INFO */}
                            {step === 2 && (
                                <form
                                    onSubmit={handleSubmitRefund}
                                    className="space-y-6"
                                >
                                    <div className="mt-2 mb-2 rounded-2xl border border-[#c90000]/10 bg-[#c90000]/5 p-4 text-sm dark:bg-[#c90000]/10">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            Orden:{' '}
                                            <strong>#{orderNumber}</strong> (
                                            {(() => {
                                                const method = String(
                                                    paymentMethod || '',
                                                ).toLowerCase();
                                                if (method === 'creditcard') {
                                                    return 'Tarjeta de Crédito/Débito';
                                                }
                                                if (
                                                    method ===
                                                    'box office payment'
                                                ) {
                                                    return requiresCard
                                                        ? 'Tarjeta de Crédito/Débito'
                                                        : 'Efectivo';
                                                }
                                                return 'Tarjeta de Crédito/Débito';
                                            })()}
                                            )
                                        </p>
                                        {buyerName && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Titular en sistema: {buyerName}
                                            </p>
                                        )}
                                    </div>

                                    {requiresTickets && (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                Validación de Boletos
                                            </h4>
                                            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                                                Por favor ingrese el IDE de los
                                                boletos físicos de esta orden
                                                que desea reembolsar y adjunte
                                                la fotografía correspondiente de
                                                cada uno.
                                            </p>
                                        </div>
                                    )}

                                    {/* Información del Beneficiario Desglosada */}
                                    <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-5 dark:border-neutral-800 dark:bg-neutral-900/30">
                                        <div>
                                            <h4 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                                Información del Beneficiario
                                            </h4>
                                            <p className="mt-0.5 text-[11px] text-gray-400">
                                                Ingrese su nombre y apellidos
                                                tal como aparecen en su
                                                identificación oficial (INE /
                                                Pasaporte).
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                                                    Primer Nombre{' '}
                                                    <span className="ml-0.5 text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) =>
                                                        setFirstName(
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    required
                                                    placeholder="Ej: JUAN"
                                                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-950"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                                                    Segundo Nombre{' '}
                                                    <span className="font-normal text-gray-400">
                                                        (Opcional)
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={middleName}
                                                    onChange={(e) =>
                                                        setMiddleName(
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    placeholder="Ej: CARLOS"
                                                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-950"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                                                    Apellido Paterno{' '}
                                                    <span className="ml-0.5 text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={lastNamePaternal}
                                                    onChange={(e) =>
                                                        setLastNamePaternal(
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    required
                                                    placeholder="Ej: PEREZ"
                                                    className="dark:bg-neutral-955 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-[11px] font-bold tracking-wider text-gray-500 uppercase">
                                                    Apellido Materno{' '}
                                                    <span className="ml-0.5 text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={lastNameMaternal}
                                                    onChange={(e) =>
                                                        setLastNameMaternal(
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    required
                                                    placeholder="Ej: GOMEZ"
                                                    className="dark:bg-neutral-955 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                                Correo Electrónico de Contacto{' '}
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <p className="mb-2 text-[11px] text-gray-400">
                                                Aquí recibirá las notificaciones
                                                del estatus de su reembolso.
                                            </p>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                required
                                                placeholder="correo@ejemplo.com"
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                                CLABE Interbancaria (18 dígitos){' '}
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <p className="mb-2 text-[11px] text-gray-400">
                                                Asegúrese de que la cuenta esté
                                                a nombre del titular del
                                                reembolso.
                                            </p>
                                            <input
                                                type="text"
                                                value={clabe}
                                                onChange={(e) => {
                                                    const val =
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        );
                                                    setClabe(val);
                                                    if (val.length >= 3) {
                                                        const prefix =
                                                            val.substring(0, 3);
                                                        const matchedBank =
                                                            banks.find(
                                                                (b) =>
                                                                    b.code ===
                                                                    prefix,
                                                            );
                                                        if (matchedBank) {
                                                            if (
                                                                matchedBank.enabled
                                                            ) {
                                                                setBankName(
                                                                    matchedBank.name,
                                                                );
                                                                setClabeError(
                                                                    '',
                                                                );
                                                            } else {
                                                                setBankName('');
                                                                setClabeError(
                                                                    `El banco "${matchedBank.name}" no está habilitado para recibir reembolsos.`,
                                                                );
                                                            }
                                                        } else {
                                                            setClabeError(
                                                                'Prefijo de CLABE no reconocido.',
                                                            );
                                                        }
                                                    } else {
                                                        setClabeError('');
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
                                                maxLength={18}
                                                required
                                                placeholder="012345678901234567"
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900"
                                            />
                                            {clabeError && (
                                                <p className="mt-1.5 text-xs font-semibold text-red-500">
                                                    {clabeError}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                                Confirmar CLABE Interbancaria
                                                (18 dígitos){' '}
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <p className="mb-2 text-[11px] text-gray-400">
                                                Escriba nuevamente su CLABE
                                                interbancaria para confirmación.
                                            </p>
                                            <input
                                                type="text"
                                                value={confirmClabe}
                                                onChange={(e) =>
                                                    setConfirmClabe(
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
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
                                                maxLength={18}
                                                required
                                                placeholder="012345678901234567"
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                                Nombre del Banco{' '}
                                                <span className="ml-1 text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <p className="mb-2 text-[11px] text-gray-400">
                                                Seleccione la institución
                                                financiera de su cuenta.
                                            </p>
                                            <select
                                                value={bankName}
                                                onChange={(e) =>
                                                    setBankName(e.target.value)
                                                }
                                                required
                                                className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                                            >
                                                <option value="">
                                                    Seleccione un banco...
                                                </option>
                                                {banks
                                                    .filter((b) => b.enabled)
                                                    .map((b) => (
                                                        <option
                                                            key={b.code}
                                                            value={b.name}
                                                        >
                                                            {b.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Cash tickets verification (Individual Ticket IDs) */}
                                    {!requiresEmail && (
                                        <div
                                            id="ticket-validation-container"
                                            className={`space-y-4 rounded-2xl border bg-gray-50/50 p-4 transition-all duration-500 dark:bg-neutral-900/50 ${
                                                highlightTicketInput
                                                    ? 'scale-[1.02] border-red-500 shadow-lg ring-4 shadow-red-500/10 ring-red-500/20 dark:border-red-500 dark:ring-red-500/30'
                                                    : 'border-gray-200 dark:border-neutral-800'
                                            }`}
                                        >
                                            <div>
                                                <h3 className="text-xs font-bold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                                                    Validación de Boletos
                                                    Físicos
                                                </h3>
                                                <p className="mt-1 text-[11px] text-gray-400">
                                                    Ingrese el IDE de cada
                                                    boleto uno por uno para
                                                    certificar que pertenecen a
                                                    esta orden.
                                                </p>
                                                {ticketSampleImage && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowSampleModal(
                                                                true,
                                                            )
                                                        }
                                                        className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[#c90000] hover:underline dark:text-red-400"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        ¿Dónde encuentro el IDE
                                                        de mi boleto?
                                                    </button>
                                                )}
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
                                                    onChange={(e) =>
                                                        setBarcodeInput(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Ej: 0999976175"
                                                    className="flex-grow rounded-xl border border-gray-200 bg-white p-3 text-sm transition focus:ring-2 focus:ring-[#c90000] focus:outline-none dark:border-neutral-800 dark:bg-neutral-950"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={ticketLoading}
                                                    onClick={
                                                        handleVerifyIndividualTicket
                                                    }
                                                    className="rounded-xl bg-gray-900 p-3 px-4 text-xs font-bold text-white transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                                                >
                                                    {ticketLoading
                                                        ? 'Validando...'
                                                        : 'Agregar'}
                                                </button>
                                            </div>

                                            {/* List of validated tickets */}
                                            {validatedTicketsList.length >
                                                0 && (
                                                <div className="space-y-2 pt-2">
                                                    <p className="text-[11px] font-semibold text-gray-500 uppercase">
                                                        Boletos Validados (
                                                        {
                                                            validatedTicketsList.length
                                                        }
                                                        ):
                                                    </p>
                                                    <div className="border-gray-150 dark:border-neutral-850 max-h-64 space-y-2 overflow-y-auto rounded-xl border bg-white p-2 dark:bg-neutral-950">
                                                        {validatedTicketsList.map(
                                                            (t, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex flex-col space-y-2 border-b border-gray-50 pb-2 pl-1 text-xs last:border-0 dark:border-neutral-800"
                                                                >
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <span className="block font-semibold">
                                                                                {
                                                                                    t.area
                                                                                }{' '}
                                                                                -
                                                                                Asiento{' '}
                                                                                {
                                                                                    t.seat
                                                                                }
                                                                            </span>
                                                                            <span className="font-mono text-[10px] text-gray-400">
                                                                                IDE:{' '}
                                                                                {t.ticket_id ||
                                                                                    t.barcode}
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleRemoveTicket(
                                                                                    t.barcode,
                                                                                )
                                                                            }
                                                                            className="mt-1 mr-1 p-1 text-red-500 hover:text-red-700"
                                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="h-4 w-4"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth="2"
                                                                                    d="M6 18L18 6M6 6l12 12"
                                                                                />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">
                                                                        <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">
                                                                            Foto
                                                                            del
                                                                            Boleto{' '}
                                                                            <span className="text-red-500">
                                                                                *
                                                                            </span>
                                                                        </label>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*,application/pdf"
                                                                            required
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                handleTicketPhotoInput(
                                                                                    e,
                                                                                    t.barcode,
                                                                                )
                                                                            }
                                                                            className="w-full text-[10px] text-gray-500 transition file:mr-2 file:rounded-md file:border-0 file:bg-gray-200 file:px-2 file:py-1 file:text-[10px] file:font-semibold file:text-gray-700 hover:file:bg-gray-300 dark:file:bg-neutral-800 dark:file:text-gray-300"
                                                                        />
                                                                        {t.photoFile && (
                                                                            <span className="mt-1 block text-[10px] text-green-600">
                                                                                ✓{' '}
                                                                                {
                                                                                    t
                                                                                        .photoFile
                                                                                        .name
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* INE File */}
                                    <div>
                                        <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                            Identificación Oficial
                                            (INE/Pasaporte){' '}
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <p className="mb-2 text-[11px] text-gray-400">
                                            Adjuntar imagen clara o archivo PDF
                                            (Max 10MB).
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            required
                                            onChange={(e) =>
                                                handleFileInput(e, setIneFile)
                                            }
                                            className="w-full text-sm text-gray-500 transition file:mr-4 file:rounded-xl file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-neutral-800 dark:file:text-gray-300"
                                        />
                                        {ineFile && (
                                            <span className="mt-1 block text-[11px] text-green-600">
                                                ✓ Listo: {ineFile.name} (~
                                                {(ineFile.size / 1024).toFixed(
                                                    0,
                                                )}{' '}
                                                KB)
                                            </span>
                                        )}
                                    </div>

                                    {/* Legal disclaimer checkbox */}
                                    <div className="border-gray-150 flex items-start space-x-3 rounded-2xl border bg-gray-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <input
                                            type="checkbox"
                                            id="acceptedTerms"
                                            checked={acceptedTerms}
                                            onChange={(e) =>
                                                setAcceptedTerms(
                                                    e.target.checked,
                                                )
                                            }
                                            required
                                            className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-[#c90000] focus:ring-[#c90000]"
                                        />
                                        <label
                                            htmlFor="acceptedTerms"
                                            className="cursor-pointer text-xs leading-relaxed text-gray-500 select-none dark:text-gray-400"
                                        >
                                            Bajo protesta de decir verdad,{' '}
                                            <strong className="font-semibold text-gray-700 dark:text-gray-300">
                                                manifiesto mi conformidad
                                            </strong>{' '}
                                            y ratifico que todos los datos
                                            proporcionados en este formulario
                                            son verdaderos, vigentes y
                                            corresponden a la operación
                                            especificada. Acepto tener pleno
                                            conocimiento de las{' '}
                                            <strong className="font-semibold text-gray-700 dark:text-gray-300">
                                                responsabilidades civiles y
                                                legales
                                            </strong>{' '}
                                            en las que podría incurrir en caso
                                            de proporcionar información falsa,
                                            inexacta o con dolo. Autorizo el uso
                                            de estos datos{' '}
                                            <strong className="font-semibold text-gray-700 dark:text-gray-300">
                                                únicamente para el trámite de
                                                devolución
                                            </strong>{' '}
                                            a la cuenta bancaria indicada.
                                        </label>
                                    </div>

                                    <div className="flex space-x-3 pt-2">
                                        <button
                                            type="button"
                                            disabled={loading || isCompresing}
                                            onClick={() => setStep(1)}
                                            className="w-1/3 rounded-2xl bg-gray-100 p-4 font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
                                        >
                                            Atrás
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={
                                                loading ||
                                                isCompresing ||
                                                !acceptedTerms
                                            }
                                            className="w-2/3 rounded-2xl bg-[#c90000] p-4 font-bold text-white shadow-lg shadow-[#c90000]/20 transition hover:bg-[#a60000] disabled:opacity-50"
                                        >
                                            {isCompresing
                                                ? 'Comprimiendo...'
                                                : loading
                                                  ? 'Enviando...'
                                                  : 'Enviar Solicitud'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Public Refund FAQs Section */}
                        <RefundFaqSection className="mt-12 md:mt-16" />
                    </div>
                </main>

                {/* Ticket ID Help Modal */}
                {showSampleModal && ticketSampleImage && (
                    <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-250 fade-in">
                        <div
                            className="relative w-full max-w-lg animate-in rounded-3xl bg-white p-6 shadow-2xl duration-250 zoom-in-95 dark:bg-neutral-900"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Ubicación del IDE de Boleto
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowSampleModal(false)}
                                    className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                            <div className="mb-4 flex items-center justify-center overflow-hidden rounded-2xl border bg-gray-50 p-2 dark:bg-neutral-950">
                                <img
                                    src={ticketSampleImage}
                                    alt="Guía de ubicación de IDE"
                                    className="max-h-[60vh] rounded-xl object-contain"
                                />
                            </div>
                            <p className="text-center text-xs leading-relaxed text-gray-500">
                                Utiliza el código numérico señalado como IDE en
                                la imagen de muestra para validar tus boletos.
                            </p>
                        </div>
                    </div>
                )}
                {/* Tickets Warning/Confirmation Modal */}
                {showTicketsWarningModal && (
                    <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200 fade-in">
                        <div
                            className="relative w-full max-w-md animate-in rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl duration-200 zoom-in-95 md:p-8 dark:border-neutral-800 dark:bg-neutral-900"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-4 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-200/60 bg-amber-50 text-amber-600 shadow-md dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                        stroke="currentColor"
                                        className="h-8 w-8 animate-bounce"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                        />
                                    </svg>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                                        ¿Tienes más boletos en esta orden?
                                    </h3>
                                    <p className="text-sm leading-relaxed font-medium text-gray-500 dark:text-gray-400">
                                        Quedan boletos disponibles para
                                        reembolso en esta orden que aún no has
                                        agregado a esta solicitud.
                                    </p>
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3 text-left text-xs leading-normal font-medium text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
                                        <strong>Nota importante:</strong> Te
                                        recomendamos agregar todos tus boletos
                                        en esta misma solicitud. Una vez que se
                                        complete el trámite de esta orden, el
                                        sistema ya no permitirá ingresar nuevas
                                        solicitudes de reembolso para ella.
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2.5 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleAddMoreTickets}
                                        className="flex w-full transform cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#c90000] to-[#b30000] py-3.5 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-[#c90000]/20 transition hover:from-[#e60000] hover:to-[#c90000] active:scale-95"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="2"
                                            stroke="currentColor"
                                            className="h-4 w-4"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 4.5v15m7.5-7.5h-15"
                                            />
                                        </svg>
                                        Agregar el otro boleto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmOnlySubmit}
                                        className="w-full cursor-pointer rounded-2xl bg-gray-100 py-3 text-xs font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
                                    >
                                        Sí, continuar con la solicitud actual
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <PublicFooter />
            </div>
        </GeolocationProvider>
    );
}

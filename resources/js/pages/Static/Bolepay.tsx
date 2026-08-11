import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    Calendar,
    ShieldCheck,
    Zap,
    Search,
    MapPin,
    Heart,
    Percent,
    Award,
    Headphones,
    Clock,
    ChevronDown,
    Ban,
    Ticket,
    CreditCard,
    Instagram,
    Twitter,
    Facebook,
} from 'lucide-react';
import { useState, useEffect, useRef, ReactNode } from 'react';

// --- Animation Components ---

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    className?: string;
    direction?: 'up' | 'down' | 'left' | 'right';
}

function FadeIn({
    children,
    delay = 0,
    className = '',
    direction = 'up',
}: FadeInProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px',
            },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    const getTransform = () => {
        if (isVisible) return 'translate-x-0 translate-y-0';
        switch (direction) {
            case 'up':
                return 'translate-y-8';
            case 'down':
                return '-translate-y-8';
            case 'left':
                return 'translate-x-8';
            case 'right':
                return '-translate-x-8';
            default:
                return 'translate-y-8';
        }
    };

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out ${className} ${
                isVisible
                    ? 'opacity-100 ' + getTransform()
                    : 'opacity-0 ' + getTransform()
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export default function Bolepay() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activeMode, setActiveMode] = useState<'taquilla' | 'website'>(
        'taquilla',
    );

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: '¿Cuánto tiempo tengo para pagar mis boletos?',
            answer: 'El tiempo de pago varía según el evento. Tienes hasta 10 días previos al evento para liquidar completamente.',
        },
        {
            question: '¿Cobran intereses?',
            answer: 'Sí, aplicamos una tasa de interés baja y transparente. Todos los costos se te explican claramente antes de la compra.',
        },
        {
            question: '¿Dónde puedo usarlo?',
            answer: 'Puedes usar Bolepay en todas las taquillas autorizadas de Boletea a nivel nacional.',
        },
        {
            question: '¿Cómo sé mis fechas de pago?',
            answer: 'Recibirás un calendario detallado con todas las fechas y montos de pago al momento de la compra.',
        },
        {
            question: '¿Cuándo recibo mis boletos?',
            answer: 'Recibirás tus boletos una vez que hayas completado todos los pagos, con tiempo suficiente antes del evento.',
        },
        {
            question: '¿Quién puede usar Bolepay?',
            answer: 'Cualquier persona mayor de 18 años con identificación oficial puede usar Bolepay, sin necesidad de tarjeta de crédito.',
        },
        {
            question: '¿Qué pasa si me pasé de la fecha de pago?',
            answer: 'Te contactaremos para regularizar tu situación. Es importante mantenerte al día con los pagos para no perder tu boleto.',
        },
    ];

    return (
        <div className="min-h-screen overflow-x-hidden bg-gray-50 font-['Instrument_Sans'] text-gray-900 selection:bg-[#2563eb] selection:text-white dark:bg-background dark:text-gray-100">
            <Head title="Bolepay - Boletea" />
            <PublicHeader />

            <main>
                {/* Hero Section */}
                <section className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[linear-gradient(135deg,#2563eb_0%,var(--color-red-hex)_100%)] text-white">
                    <div className="relative z-10 container mx-auto px-6 text-center">
                        <div className="mb-8 flex justify-center">
                            <FadeIn delay={0} direction="down">
                                <img
                                    src="/images/LOGOBOLEPAYNEGRO.png"
                                    alt="Bolepay"
                                    className="h-24 drop-shadow-sm md:h-34"
                                />
                            </FadeIn>
                        </div>

                        <FadeIn delay={200}>
                            <h1 className="mb-6 text-4xl leading-tight font-black text-white md:text-6xl lg:text-7xl">
                                ¡Vive tus eventos <br />
                                <span className="text-white">favoritos</span> y
                                págalos a tu <br />
                                ritmo!
                            </h1>
                        </FadeIn>

                        <FadeIn delay={400}>
                            <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed font-medium text-white/90">
                                Divide tu pago en semanas sin necesidad de
                                tarjeta de crédito.
                            </p>
                        </FadeIn>
                    </div>
                </section>

                {/* What is Bolepay Section */}
                <section className="bg-white py-16 dark:bg-background">
                    <div className="container mx-auto px-6 text-center">
                        <FadeIn>
                            <h2 className="mb-8 text-3xl font-bold tracking-tight md:text-4xl">
                                ¿Qué es{' '}
                                <span className="text-[#2563eb]">Bolepay</span>?
                            </h2>
                        </FadeIn>

                        <div className="mx-auto mb-16 max-w-4xl">
                            <FadeIn delay={200}>
                                <p className="mb-8 text-xl leading-relaxed text-gray-600 dark:text-muted-foreground">
                                    Bolepay es la primera plataforma en México
                                    que te permite pagar tus boletos de
                                    conciertos, shows y eventos en semanas,
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {' '}
                                        sin necesidad de tarjeta de crédito.
                                    </span>
                                </p>
                            </FadeIn>
                            <FadeIn delay={300}>
                                <div className="inline-block rounded-2xl border border-gray-100 bg-gray-50 px-8 py-6 shadow-sm dark:border-border dark:bg-card">
                                    <h3 className="mb-2 text-xl font-bold text-[#2563eb]">
                                        Entretenimiento + Facilidad de pagos
                                    </h3>
                                    <p className="font-medium text-gray-500">
                                        Compra hoy, paga en semanas
                                    </p>
                                </div>
                            </FadeIn>
                        </div>

                        {/* Features Grid */}
                        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-3">
                            {[
                                {
                                    icon: Calendar,
                                    text: 'Calendario semanal',
                                    color: 'text-[#2563eb]',
                                },
                                {
                                    icon: Ban,
                                    text: 'No requiere tarjeta',
                                    color: 'text-[#2563eb]',
                                },
                                {
                                    icon: ShieldCheck,
                                    text: 'Seguro',
                                    color: 'text-[#2563eb]',
                                },
                                {
                                    icon: HandHoldingUsdIcon,
                                    text: 'Accesible',
                                    color: 'text-[#2563eb]',
                                    customIcon: true,
                                },
                                {
                                    icon: Zap,
                                    text: 'Rápido y sencillo',
                                    color: 'text-[#2563eb]',
                                },
                                {
                                    icon: Search,
                                    text: 'Sin letras chiquitas',
                                    color: 'text-[#2563eb]',
                                },
                            ].map((item, index) => (
                                <FadeIn
                                    key={index}
                                    delay={index * 100}
                                    className="h-full"
                                >
                                    <div className="group flex h-full flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-border dark:bg-card">
                                        {item.customIcon ? (
                                            <item.icon
                                                className={`mb-4 h-10 w-10 ${item.color} transition-transform group-hover:scale-110`}
                                            />
                                        ) : (
                                            <item.icon
                                                className={`mb-4 h-10 w-10 ${item.color} transition-transform group-hover:scale-110`}
                                            />
                                        )}
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {item.text}
                                        </span>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section
                    id="como-funciona"
                    className="section-bg-pattern relative bg-gray-50 py-20 dark:bg-card/30"
                >
                    <div className="container mx-auto px-6">
                        <FadeIn>
                            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
                                ¿Cómo funciona?
                            </h2>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <div className="mb-16 flex justify-center gap-4">
                                <button
                                    onClick={() => setActiveMode('taquilla')}
                                    className={`flex transform items-center gap-2 rounded-full px-6 py-3 font-bold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                                        activeMode === 'taquilla'
                                            ? 'bg-[#2563eb] text-white shadow-blue-600/30 hover:bg-[#1d4ed8]'
                                            : 'border border-gray-200 bg-white text-gray-600 dark:border-border dark:bg-background dark:text-muted-foreground'
                                    }`}
                                >
                                    <Ticket className="h-5 w-5" />
                                    Taquilla/Físico
                                </button>
                                <button
                                    onClick={() => setActiveMode('website')}
                                    className={`flex transform items-center gap-2 rounded-full px-6 py-3 font-bold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                                        activeMode === 'website'
                                            ? 'bg-[#2563eb] text-white shadow-blue-600/30 hover:bg-[#1d4ed8]'
                                            : 'border border-gray-200 bg-white text-gray-600 dark:border-border dark:bg-background dark:text-muted-foreground'
                                    }`}
                                >
                                    <CreditCard className="h-5 w-5" />
                                    Website
                                </button>
                            </div>
                        </FadeIn>

                        {/* Taquilla/Físico Process */}
                        {activeMode === 'taquilla' && (
                            <div className="mx-auto max-w-4xl space-y-6">
                                {[
                                    {
                                        number: 1,
                                        title: 'Escoge tu evento',
                                        desc: 'Dirígete a taquillas autorizadas',
                                        action: {
                                            text: 'Ubica tu taquilla',
                                            link: route('sales-centers.public'),
                                            icon: MapPin,
                                        },
                                    },
                                    {
                                        number: 2,
                                        title: 'Paga con Bolepay',
                                        desc: 'Abona solo el 25% inicial',
                                    },
                                    {
                                        number: 3,
                                        title: 'Conoce tus fechas',
                                        desc: 'Montos de pago restantes',
                                    },
                                    {
                                        number: 4,
                                        title: 'Recibe tu boleto',
                                        desc: 'Una vez que terminas de pagar (tienes 10 días previo a tu evento para liquidar)',
                                    },
                                ].map((step, i) => (
                                    <FadeIn
                                        key={i}
                                        delay={i * 150}
                                        direction="left"
                                    >
                                        <div className="flex flex-col items-start gap-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all hover:border-[#2563eb]/30 hover:shadow-lg md:flex-row md:items-center dark:border-border dark:bg-card">
                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#2563eb]/10 text-xl font-black text-[#2563eb]">
                                                {step.number}
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
                                                    {step.title}
                                                </h3>
                                                <p className="text-gray-600 dark:text-muted-foreground">
                                                    {step.desc}
                                                </p>
                                            </div>
                                            {step.action && (
                                                <Link
                                                    href={step.action.link}
                                                    className="mt-4 flex transform items-center gap-2 rounded-xl bg-[#f59e0b] px-6 py-2 font-bold text-white shadow-sm transition-colors duration-200 hover:scale-105 hover:bg-[#d97706] md:mt-0"
                                                >
                                                    <step.action.icon className="h-4 w-4" />
                                                    {step.action.text}
                                                </Link>
                                            )}
                                        </div>
                                    </FadeIn>
                                ))}
                            </div>
                        )}

                        {/* Website Process */}
                        {activeMode === 'website' && (
                            <div className="mx-auto max-w-6xl space-y-12">
                                {/* Step 1: Selecciona tus lugares */}
                                <FadeIn delay={0}>
                                    <div className="grid items-center gap-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:grid-cols-2 dark:border-border dark:bg-card">
                                        <div className="order-2 md:order-1">
                                            <div className="mb-4 flex items-center gap-4">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#2563eb]/10 text-xl font-black text-[#2563eb]">
                                                    1
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    Selecciona tus lugares
                                                </h3>
                                            </div>
                                            <p className="text-lg leading-relaxed text-gray-600 dark:text-muted-foreground">
                                                Primero selecciona tus lugares
                                                pulsando sobre la zona de
                                                interés en el mapa
                                            </p>
                                        </div>
                                        <div className="order-1 flex justify-center md:order-2">
                                            <img
                                                src="/images/bolepay/Step-1.png"
                                                alt="Selecciona tus lugares en el mapa"
                                                className="w-full max-w-[350px] rounded-[40px] drop-shadow-2xl"
                                            />
                                        </div>
                                    </div>
                                </FadeIn>

                                {/* Step 2: Procede a realizar el pago inicial */}
                                <FadeIn delay={150}>
                                    <div className="grid items-center gap-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:grid-cols-2 dark:border-border dark:bg-card">
                                        <div className="flex justify-center">
                                            <img
                                                src="/images/bolepay/Step-2.png"
                                                alt="Aplica el código BOLEPAY"
                                                className="w-full max-w-[350px] rounded-[40px] drop-shadow-2xl"
                                            />
                                        </div>
                                        <div>
                                            <div className="mb-4 flex items-center gap-4">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#2563eb]/10 text-xl font-black text-[#2563eb]">
                                                    2
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    Aplica el código BOLEPAY
                                                </h3>
                                            </div>
                                            <p className="mb-4 text-lg leading-relaxed text-gray-600 dark:text-muted-foreground">
                                                Aplica el código{' '}
                                                <span className="font-bold text-[#2563eb]">
                                                    BOLEPAY
                                                </span>{' '}
                                                para habilitar la opción de
                                                comprar tus boletos en pagos.
                                            </p>
                                            <div className="inline-block rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-[2px]">
                                                <div className="rounded-xl bg-white px-6 py-3 dark:bg-card">
                                                    <p className="mb-1 text-sm text-gray-500 dark:text-muted-foreground">
                                                        Código promocional
                                                    </p>
                                                    <p className="text-2xl font-black text-[#2563eb]">
                                                        BOLEPAY
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-sm text-gray-500 dark:text-muted-foreground">
                                                Con BOLEPAY pagas{' '}
                                                <span className="font-bold text-[#2563eb]">
                                                    25% del costo del boleto +
                                                    cargo por servicio
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </FadeIn>

                                {/* Step 3: Aplica el código BOLEPAY */}
                                <FadeIn delay={300}>
                                    <div className="grid items-center gap-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:grid-cols-2 dark:border-border dark:bg-card">
                                        <div className="order-2 md:order-1">
                                            <div className="mb-4 flex items-center gap-4">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#2563eb]/10 text-xl font-black text-[#2563eb]">
                                                    3
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    Procede a realizar el pago
                                                    inicial
                                                </h3>
                                            </div>
                                            <div className="space-y-3 text-gray-600 dark:text-muted-foreground">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#2563eb]"></div>
                                                    <p>
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            Total de compra:
                                                        </span>{' '}
                                                        Monto total de tus
                                                        boletos
                                                    </p>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#2563eb]"></div>
                                                    <p>
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            Saldo a diferir:
                                                        </span>{' '}
                                                        Lo que pagarás en
                                                        semanas
                                                    </p>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#2563eb]"></div>
                                                    <p>
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            Pago inicial:
                                                        </span>{' '}
                                                        Solo 25% del costo +
                                                        cargo por servicio
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="order-1 flex justify-center md:order-2">
                                            <img
                                                src="/images/bolepay/Step-3.png"
                                                alt="Desglose de pago"
                                                className="w-full max-w-[350px] rounded-[40px] drop-shadow-2xl"
                                            />
                                        </div>
                                    </div>
                                </FadeIn>

                                {/* Step 4: Recuerda */}
                                <FadeIn delay={450}>
                                    <div className="grid items-center gap-8 rounded-2xl border-2 border-[#2563eb]/20 bg-gradient-to-br from-[#2563eb]/5 to-purple-500/5 p-8 md:grid-cols-2 dark:from-[#2563eb]/10 dark:to-purple-500/10">
                                        <div className="flex justify-center">
                                            <img
                                                src="/images/bolepay/step4.png"
                                                alt="Recuerda liquidar tu compra"
                                                className="w-full max-w-[350px] rounded-[40px] drop-shadow-2xl"
                                            />
                                        </div>
                                        <div>
                                            <div className="mb-4 flex items-center gap-4">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xl font-black text-white">
                                                    4
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    ¡RECUERDA!
                                                </h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card">
                                                    <p className="mb-2 font-bold text-gray-900 dark:text-white">
                                                        Tus boletos serán
                                                        enviados hasta liquidar
                                                        el saldo pendiente.
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                                        Recibirás tus boletos
                                                        digitales una vez que
                                                        completes todos los
                                                        pagos programados.
                                                    </p>
                                                </div>
                                                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-border dark:bg-card">
                                                    <p className="mb-2 font-bold text-gray-900 dark:text-white">
                                                        Tienes hasta 8 días
                                                        antes del evento para
                                                        liquidar tu compra.
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                                        Si no liquidas el total,
                                                        tu orden se cancelará
                                                        automáticamente.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            </div>
                        )}
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="bg-white py-20 dark:bg-background">
                    <div className="container mx-auto px-6">
                        <div className="mb-16 text-center">
                            <FadeIn>
                                <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl dark:text-white">
                                    Beneficios para ti
                                </h2>
                                <p className="text-lg text-gray-500">
                                    La forma inteligente de no perderte ese
                                    evento por falta de tarjeta o efectivo al
                                    instante.
                                </p>
                            </FadeIn>
                        </div>

                        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                { icon: Calendar, text: 'Controla tus pagos' },
                                {
                                    icon: Heart,
                                    text: 'Fácil, seguro, sin estrés',
                                },
                                { icon: Percent, text: 'Baja tasa de interés' },
                                { icon: Award, text: 'Respaldado por Boletea' },
                                {
                                    icon: Headphones,
                                    text: 'Atención al cliente',
                                },
                                {
                                    icon: Clock,
                                    text: 'Compra con anticipación sin complicaciones',
                                },
                            ].map((benefit, i) => (
                                <FadeIn key={i} delay={i * 100}>
                                    <div className="h-full rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-lg dark:border-border dark:bg-card dark:hover:bg-slate-800">
                                        <benefit.icon className="mx-auto mb-4 h-12 w-12 text-[#2563eb]" />
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {benefit.text}
                                        </h3>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Trust/Testimonial Section */}
                <section className="bg-gray-50 py-20 dark:bg-card/50">
                    <div className="container mx-auto max-w-3xl px-6 text-center">
                        <FadeIn>
                            <h2 className="mb-12 text-3xl font-bold tracking-tight md:text-4xl">
                                ¿Por qué confiar en nosotros?
                            </h2>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <div className="mb-16">
                                <blockquote className="relative inline-block font-serif text-2xl text-gray-700 italic dark:text-muted-foreground">
                                    "
                                    {/* Using simple quotes to avoid complex positioning issues, keeping it clean */}
                                    No tenía tarjeta y aún así fui al concierto
                                    de mi artista favorito. Con Bolepay, pude
                                    pagarlo a mi ritmo y vivir al máximo. "
                                </blockquote>
                                <cite className="mt-6 block text-lg font-bold text-gray-900 not-italic dark:text-white">
                                    – Daniela García
                                </cite>
                            </div>
                        </FadeIn>

                        <FadeIn delay={400}>
                            <div className="flex flex-col items-center">
                                <img
                                    src="images/logoBoletea.png"
                                    alt="Boletea"
                                    className="mb-6 h-10 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                                />
                                <p className="font-medium text-gray-600 dark:text-muted-foreground">
                                    "Nos respalda Boletea, boletera con
                                    presencia nacional y más de 10 años de
                                    experiencia en eventos en vivo."
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="bg-white py-20 dark:bg-background">
                    <div className="container mx-auto max-w-3xl px-6">
                        <FadeIn>
                            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
                                Preguntas frecuentes
                            </h2>
                        </FadeIn>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <FadeIn
                                    key={index}
                                    delay={index * 50}
                                    direction="left"
                                >
                                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-border dark:bg-card">
                                        <button
                                            onClick={() => toggleFaq(index)}
                                            className="flex w-full items-center justify-between p-6 text-left font-bold text-gray-900 transition-colors hover:bg-gray-50 dark:text-white dark:hover:bg-[#1a1a1a]"
                                        >
                                            {faq.question}
                                            <ChevronDown
                                                className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-[#2563eb]' : ''}`}
                                            />
                                        </button>
                                        <div
                                            className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-48' : 'max-h-0'}`}
                                        >
                                            <div className="mt-2 border-t border-gray-100 p-6 pt-0 leading-relaxed text-gray-600 dark:border-border dark:text-muted-foreground">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                            <Link
                                href={
                                    route('static.terminosycondiciones') +
                                    '#bolepay'
                                }
                                className="block text-center text-blue-600 hover:underline dark:text-blue-400"
                            >
                                Consulta los terminos y concidciones de Bolepay
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-gray-50 py-20 dark:bg-card/30">
                    <div className="container mx-auto px-6 text-center">
                        <div className="mb-16">
                            <FadeIn>
                                <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                                    ¿Dónde comprar?
                                </h3>
                                <Link
                                    href={route('sales-centers.public')}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/30 transition-transform hover:-translate-y-1 hover:bg-[#1d4ed8] hover:shadow-blue-600/50"
                                >
                                    <MapPin className="h-6 w-6" />
                                    Ubica tu taquilla
                                </Link>
                            </FadeIn>
                        </div>

                        <div>
                            <FadeIn delay={200}>
                                <h3 className="mb-8 text-xl font-bold text-gray-900 dark:text-white">
                                    Sigue nuestras redes y vive al máximo
                                </h3>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <SocialLink
                                            href="https://facebook.com/bolepaymx"
                                            icon={Facebook}
                                        />
                                        <SocialLink
                                            href="https://instagram.com/bolepaymx"
                                            icon={Instagram}
                                        />
                                        <SocialLink
                                            href="https://tiktok.com/@bolepaymx"
                                            icon={TiktokIcon}
                                        />
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </section>

                {/* Footer Unified */}
                <PublicFooter />
            </main>
        </div>
    );
}

// HandHoldingUsdIcon custom component
function HandHoldingUsdIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M12 1v14" />
            <path d="M17 5v10" />
            <path d="M7 5v10" />
            <path d="M17 19h4" />
            <path d="M7 19H3" />
            <path d="M22 19a2 2 0 1 1-2 2" />
            <path d="M4 19a2 2 0 1 0 2 2" />
            <path d="M13.4 19a2 2 0 1 0-2.8 0" />
        </svg>
    );
}

function TiktokIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    );
}

function SocialLink({ href, icon: Icon }: { href: string; icon: any }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-lg transition-transform hover:scale-110"
        >
            <Icon className="h-6 w-6 shrink-0" />
        </a>
    );
}

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
    Facebook
} from 'lucide-react';
import { useState, useEffect, useRef, ReactNode } from 'react';

// --- Animation Components ---

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    className?: string;
    direction?: 'up' | 'down' | 'left' | 'right';
}

function FadeIn({ children, delay = 0, className = "", direction = 'up' }: FadeInProps) {
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
                rootMargin: "0px 0px -50px 0px"
            }
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
            case 'up': return 'translate-y-8';
            case 'down': return '-translate-y-8';
            case 'left': return 'translate-x-8';
            case 'right': return '-translate-x-8';
            default: return 'translate-y-8';
        }
    };

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out ${className} ${isVisible ? 'opacity-100 ' + getTransform() : 'opacity-0 ' + getTransform()
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export default function Bolepay() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activeMode, setActiveMode] = useState<'taquilla' | 'website'>('taquilla');

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "¿Cuánto tiempo tengo para pagar mis boletos?",
            answer: "El tiempo de pago varía según el evento. Tienes hasta 10 días previos al evento para liquidar completamente."
        },
        {
            question: "¿Cobran intereses?",
            answer: "Sí, aplicamos una tasa de interés baja y transparente. Todos los costos se te explican claramente antes de la compra."
        },
        {
            question: "¿Dónde puedo usarlo?",
            answer: "Puedes usar Bolepay en todas las taquillas autorizadas de Boletea a nivel nacional."
        },
        {
            question: "¿Cómo sé mis fechas de pago?",
            answer: "Recibirás un calendario detallado con todas las fechas y montos de pago al momento de la compra."
        },
        {
            question: "¿Cuándo recibo mis boletos?",
            answer: "Recibirás tus boletos una vez que hayas completado todos los pagos, con tiempo suficiente antes del evento."
        },
        {
            question: "¿Quién puede usar Bolepay?",
            answer: "Cualquier persona mayor de 18 años con identificación oficial puede usar Bolepay, sin necesidad de tarjeta de crédito."
        },
        {
            question: "¿Qué pasa si me pasé de la fecha de pago?",
            answer: "Te contactaremos para regularizar tu situación. Es importante mantenerte al día con los pagos para no perder tu boleto."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100 font-['Instrument_Sans'] selection:bg-[#2563eb] selection:text-white overflow-x-hidden">
            <Head title="Bolepay - Boletea" />
            <PublicHeader />

            <main>
                {/* Hero Section */}
                <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[linear-gradient(135deg,#2563eb_0%,var(--color-red-hex)_100%)] text-white">
                    <div className="container mx-auto px-6 relative z-10 text-center">
                        <div className="flex justify-center mb-8">
                            <FadeIn delay={0} direction="down">
                                <img src="/images/LOGOBOLEPAYNEGRO.png" alt="Bolepay" className="h-24 md:h-34 drop-shadow-sm brightness-0 invert" />
                            </FadeIn>
                        </div>

                        <FadeIn delay={200}>
                            <h1 className="mb-6 text-4xl font-black md:text-6xl lg:text-7xl text-white leading-tight">
                                ¡Vive tus eventos <br />
                                <span className="text-white">favoritos</span> y págalos a tu <br />
                                ritmo!
                            </h1>
                        </FadeIn>

                        <FadeIn delay={400}>
                            <p className="mx-auto mb-10 max-w-3xl text-lg text-white/90 font-medium leading-relaxed">
                                Divide tu pago en semanas sin necesidad de tarjeta de crédito.
                            </p>
                        </FadeIn>
                    </div>
                </section>

                {/* What is Bolepay Section */}
                <section className="py-16 bg-white dark:bg-[#0a0a0a]">
                    <div className="container mx-auto px-6 text-center">
                        <FadeIn>
                            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-8">¿Qué es <span className="text-[#2563eb]">Bolepay</span>?</h2>
                        </FadeIn>

                        <div className="max-w-4xl mx-auto mb-16">
                            <FadeIn delay={200}>
                                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                                    Bolepay es la primera plataforma en México que te permite pagar tus boletos de conciertos, shows y eventos en semanas,
                                    <span className="font-bold text-gray-900 dark:text-white"> sin necesidad de tarjeta de crédito.</span>
                                </p>
                            </FadeIn>
                            <FadeIn delay={300}>
                                <div className="px-8 py-6 rounded-2xl bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-white/5 inline-block shadow-sm">
                                    <h3 className="text-xl font-bold text-[#2563eb] mb-2">Entretenimiento + Facilidad de pagos</h3>
                                    <p className="text-gray-500 font-medium">Compra hoy, paga en semanas</p>
                                </div>
                            </FadeIn>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {[
                                { icon: Calendar, text: "Calendario semanal", color: "text-[#2563eb]" },
                                { icon: Ban, text: "No requiere tarjeta", color: "text-[#2563eb]" },
                                { icon: ShieldCheck, text: "Seguro", color: "text-[#2563eb]" },
                                { icon: HandHoldingUsdIcon, text: "Accesible", color: "text-[#2563eb]", customIcon: true },
                                { icon: Zap, text: "Rápido y sencillo", color: "text-[#2563eb]" },
                                { icon: Search, text: "Sin letras chiquitas", color: "text-[#2563eb]" },
                            ].map((item, index) => (
                                <FadeIn key={index} delay={index * 100} className="h-full">
                                    <div className="group h-full flex flex-col items-center justify-center p-6 rounded-2xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                        {item.customIcon ? (
                                            <item.icon className={`w-10 h-10 mb-4 ${item.color} group-hover:scale-110 transition-transform`} />
                                        ) : (
                                            <item.icon className={`w-10 h-10 mb-4 ${item.color} group-hover:scale-110 transition-transform`} />
                                        )}
                                        <span className="font-bold text-gray-900 dark:text-white">{item.text}</span>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section id="como-funciona" className="py-20 bg-gray-50 dark:bg-[#111]/30 relative section-bg-pattern">
                    <div className="container mx-auto px-6">
                        <FadeIn>
                            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-12 text-center">¿Cómo funciona?</h2>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <div className="flex justify-center mb-16 gap-4">
                                <button
                                    onClick={() => setActiveMode('taquilla')}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95 transform duration-200 ${activeMode === 'taquilla'
                                        ? 'bg-[#2563eb] text-white shadow-blue-600/30 hover:bg-[#1d4ed8]'
                                        : 'bg-white dark:bg-[#222] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                                        }`}
                                >
                                    <Ticket className="w-5 h-5" />
                                    Taquilla/Físico
                                </button>
                                <button
                                    onClick={() => setActiveMode('website')}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95 transform duration-200 ${activeMode === 'website'
                                        ? 'bg-[#2563eb] text-white shadow-blue-600/30 hover:bg-[#1d4ed8]'
                                        : 'bg-white dark:bg-[#222] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                                        }`}
                                >
                                    <CreditCard className="w-5 h-5" />
                                    Website
                                </button>
                            </div>
                        </FadeIn>

                        {/* Taquilla/Físico Process */}
                        {activeMode === 'taquilla' && (
                            <div className="max-w-4xl mx-auto space-y-6">
                                {[
                                    { number: 1, title: "Escoge tu evento", desc: "Dirígete a taquillas autorizadas", action: { text: "Ubica tu taquilla", link: route('sales-centers.public'), icon: MapPin } },
                                    { number: 2, title: "Paga con Bolepay", desc: "Abona solo el 25% inicial" },
                                    { number: 3, title: "Conoce tus fechas", desc: "Montos de pago restantes" },
                                    { number: 4, title: "Recibe tu boleto", desc: "Una vez que terminas de pagar (tienes 10 días previo a tu evento para liquidar)" },
                                ].map((step, i) => (
                                    <FadeIn key={i} delay={i * 150} direction="left">
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-white/5 hover:border-[#2563eb]/30 transition-all hover:shadow-lg">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center text-xl font-black">
                                                {step.number}
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{step.title}</h3>
                                                <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
                                            </div>
                                            {step.action && (
                                                <Link href={step.action.link} className="mt-4 md:mt-0 px-6 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm hover:scale-105 transform duration-200">
                                                    <step.action.icon className="w-4 h-4" />
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
                            <div className="max-w-6xl mx-auto space-y-12">
                                {/* Step 1: Selecciona tus lugares */}
                                <FadeIn delay={0}>
                                    <div className="grid md:grid-cols-2 gap-8 items-center p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-white/5">
                                        <div className="order-2 md:order-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center text-xl font-black">
                                                    1
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Selecciona tus lugares</h3>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                                Primero selecciona tus lugares pulsando sobre la zona de interés en el mapa
                                            </p>
                                        </div>
                                        <div className="order-1 md:order-2 flex justify-center">
                                            <img
                                                src="/images/bolepay/step1.png"
                                                alt="Selecciona tus lugares en el mapa"
                                                className="max-w-[280px] w-full drop-shadow-2xl rounded-[40px]"
                                            />
                                        </div>
                                    </div>
                                </FadeIn>

                                {/* Step 2: Procede a realizar el pago inicial */}
                                <FadeIn delay={150}>
                                    <div className="grid md:grid-cols-2 gap-8 items-center p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-white/5">
                                        <div className="flex justify-center">
                                            <img
                                                src="/images/bolepay/step2.png"
                                                alt="Desglose de pago"
                                                className="max-w-[280px] w-full drop-shadow-2xl rounded-[40px]"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center text-xl font-black">
                                                    2
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Procede a realizar el pago inicial</h3>
                                            </div>
                                            <div className="space-y-3 text-gray-600 dark:text-gray-400">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-2 flex-shrink-0"></div>
                                                    <p><span className="font-bold text-gray-900 dark:text-white">Total de compra:</span> Monto total de tus boletos</p>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-2 flex-shrink-0"></div>
                                                    <p><span className="font-bold text-gray-900 dark:text-white">Saldo a diferir:</span> Lo que pagarás en semanas</p>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-2 flex-shrink-0"></div>
                                                    <p><span className="font-bold text-gray-900 dark:text-white">Pago inicial:</span> Solo 25% del costo + cargo por servicio</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>

                                {/* Step 3: Aplica el código BOLEPAY */}
                                <FadeIn delay={300}>
                                    <div className="grid md:grid-cols-2 gap-8 items-center p-8 rounded-2xl bg-white dark:bg-[#1a1a1a] shadow-sm border border-gray-100 dark:border-white/5">
                                        <div className="order-2 md:order-1">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center text-xl font-black">
                                                    3
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Aplica el código BOLEPAY</h3>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-4">
                                                Aplica el código <span className="font-bold text-[#2563eb]">BOLEPAY</span> para habilitar la opción de comprar tus boletos en pagos.
                                            </p>
                                            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-[2px] rounded-xl inline-block">
                                                <div className="bg-white dark:bg-[#1a1a1a] px-6 py-3 rounded-xl">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Código promocional</p>
                                                    <p className="text-2xl font-black text-[#2563eb]">BOLEPAY</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                                                Con BOLEPAY pagas <span className="font-bold text-[#2563eb]">25% del costo del boleto + cargo por servicio</span>
                                            </p>
                                        </div>
                                        <div className="order-1 md:order-2 flex justify-center">
                                            <img
                                                src="/images/bolepay/step3.png"
                                                alt="Aplica el código BOLEPAY"
                                                className="max-w-[280px] w-full drop-shadow-2xl rounded-[40px]"
                                            />
                                        </div>
                                    </div>
                                </FadeIn>

                                {/* Step 4: Recuerda */}
                                <FadeIn delay={450}>
                                    <div className="grid md:grid-cols-2 gap-8 items-center p-8 rounded-2xl bg-gradient-to-br from-[#2563eb]/5 to-purple-500/5 dark:from-[#2563eb]/10 dark:to-purple-500/10 border-2 border-[#2563eb]/20">
                                        <div className="flex justify-center">
                                            <img
                                                src="/images/bolepay/step4.png"
                                                alt="Recuerda liquidar tu compra"
                                                className="max-w-[280px] w-full drop-shadow-2xl rounded-[40px]"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xl font-black">
                                                    ¡
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">¡RECUERDA!</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                                                    <p className="text-gray-900 dark:text-white font-bold mb-2">Tus boletos serán enviados hasta liquidar el saldo pendiente.</p>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                        Recibirás tus boletos digitales una vez que completes todos los pagos programados.
                                                    </p>
                                                </div>
                                                <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                                                    <p className="text-gray-900 dark:text-white font-bold mb-2">Tienes hasta 8 días antes del evento para liquidar tu compra.</p>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                        Si no liquidas el total, tu orden se cancelará automáticamente.
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
                <section className="py-20 bg-white dark:bg-[#0a0a0a]">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <FadeIn>
                                <h2 className="text-3xl font-bold mb-4 tracking-tight md:text-4xl text-gray-900 dark:text-white">Beneficios para ti</h2>
                                <p className="text-gray-500 text-lg">La forma inteligente de no perderte ese evento por falta de tarjeta o efectivo al instante.</p>
                            </FadeIn>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {[
                                { icon: Calendar, text: "Controla tus pagos" },
                                { icon: Heart, text: "Fácil, seguro, sin estrés" },
                                { icon: Percent, text: "Baja tasa de interés" },
                                { icon: Award, text: "Respaldado por Boletea" },
                                { icon: Headphones, text: "Atención al cliente" },
                                { icon: Clock, text: "Compra con anticipación sin complicaciones" },
                            ].map((benefit, i) => (
                                <FadeIn key={i} delay={i * 100}>
                                    <div className="h-full text-center p-8 rounded-2xl bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-white/5 hover:shadow-lg transition-all hover:bg-white dark:hover:bg-[#151515] hover:-translate-y-2 duration-300">
                                        <benefit.icon className="w-12 h-12 mx-auto mb-4 text-[#2563eb]" />
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{benefit.text}</h3>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Trust/Testimonial Section */}
                <section className="py-20 bg-gray-50 dark:bg-[#111]/50">
                    <div className="container mx-auto px-6 text-center max-w-3xl">
                        <FadeIn>
                            <h2 className="text-3xl font-bold mb-12 tracking-tight md:text-4xl">¿Por qué confiar en nosotros?</h2>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <div className="mb-16">
                                <blockquote className="text-2xl font-serif text-gray-700 dark:text-gray-300 relative inline-block italic">
                                    "{/* Using simple quotes to avoid complex positioning issues, keeping it clean */}
                                    No tenía tarjeta y aún así fui al concierto de mi artista favorito. Con Bolepay, pude pagarlo a mi ritmo y vivir al máximo.
                                    "
                                </blockquote>
                                <cite className="block mt-6 font-bold text-gray-900 dark:text-white not-italic text-lg">– Daniela García</cite>
                            </div>
                        </FadeIn>

                        <FadeIn delay={400}>
                            <div className="flex flex-col items-center">
                                <img src="https://boletea.com/img/logoBoletea.png" alt="Boletea" className="h-10 mb-6 opacity-70 grayscale transition-all hover:grayscale-0 hover:opacity-100" />
                                <p className="text-gray-600 dark:text-gray-400 font-medium">
                                    "Nos respalda Boletea, boletera con presencia nacional y más de 10 años de experiencia en eventos en vivo."
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-20 bg-white dark:bg-[#0a0a0a]">
                    <div className="container mx-auto px-6 max-w-3xl">
                        <FadeIn>
                            <h2 className="text-3xl font-bold text-center mb-12 tracking-tight md:text-4xl">Preguntas frecuentes</h2>
                        </FadeIn>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <FadeIn key={index} delay={index * 50} direction="left">
                                    <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#111]">
                                        <button
                                            onClick={() => toggleFaq(index)}
                                            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-left font-bold text-gray-900 dark:text-white"
                                        >
                                            {faq.question}
                                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-[#2563eb]' : ''}`} />
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-48' : 'max-h-0'}`}>
                                            <div className="p-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5 mt-2">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gray-50 dark:bg-[#111]/30">
                    <div className="container mx-auto px-6 text-center">
                        <div className="mb-16">
                            <FadeIn>
                                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">¿Dónde comprar?</h3>
                                <Link href={route('sales-centers.public')} className="inline-flex items-center gap-2 px-8 py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full font-bold text-lg transition-transform hover:-translate-y-1 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50">
                                    <MapPin className="w-6 h-6" />
                                    Ubica tu casilla
                                </Link>
                            </FadeIn>
                        </div>

                        <div>
                            <FadeIn delay={200}>
                                <h3 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">Sigue nuestras redes y vive al máximo</h3>
                                <div className="flex justify-center gap-6 items-center">
                                    <div className="flex items-center gap-4">
                                        <SocialLink href="https://facebook.com/boletea" icon={Facebook} />
                                        <SocialLink href="https://instagram.com/boletea" icon={Instagram} />
                                        <SocialLink href="https://tiktok.com/@boletea" icon={TiktokIcon} />
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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 1v14" />
            <path d="M17 5v10" />
            <path d="M7 5v10" />
            <path d="M17 19h4" />
            <path d="M7 19H3" />
            <path d="M22 19a2 2 0 1 1-2 2" />
            <path d="M4 19a2 2 0 1 0 2 2" />
            <path d="M13.4 19a2 2 0 1 0-2.8 0" />
        </svg>
    )
}

function TiktokIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    )
}

function SocialLink({ href, icon: Icon }: { href: string; icon: any }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 shrink-0 rounded-full bg-[#2563eb] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
        >
            <Icon className="w-6 h-6 shrink-0" />
        </a>
    )
}

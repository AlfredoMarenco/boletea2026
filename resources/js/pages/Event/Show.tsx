import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Ticket } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PublicHeader from '@/components/public-header';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Countdown from '@/components/Countdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PublicFooter from '@/components/public-footer';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

// ExternalEvent imported from '@/types/event'
import { ExternalEvent, Performance } from '@/types/event';

interface SalesCenterDetail {
    id?: number;
    name: string;
    address?: string;
    logo_path?: string;
    google_map_url?: string;
    opening_hours?: string[];
    is_legacy?: boolean;
}

interface Props {
    event: ExternalEvent;
    salesCentersDetails?: SalesCenterDetail[];
    relatedEvents?: ExternalEvent[];
}

export default function Show({ event, salesCentersDetails = [], relatedEvents = [] }: Props) {
    // Normalize performances from raw_data
    const performances: Performance[] = Array.isArray(event.raw_data)
        ? event.raw_data
        : (event.raw_data ? [event.raw_data as Performance] : []);

    const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | undefined>(
        performances.length === 1 ? performances[0].PerformanceID.toString() : undefined
    );

    const visibleCdvPrices = useMemo(() => {
        const prices = (event as any).cdv_prices;
        if (!prices || !Array.isArray(prices)) return [];
        return prices
            .filter((p: any) => p.show === true || String(p.show) === 'true' || String(p.show) === '1')
            .sort((a: any, b: any) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    }, [event]);

    const [isPricesExpanded, setIsPricesExpanded] = useState(() => visibleCdvPrices.length <= 4 && visibleCdvPrices.length > 0);

    // Calendar Logic
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const performanceDates = useMemo(() => {
        const dates = new Set<string>();
        performances.forEach(p => {
            dates.add(format(new Date(p.PerformanceDateTime), 'yyyy-MM-dd'));
        });
        return dates;
    }, [performances]);

    const availablePerformancesForDate = useMemo(() => {
        if (!selectedDate) return [];
        return performances.filter(p => isSameDay(new Date(p.PerformanceDateTime), selectedDate)).sort((a, b) => new Date(a.PerformanceDateTime).getTime() - new Date(b.PerformanceDateTime).getTime());
    }, [selectedDate, performances]);

    const selectedPerformance = useMemo(() =>
        performances.find(p => p.PerformanceID.toString() === selectedPerformanceId),
        [selectedPerformanceId, performances]);

    const displayDate = useMemo(() => {
        if (performances.length > 0) {
            return new Date(performances[0].PerformanceDateTime);
        }
        if (event.start_date) {
            return new Date(event.start_date);
        }
        return null;
    }, [performances, event.start_date]);

    // Sales Open State Logic
    const [isSalesOpen, setIsSalesOpen] = useState(
        !event.sales_start_date || new Date(event.sales_start_date) <= new Date()
    );

    // Initial check on mount just in case
    useEffect(() => {
        if (event.sales_start_date && new Date(event.sales_start_date) <= new Date()) {
            setIsSalesOpen(true);
        }
    }, [event.sales_start_date]);

    const handleBuy = () => {
        if (!selectedPerformanceId) return;
        window.location.href = `https://boletea.com.mx/ordertickets.asp?p=${selectedPerformanceId}`;
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-background dark:text-gray-100 font-sans">
            <Head>
                <title>{`${event.title.replace(/^[A-Z0-9]+\s+/, '')} - Boletea`}</title>
                <meta name="description" content={event.description ? event.description.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...' : `Boletos para ${event.title.replace(/^[A-Z0-9]+\s+/, '')} en Boletea.`} />
                <meta property="og:title" content={`${event.title.replace(/^[A-Z0-9]+\s+/, '')} - Boletea`} />
                <meta property="og:description" content={event.description ? event.description.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...' : `Boletos para ${event.title.replace(/^[A-Z0-9]+\s+/, '')} en Boletea.`} />
                {event.image_path && <meta property="og:image" content={event.image_path} />}
                <meta property="og:type" content="article" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${event.title.replace(/^[A-Z0-9]+\s+/, '')} - Boletea`} />
                <meta name="twitter:description" content={event.description ? event.description.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...' : `Boletos para ${event.title.replace(/^[A-Z0-9]+\s+/, '')} en Boletea.`} />
                {event.image_path && <meta name="twitter:image" content={event.image_path} />}
            </Head>

            {/* Navbar Placeholder (Should likely be a layout) */}
            <PublicHeader />

            <main className="pt-20">
                {/* Hero / Header Section */}
                <div className="relative min-h-[50vh] flex flex-col justify-end w-full overflow-hidden bg-gray-900">
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                        {event.image_path ? (
                            <img
                                src={event.image_path}
                                alt={event.title}
                                className="h-full w-full object-cover opacity-60"
                            />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-gray-800 to-black" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                    </div>

                    <div className="container relative z-10 mx-auto flex h-full flex-col justify-end px-6 pb-8 md:pb-12 lg:pb-16">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                            <div className="flex flex-col items-start gap-4 md:max-w-4xl">
                                {event.category && (
                                    <Badge className="bg-[#c90000] text-white hover:bg-[#a00000] border-none text-xs px-2.5 py-0.5">
                                        {event.category}
                                    </Badge>
                                )}
                                <h1 className="text-3xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl">
                                    {event.title.replace(/^[A-Z0-9]+\s+/, '')}
                                </h1>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        {displayDate && (
                                            <div className="flex flex-col items-center justify-center bg-white rounded-xl p-2 min-w-[60px] shadow-lg">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
                                                    {format(displayDate, 'MMM', { locale: es }).replace('.', '')}
                                                </span>
                                                <span className="text-2xl font-extrabold text-[#c90000] leading-none">
                                                    {format(displayDate, 'dd')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col text-white">
                                            <div className="flex items-center gap-2 text-lg font-bold">
                                                <MapPin className="size-5 text-[#c90000]" />
                                                <span>{event.venue?.name || event.city_location?.name || 'Ubicación por confirmar'}</span>
                                            </div>
                                            <span className="text-sm text-gray-300 ml-7">{event.city_location?.name}{event.state ? `, ${event.state.name}` : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Image (Poster) */}
                            {event.secondary_image_path && (
                                <div className="hidden md:block shrink-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                                    <img
                                        src={event.secondary_image_path}
                                        alt={`Poster ${event.title}`}
                                        className="h-auto w-56 rounded-lg border-[4px] border-white/10 object-cover mt-10 shadow-xl backdrop-blur-sm lg:w-72"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-8 px-6 py-8 lg:gap-10 lg:py-10 lg:items-start">
                    {/* Main Content (Acerca del Evento) */}
                    <div className="flex flex-col gap-8 lg:col-span-2 lg:gap-10 order-2 lg:order-1">
                        {/* Description */}
                        <section>
                            <h2 className="mb-4 text-2xl font-bold lg:text-3xl">Acerca del evento</h2>
                            <div
                                className="prose prose-lg dark:prose-invert text-gray-600 dark:text-muted-foreground max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: (event.description ? (() => {
                                        try {
                                            const txt = document.createElement('textarea');
                                            txt.innerHTML = event.description;
                                            return txt.value;
                                        } catch (e) {
                                            return event.description;
                                        }
                                    })() : 'Sin descripción disponible.')
                                }}
                            />
                        </section>

                        {/* CDV Prices */}
                        {visibleCdvPrices.length > 0 && (
                            <section className="relative rounded-2xl border border-[#c90000]/20 bg-white/50 dark:bg-[#1a1c20]/50 p-6 shadow-lg shadow-[#c90000]/5 overflow-hidden transition-all duration-300">
                                {/* Pulse Glow Effect Background */}
                                <div className="absolute inset-0 bg-[#c90000]/5 animate-pulse pointer-events-none"></div>

                                <button 
                                    onClick={() => setIsPricesExpanded(!isPricesExpanded)}
                                    className="relative z-10 w-full flex items-center justify-between group outline-none"
                                >
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#c90000]/10 text-[#c90000] group-hover:scale-110 transition-transform">
                                            <Ticket className="size-4 sm:size-5" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold lg:text-3xl text-gray-900 dark:text-white">Zonas y Precios</h3>
                                        {!isPricesExpanded && (
                                            <Badge className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs bg-[#c90000] text-white hover:bg-[#a00000] animate-pulse border-none">
                                                Ver {visibleCdvPrices.length} precios
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-gray-400 group-hover:text-[#c90000] transition-colors rounded-full bg-gray-100 p-2 dark:bg-white/5">
                                        <svg className={`w-6 h-6 transform transition-transform duration-300 ${isPricesExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                                
                                <div className={`relative z-10 grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${isPricesExpanded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto overflow-x-hidden pr-3 pb-2 rounded-b-xl" style={{ scrollbarWidth: 'thin' }}>
                                            {visibleCdvPrices.map((price: any) => (
                                                <div 
                                                    key={price.id} 
                                                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border border-gray-200/60 bg-white dark:bg-[#1a1c20] dark:border-white/10 hover:border-[#c90000]/30 hover:shadow-md transition-all ${price.sold_out === true || String(price.sold_out) === 'true' || String(price.sold_out) === '1' ? 'opacity-60 saturate-0 hover:shadow-none pointer-events-none' : 'hover:-translate-y-0.5'}`}
                                                >
                                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                                        <Ticket className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${price.sold_out === true || String(price.sold_out) === 'true' || String(price.sold_out) === '1' ? 'text-gray-400 dark:text-gray-600' : 'text-[#c90000]'}`} />
                                                        <span className={`font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-tight ${price.sold_out === true || String(price.sold_out) === 'true' || String(price.sold_out) === '1' ? 'line-through decoration-gray-400 dark:decoration-gray-600' : ''}`}>
                                                            {price.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-end sm:items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2.5 sm:mt-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5">
                                                        {(price.sold_out === true || String(price.sold_out) === 'true' || String(price.sold_out) === '1') && (
                                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-none whitespace-nowrap text-[10px] sm:text-xs">
                                                                Agotado
                                                            </Badge>
                                                        )}
                                                        <div className="flex flex-col items-end leading-none ml-auto">
                                                            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
                                                                desde
                                                            </span>
                                                            <span className={`text-lg sm:text-xl font-black ${(price.sold_out === true || String(price.sold_out) === 'true' || String(price.sold_out) === '1') ? 'text-gray-500 dark:text-gray-500 line-through decoration-gray-400' : 'text-[#c90000] dark:text-red-500'}`}>
                                                                {(parseFloat(price.price) || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}



                        {/* Desktop Sales Centers (Hidden on mobile) */}
                        {salesCentersDetails && salesCentersDetails.length > 0 && (
                            <section className="hidden lg:block">
                                <h3 className="mb-4 text-2xl font-bold lg:text-3xl">Puntos de venta autorizados</h3>
                                <div className="flex flex-wrap gap-6 items-center">
                                    {salesCentersDetails.map((center, index) => (
                                        <Tooltip key={`desktop-sc-${index}`}>
                                            <TooltipTrigger asChild>
                                                <a
                                                    href={center.google_map_url || '#'}
                                                    target={center.google_map_url ? "_blank" : "_self"}
                                                    rel="noopener noreferrer"
                                                    className={`
                                                        group relative flex h-24 w-40 items-center justify-center rounded-xl border border-gray-200/60 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#1a1c20] dark:hover:border-white/30
                                                        ${!center.google_map_url ? 'cursor-default' : 'cursor-pointer hover:border-[#c90000]/40'}
                                                    `}
                                                >
                                                    {center.is_legacy ? (
                                                        <div className="flex flex-col items-center gap-2 text-center">
                                                            <MapPin className="size-6 text-gray-400 group-hover:text-[#c90000] transition-colors" />
                                                            <span className="text-xs font-bold leading-tight text-gray-700 dark:text-muted-foreground line-clamp-2">
                                                                {center.name}
                                                            </span>
                                                        </div>
                                                    ) : (center.logo_path ? (
                                                        <img
                                                            src={center.logo_path}
                                                            alt={center.name}
                                                            className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <MapPin className="size-6 text-[#c90000]" />
                                                            <span className="text-xs font-bold text-center line-clamp-2">{center.name}</span>
                                                        </div>
                                                    ))}
                                                </a>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs p-4 bg-white dark:bg-[#1a1c20] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-white/10 shadow-xl z-50 rounded-xl">
                                                <div className="space-y-2">
                                                    <p className="font-bold text-base text-[#c90000] dark:text-red-500">{center.name}</p>
                                                    {center.address && (
                                                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                            <MapPin className="size-4 shrink-0 mt-0.5" />
                                                            <span>{center.address}</span>
                                                        </div>
                                                    )}
                                                    {center.opening_hours && Array.isArray(center.opening_hours) && center.opening_hours.length > 0 && (
                                                        <div className="pt-3 border-t border-gray-100 dark:border-white/10 mt-3">
                                                            <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500 dark:text-gray-400">Horario</p>
                                                            <ul className="text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
                                                                {center.opening_hours.map((h, i) => <li key={i} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />{h}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Booking Sidebar */}
                    <div className="relative order-1 lg:order-2">
                        <div className="sticky top-24 flex flex-col gap-6">
                            {(!isSalesOpen && event.sales_start_date) || performances.length <= 1 || event.show_calendar !== false ? (
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-border dark:bg-card">
                                    <h3 className="mb-6 text-xl font-bold">Reserva tus Boletos</h3>

                                    {/* SALES START DATE CHECK */}
                                    {!isSalesOpen && event.sales_start_date ? (
                                        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                                            <div className="rounded-xl bg-[#c90000]/5 p-6 border border-[#c90000]/10">
                                                <h4 className="text-lg font-bold text-[#c90000] mb-2">Próximamente a la venta</h4>
                                                <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">
                                                    La venta de boletos comenzará el:
                                                </p>
                                                <p className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                                    {format(new Date(event.sales_start_date), "d 'de' MMMM 'a las' h:mm a", { locale: es })}
                                                </p>

                                                <div className="grid grid-cols-4 gap-2 text-center">
                                                    <Countdown
                                                        targetDate={event.sales_start_date}
                                                        onComplete={() => setIsSalesOpen(true)}
                                                    />
                                                </div>
                                            </div>
                                            <Button disabled className="w-full h-12 text-lg font-bold bg-gray-200 text-gray-400 dark:bg-card dark:text-gray-600">
                                                Próximamente
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {performances.length > 1 ? (
                                                <div className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700 dark:text-muted-foreground">
                                                            Selecciona una fecha
                                                        </label>
                                                        <div className="flex justify-center">
                                                            <Calendar
                                                                mode="single"
                                                                selected={selectedDate}
                                                                onSelect={setSelectedDate}
                                                                disabled={(date) => {
                                                                    const dateString = format(date, 'yyyy-MM-dd');
                                                                    return !performanceDates.has(dateString);
                                                                }}
                                                                defaultMonth={performances.length > 0 ? new Date(performances[0].PerformanceDateTime) : undefined}
                                                                className="rounded-xl border border-gray-100 bg-white shadow-sm dark:bg-card dark:border-border"
                                                                locale={es}
                                                            />
                                                        </div>
                                                    </div>

                                                    {selectedDate && (
                                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                            <label className="text-sm font-medium text-gray-700 dark:text-muted-foreground">
                                                                Horarios disponibles
                                                            </label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {availablePerformancesForDate.map((perf) => (
                                                                    <button
                                                                        key={perf.PerformanceID}
                                                                        onClick={() => setSelectedPerformanceId(perf.PerformanceID.toString())}
                                                                        className={`
                                                                        px-4 py-2 text-sm font-medium rounded-md border transition-all
                                                                        ${selectedPerformanceId === perf.PerformanceID.toString()
                                                                                ? 'bg-[#c90000] text-white border-[#c90000] shadow-md'
                                                                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#c90000] hover:text-[#c90000] dark:bg-background dark:text-muted-foreground dark:border-border'
                                                                            }
                                                                    `}
                                                                    >
                                                                        {format(new Date(perf.PerformanceDateTime), 'h:mm a')}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : performances.length === 1 ? (
                                                <div className="space-y-3">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-muted-foreground">
                                                        Fecha y Hora del Evento
                                                    </label>
                                                    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-border dark:bg-white/5">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c90000]/10 text-[#c90000]">
                                                            <CalendarIcon className="size-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white lowercase first-letter:uppercase">
                                                                {format(new Date(performances[0].PerformanceDateTime), "EEEE d 'de' MMMM", { locale: es })}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                                                Horario: {format(new Date(performances[0].PerformanceDateTime), "h:mm a")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : event.start_date ? (
                                                <div className="space-y-3">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-muted-foreground">
                                                        Fecha del Evento
                                                    </label>
                                                    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-border dark:bg-white/5">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c90000]/10 text-[#c90000]">
                                                            <CalendarIcon className="size-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white lowercase first-letter:uppercase">
                                                                {format(new Date(event.start_date), "EEEE d 'de' MMMM yyyy", { locale: es })}
                                                            </p>
                                                            {event.start_date.includes(':') && (
                                                                <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                                                    Horario: {format(new Date(event.start_date), "h:mm a")}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 text-center text-gray-500">
                                                    No hay funciones disponibles actualmente.
                                                </div>
                                            )}

                                            <Button
                                                className="w-full h-12 text-lg font-bold bg-[#c90000] hover:bg-[#a00000] text-white shadow-lg shadow-red-600/20"
                                                onClick={handleBuy}
                                                disabled={!selectedPerformanceId}
                                            >
                                                <Ticket className="mr-2 h-5 w-5" />
                                                {event.button_text || 'Comprar Boletos'}
                                            </Button>

                                            <p className="text-xs text-center text-gray-400">
                                                Pagos procesados de forma segura
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                performances.map((perf) => {
                                    const desc = event.performance_descriptions?.[perf.PerformanceID] as any;
                                    const titleStr = typeof desc === 'string' ? desc : (desc?.title || 'Reserva tus Boletos');
                                    const subtitleStr = typeof desc === 'object' && desc?.subtitle ? desc.subtitle : format(new Date(perf.PerformanceDateTime), "EEEE d 'de' MMMM yyyy", { locale: es });

                                    return (
                                        <div key={perf.PerformanceID} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-border dark:bg-card transition-all hover:shadow-2xl hover:border-[#c90000]/30 animate-in fade-in slide-in-from-bottom-4">
                                            <h3 className="mb-4 text-xl font-bold text-[#c90000] dark:text-red-500">
                                                {titleStr}
                                            </h3>
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-border dark:bg-white/5">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c90000]/10 text-[#c90000]">
                                                        <CalendarIcon className="size-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white lowercase first-letter:uppercase">
                                                            {subtitleStr}
                                                        </p>
                                                    <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                                        Horario: {format(new Date(perf.PerformanceDateTime), "h:mm a")}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <Button
                                                className="w-full h-12 text-lg font-bold bg-[#c90000] hover:bg-[#a00000] text-white shadow-lg shadow-red-600/20"
                                                onClick={() => {
                                                    window.location.href = `https://boletea.com.mx/ordertickets.asp?p=${perf.PerformanceID}`;
                                                }}
                                            >
                                                <Ticket className="mr-2 h-5 w-5" />
                                                {event.button_text || 'Comprar Boletos'}
                                            </Button>

                                            <p className="text-xs text-center text-gray-400">
                                                Pagos procesados de forma segura
                                            </p>
                                        </div>
                                    </div>
                                )})
                            )}
                        </div>
                    </div>

                    {/* Mobile Sales Centers Carousel (Hidden on desktop) */}
                    {salesCentersDetails && salesCentersDetails.length > 0 && (
                        <section className="block lg:hidden w-full overflow-hidden pt-2 pb-2 order-3">
                            <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-[#c90000]" />
                                Puntos de venta autorizados
                            </h3>
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                plugins={[
                                    Autoplay({
                                        delay: 3500,
                                    }),
                                ]}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-3">
                                    {salesCentersDetails.map((center, index) => (
                                        <CarouselItem key={`mobile-sc-${index}`} className="pl-3 basis-[65%] sm:basis-[45%]">
                                            <a
                                                href={center.google_map_url || '#'}
                                                target={center.google_map_url ? "_blank" : "_self"}
                                                rel="noopener noreferrer"
                                                className={`
                                                    group relative flex flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all dark:border-white/10 dark:bg-[#1a1c20] h-[140px] w-full
                                                    ${!center.google_map_url ? 'cursor-default' : 'active:scale-95 hover:border-[#c90000]/30 dark:hover:border-white/30'}
                                                `}
                                            >
                                                {center.is_legacy ? (
                                                    <div className="flex flex-col items-center gap-3 text-center">
                                                        <MapPin className="size-8 text-[#c90000] drop-shadow-sm transition-transform group-hover:scale-110" />
                                                        <span className="text-sm font-bold leading-tight text-gray-800 dark:text-gray-200 line-clamp-2">
                                                            {center.name}
                                                        </span>
                                                    </div>
                                                ) : (center.logo_path ? (
                                                    <div className="h-full flex items-center justify-center p-1 w-full relative">
                                                        <img
                                                            src={center.logo_path}
                                                            alt={center.name}
                                                            className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3 text-center">
                                                        <MapPin className="size-8 text-[#c90000] drop-shadow-sm transition-transform group-hover:scale-110" />
                                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2">{center.name}</span>
                                                    </div>
                                                ))}
                                                {center.address && (
                                                    <div className="absolute bottom-3 left-0 w-full text-center px-2">
                                                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 line-clamp-1">{center.address}</span>
                                                    </div>
                                                )}
                                            </a>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                        </section>
                    )}
                </div>

                {/* Related Events Section (Mobile Slider / Desktop Grid) */}
                {
                    relatedEvents && relatedEvents.length > 0 && (
                        <section className="bg-gray-50 py-12 dark:bg-card border-t border-gray-200 dark:border-border">
                            <div className="container mx-auto px-6">
                                <h3 className="mb-8 text-2xl font-bold lg:text-3xl text-gray-900 dark:text-white">
                                    Eventos que te podrían interesar
                                </h3>

                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: true,
                                    }}
                                    plugins={[
                                        Autoplay({
                                            delay: 4000,
                                        }),
                                    ]}
                                    className="w-full"
                                >
                                    <CarouselContent className="-ml-4 md:-ml-6">
                                        {relatedEvents.map((relatedEvent) => (
                                            <CarouselItem key={relatedEvent.id} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3">
                                                <a
                                                    href={route('event.show', relatedEvent.slug || relatedEvent.id)}
                                                    className="group relative flex flex-col h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg dark:border-border dark:bg-background"
                                                >
                                                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-card">
                                                        {relatedEvent.image_path ? (
                                                            <img
                                                                src={relatedEvent.image_path}
                                                                alt={relatedEvent.title}
                                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                                <Ticket className="h-10 w-10 opacity-20" />
                                                            </div>
                                                        )}

                                                        {relatedEvent.start_date && (
                                                            <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-3 py-1.5 text-center text-xs font-bold text-gray-900 backdrop-blur-sm shadow-sm dark:bg-background/80 dark:text-white">
                                                                <span className="block text-xl leading-none text-[#c90000]">
                                                                    {format(new Date(relatedEvent.start_date), 'dd')}
                                                                </span>
                                                                <span className="block uppercase leading-none text-gray-500 dark:text-muted-foreground mt-0.5">
                                                                    {format(new Date(relatedEvent.start_date), 'MMM', { locale: es }).replace('.', '')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-1 flex-col p-5">
                                                        <div className="mb-3">
                                                            {relatedEvent.category && (
                                                                <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-card dark:text-muted-foreground">
                                                                    {relatedEvent.category}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h4 className="mb-2 text-lg font-bold leading-tight text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#c90000] transition-colors">
                                                            {relatedEvent.title}
                                                        </h4>

                                                        <div className="mt-auto flex items-center gap-2 text-sm text-gray-500 dark:text-muted-foreground">
                                                            <MapPin className="h-4 w-4 text-[#c90000]" />
                                                            <span className="line-clamp-1 font-medium">
                                                                {relatedEvent.venue?.name || relatedEvent.city_location?.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </a>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <div className="hidden md:block">
                                        <CarouselPrevious />
                                        <CarouselNext />
                                    </div>
                                </Carousel>
                            </div>
                        </section>
                    )
                }
            </main>
            <PublicFooter />
        </div>
    );
}

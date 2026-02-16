import { Head } from '@inertiajs/react';
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
}

export default function Show({ event, salesCentersDetails = [] }: Props) {
    // Normalize performances from raw_data
    const performances: Performance[] = Array.isArray(event.raw_data)
        ? event.raw_data
        : (event.raw_data ? [event.raw_data as Performance] : []);

    const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | undefined>(
        performances.length === 1 ? performances[0].PerformanceID.toString() : undefined
    );

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
        <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100 font-sans">
            <Head title={`${event.title} - Boletea`} />

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
                                        {performances.length > 0 && (
                                            <div className="flex flex-col items-center justify-center bg-white rounded-xl p-2 min-w-[60px] shadow-lg">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
                                                    {format(new Date(performances[0].PerformanceDateTime), 'MMM', { locale: es }).replace('.', '')}
                                                </span>
                                                <span className="text-2xl font-extrabold text-[#c90000] leading-none">
                                                    {format(new Date(performances[0].PerformanceDateTime), 'dd')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col text-white">
                                            <div className="flex items-center gap-2 text-lg font-bold">
                                                <MapPin className="size-5 text-[#c90000]" />
                                                <span>{event.venue?.name || event.city || 'Ubicación por confirmar'}</span>
                                            </div>
                                            <span className="text-sm text-gray-300 ml-7">{event.city}</span>
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

                <div className="container mx-auto grid grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-3 lg:gap-10 lg:py-10">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8 lg:space-y-10">
                        {/* Description */}
                        <section>
                            <h2 className="mb-4 text-2xl font-bold lg:text-3xl">Acerca del evento</h2>
                            <div
                                className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300 max-w-none"
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



                        {/* Sales Centers */}
                        {salesCentersDetails && salesCentersDetails.length > 0 && (
                            <section>
                                <h3 className="mb-4 text-2xl font-bold lg:text-3xl">Puntos de venta autorizados</h3>
                                <div className="flex flex-wrap gap-8 items-center">
                                    {salesCentersDetails.map((center, index) => (
                                        <Tooltip key={index}>
                                            <TooltipTrigger asChild>
                                                <a
                                                    href={center.google_map_url || '#'}
                                                    target={center.google_map_url ? "_blank" : "_self"}
                                                    rel="noopener noreferrer"
                                                    className={`
                                                        group relative flex h-24 w-40 items-center justify-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-white/5
                                                        ${!center.google_map_url ? 'cursor-default' : 'cursor-pointer hover:border-[#c90000]/30'}
                                                    `}
                                                >
                                                    {center.is_legacy ? (
                                                        <div className="flex flex-col items-center gap-2 text-center">
                                                            <MapPin className="size-6 text-gray-400 group-hover:text-[#c90000] transition-colors" />
                                                            <span className="text-xs font-bold leading-tight text-gray-700 dark:text-gray-300 line-clamp-2">
                                                                {center.name}
                                                            </span>
                                                        </div>
                                                    ) : (center.logo_path ? (
                                                        <img
                                                            src={center.logo_path}
                                                            alt={center.name}
                                                            className="h-full w-full object-contain p-2"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <MapPin className="size-6 text-[#c90000]" />
                                                            <span className="text-xs font-bold text-center line-clamp-2">{center.name}</span>
                                                        </div>
                                                    ))}
                                                </a>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-xl z-50">
                                                <div className="space-y-2">
                                                    <p className="font-bold text-base">{center.name}</p>
                                                    {center.address && (
                                                        <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <MapPin className="size-4 shrink-0 mt-0.5" />
                                                            <span>{center.address}</span>
                                                        </div>
                                                    )}
                                                    {center.opening_hours && Array.isArray(center.opening_hours) && center.opening_hours.length > 0 && (
                                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                                            <p className="text-xs font-semibold mb-1 text-gray-500">Horario</p>
                                                            <ul className="text-xs space-y-0.5">
                                                                {center.opening_hours.map((h, i) => <li key={i}>{h}</li>)}
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
                    <div className="relative">
                        <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-[#111]">
                            <h3 className="mb-6 text-xl font-bold">Reserva tus Boletos</h3>

                            {/* SALES START DATE CHECK */}
                            {!isSalesOpen && event.sales_start_date ? (
                                <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                                    <div className="rounded-xl bg-[#c90000]/5 p-6 border border-[#c90000]/10">
                                        <h4 className="text-lg font-bold text-[#c90000] mb-2">Próximamente a la venta</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
                                    <Button disabled className="w-full h-12 text-lg font-bold bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600">
                                        Próximamente
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {performances.length > 1 ? (
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                                        className="rounded-xl border border-gray-100 bg-white shadow-sm dark:bg-[#1a1a1a] dark:border-gray-800"
                                                        locale={es}
                                                    />
                                                </div>
                                            </div>

                                            {selectedDate && (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#c90000] hover:text-[#c90000] dark:bg-[#222] dark:text-gray-300 dark:border-gray-700'
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
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Fecha y Hora del Evento
                                            </label>
                                            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/5">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c90000]/10 text-[#c90000]">
                                                    <CalendarIcon className="size-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white lowercase first-letter:uppercase">
                                                        {format(new Date(performances[0].PerformanceDateTime), "EEEE d 'de' MMMM", { locale: es })}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Horario: {format(new Date(performances[0].PerformanceDateTime), "h:mm a")}
                                                    </p>
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
                    </div>
                </div>
            </main>
        </div>
    );
}

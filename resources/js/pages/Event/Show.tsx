import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, MapPin, Ticket } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PublicHeader from '@/components/public-header';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Countdown from '@/components/Countdown';

interface Performance {
    PerformanceID: number;
    PerformanceName: string;
    PerformanceDateTime: string;
    VenueName: string;
    PerformancePrices: string;
}

interface ExternalEvent {
    id: number;
    title: string;
    city: string | null;
    category: string | null;
    description: string | null;
    image_path: string | null;
    secondary_image_path: string | null;
    sales_start_date: string | null;
    button_text: string | null;
    status: 'draft' | 'published';
    sales_centers: string[] | null;
    raw_data: Performance[] | Performance | null; // Can be array of performances or single obj or null
}

interface SalesCenterDetail {
    id?: number;
    name: string;
    address?: string;
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
                <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden bg-gray-900">
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

                    <div className="container relative z-10 mx-auto flex h-full flex-col justify-end px-6 pb-12 md:pb-24">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-8">
                            <div className="flex flex-col items-start gap-4 md:max-w-4xl">
                                {event.category && (
                                    <Badge className="bg-[#c90000] text-white hover:bg-[#a00000] border-none text-sm px-3 py-1">
                                        {event.category}
                                    </Badge>
                                )}
                                <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
                                    {event.title}
                                </h1>
                                <div className="flex flex-wrap gap-6 text-sm font-medium text-gray-300 md:text-base">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="size-5 text-[#c90000]" />
                                        <span>{event.city || 'Ubicación por confirmar'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Ticket className="size-5 text-[#c90000]" />
                                        <span>{performances.length} Funciones Disponibles</span>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Image (Poster) */}
                            {event.secondary_image_path && (
                                <div className="hidden md:block shrink-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                                    <img
                                        src={event.secondary_image_path}
                                        alt={`Poster ${event.title}`}
                                        className="h-auto w-100 rounded-xl border-[6px] border-white/10 object-cover shadow-2xl backdrop-blur-sm"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto grid grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Description */}
                        <section>
                            <h2 className="mb-6 text-2xl font-bold md:text-3xl">Acerca del Evento</h2>
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
                                <h3 className="mb-4 text-xl font-bold">Puntos de Venta</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {salesCentersDetails.map((center, index) => (
                                        <div key={index} className="flex flex-col p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-bold text-base">{center.name}</h4>
                                                    {center.address && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {center.address}
                                                        </p>
                                                    )}
                                                </div>
                                                {!center.is_legacy && center.google_map_url && (
                                                    <a
                                                        href={center.google_map_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-white hover:text-white bg-[#c90000] hover:bg-[#a00000] p-2 rounded-full transition-colors"
                                                        title="Ver en mapa"
                                                    >
                                                        <MapPin className="size-4" />
                                                    </a>
                                                )}
                                            </div>
                                            {center.opening_hours && Array.isArray(center.opening_hours) && center.opening_hours.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs font-semibold text-gray-500 mb-1">Horario:</p>
                                                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                                                        {center.opening_hours.map((hour, idx) => (
                                                            <li key={idx}>{hour}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
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
                            {event.sales_start_date && new Date(event.sales_start_date) > new Date() ? (
                                <div className="space-y-6 text-center">
                                    <div className="rounded-xl bg-[#c90000]/5 p-6 border border-[#c90000]/10">
                                        <h4 className="text-lg font-bold text-[#c90000] mb-2">Próximamente a la venta</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            La venta de boletos comenzará el:
                                        </p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                            {format(new Date(event.sales_start_date), "d 'de' MMMM 'a las' h:mm a", { locale: es })}
                                        </p>

                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            {/* Countdown Logic can be added here with separate component or inline state */}
                                            {/* For now showing static date info is a good first step, user requested countdown specifically */}
                                            <Countdown targetDate={event.sales_start_date} />
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
                                                    <p className="font-bold text-gray-900 dark:text-white capitalize">
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
                                        {event.button_text}
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

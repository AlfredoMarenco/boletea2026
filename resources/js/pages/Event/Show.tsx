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

interface Performance {
    PerformanceID: number;
    PerformanceName: string;
    PerformanceDateTime: string;
    VenueName: string;
    // Add other fields from API if needed
}

interface ExternalEvent {
    id: number;
    title: string;
    city: string | null;
    category: string | null;
    description: string | null;
    image_path: string | null;
    status: 'draft' | 'published';
    sales_centers: string[] | null;
    raw_data: Performance[] | Performance | null; // Can be array of performances or single obj or null
}

interface Props {
    event: ExternalEvent;
}

export default function Show({ event }: Props) {
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

    const handleBuy = () => {
        if (!selectedPerformanceId) return;
        window.location.href = `https://boletea.com.mx/ordertickets.asp?p=${selectedPerformanceId}`;
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100 font-sans">
            <Head title={`${event.title} - Boletea`} />

            {/* Navbar Placeholder (Should likely be a layout) */}
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
                                dangerouslySetInnerHTML={{ __html: event.description || 'Sin descripción disponible.' }}
                            />
                        </section>

                        {/* Sales Centers */}
                        {event.sales_centers && event.sales_centers.length > 0 && (
                            <section>
                                <h3 className="mb-4 text-xl font-bold">Puntos de Venta</h3>
                                <div className="flex flex-wrap gap-2">
                                    {event.sales_centers.map((center, index) => (
                                        <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                                            {center}
                                        </Badge>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Booking Sidebar */}
                    <div className="relative">
                        <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-[#111]">
                            <h3 className="mb-6 text-xl font-bold">Reserva tus Boletos</h3>

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
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Selecciona una función
                                        </label>
                                        <Select
                                            value={selectedPerformanceId}
                                            onValueChange={setSelectedPerformanceId}
                                        >
                                            <SelectTrigger className="w-full h-12 text-base">
                                                <SelectValue placeholder="Elige fecha y hora" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {performances.map((perf) => (
                                                    <SelectItem key={perf.PerformanceID} value={perf.PerformanceID.toString()}>
                                                        {format(new Date(perf.PerformanceDateTime), "d 'de' MMMM - h:mm a", { locale: es })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <Button
                                    className="w-full h-12 text-lg font-bold bg-[#c90000] hover:bg-[#a00000] text-white shadow-lg shadow-red-600/20"
                                    onClick={handleBuy}
                                    disabled={!selectedPerformanceId}
                                >
                                    <Ticket className="mr-2 h-5 w-5" />
                                    Comprar Boletos
                                </Button>

                                <p className="text-xs text-center text-gray-400">
                                    Pagos procesados de forma segura
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

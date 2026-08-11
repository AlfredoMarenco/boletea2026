import { Head } from '@inertiajs/react';
import React from 'react';
import PublicHeader from '@/components/public-header';
import {
    MapPin,
    Clock,
    CreditCard,
    Banknote,
    Ticket,
    QrCodeIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LocationPicker from '@/components/LocationPicker';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface SalesCenter {
    id: number;
    name: string;
    address: string;
    logo_path: string | null;
    google_map_url: string | null;
    opening_hours: Record<
        string,
        { open: string; close: string; closed: boolean }
    >;
    latitude?: number;
    longitude?: number;
    is_digital_only?: boolean;
    payment_methods_cash?: boolean;
    payment_methods_card?: boolean;
}

interface State {
    id: number;
    name: string;
    sales_centers: SalesCenter[];
}

const DAYS_MAP: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
};

const ORDERED_DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
];

export default function SalesCenters({ states }: { states: State[] }) {
    // Function to group hours: e.g. Lun - Vie: 9:00 - 18:00
    const formatHours = (hours: SalesCenter['opening_hours']) => {
        if (!hours) return null;

        const groups: { start: string; end: string; schedule: any }[] = [];
        let currentGroup: { start: string; end: string; schedule: any } | null =
            null;

        ORDERED_DAYS.forEach((day) => {
            const schedule = hours[day];
            if (!schedule) return;

            const scheduleStr = schedule.closed
                ? 'Cerrado'
                : `${schedule.open} - ${schedule.close}`;

            if (currentGroup) {
                const currentScheduleStr = currentGroup.schedule.closed
                    ? 'Cerrado'
                    : `${currentGroup.schedule.open} - ${currentGroup.schedule.close}`;

                if (currentScheduleStr === scheduleStr) {
                    currentGroup.end = day;
                } else {
                    groups.push(currentGroup);
                    currentGroup = { start: day, end: day, schedule };
                }
            } else {
                currentGroup = { start: day, end: day, schedule };
            }
        });

        if (currentGroup) {
            groups.push(currentGroup);
        }

        return (
            <div className="space-y-1 text-sm">
                {groups.map((group, index) => {
                    const label =
                        group.start === group.end
                            ? DAYS_MAP[group.start]
                            : `${DAYS_MAP[group.start]} - ${DAYS_MAP[group.end]}`;

                    return (
                        <div key={index} className="flex justify-between gap-4">
                            <span className="w-fit min-w-[120px] font-medium text-gray-500 dark:text-muted-foreground">
                                {label}
                            </span>
                            <span className="text-right text-gray-900 dark:text-gray-200">
                                {group.schedule.closed
                                    ? 'Cerrado'
                                    : `${group.schedule.open} - ${group.schedule.close}`}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const [selectedStateId, setSelectedStateId] = React.useState<number | null>(
        states.length > 0 ? states[0].id : null,
    );

    const selectedState = React.useMemo(
        () => states.find((s) => s.id === selectedStateId) || null,
        [states, selectedStateId],
    );

    const SalesCenterCard = ({
        center,
        className,
    }: {
        center: SalesCenter;
        className?: string;
    }) => (
        <div
            className={cn(
                'flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md dark:border-border dark:bg-card',
                className,
            )}
        >
            <div className="flex-grow p-6">
                <div className="mb-6">
                    {center.logo_path ? (
                        <div className="mx-auto flex h-36 w-36 items-center justify-center">
                            <img
                                src={center.logo_path}
                                alt={center.name}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 dark:bg-card">
                            <MapPin className="h-8 w-8 text-gray-400" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {center.name}
                        </h3>
                        <Badge
                            variant="outline"
                            className="mt-1 text-xs font-normal tracking-wider text-gray-500 uppercase"
                        >
                            Oficial
                        </Badge>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#c90000]" />
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-muted-foreground">
                            {center.address}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-muted-foreground">
                            Método de entrega
                        </p>
                        <Badge
                            variant={
                                center.is_digital_only ? 'outline' : 'secondary'
                            }
                            className="w-fit gap-2 rounded-lg px-3 py-1.5 text-sm font-medium [&>svg]:!size-5"
                        >
                            {center.is_digital_only ? (
                                <QrCodeIcon
                                    className={
                                        center.is_digital_only
                                            ? 'text-gray-500'
                                            : ''
                                    }
                                />
                            ) : (
                                <Ticket
                                    className={
                                        center.is_digital_only
                                            ? 'text-gray-500'
                                            : ''
                                    }
                                />
                            )}
                            {center.is_digital_only
                                ? 'Boleto digital'
                                : 'Boleto físico'}
                        </Badge>
                    </div>

                    {(center.payment_methods_cash ||
                        center.payment_methods_card) && (
                        <div className="flex flex-col gap-2 pt-2">
                            <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-muted-foreground">
                                Métodos de pago
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {center.payment_methods_cash && (
                                    <Badge
                                        variant="outline"
                                        className="w-fit gap-2 rounded-lg border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-900/10 dark:text-green-400 [&>svg]:!size-5"
                                    >
                                        <Banknote />
                                        Efectivo
                                    </Badge>
                                )}
                                {center.payment_methods_card && (
                                    <Badge
                                        variant="outline"
                                        className="w-fit gap-2 rounded-lg border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-900/10 dark:text-blue-400 [&>svg]:!size-5"
                                    >
                                        <CreditCard />
                                        Tarjeta
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {center.opening_hours && (
                        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-border">
                            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#c90000]">
                                <Clock className="h-4 w-4" />
                                <span>Horarios de Atención</span>
                            </div>
                            {formatHours(center.opening_hours)}
                        </div>
                    )}
                </div>
            </div>

            {center.latitude && center.longitude ? (
                <div className="mt-auto w-full">
                    <LocationPicker
                        initialLatitude={center.latitude}
                        initialLongitude={center.longitude}
                        readonly={true}
                        clickToGoogleMaps={true}
                        hideControls={true}
                        zoom={16}
                        useGoogleTiles={true}
                    />
                </div>
            ) : (
                center.google_map_url && (
                    <a
                        href={center.google_map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto block w-full border-t border-gray-100 bg-gray-50 p-3 text-center text-sm font-medium text-[#c90000] transition-colors hover:bg-gray-100 dark:border-border dark:bg-white/5 dark:hover:bg-white/10"
                    >
                        Ver ubicación en Google Maps
                    </a>
                )
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans dark:bg-background">
            <Head title="Puntos de Venta - Boletea" />
            <PublicHeader />

            <main className="mx-auto max-w-7xl px-6 pt-24 pb-16 lg:px-8">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
                        Puntos de Venta Oficiales
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-muted-foreground">
                        Encuentra el punto de venta más cercano para adquirir
                        tus boletos.
                    </p>
                </div>

                {states.length > 0 ? (
                    <div className="space-y-12">
                        {/* State Selection Carousel */}
                        <div className="relative mx-auto max-w-4xl px-12">
                            <Carousel
                                opts={{
                                    align: 'center',
                                    loop: false,
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="justify-center">
                                    {states.map((state) => (
                                        <CarouselItem
                                            key={state.id}
                                            className="basis-auto pr-2 pl-2"
                                        >
                                            <button
                                                onClick={() =>
                                                    setSelectedStateId(state.id)
                                                }
                                                className={cn(
                                                    'rounded-full px-6 py-2.5 text-sm font-semibold whitespace-nowrap shadow-sm transition-all duration-300',
                                                    selectedStateId === state.id
                                                        ? 'scale-105 bg-[#c90000] text-white shadow-lg shadow-[#c90000]/20'
                                                        : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-gray-800 dark:hover:text-white',
                                                )}
                                            >
                                                {state.name}
                                            </button>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="-left-4 border-gray-200 hover:bg-gray-100 dark:border-border dark:hover:bg-gray-800" />
                                <CarouselNext className="-right-4 border-gray-200 hover:bg-gray-100 dark:border-border dark:hover:bg-gray-800" />
                            </Carousel>
                        </div>

                        {/* Selected State Content using Grid for both Mobile and Desktop */}
                        {selectedState && (
                            <div className="animate-in duration-500 fade-in slide-in-from-bottom-4">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {selectedState.sales_centers.map(
                                        (center) => (
                                            <SalesCenterCard
                                                key={center.id}
                                                center={center}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-20 text-center text-gray-500 dark:text-muted-foreground">
                        <MapPin className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-700" />
                        <p className="text-xl">
                            No hay puntos de venta registrados actualmente.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

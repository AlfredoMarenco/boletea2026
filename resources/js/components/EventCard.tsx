import React from 'react';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Calendar, MapPin } from 'lucide-react';
import { format, isSameDay, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalEvent } from '@/types/event';

// Helper para calcular y formatear dinámicamente el rango de fechas
const getEventDateDisplay = (startDateStr: string | null, endDateStr?: string | null) => {
    if (!startDateStr) return null;

    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : null;

    const startDay = format(startDate, 'd');
    const startMonth = format(startDate, 'MMM', { locale: es }).toUpperCase().replace('.', '');
    const startYear = format(startDate, 'yyyy');

    // Caso 1: No hay end_date o es el mismo día
    if (!endDate || isSameDay(startDate, endDate)) {
        return {
            badgeMonth: startMonth,
            badgeDay: format(startDate, 'dd'),
            fullText: format(startDate, 'PPP', { locale: es }),
        };
    }

    const endDay = format(endDate, 'd');
    const endMonth = format(endDate, 'MMM', { locale: es }).toUpperCase().replace('.', '');
    const diffDays = differenceInCalendarDays(endDate, startDate);

    // Caso 2: Mismo mes y año
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
        const monthFull = format(startDate, 'MMMM', { locale: es });

        if (diffDays === 1) {
            // Caso: 17 y 18 de septiembre
            return {
                badgeMonth: startMonth,
                badgeDay: `${startDay} Y ${endDay}`,
                fullText: `${startDay} y ${endDay} de ${monthFull} de ${startYear}`,
            };
        } else {
            // Caso: Del 8 al 19 de septiembre
            return {
                badgeMonth: startMonth,
                badgeDay: `${startDay} AL ${endDay}`,
                fullText: `Del ${startDay} al ${endDay} de ${monthFull} de ${startYear}`,
            };
        }
    }

    // Caso 3: Entre meses distintos
    return {
        badgeMonth: `${startMonth} - ${endMonth}`,
        badgeDay: `${startDay} - ${endDay}`,
        fullText: `${startDay} de ${format(startDate, 'MMMM', { locale: es })} al ${endDay} de ${format(endDate, 'MMMM', { locale: es })} de ${startYear}`,
    };
};

export default function EventCard({
    event,
    disabled = false,
    forceExternal = false,
}: {
    event: ExternalEvent;
    disabled?: boolean;
    forceExternal?: boolean;
}) {
    const cleanTitle = (title: string) => {
        // Remove internal codes like MYPT260227 followed by space
        return title.replace(/^[A-Z0-9]+\s+/, '');
    };

    const dateInfo = getEventDateDisplay(event.start_date, event.end_date);

    return (
        <div
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white text-gray-900 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 ${disabled ? 'opacity-75 grayscale-[0.5]' : 'hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)]'}`}
        >
            <div
                className={`relative aspect-[5/4] w-full overflow-hidden bg-gray-100 ${disabled ? 'cursor-not-allowed' : ''}`}
            >
                {event.image_path ? (
                    <img
                        src={event.image_path}
                        alt={event.title}
                        className={`h-full w-full object-cover transition-transform duration-700 ${!disabled && 'group-hover:scale-110'}`}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                        <span className="text-[10px] font-bold tracking-wider uppercase sm:text-xs">
                            Sin Imagen
                        </span>
                    </div>
                )}

                {/* Date Badge */}
                {dateInfo && (
                    <div className="absolute top-1.5 right-1.5 flex min-w-[36px] flex-col items-center justify-center rounded-md border border-gray-100 bg-white/95 p-1 shadow-sm backdrop-blur-md sm:top-4 sm:right-4 sm:min-w-[60px] sm:rounded-xl sm:p-2 sm:shadow-lg">
                        <span className="mb-0.5 text-[7px] leading-none font-bold tracking-widest text-gray-500 uppercase sm:text-xs">
                            {dateInfo.badgeMonth}
                        </span>
                        <span className={`leading-none font-extrabold text-[#c90000] whitespace-nowrap ${dateInfo.badgeDay.length > 3 ? 'text-[10px] sm:text-lg' : 'text-sm sm:text-2xl'}`}>
                            {dateInfo.badgeDay}
                        </span>
                    </div>
                )}

                {disabled && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                        <div className="rounded-full bg-gray-900/80 px-4 py-1.5 text-[10px] font-black tracking-widest text-white uppercase backdrop-blur-md">
                            No disponible
                        </div>
                    </div>
                )}

                <div className="absolute top-2 left-2 flex flex-col gap-1.5 sm:top-4 sm:left-4 sm:gap-2">
                    {event.categories && event.categories.length > 0 && (
                        <span className="inline-flex rounded-full bg-white/90 px-1.5 py-0.5 text-[8px] leading-none font-bold text-gray-800 shadow-sm backdrop-blur-md sm:px-3 sm:py-1 sm:text-xs">
                            {event.categories[0].name}
                        </span>
                    )}
                    {event.distance_km !== undefined &&
                        event.distance_km !== null &&
                        !disabled && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#c90000]/90 px-1.5 py-0.5 text-[8px] leading-none font-bold text-white shadow-sm backdrop-blur-md sm:px-3 sm:py-1 sm:text-xs">
                                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                {event.distance_km} km
                            </span>
                        )}
                </div>
            </div>
            <div className="flex flex-1 flex-col p-2.5 sm:p-5">
                <div className="mb-1 line-clamp-1 text-[9px] leading-tight font-bold tracking-wide text-[#c90000] uppercase sm:mb-2 sm:text-xs">
                    {event.venue?.name ||
                        event.city_location?.name ||
                        'Ubicación por confirmar'}
                </div>
                <h3
                    className={`mb-1.5 line-clamp-2 text-xs leading-tight font-extrabold text-gray-900 transition-colors sm:mb-2 sm:text-xl ${!disabled && 'group-hover:text-[#c90000]'}`}
                >
                    {cleanTitle(event.title)}
                </h3>
                {dateInfo && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] leading-tight text-gray-500 sm:mb-4 sm:gap-2 sm:text-sm">
                        <Calendar className="h-3 w-3 shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                        <span className="line-clamp-1">
                            {dateInfo.fullText}
                        </span>
                    </div>
                )}
                <div className="mb-2 flex items-center gap-1 text-[10px] leading-tight text-gray-500 sm:mb-4 sm:gap-2 sm:text-sm">
                    <span className="line-clamp-1">
                        {event.city_location?.name}
                        {event.state ? `, ${event.state.name}` : ''}
                    </span>
                </div>
                <div className="mt-auto border-t border-gray-100 pt-2 sm:pt-4">
                    {disabled ? (
                        <div className="block w-full cursor-not-allowed rounded-md bg-gray-300 py-1.5 text-center text-[11px] font-bold tracking-wider text-gray-500 uppercase sm:rounded-xl sm:py-3 sm:text-sm">
                            Próximamente
                        </div>
                    ) : (event as any).is_local_event ? (
                        <Link
                            href={route('event.show', event.slug)}
                            className="block w-full rounded-md bg-gray-900 py-1.5 text-center text-[11px] font-bold text-white transition-colors hover:bg-[#c90000] sm:rounded-xl sm:py-3 sm:text-sm"
                        >
                            Comprar
                        </Link>
                    ) : forceExternal ||
                      (event.redirect_external && event.performance_url) ? (
                        <a
                            href={event.performance_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full rounded-md bg-gray-900 py-1.5 text-center text-[11px] font-bold text-white transition-colors hover:bg-[#c90000] sm:rounded-xl sm:py-3 sm:text-sm"
                        >
                            Comprar
                        </a>
                    ) : (
                        <Link
                            href={route('event.show', event.slug || event.id)}
                            className="block w-full rounded-md bg-gray-900 py-1.5 text-center text-[11px] font-bold text-white transition-colors hover:bg-[#c90000] sm:rounded-xl sm:py-3 sm:text-sm"
                        >
                            Comprar
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}


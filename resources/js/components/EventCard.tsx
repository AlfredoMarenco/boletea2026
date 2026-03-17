import React from 'react';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalEvent } from '@/types/event';

export default function EventCard({ event }: { event: ExternalEvent }) {
    const cleanTitle = (title: string) => {
        // Remove internal codes like MYPT260227 followed by space
        return title.replace(/^[A-Z0-9]+\s+/, '');
    };

    const dateObj = event.start_date ? new Date(event.start_date) : null;
    const day = dateObj ? format(dateObj, 'dd') : null;
    const month = dateObj ? format(dateObj, 'MMM', { locale: es }).toUpperCase().replace('.', '') : null;

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-200/60 text-gray-900">
            <div className="relative w-full aspect-[5/4] bg-gray-100 overflow-hidden">
                {event.image_path ? (
                    <img src={event.image_path} alt={event.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400"><span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Sin Imagen</span></div>
                )}

                {/* Date Badge */}
                {dateObj && (
                    <div className="absolute top-1.5 right-1.5 sm:top-4 sm:right-4 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md rounded-md sm:rounded-xl p-1 sm:p-2 min-w-[36px] sm:min-w-[60px] shadow-sm sm:shadow-lg border border-gray-100">
                        <span className="text-[7px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mb-0.5">{month}</span>
                        <span className="text-sm sm:text-2xl font-extrabold text-[#c90000] leading-none">{day}</span>
                    </div>
                )}

                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1.5 sm:gap-2">
                    {event.categories && event.categories.length > 0 && (
                        <span className="inline-flex px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-md text-[8px] sm:text-xs font-bold text-gray-800 shadow-sm leading-none">
                            {event.categories[0].name}
                        </span>
                    )}
                    {event.distance_km !== undefined && event.distance_km !== null && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#c90000]/90 backdrop-blur-md text-[8px] sm:text-xs font-bold text-white shadow-sm leading-none">
                            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {event.distance_km} km
                        </span>
                    )}
                </div>
            </div>
            <div className="flex flex-1 flex-col p-2.5 sm:p-5">
                <div className="mb-1 sm:mb-2 text-[9px] sm:text-xs font-bold text-[#c90000] uppercase tracking-wide line-clamp-1 leading-tight">
                    {event.venue?.name || event.city_location?.name || 'Ubicación por confirmar'}
                </div>
                <h3 className="mb-1.5 sm:mb-2 text-xs sm:text-xl font-extrabold leading-tight text-gray-900 group-hover:text-[#c90000] transition-colors line-clamp-2">
                    {cleanTitle(event.title)}
                </h3>
                {event.start_date && (
                    <div className="mb-1 sm:mb-4 flex items-center text-[10px] sm:text-sm text-gray-500 gap-1 sm:gap-2 leading-tight">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                        <span className="line-clamp-1">{format(new Date(event.start_date), 'PPP', { locale: es })}</span>
                    </div>
                )}
                <div className="mb-2 sm:mb-4 flex items-center text-[10px] sm:text-sm text-gray-500 gap-1 sm:gap-2 leading-tight">
                    <span className="line-clamp-1">{event.city_location?.name}{event.state ? `, ${event.state.name}` : ''}</span>
                </div>
                <div className="mt-auto pt-2 sm:pt-4 border-t border-gray-100">
                    <Link href={route('event.show', event.slug || event.id)} className="block w-full rounded-md sm:rounded-xl bg-gray-900 py-1.5 sm:py-3 text-center text-[11px] sm:text-sm font-bold text-white transition-colors hover:bg-[#c90000]">
                        Comprar
                    </Link>
                </div>
            </div>
        </div>
    );
}

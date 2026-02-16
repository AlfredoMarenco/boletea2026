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
        <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-[#111] border border-gray-100 dark:border-white/5">
            <div className="relative w-full aspect-[5/4] bg-gray-200 dark:bg-gray-800 overflow-hidden">
                {event.image_path ? (
                    <img src={event.image_path} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400"><span className="text-xs uppercase">Sin Imagen</span></div>
                )}

                {/* Date Badge */}
                {dateObj && (
                    <div className="absolute top-4 right-4 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md rounded-xl p-2 min-w-[60px] shadow-lg border border-gray-100 dark:border-gray-800 dark:bg-black/80">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{month}</span>
                        <span className="text-2xl font-extrabold text-[#c90000] leading-none">{day}</span>
                    </div>
                )}

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {event.categories && event.categories.length > 0 && (
                        <span className="inline-flex px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-black shadow-sm">
                            {event.categories[0].name}
                        </span>
                    )}
                    {event.distance_km !== undefined && event.distance_km !== null && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#c90000]/90 backdrop-blur-md text-xs font-bold text-white shadow-sm">
                            <MapPin className="w-3 h-3" />
                            {event.distance_km} km
                        </span>
                    )}
                </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 text-xs font-medium text-[#c90000] uppercase tracking-wide">
                    {event.venue?.name || event.city || 'Ubicación por confirmar'}
                </div>
                <h3 className="mb-2 text-xl font-bold leading-tight text-gray-900 group-hover:text-[#c90000] dark:text-white transition-colors line-clamp-2">
                    {cleanTitle(event.title)}
                </h3>
                {event.start_date && (
                    <div className="mb-4 flex items-center text-sm text-gray-500 gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {format(new Date(event.start_date), 'PPP', { locale: es })}
                    </div>
                )}
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                    <Link href={route('event.show', event.id)} className="block w-full rounded-xl bg-gray-900 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#c90000] dark:bg-white dark:text-black dark:hover:bg-[#c90000] dark:hover:text-white">
                        Comprar Boletos
                    </Link>
                </div>
            </div>
        </div>
    );
}

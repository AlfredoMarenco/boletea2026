import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { GeolocationProvider, useGeolocation } from '@/contexts/GeolocationProvider';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Calendar, Search } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FilterBar from '@/components/FilterBar';
import EventCard from '@/components/EventCard';
import { ExternalEvent } from '@/types/event';

// ExternalEvent moved to '@/types/event'



interface Venue {
    id: number;
    name: string;
}

interface FilterOptions {
    cities: string[];
    venues: Venue[];
    categories: string[]; // This remains string[] as we pluck names in backend
}

interface Filters {
    search?: string;
    city?: string;
    venue_id?: string;
    category?: string;
    date_start?: string;
    date_end?: string;
}

interface Props {
    canRegister: boolean;
    events: ExternalEvent[];
    filters: Filters;
    options: FilterOptions;
}

export default function Welcome({ canRegister, events: initialEvents, nearbyEvents, carouselEvents, filters, options }: Props & { nearbyEvents: ExternalEvent[], carouselEvents: ExternalEvent[] }) {
    return (
        <GeolocationProvider>
            <WelcomeContent
                canRegister={canRegister}
                events={initialEvents}
                nearbyEvents={nearbyEvents}
                carouselEvents={carouselEvents}
                filters={filters}
                options={options}
            />
        </GeolocationProvider>
    );
}

function WelcomeContent({ canRegister, events, nearbyEvents, carouselEvents, filters, options }: Props & { nearbyEvents: ExternalEvent[], carouselEvents: ExternalEvent[] }) {
    const { city, state, country, latitude, longitude } = useGeolocation();
    const locationSentRef = useRef(false);

    // Update session location when coordinates are available
    useEffect(() => {
        if (latitude !== null && longitude !== null && !locationSentRef.current) {
            locationSentRef.current = true;

            axios.post(route('location.store'), {
                lat: latitude,
                lng: longitude,
                city: city,
                state: state,
                country: country
            }).then(() => {
                // Reload to get sorted events
                router.reload({
                    only: ['events', 'nearbyEvents'],
                    preserveScroll: true,
                });
            }).catch(err => {
                console.error('Failed to update location session', err);
                locationSentRef.current = false;
            });
        }
    }, [latitude, longitude, city, state, country]);

    // cleanTitle moved to EventCard component

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100 font-sans selection:bg-[#c90000] selection:text-white">
            <Head title="Inicio - Boletea" />

            <PublicHeader canRegister={canRegister} />

            <main>
                {/* Hero Section */}
                <section className="relative pt-24 pb-16 lg:pt-28 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#c90000] opacity-[0.08] blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="container mx-auto px-6">
                        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10 xl:gap-16">
                            <div className="text-center lg:text-left">
                                <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl">
                                    Vive la <span className="text-[#c90000]">experiencia</span>.
                                </h1>
                                <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400 lg:mx-0 lg:text-lg xl:text-xl">
                                    Descubre los mejores conciertos, festivales y obras de teatro en tu ciudad.
                                </p>
                            </div>

                            <div className="relative mx-auto w-full max-w-[500px] lg:mx-0 lg:max-w-none">
                                <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 4000 })]} className="h-full w-full">
                                    <CarouselContent>
                                        {carouselEvents && carouselEvents.map((event) => (
                                            <CarouselItem key={event.id}>
                                                <Link href={route('event.show', event.id)} className="group relative block aspect-[5/4] w-full overflow-hidden rounded-2xl">
                                                    {event.image_path ? (
                                                        <img src={event.image_path} alt={event.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-gray-800"><span className="text-gray-400">Sin Imagen</span></div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60"></div>
                                                    <div className="absolute bottom-0 left-0 p-6 text-white">
                                                        <h3 className="text-2xl font-bold">{event.title.replace(/^[A-Z0-9]+\s+/, '')}</h3>
                                                        <p className="text-gray-300">{event.city}</p>
                                                    </div>
                                                </Link>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Filter Bar */}
                <FilterBar filters={filters} options={options} />

                {/* Main Content Area */}
                <div className="pb-16 bg-gray-50 dark:bg-[#0a0a0a]">

                    {/* Nearby Events Section */}
                    {nearbyEvents && nearbyEvents.length > 0 && (
                        <section className="py-12 border-b border-gray-200 dark:border-white/5">
                            <div className="container mx-auto px-6">
                                <div className="mb-8 flex items-center gap-2">
                                    <MapPin className="text-[#c90000]" />
                                    <h2 className="text-3xl font-bold">
                                        Eventos cerca de {state || city || 'ti'}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {nearbyEvents.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* All / Filtered Events Section */}
                    <section className="py-12">
                        <div className="container mx-auto px-6">
                            <div className="mb-12">
                                <h2 className="text-3xl font-bold">
                                    {Object.keys(filters).length > 0 ? 'Resultados de tu búsqueda' : 'Todos los Eventos'}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {`${events.length} resultados encontrados`}
                                </p>
                            </div>

                            {events.length > 0 ? (
                                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {events.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center border dashed border-gray-200 rounded-3xl">
                                    <p className="text-lg text-gray-500">No se encontraron eventos con estos filtros.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <PublicFooter />
        </div >
    );
}



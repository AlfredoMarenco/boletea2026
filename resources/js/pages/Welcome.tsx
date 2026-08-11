import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import {
    GeolocationProvider,
    useGeolocation,
} from '@/contexts/GeolocationProvider';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Calendar, Search, X } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

interface WelcomeBanner {
    id: number;
    title: string | null;
    image_path: string | null;
    external_link: string | null;
    external_event_id: number | null;
    is_active: boolean;
    resolved_image: string | null;
    resolved_link: string | null;
    resolved_title: string;
    event?: ExternalEvent | null;
}

interface Props {
    canRegister: boolean;
    events: ExternalEvent[];
    filters: Filters;
    options: FilterOptions;
    showFeatured: boolean;
    showNearby: boolean;
    bannerEvent: WelcomeBanner | null;
}

export default function Welcome({
    canRegister,
    events: initialEvents,
    nearbyEvents,
    carouselEvents,
    featuredEvents,
    bannerEvent,
    filters,
    options,
    showFeatured,
    showNearby,
}: Props & {
    nearbyEvents: ExternalEvent[];
    carouselEvents: ExternalEvent[];
    featuredEvents: ExternalEvent[];
}) {
    return (
        <GeolocationProvider>
            <WelcomeContent
                canRegister={canRegister}
                events={initialEvents}
                nearbyEvents={nearbyEvents}
                carouselEvents={carouselEvents}
                featuredEvents={featuredEvents}
                bannerEvent={bannerEvent}
                filters={filters}
                options={options}
                showFeatured={showFeatured}
                showNearby={showNearby}
            />
        </GeolocationProvider>
    );
}

function WelcomeContent({
    canRegister,
    events,
    nearbyEvents,
    carouselEvents,
    featuredEvents,
    bannerEvent,
    filters,
    options,
    showFeatured,
    showNearby,
}: Props & {
    nearbyEvents: ExternalEvent[];
    carouselEvents: ExternalEvent[];
    featuredEvents: ExternalEvent[];
}) {
    const { city, state, country, latitude, longitude } = useGeolocation();
    const locationSentRef = useRef(false);
    const [showBanner, setShowBanner] = useState(false); // Inicia oculto para el delay
    const [progress, setProgress] = useState(100);
    const bannerDuration = 10000; // 10 segundos
    const displayDelay = 2000; // 2 segundos de retraso antes de mostrar

    // Efecto para mostrar el banner después del delay
    useEffect(() => {
        const delayTimer = setTimeout(() => {
            setShowBanner(true);
        }, displayDelay);

        return () => clearTimeout(delayTimer);
    }, []);

    // Efecto para la barra de progreso y auto-cierre
    useEffect(() => {
        if (!showBanner) return;

        const startTime = Date.now();

        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(
                0,
                100 - (elapsed / bannerDuration) * 100,
            );
            setProgress(remaining);

            if (remaining === 0) {
                setShowBanner(false);
                clearInterval(timer);
            }
        }, 30); // Actualiza con la suficiente frecuencia para que la barra se vea fluida

        return () => clearInterval(timer);
    }, [showBanner]);

    // Update session location when coordinates are available
    useEffect(() => {
        if (
            latitude !== null &&
            longitude !== null &&
            !locationSentRef.current
        ) {
            locationSentRef.current = true;

            axios
                .post(route('location.store'), {
                    lat: latitude,
                    lng: longitude,
                    city: city,
                    state: state,
                    country: country,
                })
                .then(() => {
                    // Reload to get sorted events
                    router.reload({
                        only: ['events', 'nearbyEvents', 'featuredEvents'],
                    });
                })
                .catch((err) => {
                    console.error('Failed to update location session', err);
                    locationSentRef.current = false;
                });
        }
    }, [latitude, longitude, city, state, country]);

    // cleanTitle moved to EventCard component

    const hasActiveFilters = !!(
        filters.search ||
        filters.city ||
        filters.venue_id ||
        (filters.category && filters.category !== 'all') ||
        (filters.date_start && filters.date_end)
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-[#c90000] selection:text-white dark:bg-background dark:text-gray-100">
            <Head>
                <title>Inicio - Boletea</title>
                <meta
                    name="description"
                    content="Descubre los mejores conciertos, festivales y obras de teatro en tu ciudad con Boletea. Compra tus boletos de forma segura y vive la experiencia."
                />
                <meta
                    name="keywords"
                    content="boletea, boletos, eventos, conciertos, teatros, festivales, tickets, mexico"
                />
                <meta property="og:title" content="Inicio - Boletea" />
                <meta
                    property="og:description"
                    content="Descubre los mejores conciertos, festivales y obras de teatro en tu ciudad con Boletea. Compra tus boletos de forma segura y vive la experiencia."
                />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="Boletea" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Inicio - Boletea" />
                <meta
                    name="twitter:description"
                    content="Descubre los mejores conciertos, festivales y obras de teatro en tu ciudad con Boletea. Compra tus boletos de forma segura y vive la experiencia."
                />
            </Head>

            <PublicHeader canRegister={canRegister} />

            <main className="pt-20">
                {/* Filter Bar */}
                <FilterBar filters={filters} options={options} />

                {/* Hero Section */}
                {!hasActiveFilters && (
                    <section className="relative overflow-hidden pt-12 pb-8 lg:pt-16">
                        <div className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-[#c90000] opacity-[0.08] blur-[120px]"></div>

                        <div className="container mx-auto px-6">
                            <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10 xl:gap-16">
                                <div className="text-center lg:text-left">
                                    <h1 className="mb-6 text-4xl leading-tight font-extrabold tracking-tight md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl">
                                        <span className="text-[#006847]">
                                            Vive
                                        </span>{' '}
                                        la{' '}
                                        <span
                                            style={{
                                                background:
                                                    'linear-gradient(90deg, #006847 0%, #CE1126 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor:
                                                    'transparent',
                                                backgroundClip: 'text',
                                            }}
                                        >
                                            experiencia
                                        </span>
                                        .
                                    </h1>
                                    <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 lg:mx-0 lg:text-lg xl:text-xl dark:text-muted-foreground">
                                        Descubre los mejores conciertos,
                                        festivales y obras de teatro en tu
                                        ciudad.
                                    </p>
                                </div>

                                <div className="relative mx-auto w-full max-w-[500px] lg:mx-0 lg:max-w-none">
                                    <Carousel
                                        opts={{ loop: true }}
                                        plugins={[Autoplay({ delay: 4000 })]}
                                        className="h-full w-full"
                                    >
                                        <CarouselContent>
                                            {carouselEvents &&
                                                carouselEvents.map((event) => (
                                                    <CarouselItem
                                                        key={event.id}
                                                    >
                                                        {event.redirect_external &&
                                                        event.performance_url ? (
                                                            <a
                                                                href={
                                                                    event.performance_url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="group relative block aspect-[5/4] w-full overflow-hidden rounded-2xl"
                                                            >
                                                                {event.image_path ? (
                                                                    <img
                                                                        src={
                                                                            event.image_path
                                                                        }
                                                                        alt={
                                                                            event.title
                                                                        }
                                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center bg-gray-800">
                                                                        <span className="text-gray-400">
                                                                            Sin
                                                                            Imagen
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60"></div>
                                                                <div className="absolute bottom-0 left-0 p-6 text-white">
                                                                    <h3 className="text-2xl font-bold">
                                                                        {event.title.replace(
                                                                            /^[A-Z0-9]+\s+/,
                                                                            '',
                                                                        )}
                                                                    </h3>
                                                                    <p className="text-gray-300">
                                                                        {
                                                                            event.city
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </a>
                                                        ) : (
                                                            <Link
                                                                href={route(
                                                                    'event.show',
                                                                    event.slug ||
                                                                        event.id,
                                                                )}
                                                                className="group relative block aspect-[5/4] w-full overflow-hidden rounded-2xl"
                                                            >
                                                                {event.image_path ? (
                                                                    <img
                                                                        src={
                                                                            event.image_path
                                                                        }
                                                                        alt={
                                                                            event.title
                                                                        }
                                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                                    />
                                                                ) : (
                                                                    <div className="flex h-full w-full items-center justify-center bg-gray-800">
                                                                        <span className="text-gray-400">
                                                                            Sin
                                                                            Imagen
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60"></div>
                                                                <div className="absolute bottom-0 left-0 p-6 text-white">
                                                                    <h3 className="text-2xl font-bold">
                                                                        {event.title.replace(
                                                                            /^[A-Z0-9]+\s+/,
                                                                            '',
                                                                        )}
                                                                    </h3>
                                                                    <p className="text-gray-300">
                                                                        {
                                                                            event.city
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        )}
                                                    </CarouselItem>
                                                ))}
                                        </CarouselContent>
                                    </Carousel>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Main Content Area */}
                <div className="bg-gray-50 pb-16 dark:bg-background">
                    {/* Featured Events Section */}
                    {!hasActiveFilters &&
                        showFeatured &&
                        featuredEvents &&
                        featuredEvents.length > 0 && (
                            <section className="border-b border-gray-200 pt-8 pb-4 dark:border-border">
                                <div className="container mx-auto px-6">
                                    <div className="mb-8 flex items-center gap-2 text-yellow-500">
                                        <svg
                                            className="h-8 w-8 drop-shadow-sm"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <h2 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
                                            Eventos Destacados
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
                                        {featuredEvents.map((event) => (
                                            <EventCard
                                                key={event.id}
                                                event={event}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                    {/* Nearby Events Section */}
                    {false &&
                        showNearby &&
                        nearbyEvents &&
                        nearbyEvents.length > 0 && (
                            <section className="border-b border-gray-200 pt-4 pb-12 dark:border-border">
                                <div className="container mx-auto px-6">
                                    <div className="mb-8 flex items-center gap-2">
                                        <MapPin className="text-[#c90000]" />
                                        <h2 className="text-3xl font-bold">
                                            Eventos cerca de{' '}
                                            {state || city || 'ti'}
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
                                        {nearbyEvents.map((event) => (
                                            <EventCard
                                                key={event.id}
                                                event={event}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                    {/* All / Filtered Events Section */}
                    <section className="py-12">
                        <div className="container mx-auto px-6">
                            <div className="mb-12">
                                <h2 className="flex items-center gap-2 text-3xl font-bold">
                                    {hasActiveFilters
                                        ? 'Resultados de tu búsqueda'
                                        : 'Todos los Eventos'}
                                </h2>
                                <p className="text-gray-500 dark:text-muted-foreground">
                                    {`${events.length} resultados encontrados`}
                                </p>
                            </div>

                            {events.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
                                    {events.map((event) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="dashed rounded-3xl border border-gray-200 p-20 text-center">
                                    <p className="text-lg text-gray-500">
                                        No se encontraron eventos con estos
                                        filtros.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Modal / Banner Flotante - Dinámico (Optimizado) */}
            {showBanner && bannerEvent && (
                <div className="fixed right-6 bottom-6 z-50 w-[280px] animate-in duration-700 slide-in-from-bottom-5 fade-in sm:w-[320px] md:w-[350px]">
                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-shadow hover:shadow-red-500/10 dark:border-border dark:bg-card">
                        {/* Barra de progreso de cierre */}
                        <div className="absolute top-0 left-0 z-20 h-1 w-full bg-gray-100 dark:bg-card">
                            <div
                                className="h-full bg-[#c90000]"
                                style={{
                                    width: `${progress}%`,
                                    transition: 'width 30ms linear',
                                }}
                            ></div>
                        </div>

                        <button
                            onClick={() => setShowBanner(false)}
                            className="absolute top-3 right-3 z-30 rounded-full bg-black/40 p-1.5 text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-[#c90000] focus:opacity-100"
                            aria-label="Cerrar banner"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <a
                            href={bannerEvent.resolved_link || '#'}
                            target={
                                bannerEvent.resolved_link &&
                                bannerEvent.resolved_link.startsWith('http') &&
                                !bannerEvent.resolved_link.includes(
                                    window.location.hostname,
                                )
                                    ? '_blank'
                                    : '_self'
                            }
                            rel="noopener noreferrer"
                            className="block pt-1"
                        >
                            <div className="border-b border-gray-100 bg-gray-50/80 px-3 py-2 text-center text-[10px] font-bold tracking-wider text-[#c90000] uppercase backdrop-blur-sm sm:text-xs dark:border-border dark:bg-card/80 dark:text-red-500">
                                ¡Evento Recomendado!
                            </div>
                            <div className="relative flex justify-center overflow-hidden bg-black/5">
                                <img
                                    src={
                                        bannerEvent.resolved_image ||
                                        '/images/banners/banner_web.png'
                                    }
                                    alt={bannerEvent.resolved_title || ''}
                                    className="h-auto w-full transform object-contain transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                <div className="absolute right-3 bottom-2 left-3 line-clamp-1 translate-y-2 text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                    {bannerEvent.resolved_title}
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            )}

            <PublicFooter />
        </div>
    );
}

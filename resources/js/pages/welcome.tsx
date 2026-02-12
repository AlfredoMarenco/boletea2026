import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ModeToggle } from '@/components/mode-toggle';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { GeolocationProvider, useGeolocation } from '@/contexts/GeolocationProvider';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface ExternalEvent {
    id: number;
    title: string;
    city: string | null;
    category: string | null;
    status: 'draft' | 'published';
    image_path: string | null;
    sales_centers: string[] | null;
    description: string | null;
    distance_km?: number | null;
}

interface Props {
    canRegister: boolean;
    events: ExternalEvent[];
}

export default function Welcome({ canRegister, events: initialEvents }: Props) {
    return (
        <GeolocationProvider>
            <WelcomeContent canRegister={canRegister} events={initialEvents} />
        </GeolocationProvider>
    );
}

function WelcomeContent({ canRegister, events }: Props) {
    const { city, latitude, longitude, isLoading } = useGeolocation();

    // Reload events with user location when coordinates are available
    useEffect(() => {
        if (latitude !== null && longitude !== null) {
            router.reload({
                data: {
                    lat: latitude,
                    lng: longitude,
                },
                only: ['events'],
            });
        }
    }, [latitude, longitude]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100 font-sans selection:bg-[#c90000] selection:text-white">
            <Head title="Inicio - Boletea" />

            {/* Navbar / Header */}
            <PublicHeader canRegister={canRegister} />

            <main>
                {/* Hero Section */}
                <section className="relative pt-24 pb-16 lg:pt-28 overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#c90000] opacity-[0.08] blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="container mx-auto px-6">
                        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10 xl:gap-16">
                            {/* Left Column: Text & Search */}
                            <div className="text-center lg:text-left">
                                <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl">
                                    Vive la <span className="text-[#c90000]">experiencia</span>.
                                </h1>
                                <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400 lg:mx-0 lg:text-lg xl:text-xl">
                                    Descubre los mejores conciertos, festivales y obras de teatro en tu ciudad.
                                    Tu entrada a momentos inolvidables.
                                </p>

                                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                                    <input
                                        type="text"
                                        placeholder="Buscar evento..."
                                        className="w-full max-w-sm rounded-full border border-gray-200 bg-white/50 px-6 py-3 text-sm backdrop-blur-sm focus:border-[#c90000] focus:ring-2 focus:ring-[#c90000]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    />
                                    <button className="rounded-full bg-[#c90000] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition-transform hover:scale-105 active:scale-95">
                                        Buscar
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Image Slider */}
                            <div className="relative mx-auto w-full max-w-[500px] lg:mx-0 lg:max-w-none">
                                <div className="relative aspect-[5/4] overflow-hidden rounded-2xl shadow-2xl shadow-red-900/20">
                                    <Carousel
                                        opts={{
                                            loop: true,
                                        }}
                                        plugins={[
                                            Autoplay({
                                                delay: 4000,
                                            }),
                                        ]}
                                        className="h-full w-full"
                                    >
                                        <CarouselContent className="h-full">
                                            {events.length > 0 ? (
                                                events.slice(0, 5).map((event) => (
                                                    <CarouselItem key={event.id} className="h-full w-full">
                                                        <Link href={route('event.show', event.id)} className="group relative block h-full w-full cursor-pointer">
                                                            {event.image_path ? (
                                                                <img
                                                                    src={event.image_path}
                                                                    alt={event.title}
                                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                                                                    <span className="text-gray-400">Sin Imagen</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white opacity-0 transition-all duration-300 translate-y-4 group-hover:translate-y-0 group-hover:opacity-100">
                                                                <h3 className="line-clamp-2 text-2xl font-bold">{event.title}</h3>
                                                                <p className="mt-1 text-sm text-gray-300">{event.city}</p>
                                                            </div>
                                                        </Link>
                                                    </CarouselItem>
                                                ))
                                            ) : (
                                                <CarouselItem className="h-full w-full">
                                                    <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                                                        <span className="text-gray-400">No hay eventos destacados</span>
                                                    </div>
                                                </CarouselItem>
                                            )}
                                        </CarouselContent>
                                        {/* Optional buttons */}
                                        {/* <CarouselPrevious className="left-4 bg-white/10 hover:bg-white/20 text-white border-0" /> */}
                                        {/* <CarouselNext className="right-4 bg-white/10 hover:bg-white/20 text-white border-0" /> */}
                                    </Carousel>
                                </div>
                                {/* Decorative elements behind slider */}
                                <div className="absolute -top-10 -right-10 -z-10 h-[300px] w-[300px] rounded-full bg-[#c90000] opacity-20 blur-[100px]"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Events Grid Section */}
                <section className="py-16 bg-gray-50 dark:bg-[#0a0a0a]">
                    <div className="container mx-auto px-6">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                                    {city ? `Próximos Eventos cerca de ${city}` : 'Próximos Eventos'}
                                </h2>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Explora lo que está por suceder.</p>
                            </div>
                            <Link href="#" className="hidden text-sm font-medium text-[#c90000] hover:underline md:block">
                                Ver todos los eventos &rarr;
                            </Link>
                        </div>

                        {events.length > 0 ? (
                            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-[#111] border border-gray-100 dark:border-white/5"
                                    >
                                        {/* Image Container */}
                                        <div
                                            className="relative w-full overflow-hidden bg-gray-200 dark:bg-gray-800"
                                            style={{ aspectRatio: '500/400' }}
                                        >
                                            {event.image_path ? (
                                                <img
                                                    src={event.image_path}
                                                    alt={event.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-gray-400">
                                                    <span className="text-xs uppercase tracking-widest">Sin Imagen</span>
                                                </div>
                                            )}

                                            {/* Badges */}
                                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                {event.category && (
                                                    <span className="inline-flex px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-black shadow-sm">
                                                        {event.category}
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

                                        {/* Content */}
                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#c90000]">
                                                <span>{event.city || 'Ubicación pendiente'}</span>
                                            </div>
                                            <h3 className="mb-2 text-xl font-bold leading-tight text-gray-900 group-hover:text-[#c90000] dark:text-white transition-colors">
                                                {event.title}
                                            </h3>

                                            <div className="mt-auto pt-4">
                                                <Link
                                                    href={route('event.show', event.id)}
                                                    className="block w-full rounded-xl bg-gray-900 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#c90000] dark:bg-white dark:text-black dark:hover:bg-[#c90000] dark:hover:text-white"
                                                >
                                                    Ver Detalles
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-20 text-center dark:border-gray-800 dark:bg-white/5">
                                <p className="text-lg font-medium text-gray-500">No hay eventos publicados por el momento.</p>
                            </div>
                        )}

                        <div className="mt-12 text-center md:hidden">
                            <Link href="#" className="text-sm font-medium text-[#c90000] hover:underline">
                                Ver todos los eventos &rarr;
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Unified Footer */}
            <PublicFooter />
        </div>
    );
}

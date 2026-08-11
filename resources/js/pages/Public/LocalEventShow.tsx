import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import {
    Calendar as CalendarIcon,
    MapPin,
    Ticket,
    ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Venue {
    name: string;
    address: string;
}

interface Event {
    id: number;
    name: string;
    slug: string;
    description: string;
    start_date: string;
    end_date: string | null;
    image_path: string | null;
    venue: Venue;
}

interface Props {
    event: Event;
}

export default function LocalEventShow({ event }: Props) {
    const displayDate = event.start_date ? new Date(event.start_date) : null;
    const cleanTitle = event.name.replace(/^[A-Z0-9]+\s+/, '');

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-background dark:text-gray-100">
            <Head>
                <title>{`${cleanTitle} - Boletea`}</title>
                <meta
                    name="description"
                    content={
                        event.description
                            ? event.description
                                  .replace(/<[^>]*>?/gm, '')
                                  .substring(0, 160) + '...'
                            : `Boletos para ${cleanTitle} en Boletea.`
                    }
                />
                <meta property="og:title" content={`${cleanTitle} - Boletea`} />
                <meta
                    property="og:description"
                    content={
                        event.description
                            ? event.description
                                  .replace(/<[^>]*>?/gm, '')
                                  .substring(0, 160) + '...'
                            : `Boletos para ${cleanTitle} en Boletea.`
                    }
                />
                {event.image_path && (
                    <meta property="og:image" content={event.image_path} />
                )}
                <meta property="og:type" content="article" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content={`${cleanTitle} - Boletea`}
                />
                <meta
                    name="twitter:description"
                    content={
                        event.description
                            ? event.description
                                  .replace(/<[^>]*>?/gm, '')
                                  .substring(0, 160) + '...'
                            : `Boletos para ${cleanTitle} en Boletea.`
                    }
                />
                {event.image_path && (
                    <meta name="twitter:image" content={event.image_path} />
                )}
            </Head>

            <PublicHeader />

            <main className="pt-20">
                {/* Hero / Header Section */}
                <div className="relative flex min-h-[50vh] w-full flex-col justify-end overflow-hidden bg-gray-900">
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                        {event.image_path ? (
                            <img
                                src={
                                    event.image_path.startsWith('http')
                                        ? event.image_path
                                        : `/storage/${event.image_path}`
                                }
                                alt={event.name}
                                className="h-full w-full object-cover opacity-60"
                            />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-gray-800 to-black" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                    </div>

                    <div className="relative z-10 container mx-auto flex h-full flex-col justify-end px-6 pb-8 md:pb-12 lg:pb-16">
                        <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
                            <div className="flex flex-col items-start gap-4 md:max-w-4xl">
                                <Badge className="border-none bg-[#c90000] px-2.5 py-0.5 text-xs text-white hover:bg-[#a00000]">
                                    Concierto
                                </Badge>
                                <h1 className="text-3xl leading-tight font-black tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl">
                                    {cleanTitle}
                                </h1>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        {displayDate && (
                                            <div className="flex min-w-[60px] flex-col items-center justify-center rounded-xl bg-white p-2 shadow-lg">
                                                <span className="text-xs leading-none font-bold tracking-widest text-gray-500 uppercase">
                                                    {format(
                                                        displayDate,
                                                        'MMM',
                                                        { locale: es },
                                                    ).replace('.', '')}
                                                </span>
                                                <span className="text-2xl leading-none font-extrabold text-[#c90000]">
                                                    {format(displayDate, 'dd')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col text-white">
                                            <div className="flex items-center gap-2 text-lg font-bold">
                                                <MapPin className="size-5 text-[#c90000]" />
                                                <span>
                                                    {event.venue?.name ||
                                                        'Ubicación por confirmar'}
                                                </span>
                                            </div>
                                            <span className="ml-7 text-sm text-gray-300">
                                                {event.venue?.address}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Image (Poster) */}
                            {event.image_path && (
                                <div className="hidden shrink-0 animate-in delay-300 duration-700 fade-in slide-in-from-bottom-8 md:block">
                                    <img
                                        src={
                                            event.image_path.startsWith('http')
                                                ? event.image_path
                                                : `/storage/${event.image_path}`
                                        }
                                        alt={`Poster ${event.name}`}
                                        className="animate-pulse-slow mt-10 h-auto w-56 rounded-lg border-[4px] border-white/10 object-cover shadow-xl backdrop-blur-sm lg:w-72"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="container mx-auto flex flex-col gap-8 px-6 py-8 lg:grid lg:grid-cols-3 lg:items-start lg:gap-10 lg:py-10">
                    {/* Left Column: Details */}
                    <div className="order-2 flex flex-col gap-8 lg:order-1 lg:col-span-2 lg:gap-10">
                        <section>
                            <h2 className="mb-4 text-2xl font-bold text-slate-900 lg:text-3xl dark:text-white">
                                Acerca del evento
                            </h2>
                            {event.description ? (
                                <div
                                    className="prose prose-sm max-w-none overflow-x-auto break-words text-gray-600 dark:text-muted-foreground dark:prose-invert"
                                    dangerouslySetInnerHTML={{
                                        __html: event.description,
                                    }}
                                />
                            ) : (
                                <p className="text-slate-400 italic">
                                    No hay descripción disponible para este
                                    evento.
                                </p>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Sticky Booking Card */}
                    <div className="relative order-1 w-full lg:order-2">
                        <div className="sticky top-24 flex flex-col gap-6">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-border dark:bg-card">
                                <h3 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">
                                    Reserva tus Boletos
                                </h3>

                                <div className="space-y-6">
                                    {displayDate && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-gray-700 dark:text-muted-foreground">
                                                Fecha y Hora del Evento
                                            </label>
                                            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-border dark:bg-white/5">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c90000]/10 text-[#c90000]">
                                                    <CalendarIcon className="size-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 capitalize dark:text-white">
                                                        {format(
                                                            displayDate,
                                                            "EEEE d 'de' MMMM yyyy",
                                                            { locale: es },
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-muted-foreground">
                                                        Horario:{' '}
                                                        {format(
                                                            displayDate,
                                                            'h:mm a',
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <Link
                                        href={route(
                                            'local-event.booking',
                                            event.slug,
                                        )}
                                        className="block w-full"
                                    >
                                        <Button className="h-12 w-full rounded-xl bg-[#c90000] text-lg font-bold text-white shadow-lg shadow-red-600/20 hover:bg-[#a00000]">
                                            <Ticket className="mr-2 h-5 w-5" />
                                            Comprar Boletos
                                        </Button>
                                    </Link>

                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                        <ShieldCheck className="size-4 text-green-600" />
                                        <span>Compra 100% segura</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}

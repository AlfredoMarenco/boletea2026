import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, DollarSign, Ticket, Layers, Tag, Check } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import GeneralTab from './components/tabs/GeneralTab';
import PricingTab from './components/tabs/PricingTab';
import TicketTab from './components/tabs/TicketTab';
import AvailabilityMapTab from './components/tabs/AvailabilityMapTab';
import PromotionsTab from './components/tabs/PromotionsTab';
import { Event, Showtime, Venue, SeatingMap, PriceType } from './types';

interface Props {
    event: Event;
    showtime: Showtime;
    venues: Venue[];
    seatingMaps: SeatingMap[];
    priceTypes: PriceType[];
}

export default function ShowtimeShow({ event, showtime, venues, seatingMaps, priceTypes }: Props) {
    const handleSyncInventory = () => {
        router.post(route('admin.local-events.showtimes.sync-inventory', [event.id, showtime.id]));
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Eventos Locales',
                    href: route('admin.local-events.index'),
                },
                {
                    title: event.name,
                    href: route('admin.local-events.edit', event.id),
                },
                {
                    title: 'Funciones',
                    href: route('admin.local-events.showtimes.index', event.id),
                },
                {
                    title: showtime.name,
                    href: route('admin.local-events.showtimes.show', [event.id, showtime.id]),
                },
            ]}
        >
            <Head title={`Administrar ${showtime.name} - ${event.name}`} />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.get(route('admin.local-events.showtimes.index', event.id))}
                        className="gap-2 text-xs font-semibold"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Lista de Funciones
                    </Button>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black tracking-tight">{showtime.name}</h2>
                                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    {showtime.status}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                                <span>Recinto: <strong className="text-foreground">{showtime.venue?.name}</strong></span>
                                <span>•</span>
                                <span>Mapa Base: <strong className="text-foreground">{showtime.seating_map?.name || 'Snapshot'}</strong></span>
                                <span>•</span>
                                <span>Show: <strong className="text-foreground">{format(new Date(showtime.date_time), "dd/MM/yyyy HH:mm 'hrs'", { locale: es })}</strong></span>
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSyncInventory}
                            className="gap-2 text-xs font-bold shrink-0"
                        >
                            <Check className="h-4 w-4 text-emerald-600" />
                            Re-sincronizar Inventario de Asientos
                        </Button>
                    </div>

                    <Tabs defaultValue="general" className="w-full">
                        <div className="border-b px-6 bg-slate-50/30 dark:bg-slate-900/30">
                            <TabsList className="h-12 bg-transparent gap-2 p-0">
                                <TabsTrigger
                                    value="general"
                                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold gap-2 text-xs h-10 px-4"
                                >
                                    <Settings className="h-4 w-4 text-indigo-500" />
                                    Datos Generales & Fechas
                                </TabsTrigger>
                                <TabsTrigger
                                    value="prices"
                                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold gap-2 text-xs h-10 px-4"
                                >
                                    <DollarSign className="h-4 w-4 text-emerald-500" />
                                    Precios & Categorías
                                </TabsTrigger>
                                <TabsTrigger
                                    value="ticket"
                                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold gap-2 text-xs h-10 px-4"
                                >
                                    <Ticket className="h-4 w-4 text-amber-500" />
                                    Boleto Imprimible
                                </TabsTrigger>
                                <TabsTrigger
                                    value="availability"
                                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold gap-2 text-xs h-10 px-4"
                                >
                                    <Layers className="h-4 w-4 text-purple-500" />
                                    Disponibilidad Asientos (Mapa)
                                </TabsTrigger>
                                <TabsTrigger
                                    value="promotions"
                                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm font-bold gap-2 text-xs h-10 px-4"
                                >
                                    <Tag className="h-4 w-4 text-rose-500" />
                                    Promociones & Cupones
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="general" className="p-6">
                            <GeneralTab event={event} showtime={showtime} venues={venues} seatingMaps={seatingMaps} />
                        </TabsContent>

                        <TabsContent value="prices" className="p-6">
                            <PricingTab event={event} showtime={showtime} priceTypes={priceTypes} />
                        </TabsContent>

                        <TabsContent value="ticket" className="p-6">
                            <TicketTab event={event} showtime={showtime} />
                        </TabsContent>

                        <TabsContent value="availability" className="p-6">
                            <AvailabilityMapTab event={event} showtime={showtime} />
                        </TabsContent>

                        <TabsContent value="promotions" className="p-6">
                            <PromotionsTab event={event} showtime={showtime} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}

import { Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import ShowtimesTable from './components/ShowtimesTable';
import CreateShowtimeModal from './components/CreateShowtimeModal';
import { Event, Venue, SeatingMap, PriceType } from './types';

interface Props {
    event: Event;
    venues: Venue[];
    seatingMaps: SeatingMap[];
    priceTypes: PriceType[];
}

export default function ShowtimesIndex({ event, venues, seatingMaps }: Props) {
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
                    title: 'Funciones del Evento',
                    href: route('admin.local-events.showtimes.index', event.id),
                },
            ]}
        >
            <Head title={`Funciones - ${event.name}`} />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Funciones del Evento</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gestiona las fechas, horarios, recintos y configuraciones de venta para <strong className="text-foreground">{event.name}</strong>.
                        </p>
                    </div>

                    <CreateShowtimeModal
                        event={event}
                        venues={venues}
                        seatingMaps={seatingMaps}
                    />
                </div>

                <ShowtimesTable event={event} />
            </div>
        </AppLayout>
    );
}

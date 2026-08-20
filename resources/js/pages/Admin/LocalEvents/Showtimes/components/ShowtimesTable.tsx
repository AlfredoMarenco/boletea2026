import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Calendar, MapPin, Sliders, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Event, Showtime } from '../types';

interface Props {
    event: Event;
}

export default function ShowtimesTable({ event }: Props) {
    const handleDeleteShowtime = (showtimeId: number) => {
        if (
            confirm(
                '¿Estás seguro de eliminar esta función? No se puede eliminar si ya tiene boletos vendidos.'
            )
        ) {
            router.delete(route('admin.local-events.showtimes.destroy', [event.id, showtimeId]));
        }
    };

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/60">
                        <TableHead className="w-12 font-bold text-center">#</TableHead>
                        <TableHead className="font-bold">Función / Fecha / Horario</TableHead>
                        <TableHead className="font-bold">Recinto & Mapa</TableHead>
                        <TableHead className="font-bold">Estado & Canales</TableHead>
                        <TableHead className="text-right font-bold">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {event.showtimes && event.showtimes.length > 0 ? (
                        event.showtimes.map((st: Showtime, index: number) => {
                            const totalSeats = st.seat_inventories?.length || 0;
                            const availableSeats =
                                st.seat_inventories?.filter((i) => i.status === 'available')
                                    .length || 0;

                            return (
                                <TableRow
                                    key={st.id}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                                >
                                    <TableCell className="text-center font-black text-slate-400">
                                        {index + 1}.
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-extrabold text-base text-foreground flex items-center gap-2">
                                                <span>{st.name}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-3">
                                                <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(
                                                        new Date(st.date_time),
                                                        "EEEE d 'de' MMMM, yyyy | HH:mm 'hrs'",
                                                        { locale: es }
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5 text-xs">
                                            <p className="font-semibold text-foreground flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-[#c90000]" />
                                                {st.venue?.name || 'Recinto no asignado'}
                                            </p>
                                            <p className="text-muted-foreground">
                                                Mapa:{' '}
                                                <span className="font-medium text-foreground">
                                                    {st.seating_map?.name || 'Snapshot inmutable'}
                                                </span>
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-md px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    Estado:{' '}
                                                    {st.status === 'on_sale'
                                                        ? 'A la Venta'
                                                        : st.status}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground">
                                                Asientos Disponibles:{' '}
                                                <strong className="text-emerald-600 dark:text-emerald-400">
                                                    {availableSeats}
                                                </strong>{' '}
                                                / {totalSeats}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-1.5">
                                            <Button
                                                size="sm"
                                                className="bg-[#c90000] hover:bg-[#a00000] text-white gap-1.5 font-bold shadow-sm"
                                                onClick={() =>
                                                    router.get(
                                                        route(
                                                            'admin.local-events.showtimes.show',
                                                            [event.id, st.id]
                                                        )
                                                    )
                                                }
                                            >
                                                <Sliders className="h-3.5 w-3.5" />
                                                Administrar
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                                                onClick={() => handleDeleteShowtime(st.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                No hay funciones registradas para este evento aún. Haz clic en "Nueva Función" para agregar una.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

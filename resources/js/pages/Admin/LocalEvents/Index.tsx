import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
    id: number;
    name: string;
    start_date: string;
    venue: {
        name: string;
    };
    status: string;
}

interface Props {
    events: Event[];
}

export default function Index({ events }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este evento?')) {
            router.delete(route('admin.local-events.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Eventos Locales', href: route('admin.local-events.index') },
        ]}>
            <Head title="Eventos Locales" />

            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Eventos Gestionados</h1>
                    <Button asChild>
                        <Link href={route('admin.local-events.create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Evento
                        </Link>
                    </Button>
                </div>

                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Evento</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Recinto</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.length > 0 ? (
                                events.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                                                {event.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(event.start_date), "d 'de' MMMM, yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell>{event.venue.name}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                event.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {event.status === 'published' ? 'Publicado' : 'Borrador'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={route('admin.local-events.edit', event.id)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(event.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No hay eventos locales registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}

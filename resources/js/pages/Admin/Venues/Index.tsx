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
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';

interface Venue {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
}

interface Props {
    venues: {
        data: Venue[];
        links: any[];
    };
}

export default function Index({ venues }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este recinto?')) {
            router.delete(route('admin.venues.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Recintos', href: route('admin.venues.index') },
        ]}>
            <Head title="Recintos" />

            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Recintos (Venues)</h1>
                    <Button asChild>
                        <Link href={route('admin.venues.create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Recinto
                        </Link>
                    </Button>
                </div>

                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Ubicación</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {venues.data.length > 0 ? (
                                venues.data.map((venue) => (
                                    <TableRow key={venue.id}>
                                        <TableCell className="font-medium">{venue.name}</TableCell>
                                        <TableCell>
                                            {venue.latitude && venue.longitude ? (
                                                <span className="flex items-center text-green-600 text-xs">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    Coordenadas OK
                                                </span>
                                            ) : (
                                                <span className="text-orange-500 text-xs">Sin ubicación</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={route('admin.venues.edit', venue.id)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(venue.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No hay recintos registrados.
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

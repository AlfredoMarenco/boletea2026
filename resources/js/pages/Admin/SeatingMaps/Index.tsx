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
import { Plus, Pencil, Trash2, Layout } from 'lucide-react';

interface SeatingMap {
    id: number;
    name: string;
    venue: {
        name: string;
    };
    is_active: boolean;
}

interface Props {
    seatingMaps: SeatingMap[];
}

export default function Index({ seatingMaps }: Props) {
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta plantilla de mapa?')) {
            router.delete(route('admin.seating-maps.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Mapas de Asientos', href: route('admin.seating-maps.index') },
        ]}>
            <Head title="Mapas de Asientos" />

            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Plantillas de Mapas</h1>
                    <Button asChild>
                        <Link href={route('admin.seating-maps.create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Mapa
                        </Link>
                    </Button>
                </div>

                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre del Mapa</TableHead>
                                <TableHead>Recinto (Venue)</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {seatingMaps.length > 0 ? (
                                seatingMaps.map((map) => (
                                    <TableRow key={map.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <Layout className="h-4 w-4 mr-2 text-blue-500" />
                                                {map.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{map.venue.name}</TableCell>
                                        <TableCell>
                                            {map.is_active ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Activo</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Inactivo</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={route('admin.seating-maps.edit', map.id)}>
                                                        <Pencil className="h-4 w-4 mr-1" />
                                                        Editar Layout
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(map.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No hay mapas registrados.
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

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
} from '@/components/ui/table';
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
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Mapas de Asientos',
                    href: route('admin.seating-maps.index'),
                },
            ]}
        >
            <Head title="Mapas de Asientos" />

            <div className="mx-auto max-w-6xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Plantillas de Mapas</h1>
                    <Button asChild>
                        <Link href={route('admin.seating-maps.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Mapa
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre del Mapa</TableHead>
                                <TableHead>Recinto (Venue)</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {seatingMaps.length > 0 ? (
                                seatingMaps.map((map) => (
                                    <TableRow key={map.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <Layout className="mr-2 h-4 w-4 text-blue-500" />
                                                {map.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{map.venue.name}</TableCell>
                                        <TableCell>
                                            {map.is_active ? (
                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                                    Inactivo
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={route(
                                                            'admin.seating-maps.edit',
                                                            map.id,
                                                        )}
                                                    >
                                                        <Pencil className="mr-1 h-4 w-4" />
                                                        Editar Layout
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() =>
                                                        handleDelete(map.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center"
                                    >
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

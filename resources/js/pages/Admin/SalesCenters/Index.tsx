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
import { Plus, Edit, Trash, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SalesCenter {
    id: number;
    name: string;
    address: string;
    logo_path: string | null;
    is_active: boolean;
    is_digital_only?: boolean;
}

export default function Index({
    salesCenters,
}: {
    salesCenters: SalesCenter[];
}) {
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este punto de venta?')) {
            router.delete(route('admin.sales-centers.destroy', id));
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: route('admin.dashboard') },
                {
                    title: 'Puntos de Venta',
                    href: route('admin.sales-centers.index'),
                },
            ]}
        >
            <Head title="Puntos de Venta" />

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Puntos de Venta
                    </h1>
                    <Button asChild>
                        <Link href={route('admin.sales-centers.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Punto de Venta
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border bg-card text-card-foreground shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">
                                    Logo
                                </TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Dirección</TableHead>
                                <TableHead className="w-[100px]">
                                    Estado
                                </TableHead>
                                <TableHead className="text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salesCenters.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-10 text-center text-muted-foreground"
                                    >
                                        No hay puntos de venta registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                salesCenters.map((center) => (
                                    <TableRow key={center.id}>
                                        <TableCell>
                                            {center.logo_path ? (
                                                <img
                                                    src={center.logo_path}
                                                    alt={center.name}
                                                    className="h-10 w-10 rounded object-contain"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                                                    N/A
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {center.name}
                                        </TableCell>
                                        <TableCell
                                            className="max-w-xs truncate"
                                            title={center.address}
                                        >
                                            {center.address}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    center.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {center.is_active
                                                    ? 'Activo'
                                                    : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="space-x-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                            >
                                                <Link
                                                    href={route(
                                                        'admin.sales-centers.edit',
                                                        center.id,
                                                    )}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDelete(center.id)
                                                }
                                                className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}

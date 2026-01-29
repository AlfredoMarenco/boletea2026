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
import { Plus, Edit, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SalesCenterGroup {
    id: number;
    name: string;
    description: string | null;
    sales_centers_count: number;
}

export default function Index({ groups }: { groups: SalesCenterGroup[] }) {
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este grupo?')) {
            router.delete(route('admin.sales-center-groups.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: route('admin.dashboard') },
            { title: 'Grupos de Ventas', href: route('admin.sales-center-groups.index') },
        ]}>
            <Head title="Grupos de Ventas" />

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Grupos de Centros de Venta
                    </h1>
                    <Button asChild>
                        <Link href={route('admin.sales-center-groups.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Grupo
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border bg-card text-card-foreground shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Puntos de Venta</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        No hay grupos registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                groups.map((group) => (
                                    <TableRow key={group.id}>
                                        <TableCell className="font-medium">{group.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{group.description || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {group.sales_centers_count} Puntos
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={route('admin.sales-center-groups.edit', group.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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

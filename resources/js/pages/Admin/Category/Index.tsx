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

interface Category {
    id: number;
    name: string;
    external_events_count: number;
}

export default function Index({ categories }: { categories: Category[] }) {
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta categoría?')) {
            router.delete(route('admin.categories.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: route('admin.dashboard') },
            { title: 'Categorias', href: route('admin.categories.index') },
        ]}>
            <Head title="Categorias" />

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Categorias
                    </h1>
                    <Button asChild>
                        <Link href={route('admin.categories.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Categoria
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border bg-card text-card-foreground shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="text-center">Eventos con esta categoria</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                                        No hay categorias registradas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="text-center font-medium">{category.external_events_count}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={route('admin.categories.edit', category.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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
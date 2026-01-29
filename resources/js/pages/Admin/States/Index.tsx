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

interface State {
    id: number;
    name: string;
}

export default function Index({ states }: { states: State[] }) {
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este estado?')) {
            router.delete(route('admin.states.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: route('admin.dashboard') },
            { title: 'Estados', href: route('admin.states.index') },
        ]}>
            <Head title="Estados" />

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Estados
                    </h1>
                    <Button asChild>
                        <Link href={route('admin.states.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Estado
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border bg-card text-card-foreground shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {states.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">
                                        No hay estados registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                states.map((state) => (
                                    <TableRow key={state.id}>
                                        <TableCell className="font-medium">{state.name}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={route('admin.states.edit', state.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(state.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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

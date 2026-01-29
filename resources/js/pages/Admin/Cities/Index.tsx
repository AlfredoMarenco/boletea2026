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

interface City {
    id: number;
    name: string;
    state: State;
}

export default function Index({ cities }: { cities: City[] }) {
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta ciudad?')) {
            router.delete(route('admin.cities.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: route('admin.dashboard') },
            { title: 'Ciudades', href: route('admin.cities.index') },
        ]}>
            <Head title="Ciudades" />

            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Ciudades
                    </h1>
                    <Button asChild>
                        <Link href={route('admin.cities.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Ciudad
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border bg-card text-card-foreground shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cities.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                                        No hay ciudades registradas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                cities.map((city) => (
                                    <TableRow key={city.id}>
                                        <TableCell className="font-medium">{city.name}</TableCell>
                                        <TableCell>{city.state?.name}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={route('admin.cities.edit', city.id)}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(city.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
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

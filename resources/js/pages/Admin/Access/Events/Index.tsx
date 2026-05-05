import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
}

interface AccessEvent {
    id: number;
    name: string;
    date: string | null;
    status: 'active' | 'inactive';
    external_event?: {
        title: string;
    };
}

interface Props {
    events: PaginatedData<AccessEvent>;
    filters: {
        search?: string | null;
    };
}

export default function Index({ events, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(
                    route('admin.access.events.index'),
                    { search: searchQuery },
                    { preserveState: true, preserveScroll: true, replace: true }
                );
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, filters?.search]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Control de Acceso', href: route('admin.access.events.index') }]}>
            <Head title="Bases de Acceso" />

            <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Bases de Datos de Acceso
                        </h1>
                        <p className="text-sm text-gray-500">Gestión de códigos por eventos</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="w-full lg:w-64">
                            <Input
                                type="text"
                                placeholder="Buscar base..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button asChild variant="default">
                            <Link href={route('admin.access.events.create')}>Crear Nueva Base</Link>
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-md shadow overflow-hidden dark:bg-background border border-gray-200 dark:border-border flex flex-col">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nombre de la Base</TableHead>
                                    <TableHead>Evento Vinculado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.data && events.data.length > 0 ? (
                                    events.data.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>{event.id}</TableCell>
                                            <TableCell className="font-medium">{event.name}</TableCell>
                                            <TableCell>{event.external_event?.title || '-'}</TableCell>
                                            <TableCell>{event.date ? new Date(event.date).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                                                    {event.status === 'active' ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button asChild size="sm" variant="ghost">
                                                    <Link href={route('admin.access.events.stats', event.id)}>
                                                        Estadísticas
                                                    </Link>
                                                </Button>
                                                <Button asChild size="sm" variant="ghost">
                                                    <Link href={route('admin.access.events.edit', event.id)}>
                                                        Editar
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm('¿Estás seguro de que deseas eliminar esta base? Se borrarán todos los códigos asociados.')) {
                                                            router.delete(route('admin.access.events.destroy', event.id));
                                                        }
                                                    }}
                                                >
                                                    Eliminar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            No hay bases de acceso registradas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {events.total > 0 && (
                        <div className="p-4 border-t border-gray-200 dark:border-border flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Mostrando {events.from} a {events.to} de {events.total} resultados
                            </div>
                            <div className="flex gap-1">
                                {events.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${link.active
                                                ? 'bg-primary text-primary-foreground font-medium'
                                                : 'hover:bg-accent text-foreground'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="px-3 py-1 text-sm text-gray-400"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

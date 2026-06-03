import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { Trash2 } from 'lucide-react'; // Added import

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

interface ExternalEvent {
    id: number;
    title: string;
    city: string | null;
    category: string | null;
    status: 'draft' | 'published';
    image_path: string | null;
    sales_centers: string[] | null;
}

interface Props {
    events: PaginatedData<ExternalEvent>;
    filters: {
        show_past: boolean;
        search?: string | null;
    };
}

export default function Index({ events, filters }: Props) {
    const { post, processing } = useForm();
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(
                    route('admin.events.index'),
                    { show_past: filters?.show_past, search: searchQuery },
                    { preserveState: true, preserveScroll: true, replace: true }
                );
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, filters?.show_past, filters?.search]);

    const handleSync = () => {
        post(route('admin.events.sync'));
    };

    const handleTogglePast = (checked: boolean) => {
        router.get(
            route('admin.events.index'),
            { show_past: checked, search: filters?.search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
            router.delete(route('admin.events.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Eventos Externos', href: route('admin.events.index') }]}>
            <Head title="Administrar Eventos" />

            <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Eventos Externos
                    </h1>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="w-full lg:w-64">
                            <Input
                                type="text"
                                placeholder="Buscar evento..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-border pl-4">
                            <Switch
                                id="show-past"
                                checked={filters?.show_past}
                                onCheckedChange={handleTogglePast}
                            />
                            <Label htmlFor="show-past" className="cursor-pointer text-sm font-medium whitespace-nowrap">
                                Mostrar pasados
                            </Label>
                        </div>
                        <Button asChild variant="default">
                            <Link href={route('admin.events.create')}>Crear Evento</Link>
                        </Button>
                        <Button onClick={handleSync} disabled={processing} variant="outline">
                            {processing ? 'Sincronizando...' : 'Sincronizar API'}
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-md shadow overflow-hidden dark:bg-background border border-gray-200 dark:border-border flex flex-col">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Imagen</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Ciudad</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.data && events.data.length > 0 ? (
                                    events.data.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>{event.id}</TableCell>
                                            <TableCell>
                                                <img src={event.image_path || undefined} alt={event.title} className="w-20 h-20 object-contain" />
                                            </TableCell>
                                            <TableCell className="font-medium">{event.title}</TableCell>
                                            <TableCell>{event.city || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                                                    {event.status === 'published' ? 'Publicado' : 'Borrador'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button asChild size="sm" variant="ghost">
                                                        <Link href={route('admin.events.edit', event.id)}>
                                                            Editar
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() => handleDelete(event.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            No hay eventos registrados. Intenta sincronizar.
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

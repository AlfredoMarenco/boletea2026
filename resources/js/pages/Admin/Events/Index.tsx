import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
}

export default function Index({ events }: Props) {
    const { post, processing } = useForm();

    const handleSync = () => {
        post(route('admin.events.sync'));
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Eventos Externos', href: route('admin.events.index') }]}>
            <Head title="Administrar Eventos" />

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Eventos Externos
                    </h1>
                    <div className="flex items-center gap-4">
                        <Button asChild variant="default">
                            <Link href={route('admin.events.create')}>Crear Evento</Link>
                        </Button>
                        <Button onClick={handleSync} disabled={processing} variant="outline">
                            {processing ? 'Sincronizando...' : 'Sincronizar API'}
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-md shadow overflow-hidden dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col">
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
                                                <img src={event.image_path} alt={event.title} className="w-20 h-20 object-contain" />
                                            </TableCell>
                                            <TableCell className="font-medium">{event.title}</TableCell>
                                            <TableCell>{event.city || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                                                    {event.status === 'published' ? 'Publicado' : 'Borrador'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild size="sm" variant="ghost">
                                                    <Link href={route('admin.events.edit', event.id)}>
                                                        Editar
                                                    </Link>
                                                </Button>
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
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
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

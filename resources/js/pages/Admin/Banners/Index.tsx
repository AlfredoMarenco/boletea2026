import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
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

interface WelcomeBanner {
    id: number;
    title: string | null;
    is_active: boolean;
    resolved_image: string | null;
    resolved_link: string | null;
    resolved_title: string;
    external_event_id: number | null;
    created_at: string;
}

interface Props {
    banners: WelcomeBanner[];
}

export default function Index({ banners }: Props) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Banners Flotantes', href: route('admin.banners.index') }]}>
            <Head title="Banners Flotantes" />

            <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Banners Flotantes (Inicio)
                    </h1>
                    <div className="flex gap-2">
                        <Button asChild variant="default">
                            <Link href={route('admin.banners.create')}>Nuevo Banner</Link>
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-md shadow overflow-hidden dark:bg-background border border-gray-200 dark:border-border">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Imagen</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Estatus</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {banners && banners.length > 0 ? (
                                    banners.map((banner) => (
                                        <TableRow key={banner.id}>
                                            <TableCell>
                                                {banner.resolved_image ? (
                                                    <img src={banner.resolved_image} alt={banner.resolved_title} className="w-24 h-16 object-cover rounded-md" />
                                                ) : (
                                                    <div className="w-24 h-16 bg-gray-100 flex items-center justify-center rounded-md text-xs text-gray-500">Sin Imagen</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{banner.resolved_title}</TableCell>
                                            <TableCell>
                                                {banner.external_event_id ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                        Evento Asociado
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">
                                                        Personalizado
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                                                    {banner.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button asChild size="sm" variant="ghost">
                                                    <Link href={route('admin.banners.edit', banner.id)}>
                                                        Editar
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm('¿Estás seguro de que deseas eliminar este banner?')) {
                                                            router.delete(route('admin.banners.destroy', banner.id));
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
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            No hay banners creados aún.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Layout, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface SeatingMap {
    id: number;
    name: string;
    venue: {
        name: string;
    };
    is_active: boolean;
}

interface Venue {
    id: number;
    name: string;
}

interface Props {
    seatingMaps: SeatingMap[];
    venues?: Venue[];
}

export default function Index({ seatingMaps, venues = [] }: Props) {
    const [isImportOpen, setIsImportOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        venue_id: '',
        map_file: null as File | null,
    });

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta plantilla de mapa?')) {
            router.delete(route('admin.seating-maps.destroy', id));
        }
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.map_file) {
            toast.error('Por favor selecciona un archivo JSON de mapa.');
            return;
        }
        post(route('admin.seating-maps.import'), {
            onSuccess: () => {
                setIsImportOpen(false);
                reset();
                toast.success('Mapa importado exitosamente');
            },
        });
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
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Importar Mapa (JSON)
                        </Button>
                        <Button asChild>
                            <Link href={route('admin.seating-maps.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Mapa
                            </Link>
                        </Button>
                    </div>
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
                                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
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
                                                    title="Exportar archivo JSON"
                                                >
                                                    <a
                                                        href={route(
                                                            'admin.seating-maps.export',
                                                            map.id,
                                                        )}
                                                        download
                                                    >
                                                        <Download className="mr-1 h-4 w-4 text-green-600 dark:text-green-400" />
                                                        Exportar JSON
                                                    </a>
                                                </Button>
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
                                                    className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
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
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No hay mapas registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal de Importación */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importar Mapa de Asientos</DialogTitle>
                        <DialogDescription>
                            Selecciona una plantilla de mapa en formato JSON exportada desde otro servidor o entorno local.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleImportSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="import-name">Nombre para el Mapa</Label>
                            <Input
                                id="import-name"
                                placeholder="Ej: Mapa Estadio Importado"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="import-venue">Recinto (Venue) de Destino</Label>
                            <Select
                                onValueChange={(val) => setData('venue_id', val)}
                                value={data.venue_id}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el recinto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {venues.map((v) => (
                                        <SelectItem key={v.id} value={v.id.toString()}>
                                            {v.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.venue_id && (
                                <p className="text-xs text-red-500">{errors.venue_id}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="import-file">Archivo JSON del Mapa</Label>
                            <Input
                                id="import-file"
                                type="file"
                                accept=".json,application/json"
                                onChange={(e) =>
                                    setData('map_file', e.target.files?.[0] || null)
                                }
                                required
                            />
                            {errors.map_file && (
                                <p className="text-xs text-red-500">{errors.map_file}</p>
                            )}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsImportOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Importando...' : 'Importar Mapa'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

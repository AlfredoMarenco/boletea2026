import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Trash2, PlusCircle, ArrowRight } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Audience {
    id: number;
    name: string;
    description: string | null;
    contacts_count: number;
    created_at: string;
}

interface Props {
    audiences: Audience[];
}

export default function Audiences({ audiences }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.mailing.audiences.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`¿Eliminar la lista "${name}"? Los contactos no se borrarán, solo se quitarán de esta lista.`)) {
            router.delete(route('admin.mailing.audiences.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Mailing', href: route('admin.mailing.campaigns.index') },
            { title: 'Audiencias', href: '#' },
        ]}>
            <Head title="Gestión de Audiencias" />

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Audiencias (Listas)</h1>
                        <p className="text-sm text-gray-500 mt-1">Organiza tus contactos en grupos para envíos segmentados.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Formulario de Creación */}
                    <div className="lg:col-span-1">
                        <form onSubmit={handleSubmit} 
                              className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg p-6 shadow-sm sticky top-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 text-primary" /> Nueva Audiencia
                            </h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="aname">Nombre de la lista</Label>
                                    <Input
                                        id="aname"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="Ej: Invitados VIP Gala"
                                        className="mt-1"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="adesc">Descripción (opcional)</Label>
                                    <Textarea
                                        id="adesc"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        placeholder="Breve detalle sobre este grupo..."
                                        className="mt-1 h-24"
                                    />
                                </div>

                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing ? 'Creando...' : 'Crear audiencias'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Tabla de Audiencias */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Contactos</TableHead>
                                        <TableHead>Creada el</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {audiences.length > 0 ? audiences.map(a => (
                                        <TableRow key={a.id}>
                                            <TableCell>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{a.name}</div>
                                                {a.description && <div className="text-xs text-gray-500 line-clamp-1">{a.description}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                    <span className="font-semibold">{a.contacts_count}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {new Date(a.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => router.get(route('admin.mailing.contacts.index'), { audience_id: a.id })}
                                                    className="group"
                                                >
                                                    Gestionar <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                    onClick={() => handleDelete(a.id, a.name)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                                                No hay audiencias creadas. Comienza creando una a la izquierda.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

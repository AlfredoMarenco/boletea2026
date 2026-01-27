import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ExternalEvent {
    id: number;
    title: string;
    city: string | null;
    category: string | null;
    status: 'draft' | 'published';
    image_path: string | null;
    description: string | null;
    sales_centers: string[] | null;
}

interface Props {
    event: ExternalEvent;
}

export default function Edit({ event }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        city: event.city || '',
        category: event.category || '',
        image_path: event.image_path || '',
        description: event.description || '',
        status: event.status,
        sales_centers: event.sales_centers || [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.events.update', event.id));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Eventos', href: route('admin.events.index') },
            { title: 'Editar Evento', href: '#' }
        ]}>
            <Head title={`Editar ${event.title}`} />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                        Editar: {event.title}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="city">Ciudad</Label>
                                <Input
                                    id="city"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                />
                                {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría</Label>
                                <Input
                                    id="category"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                />
                                {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image_path">URL de la Imagen (500x400)</Label>
                            <Input
                                id="image_path"
                                value={data.image_path}
                                onChange={(e) => setData('image_path', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                            {errors.image_path && <p className="text-red-500 text-sm">{errors.image_path}</p>}
                            {data.image_path && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Vista Previa:</p>
                                    <img src={data.image_path} alt="Preview" className="w-[250px] h-[200px] object-cover rounded border" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción (HTML)</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="min-h-[200px] font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500">
                                Puedes usar HTML básico para dar formato.
                            </p>
                            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value: 'draft' | 'published') => setData('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Borrador</SelectItem>
                                    <SelectItem value="published">Publicado</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t">
                            <Button type="button" variant="ghost" asChild>
                                <Link href={route('admin.events.index')}>Cancelar</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

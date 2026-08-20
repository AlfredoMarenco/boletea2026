import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
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

interface Event {
    id: number;
    name: string;
    description: string;
    status: string;
    image_path: string | null;
}

interface Props {
    event: Event;
}

export default function Edit({ event }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: event.name || '',
        description: event.description || '',
        status: event.status || 'draft',
        image: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.local-events.update', event.id));
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Eventos Locales',
                    href: route('admin.local-events.index'),
                },
                {
                    title: 'Editar Evento',
                    href: route('admin.local-events.edit', event.id),
                },
            ]}
        >
            <Head title={`Editar Evento: ${event.name}`} />

            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Editar Evento (Cascarón)</h1>
                        <p className="text-sm text-muted-foreground">
                            Modifica los datos generales del espectáculo. Las funciones, recintos, mapas y fechas de venta se gestionan en su sección correspondiente.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Evento</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Ej: Gran Concierto 2026"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Estado General</Label>
                                <Select
                                    onValueChange={(value) =>
                                        setData('status', value)
                                    }
                                    value={data.status}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Estado del evento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">
                                            Borrador
                                        </SelectItem>
                                        <SelectItem value="published">
                                            Publicado
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            Cancelado
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-sm text-red-500">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">
                                    Imagen / Poster (Opcional)
                                </Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setData(
                                            'image',
                                            e.target.files
                                                ? e.target.files[0]
                                                : null,
                                        )
                                    }
                                />
                                {errors.image && (
                                    <p className="text-sm text-red-500">
                                        {errors.image}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => window.history.back()}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-[#c90000] text-white">
                                    Guardar Cambios
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-6">
                        {event.image_path && (
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <h2 className="mb-4 text-lg font-semibold">
                                    Imagen Actual
                                </h2>
                                <img
                                    src={`/storage/${event.image_path}`}
                                    alt={event.name}
                                    className="w-full rounded-lg object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

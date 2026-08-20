import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Info } from 'lucide-react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        image: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.local-events.store'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Eventos Locales',
                    href: route('admin.local-events.index'),
                },
                {
                    title: 'Nuevo Evento',
                    href: route('admin.local-events.create'),
                },
            ]}
        >
            <Head title="Nuevo Evento (Cascarón)" />

            <div className="mx-auto max-w-2xl p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Crear Nuevo Espectáculo / Evento
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Registra el cascarón principal del espectáculo. Después podrás agregarle 1 o más funciones con sus recintos, mapas y precios correspondientes.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
                >
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3">
                        <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                            <strong>Nota sobre recintos, mapas y precios:</strong>
                            <p className="mt-0.5">
                                Este formulario crea únicamente la información general del espectáculo. Los recintos, funciones, mapas interactivos, precios y fechas de venta se configuran individualmente en el siguiente paso por cada función.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Evento / Espectáculo</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Ej: Tour Boletea 2026"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500 font-medium">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Sinopsis / Descripción General</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Detalles generales del espectáculo para el público..."
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">
                            Poster / Banner Publicitario
                        </Label>
                        <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setData(
                                    'image',
                                    e.target.files ? e.target.files[0] : null,
                                )
                            }
                        />
                        {errors.image && (
                            <p className="text-sm text-red-500 font-medium">
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
                        <Button type="submit" disabled={processing} className="bg-[#c90000] hover:bg-[#a00000] text-white">
                            <Calendar className="mr-2 h-4 w-4" />
                            Crear Evento e Ir a Funciones
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FormEventHandler } from 'react';
import { route } from 'ziggy-js';

interface Props {
    settings: {
        show_featured_events?: string;
        show_nearby_events?: string;
    };
}

export default function Index({ settings }: Props) {
    const { data, setData, post, processing } = useForm({
        show_featured_events: settings.show_featured_events === '1' || settings.show_featured_events === undefined,
        show_nearby_events: settings.show_nearby_events === '1' || settings.show_nearby_events === undefined,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Configuración actualizada correctamente');
            },
            onError: () => {
                toast.error('Hubo un error al actualizar la configuración');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: route('admin.dashboard') },
            { title: 'Configuración del Sitio', href: route('admin.settings.index') },
        ]}>
            <Head title="Configuración del Sitio" />

            <div className="p-6 max-w-2xl mx-auto w-full">
                <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-border">
                    <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                        Configuración de la Página Principal
                    </h1>

                    <form onSubmit={submit} className="space-y-8">
                        
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-200">
                                Secciones Visibles
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Controla qué secciones se muestran a los usuarios en la vista principal (Welcome).
                            </p>

                            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50 dark:bg-muted/50">
                                <Checkbox
                                    id="show_featured_events"
                                    checked={data.show_featured_events}
                                    onCheckedChange={(checked) => setData('show_featured_events', checked as boolean)}
                                />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor="show_featured_events" className="text-base font-medium cursor-pointer">
                                        Sección "Eventos Destacados"
                                    </Label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                                        Muestra el slider con los eventos que has marcado como 'Destacados'.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50 dark:bg-muted/50">
                                <Checkbox
                                    id="show_nearby_events"
                                    checked={data.show_nearby_events}
                                    onCheckedChange={(checked) => setData('show_nearby_events', checked as boolean)}
                                />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor="show_nearby_events" className="text-base font-medium cursor-pointer">
                                        Sección "Eventos por Ubicación (Cerca de ti)"
                                    </Label>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                                        Muestra los eventos ordenados por su distancia usando la geolocalización del dispositivo.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                Guardar Configuración
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

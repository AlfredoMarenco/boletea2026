import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import InputError from '@/components/input-error';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExternalEvent {
    id: number;
    title: string;
    start_date: string | null;
    image_path: string | null;
}

interface Props {
    events: ExternalEvent[];
}

export default function Create({ events }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        type: 'manual' as 'manual' | 'event',
        image_file: null as File | null,
        external_link: '',
        external_event_id: '' as string | number,
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.banners.store'));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Banners Flotantes', href: route('admin.banners.index') },
            { title: 'Crear Banner', href: route('admin.banners.create') }
        ]}>
            <Head title="Crear Banner" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Crear Nuevo Banner Flotante</h1>
                    <Button asChild variant="outline">
                        <Link href={route('admin.banners.index')}>Volver</Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardContent className="p-6 space-y-6">

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Título interno (opcional)</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="Ej. Promo Buen Fin 2026"
                                        className="mt-1"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Solo para identificarlo en el listado.</p>
                                    <InputError message={errors.title} className="mt-2" />
                                </div>

                                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-card">
                                    <Label className="mb-3 block text-base font-semibold">Tipo de Banner</Label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="type" 
                                                value="manual" 
                                                checked={data.type === 'manual'} 
                                                onChange={() => setData('type', 'manual')}
                                                className="w-4 h-4 text-primary"
                                            />
                                            <span>Manual (Subir Imagen Personalizada)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="type" 
                                                value="event" 
                                                checked={data.type === 'event'} 
                                                onChange={() => setData('type', 'event')}
                                                className="w-4 h-4 text-primary"
                                            />
                                            <span>Basado en un Evento Existente</span>
                                        </label>
                                    </div>
                                </div>

                                {data.type === 'manual' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <Label htmlFor="image_file">Imagen del Banner</Label>
                                            <Input
                                                id="image_file"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setData('image_file', e.target.files?.[0] || null)}
                                                className="mt-1 flex-1 cursor-pointer"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Recomendado: Imagen horizontal (16:10), ej. 800x500 px. Peso max: 10MB.</p>
                                            <InputError message={errors.image_file} className="mt-2" />
                                        </div>

                                        <div>
                                            <Label htmlFor="external_link">Enlace de Destino</Label>
                                            <Input
                                                id="external_link"
                                                type="url"
                                                value={data.external_link}
                                                onChange={(e) => setData('external_link', e.target.value)}
                                                placeholder="https://ejemplo.com/comprar"
                                                className="mt-1"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">URL a la que el usuario será redirigido al hacer clic.</p>
                                            <InputError message={errors.external_link} className="mt-2" />
                                        </div>
                                    </div>
                                )}

                                {data.type === 'event' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <Label htmlFor="external_event_id">Selecciona un Evento Activo</Label>
                                            <Select 
                                                value={data.external_event_id ? data.external_event_id.toString() : ""} 
                                                onValueChange={(val) => setData('external_event_id', val)}
                                            >
                                                <SelectTrigger className="w-full mt-1">
                                                    <SelectValue placeholder="Busca y selecciona un evento..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {events.map((evt) => (
                                                        <SelectItem key={evt.id} value={evt.id.toString()}>
                                                            {evt.title} {evt.start_date ? `(${format(new Date(evt.start_date), 'dd MMM yyyy', { locale: es })})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-sm text-gray-500 mt-1">El banner usará automáticamente la imagen y URL asociadas a este evento.</p>
                                            <InputError message={errors.external_event_id} className="mt-2" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-border">
                                    <Switch
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                    <Label htmlFor="is_active" className="cursor-pointer">
                                        Banner Activo
                                    </Label>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={processing}>
                            Crear Banner
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

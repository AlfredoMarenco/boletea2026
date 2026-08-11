import AppLayout from '@/layouts/app-layout';
import React from 'react';
import { Save, X } from 'lucide-react';
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
}

interface PostbackUrl {
    id: number;
    name: string;
}

interface Props {
    externalEvents: ExternalEvent[];
    postbackUrls: PostbackUrl[];
}

export default function Create({ externalEvents, postbackUrls = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        external_event_id: '',
        date: '',
        description: '',
        postback_url_id: '',
        status: 'active',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.access.events.store'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Control de Acceso',
                    href: route('admin.access.events.index'),
                },
                { title: 'Crear Base', href: '#' },
            ]}
        >
            <Head title="Crear Base de Acceso" />

            <div className="mx-auto max-w-4xl p-6 pb-32">
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            Nueva Base de Acceso
                        </h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            Define la base de datos de códigos para el control
                            de entrada.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            asChild
                            className="rounded-xl"
                        >
                            <Link href={route('admin.access.events.index')}>
                                <X className="mr-2 size-4" />
                                Cancelar
                            </Link>
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de la Base</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Ej. Acceso General - Concierto X"
                                    className="h-11 rounded-xl"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="external_event_id">
                                    Vincular a Evento Externo (Opcional)
                                </Label>
                                <Select
                                    value={
                                        data.external_event_id
                                            ? String(data.external_event_id)
                                            : 'none'
                                    }
                                    onValueChange={(value) =>
                                        setData(
                                            'external_event_id',
                                            value === 'none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue placeholder="Selecciona un evento" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Sin vincular
                                        </SelectItem>
                                        {externalEvents.map((ev) => (
                                            <SelectItem
                                                key={ev.id}
                                                value={String(ev.id)}
                                            >
                                                {ev.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.external_event_id && (
                                    <p className="text-sm text-red-500">
                                        {errors.external_event_id}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="date">Fecha del Evento</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) =>
                                        setData('date', e.target.value)
                                    }
                                    className="h-11 rounded-xl"
                                />
                                {errors.date && (
                                    <p className="text-sm text-red-500">
                                        {errors.date}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Estado</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value: any) =>
                                        setData('status', value)
                                    }
                                >
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">
                                            Activo (Permite Escaneo)
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactivo
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-sm text-red-500">
                                        {errors.status}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Notas / Descripción
                            </Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Detalles adicionales..."
                                className="min-h-[100px] rounded-xl"
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Label>URL de Postback (Servicio externo)</Label>
                            <div className="space-y-2 rounded-xl border bg-gray-50/50 p-4 dark:bg-black/20">
                                <label className="flex cursor-pointer items-center gap-3 rounded p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/5">
                                    <input
                                        type="radio"
                                        name="postback_url_id"
                                        value=""
                                        checked={data.postback_url_id === ''}
                                        onChange={() =>
                                            setData('postback_url_id', '')
                                        }
                                        className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                        Ninguno (Deshabilitado)
                                    </span>
                                </label>
                                {postbackUrls.map((pb) => (
                                    <label
                                        key={pb.id}
                                        className="flex cursor-pointer items-center gap-3 rounded p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                                    >
                                        <input
                                            type="radio"
                                            name="postback_url_id"
                                            value={pb.id}
                                            checked={
                                                String(data.postback_url_id) ===
                                                String(pb.id)
                                            }
                                            onChange={() =>
                                                setData(
                                                    'postback_url_id',
                                                    String(pb.id),
                                                )
                                            }
                                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                            {pb.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-500 italic">
                                Selecciona el servicio al cual se notificarán
                                los escaneos.
                            </p>
                            {errors.postback_url_id && (
                                <p className="text-sm text-red-500">
                                    {errors.postback_url_id}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-11 rounded-xl bg-primary px-8 font-bold hover:bg-primary/90"
                        >
                            <Save className="mr-2 size-4" />
                            {processing
                                ? 'Guardando...'
                                : 'Crear Base de Acceso'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

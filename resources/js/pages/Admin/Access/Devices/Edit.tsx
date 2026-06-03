import AppLayout from '@/layouts/app-layout';
import React from 'react';
import { Save, X, Tablet } from 'lucide-react';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AccessDevice {
    id: number;
    name: string;
    device_identifier: string;
    status: 'active' | 'inactive';
}

interface Props {
    device: AccessDevice;
}

export default function Edit({ device }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: device.name || '',
        device_identifier: device.device_identifier || '',
        status: device.status || 'active',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.access.devices.update', device.id));
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Dispositivos',
                    href: route('admin.access.devices.index'),
                },
                { title: 'Editar', href: '#' },
            ]}
        >
            <Head title="Editar Scanner" />

            <div className="mx-auto max-w-2xl p-6 pb-32">
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            Editar Scanner
                        </h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            Modifica la información del dispositivo Zebra.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            asChild
                            className="rounded-xl"
                        >
                            <Link href={route('admin.access.devices.index')}>
                                <X className="mr-2 size-4" />
                                Cancelar
                            </Link>
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                        <div className="mb-6 flex justify-center">
                            <div className="rounded-full bg-primary/10 p-4">
                                <Tablet className="size-12 text-primary" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Dispositivo</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Ej. Scanner Puerta Norte 01"
                                className="h-11 rounded-xl"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="device_identifier">
                                Identificador Único (UUID / MAC)
                            </Label>
                            <Input
                                id="device_identifier"
                                value={data.device_identifier}
                                onChange={(e) =>
                                    setData('device_identifier', e.target.value)
                                }
                                placeholder="Ej. 00:1A:2B:3C:4D:5E"
                                className="h-11 rounded-xl"
                            />
                            <p className="text-[10px] text-gray-400">
                                Este ID debe coincidir con el que reporte la App
                                Android.
                            </p>
                            {errors.device_identifier && (
                                <p className="text-sm text-red-500">
                                    {errors.device_identifier}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) =>
                                    setData(
                                        'status',
                                        e.target.value as 'active' | 'inactive',
                                    )
                                }
                                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="active">Activo</option>
                                <option value="inactive">Inactivo</option>
                            </select>
                            {errors.status && (
                                <p className="text-sm text-red-500">
                                    {errors.status}
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
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

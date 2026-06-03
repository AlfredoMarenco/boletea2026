import AppLayout from '@/layouts/app-layout';
import React from 'react';
import { Save, X, Tablet } from 'lucide-react';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        device_identifier: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.access.devices.store'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Dispositivos',
                    href: route('admin.access.devices.index'),
                },
                { title: 'Registrar', href: '#' },
            ]}
        >
            <Head title="Registrar Scanner" />

            <div className="mx-auto max-w-2xl p-6 pb-32">
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            Registrar Scanner
                        </h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            Vincula un nuevo dispositivo Zebra al sistema.
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

                        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4 dark:border-yellow-900/20 dark:bg-yellow-900/10">
                            <p className="text-xs text-yellow-700 dark:text-yellow-500">
                                Al registrar, se generará un{' '}
                                <strong>API Token</strong> único. Deberás
                                ingresarlo en la App para autorizar la conexión.
                            </p>
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
                                ? 'Registrando...'
                                : 'Registrar y Generar Token'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

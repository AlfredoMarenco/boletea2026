import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useState } from 'react';
import LocationPicker from '@/components/LocationPicker';

export default function Create() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mapSearchQuery, setMapSearchQuery] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.venues.store'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Recintos', href: route('admin.venues.index') },
                { title: 'Nuevo', href: '#' },
            ]}
        >
            <Head title="Nuevo Recinto" />

            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.venues.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Nuevo Recinto</h1>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-8 rounded-xl border bg-card p-6 shadow-sm"
                >
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => {
                                    setData('name', e.target.value);
                                    setSearchQuery(e.target.value);
                                }}
                                placeholder="Ej. Teatro del Estado"
                            />
                            {errors.name && (
                                <span className="text-sm text-red-500">
                                    {errors.name}
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                                placeholder="Ej. Av. Ignacio de la Llave s/n"
                            />
                            {errors.address && (
                                <span className="text-sm text-red-500">
                                    {errors.address}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Ubicación en Mapa</Label>
                        <div className="mb-2 flex gap-2">
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar ubicación..."
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setMapSearchQuery(searchQuery)}
                            >
                                <MapPin className="mr-2 h-4 w-4" />
                                Buscar
                            </Button>
                        </div>
                        <LocationPicker
                            searchQuery={mapSearchQuery}
                            onLocationChange={(lat, lng) => {
                                setData((data) => ({
                                    ...data,
                                    latitude: lat,
                                    longitude: lng,
                                }));
                            }}
                        />
                        <p className="text-sm text-gray-500">
                            Busca y selecciona la ubicación exacta del recinto.
                            Esto se usará para calcular la cercanía.
                        </p>
                    </div>

                    <div className="flex items-center justify-end border-t pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Recinto'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

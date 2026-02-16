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
        <AppLayout breadcrumbs={[
            { title: 'Recintos', href: route('admin.venues.index') },
            { title: 'Nuevo', href: '#' },
        ]}>
            <Head title="Nuevo Recinto" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.venues.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Nuevo Recinto</h1>
                </div>

                <form onSubmit={submit} className="space-y-8 bg-card p-6 rounded-xl border shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => {
                                    setData('name', e.target.value);
                                    setSearchQuery(e.target.value);
                                }}
                                placeholder="Ej. Teatro del Estado"
                            />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                                placeholder="Ej. Av. Ignacio de la Llave s/n"
                            />
                            {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Ubicación en Mapa</Label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar ubicación..."
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setMapSearchQuery(searchQuery)}
                            >
                                <MapPin className="h-4 w-4 mr-2" />
                                Buscar
                            </Button>
                        </div>
                        <LocationPicker
                            searchQuery={mapSearchQuery}
                            onLocationChange={(lat, lng) => {
                                setData(data => ({ ...data, latitude: lat, longitude: lng }));
                            }}
                        />
                        <p className="text-sm text-gray-500">
                            Busca y selecciona la ubicación exacta del recinto. Esto se usará para calcular la cercanía.
                        </p>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Recinto'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

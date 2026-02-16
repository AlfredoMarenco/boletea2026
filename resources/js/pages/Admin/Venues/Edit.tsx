import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useState } from 'react';
import LocationPicker from '@/components/LocationPicker';

interface Venue {
    id: number;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
}

export default function Edit({ venue }: { venue: Venue }) {
    const [searchQuery, setSearchQuery] = useState(venue.name);
    const [mapSearchQuery, setMapSearchQuery] = useState('');

    const { data, setData, put, processing, errors } = useForm({
        name: venue.name,
        address: venue.address || '',
        latitude: venue.latitude,
        longitude: venue.longitude,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.venues.update', venue.id));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Recintos', href: route('admin.venues.index') },
            { title: 'Editar', href: '#' },
        ]}>
            <Head title="Editar Recinto" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.venues.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Editar Recinto</h1>
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
                            />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
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
                            initialLatitude={venue.latitude || undefined}
                            initialLongitude={venue.longitude || undefined}
                            searchQuery={mapSearchQuery}
                            onLocationChange={(lat, lng) => {
                                setData(data => ({ ...data, latitude: lat, longitude: lng }));
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Actualizar Recinto'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

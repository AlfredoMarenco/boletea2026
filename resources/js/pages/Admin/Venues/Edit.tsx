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
        <AppLayout
            breadcrumbs={[
                { title: 'Recintos', href: route('admin.venues.index') },
                { title: 'Editar', href: '#' },
            ]}
        >
            <Head title="Editar Recinto" />

            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.venues.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Editar Recinto</h1>
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
                            initialLatitude={venue.latitude || undefined}
                            initialLongitude={venue.longitude || undefined}
                            searchQuery={mapSearchQuery}
                            onLocationChange={(lat, lng) => {
                                setData((data) => ({
                                    ...data,
                                    latitude: lat,
                                    longitude: lng,
                                }));
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-end border-t pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Actualizar Recinto'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

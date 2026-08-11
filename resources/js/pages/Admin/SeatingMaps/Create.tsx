import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Venue {
    id: number;
    name: string;
}

interface Props {
    venues: Venue[];
}

export default function Create({ venues }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        venue_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.seating-maps.store'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Mapas de Asientos',
                    href: route('admin.seating-maps.index'),
                },
                {
                    title: 'Nuevo Mapa',
                    href: route('admin.seating-maps.create'),
                },
            ]}
        >
            <Head title="Nuevo Mapa de Asientos" />

            <div className="mx-auto max-w-2xl p-6">
                <h1 className="mb-6 text-2xl font-bold">
                    Crear Nueva Plantilla de Mapa
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border bg-card p-6 shadow-sm"
                >
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Plantilla</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Ej: Estadio Azteca - Concierto"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="venue">Seleccionar Recinto</Label>
                        <Select
                            onValueChange={(value) =>
                                setData('venue_id', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un recinto" />
                            </SelectTrigger>
                            <SelectContent>
                                {venues.map((venue) => (
                                    <SelectItem
                                        key={venue.id}
                                        value={venue.id.toString()}
                                    >
                                        {venue.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.venue_id && (
                            <p className="text-sm text-red-500">
                                {errors.venue_id}
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
                        <Button type="submit" disabled={processing}>
                            Crear y Abrir Editor
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

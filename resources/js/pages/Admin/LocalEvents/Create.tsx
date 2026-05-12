import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Venue {
    id: number;
    name: string;
}

interface SeatingMap {
    id: number;
    name: string;
    venue_id: number;
}

interface Props {
    venues: Venue[];
    seatingMaps: SeatingMap[];
}

export default function Create({ venues, seatingMaps }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        venue_id: '',
        seating_map_id: '',
        image: null as File | null,
    });

    const filteredMaps = seatingMaps.filter(map => !data.venue_id || map.venue_id === parseInt(data.venue_id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.local-events.store'));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Eventos Locales', href: route('admin.local-events.index') },
            { title: 'Nuevo Evento', href: route('admin.local-events.create') },
        ]}>
            <Head title="Nuevo Evento Local" />

            <div className="p-6 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Crear Nuevo Evento Nativo</h1>

                <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 border rounded-xl shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Evento</Label>
                        <Input 
                            id="name" 
                            value={data.name} 
                            onChange={e => setData('name', e.target.value)} 
                            placeholder="Ej: Gran Concierto 2026"
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Fecha y Hora de Inicio</Label>
                            <Input 
                                id="start_date" 
                                type="datetime-local"
                                value={data.start_date} 
                                onChange={e => setData('start_date', e.target.value)} 
                            />
                            {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">Fecha y Hora de Fin</Label>
                            <Input 
                                id="end_date" 
                                type="datetime-local"
                                value={data.end_date} 
                                onChange={e => setData('end_date', e.target.value)} 
                            />
                            {errors.end_date && <p className="text-sm text-red-500">{errors.end_date}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="venue">Recinto (Venue)</Label>
                        <Select onValueChange={value => setData('venue_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un recinto" />
                            </SelectTrigger>
                            <SelectContent>
                                {venues.map(venue => (
                                    <SelectItem key={venue.id} value={venue.id.toString()}>
                                        {venue.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.venue_id && <p className="text-sm text-red-500">{errors.venue_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="seating_map">Plantilla de Mapa de Asientos</Label>
                        <Select 
                            onValueChange={value => setData('seating_map_id', value)}
                            disabled={!data.venue_id}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={data.venue_id ? "Selecciona una plantilla" : "Primero selecciona un recinto"} />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredMaps.map(map => (
                                    <SelectItem key={map.id} value={map.id.toString()}>
                                        {map.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.seating_map_id && <p className="text-sm text-red-500">{errors.seating_map_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea 
                            id="description" 
                            value={data.description} 
                            onChange={e => setData('description', e.target.value)} 
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Imagen del Evento (Opcional)</Label>
                        <Input 
                            id="image" 
                            type="file" 
                            accept="image/*"
                            onChange={e => setData('image', e.target.files ? e.target.files[0] : null)} 
                        />
                        {errors.image && <p className="text-sm text-red-500">{errors.image}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancelar</Button>
                        <Button type="submit" disabled={processing}>Crear Evento</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

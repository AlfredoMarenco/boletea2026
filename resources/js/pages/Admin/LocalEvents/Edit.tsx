import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface Venue {
    id: number;
    name: string;
}

interface SeatingMap {
    id: number;
    name: string;
    venue_id: number;
}

interface EventMap {
    id: number;
    seating_map_id: number;
    seating_map: SeatingMap;
}

interface Event {
    id: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string | null;
    venue_id: number;
    status: string;
    image_path: string | null;
    event_maps: EventMap[];
}

interface Props {
    event: Event;
    venues: Venue[];
    seatingMaps: SeatingMap[];
}

export default function Edit({ event, venues, seatingMaps }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        name: event.name || '',
        description: event.description || '',
        start_date: event.start_date ? format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm") : '',
        end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : '',
        venue_id: event.venue_id ? event.venue_id.toString() : '',
        status: event.status || 'draft',
        image: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.local-events.update', event.id));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Eventos Locales', href: route('admin.local-events.index') },
            { title: 'Editar Evento', href: route('admin.local-events.edit', event.id) },
        ]}>
            <Head title={`Editar Evento: ${event.name}`} />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Editar Evento Nativo</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="venue">Recinto (Venue)</Label>
                                    <Select onValueChange={value => setData('venue_id', value)} value={data.venue_id}>
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
                                    <Label htmlFor="status">Estado</Label>
                                    <Select onValueChange={value => setData('status', value)} value={data.status}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Estado del evento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Borrador</SelectItem>
                                            <SelectItem value="published">Publicado</SelectItem>
                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                </div>
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
                                <Button type="submit" disabled={processing}>Guardar Cambios</Button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-card p-6 border rounded-xl shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Mapa de Asientos</h2>
                            {event.event_maps && event.event_maps.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted rounded-lg">
                                        <p className="font-medium">{event.event_maps[0].seating_map?.name}</p>
                                        <p className="text-sm text-muted-foreground mt-1">Mapa asignado</p>
                                    </div>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href={route('admin.local-events.prices', event.id)}>
                                            Configurar Precios y Zonas
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No hay mapa asignado a este evento.</p>
                            )}
                        </div>

                        {event.image_path && (
                            <div className="bg-card p-6 border rounded-xl shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">Imagen Actual</h2>
                                <img 
                                    src={`/storage/${event.image_path}`} 
                                    alt={event.name} 
                                    className="w-full rounded-lg object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

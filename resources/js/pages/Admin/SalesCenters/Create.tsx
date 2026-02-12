import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker';

const DAYS = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
];

interface State {
    id: number;
    name: string;
}

export default function Create({ states }: { states: State[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [mapSearchQuery, setMapSearchQuery] = useState('');

    const defaultSchedule = DAYS.reduce((acc, day) => {
        acc[day.key] = { open: '09:00', close: '18:00', closed: false };
        return acc;
    }, {} as any);

    const { data, setData, post, transform, processing, errors } = useForm({
        name: '',
        address: '',
        logo_path: null as File | null,
        is_active: true,
        opening_hours: defaultSchedule,
        states: [] as number[],
        latitude: null as number | null,
        longitude: null as number | null,
    });

    const handleScheduleChange = (dayKey: string, field: string, value: any) => {
        setData('opening_hours', {
            ...data.opening_hours,
            [dayKey]: {
                ...data.opening_hours[dayKey],
                [field]: value
            }
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            opening_hours: JSON.stringify(data.opening_hours),
        }));
        post(route('admin.sales-centers.store'));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Puntos de Venta', href: route('admin.sales-centers.index') },
            { title: 'Nuevo', href: '#' },
        ]}>
            <Head title="Nuevo Punto de Venta" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.sales-centers.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Nuevo Punto de Venta</h1>
                </div>

                <form onSubmit={submit} className="space-y-8 bg-card p-6 rounded-xl border shadow-sm">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Ej. Taquilla Principal"
                            />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo</Label>
                            <Input
                                id="logo"
                                type="file"
                                accept="image/*"
                                onChange={e => setData('logo_path', e.target.files ? e.target.files[0] : null)}
                            />
                            {errors.logo_path && <span className="text-red-500 text-sm">{errors.logo_path}</span>}
                        </div>

                        {/* ... inside form ... */}

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Dirección</Label>
                            <div className="flex gap-2">
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={e => {
                                        setData('address', e.target.value);
                                        setSearchQuery(e.target.value);
                                    }}
                                    placeholder="Calle, Número, Colonia, Ciudad..."
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setMapSearchQuery(searchQuery)}
                                    title="Buscar en el mapa"
                                    className="h-auto"
                                >
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Buscar en Mapa
                                </Button>
                            </div>
                            {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>Ubicación en Mapa</Label>
                            <LocationPicker
                                searchQuery={mapSearchQuery}
                                onLocationChange={(lat, lng) => {
                                    setData(data => ({ ...data, latitude: lat, longitude: lng }));
                                }}
                                onAddressFound={(address) => {
                                    setData(data => ({ ...data, address: address }));
                                    setSearchQuery(address);
                                }}
                            />
                            {/* Hidden inputs to ensure data is submitted if needed, though useForm handles it */}
                            <p className="text-sm text-gray-500">
                                Haz clic en el mapa para seleccionar la ubicación exacta o usa el botón "Buscar en Mapa" con la dirección ingresada.
                            </p>
                        </div>
                    </div>

                    {/* States */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Estados Relacionados</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-card/50">
                            {states.map((state) => (
                                <div key={state.id} className="flex items-center space-x-2">
                                    <Switch
                                        id={`state-${state.id}`}
                                        checked={data.states.includes(state.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setData('states', [...data.states, state.id]);
                                            } else {
                                                setData('states', data.states.filter((id: number) => id !== state.id));
                                            }
                                        }}
                                    />
                                    <Label htmlFor={`state-${state.id}`}>{state.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Horarios de Atención</h3>
                        <div className="grid gap-4">
                            {DAYS.map((day) => {
                                const schedule = data.opening_hours[day.key] || { closed: true };
                                return (
                                    <div key={day.key} className="flex items-center gap-4 p-3 rounded-lg border bg-background/50">
                                        <div className="w-24 font-medium">{day.label}</div>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={!schedule.closed}
                                                onCheckedChange={(checked) => handleScheduleChange(day.key, 'closed', !checked)}
                                            />
                                            <span className="text-sm text-muted-foreground w-16">
                                                {schedule.closed ? 'Cerrado' : 'Abierto'}
                                            </span>
                                        </div>

                                        {!schedule.closed && (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input
                                                    type="time"
                                                    className="w-32"
                                                    value={schedule.open}
                                                    onChange={(e) => handleScheduleChange(day.key, 'open', e.target.value)}
                                                />
                                                <span>a</span>
                                                <Input
                                                    type="time"
                                                    className="w-32"
                                                    value={schedule.close}
                                                    onChange={(e) => handleScheduleChange(day.key, 'close', e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked)}
                            />
                            <Label>Punto de Venta Activo</Label>
                        </div>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Punto de Venta'}
                        </Button>
                    </div>
                </form>
            </div >
        </AppLayout >
    );
}

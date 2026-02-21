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

interface SalesCenter {
    id: number;
    name: string;
    address: string;
    google_map_url: string;
    logo_path: string;
    opening_hours: any;
    is_active: boolean;
    states: State[];
    latitude?: number;
    longitude?: number;
    is_digital_only?: boolean;
    payment_methods_cash?: boolean;
    payment_methods_card?: boolean;
}

export default function Edit({ salesCenter, states }: { salesCenter: SalesCenter, states: State[] }) {
    const [searchQuery, setSearchQuery] = useState(salesCenter.address || '');
    const [mapSearchQuery, setMapSearchQuery] = useState('');

    const defaultSchedule = DAYS.reduce((acc, day) => {
        acc[day.key] = { open: '09:00', close: '18:00', closed: false };
        return acc;
    }, {} as any);

    // Merge default with existing to ensure all keys exist
    const initialHours = { ...defaultSchedule, ...salesCenter.opening_hours };

    const { data, setData, post, transform, processing, errors } = useForm({
        _method: 'put',
        name: salesCenter.name || '',
        address: salesCenter.address || '',
        logo_path: null as File | null,
        is_active: Boolean(salesCenter.is_active),
        opening_hours: initialHours,
        states: salesCenter.states ? salesCenter.states.map(s => s.id) : [],
        latitude: salesCenter.latitude || null,
        longitude: salesCenter.longitude || null,
        is_digital_only: Boolean(salesCenter.is_digital_only),
        payment_methods_cash: Boolean(salesCenter.payment_methods_cash),
        payment_methods_card: Boolean(salesCenter.payment_methods_card),
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
        post(route('admin.sales-centers.update', salesCenter.id));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Puntos de Venta', href: route('admin.sales-centers.index') },
            { title: 'Editar', href: '#' },
        ]}>
            <Head title={`Editar ${salesCenter.name}`} />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.sales-centers.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Editar: {salesCenter.name}</h1>
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
                            />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo (Opcional)</Label>
                            <div className="flex gap-4 items-center">
                                {salesCenter.logo_path && (
                                    <img src={salesCenter.logo_path} className="h-10 w-10 object-contain border rounded" />
                                )}
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setData('logo_path', e.target.files ? e.target.files[0] : null)}
                                />
                            </div>
                            {errors.logo_path && <span className="text-red-500 text-sm">{errors.logo_path}</span>}
                        </div>

                        {/* Checkbox para mostrar que solo venden boleto digital */}
                        <div className="space-y-2">
                            <Label htmlFor="is_digital_only">¿Solo venden boleto digital?</Label>
                            <p className="text-sm text-muted-foreground">Si está activo, se mostrará un mensaje en el punto de venta que indica que solo venden boletos digitales.</p>
                            <Switch
                                id="is_digital_only"
                                checked={data.is_digital_only}
                                onCheckedChange={value => setData('is_digital_only', value)}
                            />
                        </div>

                        {/*  Checkboxes que deje seleccionar si se puede pagar con tarjeta y efectivo o segun lo que se le asigne */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_methods">Métodos de pago</Label>
                            <p className="text-sm text-muted-foreground">Selecciona los métodos de pago que se aceptan en el punto de venta.</p>
                            <div className="flex gap-4">
                                <Label htmlFor="payment_methods">Efectivo</Label>
                                <Switch
                                    id="payment_methods_cash"
                                    checked={data.payment_methods_cash}
                                    onCheckedChange={value => setData('payment_methods_cash', value)}
                                />
                                <Label htmlFor="payment_methods">Tarjeta</Label>
                                <Switch
                                    id="payment_methods_card"
                                    checked={data.payment_methods_card}
                                    onCheckedChange={value => setData('payment_methods_card', value)}
                                />
                            </div>
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
                                initialLatitude={salesCenter.latitude}
                                initialLongitude={salesCenter.longitude}
                                searchQuery={mapSearchQuery}
                                onLocationChange={(lat, lng) => {
                                    setData(data => ({ ...data, latitude: lat, longitude: lng }));
                                }}
                                onAddressFound={(address) => {
                                    setData(data => ({ ...data, address: address }));
                                    setSearchQuery(address);
                                }}
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Haz clic en el mapa para ajustar la ubicación exacta.
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
                                const schedule = data.opening_hours[day.key] || { closed: true, open: '09:00', close: '18:00' };
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
                            {processing ? 'Guardando...' : 'Actualizar Punto de Venta'}
                        </Button>
                    </div>
                </form>
            </div >
        </AppLayout >
    );
}

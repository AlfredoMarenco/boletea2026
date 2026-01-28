import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const DAYS = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
];

interface SalesCenter {
    id: number;
    name: string;
    address: string;
    google_map_url: string;
    logo_path: string;
    opening_hours: any;
    is_active: boolean;
}

export default function Edit({ salesCenter }: { salesCenter: SalesCenter }) {
    const defaultSchedule = DAYS.reduce((acc, day) => {
        acc[day.key] = { open: '09:00', close: '18:00', closed: false };
        return acc;
    }, {} as any);

    // Merge default with existing to ensure all keys exist
    const initialHours = { ...defaultSchedule, ...salesCenter.opening_hours };

    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        name: salesCenter.name || '',
        address: salesCenter.address || '',
        google_map_url: salesCenter.google_map_url || '',
        logo_path: null as File | null,
        is_active: Boolean(salesCenter.is_active),
        opening_hours: initialHours,
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

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                            />
                            {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="map">URL Google Maps</Label>
                            <Input
                                id="map"
                                value={data.google_map_url}
                                onChange={e => setData('google_map_url', e.target.value)}
                            />
                            {errors.google_map_url && <span className="text-red-500 text-sm">{errors.google_map_url}</span>}
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
            </div>
        </AppLayout>
    );
}

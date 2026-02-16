import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface State {
    id: number;
    name: string;
}

export default function Create({ states }: { states: State[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        state_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.cities.store'));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Ciudades', href: route('admin.cities.index') },
            { title: 'Nueva', href: '#' },
        ]}>
            <Head title="Nueva Ciudad" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.cities.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Nueva Ciudad</h1>
                </div>

                <form onSubmit={submit} className="space-y-8 bg-card p-6 rounded-xl border shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="state_id">Estado</Label>
                            <Select onValueChange={(val) => setData('state_id', val)} defaultValue={data.state_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {states.map((state) => (
                                        <SelectItem key={state.id} value={String(state.id)}>
                                            {state.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.state_id && <span className="text-red-500 text-sm">{errors.state_id}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Ej. Xalapa"
                            />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Ciudad'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

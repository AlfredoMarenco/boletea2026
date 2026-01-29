import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

interface State {
    id: number;
    name: string;
}

export default function Edit({ state }: { state: State }) {
    const { data, setData, put, processing, errors } = useForm({
        name: state.name,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.states.update', state.id));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Estados', href: route('admin.states.index') },
            { title: 'Editar', href: '#' },
        ]}>
            <Head title="Editar Estado" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.states.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Editar Estado</h1>
                </div>

                <form onSubmit={submit} className="space-y-8 bg-card p-6 rounded-xl border shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                        />
                        {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Actualizar Estado'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

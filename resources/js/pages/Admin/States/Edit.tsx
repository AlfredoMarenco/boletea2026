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
        <AppLayout
            breadcrumbs={[
                { title: 'Estados', href: route('admin.states.index') },
                { title: 'Editar', href: '#' },
            ]}
        >
            <Head title="Editar Estado" />

            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.states.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Editar Estado</h1>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-8 rounded-xl border bg-card p-6 shadow-sm"
                >
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                            {errors.name && (
                                <span className="text-sm text-red-500">
                                    {errors.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end border-t pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

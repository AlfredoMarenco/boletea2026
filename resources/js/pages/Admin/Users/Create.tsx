import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';
import InputError from '@/components/input-error';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Usuarios', href: route('admin.users.index') },
                { title: 'Crear Usuario', href: route('admin.users.create') },
            ]}
        >
            <Head title="Crear Usuario" />

            <div className="mx-auto max-w-2xl p-6">
                <div className="mb-6">
                    <Link
                        href={route('admin.users.index')}
                        className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Volver a Usuarios
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Crear Nuevo Usuario
                    </h1>
                </div>

                <div className="rounded-md border border-gray-200 bg-white p-6 shadow dark:border-border dark:bg-background">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                required
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    required
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">
                                    Confirmar Contraseña
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" type="button" asChild>
                                <Link href={route('admin.users.index')}>
                                    Cancelar
                                </Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : 'Crear Usuario'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

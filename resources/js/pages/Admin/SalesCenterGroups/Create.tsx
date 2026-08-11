import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';

interface SalesCenter {
    id: number;
    name: string;
}

export default function Create({
    salesCenters,
}: {
    salesCenters: SalesCenter[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        sales_centers: [] as number[],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.sales-center-groups.store'));
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Grupos de Ventas',
                    href: route('admin.sales-center-groups.index'),
                },
                { title: 'Nuevo', href: '#' },
            ]}
        >
            <Head title="Nuevo Grupo de Ventas" />

            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.sales-center-groups.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Nuevo Grupo</h1>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-8 rounded-xl border bg-card p-6 shadow-sm"
                >
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Grupo</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Ej. Taquillas Norte"
                            />
                            {errors.name && (
                                <span className="text-sm text-red-500">
                                    {errors.name}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Descripción opcional del grupo..."
                            />
                            {errors.description && (
                                <span className="text-sm text-red-500">
                                    {errors.description}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Sales Centers Selection */}
                    <div className="space-y-4">
                        <Label>Puntos de Venta</Label>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-card/50 p-4 md:grid-cols-2 lg:grid-cols-3">
                            {salesCenters.map((center) => (
                                <div
                                    key={center.id}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`center-${center.id}`}
                                        checked={data.sales_centers.includes(
                                            center.id,
                                        )}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setData('sales_centers', [
                                                    ...data.sales_centers,
                                                    center.id,
                                                ]);
                                            } else {
                                                setData(
                                                    'sales_centers',
                                                    data.sales_centers.filter(
                                                        (id) =>
                                                            id !== center.id,
                                                    ),
                                                );
                                            }
                                        }}
                                    />
                                    <Label
                                        htmlFor={`center-${center.id}`}
                                        className="cursor-pointer font-normal"
                                    >
                                        {center.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Selecciona los puntos de venta que pertenecerán a
                            este grupo.
                        </p>
                    </div>

                    <div className="flex justify-end border-t pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Crear Grupo'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

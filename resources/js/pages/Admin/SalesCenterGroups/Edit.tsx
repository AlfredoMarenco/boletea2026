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

interface SalesCenterGroup {
    id: number;
    name: string;
    description: string | null;
}

interface Props {
    group: SalesCenterGroup;
    salesCenters: SalesCenter[];
    assignedSalesCenters: number[];
}

export default function Edit({ group, salesCenters, assignedSalesCenters }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        name: group.name,
        description: group.description || '',
        sales_centers: assignedSalesCenters,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.sales-center-groups.update', group.id));
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Grupos de Ventas', href: route('admin.sales-center-groups.index') },
            { title: 'Editar', href: '#' },
        ]}>
            <Head title={`Editar ${group.name}`} />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.sales-center-groups.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Editar Grupo</h1>
                </div>

                <form onSubmit={submit} className="space-y-8 bg-card p-6 rounded-xl border shadow-sm">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Grupo</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Ej. Taquillas Norte"
                            />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Descripción opcional del grupo..."
                            />
                            {errors.description && <span className="text-red-500 text-sm">{errors.description}</span>}
                        </div>
                    </div>

                    {/* Sales Centers Selection */}
                    <div className="space-y-4">
                        <Label>Puntos de Venta</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-card/50">
                            {salesCenters.map((center) => (
                                <div key={center.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`center-${center.id}`}
                                        checked={data.sales_centers.includes(center.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setData('sales_centers', [...data.sales_centers, center.id]);
                                            } else {
                                                setData('sales_centers', data.sales_centers.filter((id) => id !== center.id));
                                            }
                                        }}
                                    />
                                    <Label htmlFor={`center-${center.id}`} className="cursor-pointer font-normal">
                                        {center.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Selecciona los puntos de venta que pertenecerán a este grupo.</p>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Actualizar Grupo' : 'Actualizar Grupo'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

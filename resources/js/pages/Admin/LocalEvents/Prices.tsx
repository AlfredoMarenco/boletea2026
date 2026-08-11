import { Head, useForm, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, ArrowLeft, Send } from 'lucide-react';

interface EventPrice {
    id?: number;
    name: string;
    price: number;
    service_charge: number;
    bank_commission: number;
    web_sales_enabled: boolean;
    box_office_sales_enabled: boolean;
    color: string;
}

interface Event {
    id: number;
    name: string;
    status: string;
    prices: EventPrice[];
}

interface Props {
    event: Event;
    mapCategories: string[];
}

export default function Prices({ event, mapCategories = [] }: Props) {
    const initialPrices =
        event.prices.length > 0
            ? event.prices
            : mapCategories.map((cat, index) => ({
                  name: cat,
                  price: 0,
                  service_charge: 0,
                  bank_commission: 0,
                  web_sales_enabled: true,
                  box_office_sales_enabled: true,
                  color: [
                      '#3b82f6',
                      '#10b981',
                      '#f59e0b',
                      '#ef4444',
                      '#8b5cf6',
                  ][index % 5],
              }));

    if (initialPrices.length === 0) {
        initialPrices.push({
            name: '',
            price: 0,
            service_charge: 0,
            bank_commission: 0,
            web_sales_enabled: true,
            box_office_sales_enabled: true,
            color: '#3b82f6',
        });
    }

    const { data, setData, post, processing, errors } = useForm({
        prices: initialPrices,
    });

    const addPrice = () => {
        setData('prices', [
            ...data.prices,
            {
                name: '',
                price: 0,
                service_charge: 0,
                bank_commission: 0,
                web_sales_enabled: true,
                box_office_sales_enabled: true,
                color: '#10b981',
            },
        ]);
    };

    const removePrice = (index: number) => {
        const newPrices = [...data.prices];
        newPrices.splice(index, 1);
        setData('prices', newPrices);
    };

    const updatePrice = (
        index: number,
        field: keyof EventPrice,
        value: any,
    ) => {
        const newPrices = [...data.prices];
        newPrices[index] = { ...newPrices[index], [field]: value };
        setData('prices', newPrices);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.local-events.prices.update', event.id));
    };

    const handlePublish = () => {
        if (
            confirm(
                '¿Estás seguro de publicar el evento? Esto generará el inventario basado en el mapa de asientos y los precios configurados.',
            )
        ) {
            router.post(route('admin.local-events.inventory', event.id));
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Eventos Locales',
                    href: route('admin.local-events.index'),
                },
                {
                    title: 'Editar Evento',
                    href: route('admin.local-events.edit', event.id),
                },
                {
                    title: 'Precios y Zonas',
                    href: route('admin.local-events.prices', event.id),
                },
            ]}
        >
            <Head title={`Precios: ${event.name}`} />

            <div className="mx-auto max-w-5xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={route(
                                    'admin.local-events.edit',
                                    event.id,
                                )}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Configuración de Precios
                            </h1>
                            <p className="text-muted-foreground">
                                {event.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant={
                                event.status === 'published'
                                    ? 'secondary'
                                    : 'default'
                            }
                            onClick={handlePublish}
                            disabled={event.prices.length === 0}
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            {event.status === 'published'
                                ? 'Regenerar Inventario'
                                : 'Publicar y Generar Inventario'}
                        </Button>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Zonas y Categorías
                        </h2>
                        <Button variant="outline" onClick={addPrice} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar Zona
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {data.prices.map((price, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-12 items-end gap-4 rounded-lg border bg-muted/30 p-4"
                            >
                                <div className="col-span-3">
                                    <Label>Nombre de Zona</Label>
                                    <Input
                                        value={price.name}
                                        onChange={(e) =>
                                            updatePrice(
                                                index,
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Ej: VIP, General"
                                        required
                                    />
                                    {errors[`prices.${index}.name`] && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors[`prices.${index}.name`]}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <Label>Precio ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={price.price}
                                        onChange={(e) =>
                                            updatePrice(
                                                index,
                                                'price',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Cargo x Serv. ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={price.service_charge ?? 0}
                                        onChange={(e) =>
                                            updatePrice(
                                                index,
                                                'service_charge',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Com. Bancaria ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={price.bank_commission ?? 0}
                                        onChange={(e) =>
                                            updatePrice(
                                                index,
                                                'bank_commission',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label className="mb-1 block text-[11px]">
                                        Canales
                                    </Label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`web_${index}`}
                                                checked={
                                                    price.web_sales_enabled
                                                }
                                                onCheckedChange={(checked) =>
                                                    updatePrice(
                                                        index,
                                                        'web_sales_enabled',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor={`web_${index}`}
                                                className="cursor-pointer text-xs"
                                            >
                                                Web
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`taquilla_${index}`}
                                                checked={
                                                    price.box_office_sales_enabled
                                                }
                                                onCheckedChange={(checked) =>
                                                    updatePrice(
                                                        index,
                                                        'box_office_sales_enabled',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <Label
                                                htmlFor={`taquilla_${index}`}
                                                className="cursor-pointer text-xs"
                                            >
                                                Taquilla
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 pb-1">
                                    <Input
                                        type="color"
                                        value={price.color}
                                        onChange={(e) =>
                                            updatePrice(
                                                index,
                                                'color',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 w-10 cursor-pointer p-1"
                                        title="Color UI"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => removePrice(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {data.prices.length === 0 && (
                            <div className="rounded-lg border-2 border-dashed py-8 text-center text-muted-foreground">
                                No hay precios configurados. Agrega las zonas
                                correspondientes al mapa de asientos.
                            </div>
                        )}

                        <div className="flex justify-end border-t pt-4">
                            <Button
                                type="submit"
                                disabled={processing}
                                size="lg"
                            >
                                Guardar Precios
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

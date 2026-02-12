import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ExternalEvent {
    id: number;
    title: string;
    city: string | null;
    category: string | null;
    status: 'draft' | 'published';
    image_path: string | null;
    secondary_image_path: string | null;
    sales_start_date: string | null;
    button_text: string | null;
    description: string | null;
    sales_centers: number[] | null;
    sales_center_groups?: number[] | null;
    categories?: number[] | null;
}

interface SalesCenter {
    id: number;
    name: string;
    is_active: boolean;
}

interface State {
    id: number;
    name: string;
}

interface City {
    id: number;
    name: string;
    state_id: number;
}

interface SalesCenterGroup {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    event: ExternalEvent;
    salesCenters?: SalesCenter[];
    salesCenterGroups?: SalesCenterGroup[];
    states: State[];
    cities: City[];
    categories?: Category[];
}

export default function Edit({ event, salesCenters = [], salesCenterGroups = [], states = [], cities = [], categories = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm<any>({
        _method: 'put',
        city: event.city || '',
        state_id: (event as any).state_id,
        city_id: (event as any).city_id,
        category: event.category || '',
        image_path: event.image_path || '',
        secondary_image_path: event.secondary_image_path || '',
        sales_start_date: event.sales_start_date ? format(new Date(event.sales_start_date), "yyyy-MM-dd'T'HH:mm") : '',
        button_text: event.button_text || '',
        description: event.description || '',
        status: event.status,
        sales_centers: (event.sales_centers as number[]) || [],
        sales_center_groups: ((event as any).sales_center_groups as number[]) || [],
        categories: ((event as any).categories as number[]) || [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use post with _method: put for file uploads to work
        post(route('admin.events.update', event.id));
    };

    // Helper to render preview
    const renderSecondaryPreview = () => {
        if (typeof data.secondary_image_path === 'string' && data.secondary_image_path) {
            return <img src={data.secondary_image_path} alt="Preview" className="w-[79px] h-[108px] object-cover rounded border" />;
        }
        if ((data.secondary_image_path as any) instanceof File) {
            return <img src={URL.createObjectURL(data.secondary_image_path as any)} alt="Preview" className="w-[79px] h-[108px] object-cover rounded border" />;
        }
        return null;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Eventos', href: route('admin.events.index') },
            { title: 'Editar Evento', href: '#' }
        ]}>
            <Head title={`Editar ${event.title}`} />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                        Editar: {event.title}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="state_id">Estado</Label>
                                <Select
                                    value={data.state_id ? String(data.state_id) : ""}
                                    onValueChange={(value) => {
                                        setData((data: any) => ({ ...data, state_id: Number(value), city_id: '' }));
                                    }}
                                >
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
                                {errors.state_id && <p className="text-red-500 text-sm">{errors.state_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city_id">Ciudad</Label>
                                <Select
                                    value={data.city_id ? String(data.city_id) : ""}
                                    onValueChange={(value) => setData('city_id', Number(value))}
                                    disabled={!data.state_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una ciudad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities
                                            .filter((city) => city.state_id === data.state_id)
                                            .map((city) => (
                                                <SelectItem key={city.id} value={String(city.id)}>
                                                    {city.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {errors.city_id && <p className="text-red-500 text-sm">{errors.city_id}</p>}
                            </div>

                            <div className="space-y-2 hidden">
                                <Label htmlFor="city">Ciudad (Texto Legacy)</Label>
                                <Input
                                    id="city"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                />
                                {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                            </div>

                            <div className="space-y-2 hidden">
                                <Label htmlFor="category">Categoría</Label>
                                <Input
                                    id="category"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                />
                                {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="image_path">Imagen Principal (URL 500x400)</Label>
                                <Input
                                    id="image_path"
                                    value={data.image_path}
                                    onChange={(e) => setData('image_path', e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                />
                                {errors.image_path && <p className="text-red-500 text-sm">{errors.image_path}</p>}
                                {data.image_path && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">Vista Previa:</p>
                                        <img src={data.image_path} alt="Preview" className="w-[125px] h-[100px] object-cover rounded border" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="secondary_image_path">Imagen Secundaria (Archivo 315x430)</Label>
                                <Input
                                    id="secondary_image_path"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            // @ts-ignore
                                            setData('secondary_image_path', e.target.files[0]);
                                        }
                                    }}
                                />
                                {/* @ts-ignore */}
                                {errors.secondary_image_path && <p className="text-red-500 text-sm">{errors.secondary_image_path}</p>}
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Vista Previa:</p>
                                    {renderSecondaryPreview()}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="sales_start_date">Inicio de Venta</Label>
                                <Input
                                    id="sales_start_date"
                                    type="datetime-local"
                                    value={data.sales_start_date}
                                    onChange={(e) => setData('sales_start_date', e.target.value)}
                                />
                                <p className="text-xs text-gray-500">Dejar vacío para venta inmediata.</p>
                                {/* @ts-ignore */}
                                {errors.sales_start_date && <p className="text-red-500 text-sm">{errors.sales_start_date}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="button_text">Texto del Botón de Compra</Label>
                                <Input
                                    id="button_text"
                                    value={data.button_text}
                                    onChange={(e) => setData('button_text', e.target.value)}
                                    placeholder="Ej. Comprar Boletos (Default)"
                                />
                                {/* @ts-ignore */}
                                {errors.button_text && <p className="text-red-500 text-sm">{errors.button_text}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción (HTML)</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="min-h-[200px] font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500">
                                Puedes usar HTML básico para dar formato.
                            </p>
                            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value: 'draft' | 'published') => setData('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Borrador</SelectItem>
                                    <SelectItem value="published">Publicado</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
                            {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
                        </div>

                        {salesCenters && salesCenters.length > 0 && (
                            <div className="space-y-4 border-t pt-4">
                                <Label>Centros de Venta Disponibles</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {salesCenters.map((center) => (
                                        <div key={center.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`center-${center.id}`}
                                                checked={data.sales_centers?.some((c: number) => Number(c) === center.id)}
                                                onCheckedChange={(checked) => {
                                                    const current = data.sales_centers || [];
                                                    const centerId = center.id;
                                                    if (checked) {
                                                        if (!current.some((c: number) => Number(c) === centerId)) {
                                                            setData('sales_centers', [...current, centerId]);
                                                        }
                                                    } else {
                                                        setData('sales_centers', current.filter((c: number) => Number(c) !== centerId));
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor={`center-${center.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {center.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Selecciona los centros de venta físicos donde estarán disponibles los boletos para este evento.
                                </p>
                            </div>
                        )}

                        {salesCenterGroups && salesCenterGroups.length > 0 && (
                            <div className="space-y-4 border-t pt-4">
                                <Label>Grupos de Centros de Venta</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {salesCenterGroups.map((group) => (
                                        <div key={group.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`group-${group.id}`}
                                                checked={data.sales_center_groups?.some((g: number) => Number(g) === group.id)}
                                                onCheckedChange={(checked) => {
                                                    const current = data.sales_center_groups || [];
                                                    const groupId = group.id;
                                                    if (checked) {
                                                        if (!current.some((g: number) => Number(g) === groupId)) {
                                                            setData('sales_center_groups', [...current, groupId]);
                                                        }
                                                    } else {
                                                        setData('sales_center_groups', current.filter((g: number) => Number(g) !== groupId));
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor={`group-${group.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {group.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Selecciona grupos predefinidos de puntos de venta.
                                </p>
                            </div>
                        )}

                        {categories && categories.length > 0 && (
                            <div className="space-y-4 border-t pt-4">
                                <Label>Categorías del Evento</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Available Categories - Left Panel */}
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Disponibles
                                        </div>
                                        <div className="border rounded-lg bg-gray-50 dark:bg-gray-800 h-64 overflow-y-auto">
                                            {categories
                                                .filter(cat => !data.categories?.includes(cat.id))
                                                .map((category) => (
                                                    <div
                                                        key={category.id}
                                                        onClick={() => {
                                                            const current = data.categories || [];
                                                            setData('categories', [...current, category.id]);
                                                        }}
                                                        className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors flex items-center justify-between group"
                                                    >
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                                            {category.name}
                                                        </span>
                                                        <svg
                                                            className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                ))}
                                            {categories.filter(cat => !data.categories?.includes(cat.id)).length === 0 && (
                                                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
                                                    No hay categorías disponibles
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Haz clic para agregar →
                                        </p>
                                    </div>

                                    {/* Selected Categories - Right Panel */}
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Seleccionadas
                                        </div>
                                        <div className="border rounded-lg bg-green-50 dark:bg-green-900/10 h-64 overflow-y-auto">
                                            {data.categories?.map((categoryId: number) => {
                                                const category = categories.find(c => c.id === categoryId);
                                                if (!category) return null;
                                                return (
                                                    <div
                                                        key={category.id}
                                                        onClick={() => {
                                                            setData('categories', data.categories?.filter((c: number) => c !== category.id) || []);
                                                        }}
                                                        className="px-4 py-2.5 border-b border-green-200 dark:border-green-800 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors flex items-center justify-between group"
                                                    >
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                                            {category.name}
                                                        </span>
                                                        <svg
                                                            className="w-4 h-4 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </div>
                                                );
                                            })}
                                            {(!data.categories || data.categories.length === 0) && (
                                                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
                                                    No hay categorías seleccionadas
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Haz clic para remover ✕
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 italic">
                                    Las categorías seleccionadas se asignarán a este evento.
                                </p>
                            </div>
                        )}


                        <div className="flex justify-end space-x-4 pt-4 border-t">
                            <Button type="button" variant="ghost" asChild>
                                <Link href={route('admin.events.index')}>Cancelar</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

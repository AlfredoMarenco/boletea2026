import AppLayout from '@/layouts/app-layout';
import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Info, MapPin, Image as ImageIcon, CreditCard, Link as LinkIcon, Save, X } from 'lucide-react';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/ui/rich-text-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import ImageLibrary from '@/components/ImageLibrary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ExternalEvent {
    id: number;
    title: string;
    slug?: string | null;
    performance_url: string | null;
    city: string | null;
    venue_id: number | null;
    category: string | null;
    status: 'draft' | 'published';
    image_path: string | null;
    secondary_image_path: string | null;
    start_date: string | null;
    sales_start_date: string | null;
    button_text: string | null;
    description: string | null;
    sales_centers: number[] | null;
    sales_center_groups?: number[] | null;
    categories?: number[] | null;
    cdv_prices?: any[] | null;
    is_featured?: boolean;
    redirect_external?: boolean;
    show_calendar?: boolean;
    calendar_description?: string | null;
    performance_descriptions?: Record<string, { title?: string; subtitle?: string } | string> | null;
    meta_pixel_id?: string | null;
    raw_data?: any;
    linked_events?: number[] | null;
    show_linked_events?: boolean;
}

interface SalesCenter {
    id: number;
    name: string;
    is_active: boolean;
}

interface Venue {
    id: number;
    name: string;
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
    venues?: Venue[];
    allEvents?: { id: number; title: string; start_date: string }[];
}

export default function Edit({ event, salesCenters = [], salesCenterGroups = [], states = [], cities = [], categories = [], venues = [], allEvents = [] }: Props) {
    const { data, setData, post, processing, errors, transform } = useForm<any>({
        _method: 'put',
        title: event.title || '',
        slug: event.slug || '',
        performance_url: event.performance_url || '',
        city: event.city || '',
        state_id: (event as any).state_id,
        city_id: (event as any).city_id,
        venue_id: event.venue_id || '',
        category: event.category || '',
        image_path: event.image_path || '',
        secondary_image_path: event.secondary_image_path || '',
        start_date: event.start_date ? format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm") : '',
        sales_start_date: event.sales_start_date ? format(new Date(event.sales_start_date), "yyyy-MM-dd'T'HH:mm") : '',
        button_text: event.button_text || '',
        description: event.description || '',
        status: event.status,
        sales_centers: (event.sales_centers as number[]) || [],
        sales_center_groups: ((event as any).sales_center_groups as number[]) || [],
        categories: ((event as any).categories as number[]) || [],
        cdv_prices: (event.cdv_prices as any[]) || [],
        is_featured: event.is_featured || false,
        redirect_external: event.redirect_external || false,
        show_calendar: event.show_calendar ?? true,
        calendar_description: event.calendar_description || '',
        performance_descriptions: event.performance_descriptions || {},
        meta_pixel_id: event.meta_pixel_id || '',
        linked_events: ((event as any).linked_events as number[]) || [],
        show_linked_events: event.show_linked_events || false,
    });

    transform((data) => {
        const submissionData = { ...data };
        if (submissionData.start_date) {
            submissionData.start_date = submissionData.start_date.replace('T', ' ');
            if (submissionData.start_date.length === 16) {
                submissionData.start_date += ':00';
            }
        } else {
            submissionData.start_date = null;
        }

        if (submissionData.sales_start_date) {
            submissionData.sales_start_date = submissionData.sales_start_date.replace('T', ' ');
            if (submissionData.sales_start_date.length === 16) {
                submissionData.sales_start_date += ':00';
            }
        } else {
            submissionData.sales_start_date = null;
        }
        return submissionData;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.events.update', event.id), {
            forceFormData: true,
        });
    };

    const renderPrimaryPreview = () => {
        if (typeof data.image_path === 'string' && data.image_path) {
            return <img src={data.image_path} alt="Preview" className="w-[125px] h-[100px] object-cover rounded border" />;
        }
        if ((data.image_path as any) instanceof File) {
            return <img src={URL.createObjectURL(data.image_path as any)} alt="Preview" className="w-[125px] h-[100px] object-cover rounded border" />;
        }
        return null;
    };

    const renderSecondaryPreview = () => {
        if (typeof data.secondary_image_path === 'string' && data.secondary_image_path) {
            return <img src={data.secondary_image_path} alt="Preview" className="w-[79px] h-[108px] object-cover rounded border" />;
        }
        if ((data.secondary_image_path as any) instanceof File) {
            return <img src={URL.createObjectURL(data.secondary_image_path as any)} alt="Preview" className="w-[79px] h-[108px] object-cover rounded border" />;
        }
        return null;
    };

    const orderedPerformances = React.useMemo(() => {
        if (!event.raw_data || !Array.isArray(event.raw_data)) return [];
        return [...event.raw_data].sort((a, b) => {
            const orderA = typeof data.performance_descriptions?.[a.PerformanceID] === 'object'
                ? (data.performance_descriptions[a.PerformanceID] as any)?.order ?? 999
                : 999;
            const orderB = typeof data.performance_descriptions?.[b.PerformanceID] === 'object'
                ? (data.performance_descriptions[b.PerformanceID] as any)?.order ?? 999
                : 999;
            return orderA - orderB;
        });
    }, [event.raw_data, data.performance_descriptions]);

    const [eventSearch, setEventSearch] = React.useState('');
    const filteredEvents = (allEvents || []).filter(ev =>
        ev.title.toLowerCase().includes(eventSearch.toLowerCase()) &&
        !data.linked_events?.includes(ev.id)
    );

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        
        const items = Array.from(orderedPerformances);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        const updatedDescriptions = { ...(data.performance_descriptions || {}) };
        items.forEach((item: any, index: number) => {
            const currentDesc = typeof updatedDescriptions[item.PerformanceID] === 'object' 
                ? updatedDescriptions[item.PerformanceID] 
                : { title: typeof updatedDescriptions[item.PerformanceID] === 'string' ? updatedDescriptions[item.PerformanceID] : '' };
                
            updatedDescriptions[item.PerformanceID] = {
                ...(currentDesc as any),
                order: index
            };
        });
        
        setData('performance_descriptions', updatedDescriptions);
    };

    // Tab Error Indicators
    const hasGeneralErrors = !!(errors.title || errors.slug || errors.performance_url || errors.meta_pixel_id || errors.description || errors.status);
    const hasLocationErrors = !!(errors.venue_id || errors.state_id || errors.city_id || errors.start_date || errors.sales_start_date || errors.button_text);
    const hasMediaErrors = !!(errors.image_path || errors.secondary_image_path);
    const hasPricingErrors = !!(errors.cdv_prices || errors.sales_centers || errors.sales_center_groups);
    const hasLinkErrors = !!(errors.categories || errors.linked_events || errors.show_calendar);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Eventos', href: route('admin.events.index') },
            { title: 'Editar Evento', href: '#' }
        ]}>
            <Head title={`Editar ${event.title}`} />

            <div className="p-6 max-w-6xl mx-auto pb-32">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            Editar Evento
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {event.title} • ID: {event.id}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" asChild className="rounded-xl">
                            <Link href={route('admin.events.index')}>
                                <X className="size-4 mr-2" />
                                Cancelar
                            </Link>
                        </Button>
                        <Button onClick={handleSubmit} disabled={processing} className="bg-[#c90000] hover:bg-[#a00000] rounded-xl shadow-lg shadow-red-600/20">
                            <Save className="size-4 mr-2" />
                            Guardar cambios
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-8 w-full md:w-auto h-auto p-1 grid grid-cols-2 md:grid-cols-5 gap-1">
                        <TabsTrigger value="general" hasError={hasGeneralErrors} className="gap-2">
                            <Info className="size-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="location" hasError={hasLocationErrors} className="gap-2">
                            <MapPin className="size-4" />
                            Ubicación
                        </TabsTrigger>
                        <TabsTrigger value="multimedia" hasError={hasMediaErrors} className="gap-2">
                            <ImageIcon className="size-4" />
                            Imágenes
                        </TabsTrigger>
                        <TabsTrigger value="pricing" hasError={hasPricingErrors} className="gap-2">
                            <CreditCard className="size-4" />
                            Ventas y Precios
                        </TabsTrigger>
                        <TabsTrigger value="linking" hasError={hasLinkErrors} className="gap-2">
                            <LinkIcon className="size-4" />
                            Vínculos
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        {/* TAB: GENERAL */}
                        <TabsContent value="general" className="space-y-6">
                            <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-6 transition-all">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-4 dark:border-white/5">
                                    <div className="w-1.5 h-6 bg-[#c90000] rounded-full" />
                                    Información Básica
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Título del Evento</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Nombre comercial del evento"
                                            className="rounded-xl h-11"
                                        />
                                        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Slug / URL (Opcional)</Label>
                                        <Input
                                            id="slug"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            placeholder="ej. mi-evento-festival"
                                            className="rounded-xl h-11"
                                        />
                                        {errors.slug && <p className="text-red-500 text-sm">{errors.slug}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="performance_url">Liga de Compra Externa (Performance URL)</Label>
                                    <Input
                                        id="performance_url"
                                        value={data.performance_url}
                                        onChange={(e) => setData('performance_url', e.target.value)}
                                        placeholder="https://boletea.com.mx/ordertickets.asp?p=123"
                                        className="rounded-xl h-11"
                                    />
                                    {errors.performance_url && <p className="text-red-500 text-sm">{errors.performance_url}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-white/5 mt-6">
                                    <div className="space-y-4">
                                        <Label>Estado de Publicación</Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(value: 'draft' | 'published') => setData('status', value)}
                                        >
                                            <SelectTrigger className="rounded-xl h-11">
                                                <SelectValue placeholder="Selecciona un estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Borrador (Oculto)</SelectItem>
                                                <SelectItem value="published">Publicado (Visible)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
                                    </div>

                                    <div className="space-y-4 pt-6">
                                        <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-card">
                                            <Checkbox
                                                id="is_featured"
                                                checked={data.is_featured}
                                                onCheckedChange={(checked) => setData('is_featured', !!checked)}
                                            />
                                            <div className="grid gap-1.5 leading-none cursor-pointer" onClick={() => setData('is_featured', !data.is_featured)}>
                                                <label className="text-sm font-bold cursor-pointer">Evento Destacado</label>
                                                <p className="text-xs text-gray-500">Aparecerá en el inicio.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="meta_pixel_id">Meta (Facebook) Pixel ID</Label>
                                        <Input
                                            id="meta_pixel_id"
                                            value={data.meta_pixel_id}
                                            onChange={(e) => setData('meta_pixel_id', e.target.value)}
                                            placeholder="ej. 1234567890"
                                            className="rounded-xl h-11"
                                        />
                                        {errors.meta_pixel_id && <p className="text-red-500 text-sm">{errors.meta_pixel_id}</p>}
                                    </div>

                                    <div className="space-y-4 pt-6">
                                        <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-card">
                                            <Checkbox
                                                id="redirect_external"
                                                checked={data.redirect_external}
                                                onCheckedChange={(checked) => setData('redirect_external', !!checked)}
                                            />
                                            <div className="grid gap-1.5 leading-none cursor-pointer" onClick={() => setData('redirect_external', !data.redirect_external)}>
                                                <label className="text-sm font-bold cursor-pointer">Redirección Directa</label>
                                                <p className="text-xs text-gray-500">Bypassear la página de detalles.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <Label>Descripción del Evento</Label>
                                    <RichTextEditor
                                        value={data.description}
                                        onChange={(val) => setData('description', val)}
                                    />
                                    {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: LOCATION & DATES */}
                        <TabsContent value="location" className="space-y-6">
                            <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-4 dark:border-white/5">
                                    <div className="w-1.5 h-6 bg-[#c90000] rounded-full" />
                                    Lugar y Recinto
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="state_id">Estado</Label>
                                        <Select
                                            value={data.state_id ? String(data.state_id) : ""}
                                            onValueChange={(value) => setData((d: any) => ({ ...d, state_id: Number(value), city_id: '' }))}
                                        >
                                            <SelectTrigger className="rounded-xl h-11">
                                                <SelectValue placeholder="Selecciona estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {states.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
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
                                            <SelectTrigger className="rounded-xl h-11">
                                                <SelectValue placeholder="Selecciona ciudad" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cities.filter(c => c.state_id === data.state_id).map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.city_id && <p className="text-red-500 text-sm">{errors.city_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="venue_id">Recinto (Venue)</Label>
                                        <Select
                                            value={data.venue_id ? String(data.venue_id) : ""}
                                            onValueChange={(value) => setData('venue_id', Number(value))}
                                        >
                                            <SelectTrigger className="rounded-xl h-11">
                                                <SelectValue placeholder="Selecciona recinto" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {venues.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {errors.venue_id && <p className="text-red-500 text-sm">{errors.venue_id}</p>}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold flex items-center gap-2 mt-8 mb-4 border-b pb-4 dark:border-white/5">
                                    <div className="w-1.5 h-6 bg-[#c90000] rounded-full" />
                                    Fechas y Programación
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">Fecha y Hora del Evento</Label>
                                        <Input
                                            id="start_date"
                                            type="datetime-local"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            className="rounded-xl h-11"
                                        />
                                        {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date as string}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sales_start_date">Fecha Inicio de Venta (Opcional)</Label>
                                        <Input
                                            id="sales_start_date"
                                            type="datetime-local"
                                            value={data.sales_start_date}
                                            onChange={(e) => setData('sales_start_date', e.target.value)}
                                            className="rounded-xl h-11"
                                        />
                                        {errors.sales_start_date && <p className="text-red-500 text-sm">{errors.sales_start_date as string}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="button_text">Texto Personalizado del Botón de Compra</Label>
                                    <Input
                                        id="button_text"
                                        value={data.button_text}
                                        onChange={(e) => setData('button_text', e.target.value)}
                                        placeholder="Ej. Comprar Boletos / Inscribirse"
                                        className="rounded-xl h-11"
                                    />
                                    {errors.button_text && <p className="text-red-500 text-sm">{errors.button_text}</p>}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: MULTIMEDIA */}
                        <TabsContent value="multimedia" className="space-y-6">
                            <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-8">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-4 dark:border-white/5">
                                    <div className="w-1.5 h-6 bg-[#c90000] rounded-full" />
                                    Imágenes del Evento
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <Label className="text-base">Imagen Principal (Fondo / Hero)</Label>
                                        <div className="flex flex-col gap-4">
                                            <div className="aspect-video relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-card flex items-center justify-center group">
                                                {renderPrimaryPreview() ? (
                                                    <div className="w-full h-full">
                                                        {React.cloneElement(renderPrimaryPreview() as any, { className: "w-full h-full object-cover" })}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-gray-400">
                                                        <ImageIcon className="size-10 mb-2 opacity-20" />
                                                        <span className="text-xs">1920x1080 recomendado</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        id="main-image-upload"
                                                        className="hidden"
                                                        onChange={(e) => e.target.files && setData('image_path', e.target.files[0])}
                                                    />
                                                    <Button 
                                                        type="button" 
                                                        variant="outline" 
                                                        className="w-full rounded-xl gap-2 h-11 border-dashed hover:border-[#c90000] hover:bg-red-50 dark:hover:bg-red-900/10"
                                                        onClick={() => document.getElementById('main-image-upload')?.click()}
                                                    >
                                                        <ImageIcon className="size-4" />
                                                        Subir Local
                                                    </Button>
                                                </div>
                                                <ImageLibrary
                                                    onSelect={(url) => setData('image_path', url)}
                                                    currentImage={typeof data.image_path === 'string' ? data.image_path : null}
                                                />
                                            </div>
                                        </div>
                                        {errors.image_path && <p className="text-red-500 text-sm">{errors.image_path as string}</p>}
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-base">Imagen Secundaria (Poster / Cartel)</Label>
                                        <div className="flex flex-col gap-4">
                                            <div className="aspect-[3/4] max-w-[200px] mx-auto relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-card flex items-center justify-center">
                                                {renderSecondaryPreview() ? (
                                                    <div className="w-full h-full">
                                                        {React.cloneElement(renderSecondaryPreview() as any, { className: "w-full h-full object-cover" })}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-gray-400">
                                                        <ImageIcon className="size-10 mb-2 opacity-20" />
                                                        <span className="text-xs text-center px-4">Relación 3:4 (Poster móvil)</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        id="secondary-image-upload"
                                                        className="hidden"
                                                        onChange={(e) => e.target.files && setData('secondary_image_path', e.target.files[0])}
                                                    />
                                                    <Button 
                                                        type="button" 
                                                        variant="outline" 
                                                        className="w-full rounded-xl gap-2 h-11 border-dashed hover:border-[#c90000] hover:bg-red-50 dark:hover:bg-red-900/10"
                                                        onClick={() => document.getElementById('secondary-image-upload')?.click()}
                                                    >
                                                        <ImageIcon className="size-4" />
                                                        Subir Local
                                                    </Button>
                                                </div>
                                                <ImageLibrary
                                                    onSelect={(url) => setData('secondary_image_path', url)}
                                                    currentImage={typeof data.secondary_image_path === 'string' ? data.secondary_image_path : null}
                                                />
                                            </div>
                                        </div>
                                        {errors.secondary_image_path && <p className="text-red-500 text-sm">{errors.secondary_image_path as string}</p>}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: PRICING & SALES */}
                        <TabsContent value="pricing" className="space-y-6">
                            <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4 border-b pb-4 dark:border-white/5">
                                        <div className="w-1.5 h-6 bg-[#c90000] rounded-full" />
                                        Precios CDV (Sincronizados)
                                    </h3>
                                    
                                    {data.cdv_prices && data.cdv_prices.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {data.cdv_prices
                                                .map((price: any, i: number) => ({ ...price, originalIndex: i }))
                                                .sort((a: any, b: any) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0))
                                                .map((price: any) => (
                                                    <div key={price.id} className="p-4 border rounded-2xl bg-gray-50 dark:bg-card border-gray-100 dark:border-white/5 flex flex-col gap-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-bold text-gray-800 dark:text-gray-200">{price.name}</p>
                                                                <p className="text-xl font-black text-[#c90000]">{(parseFloat(price.price) || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`show-${price.id}`}
                                                                        checked={price.show === true || String(price.show) === 'true' || String(price.show) === '1'}
                                                                        onCheckedChange={(checked) => {
                                                                            const newPrices = [...data.cdv_prices];
                                                                            newPrices[price.originalIndex].show = !!checked;
                                                                            setData('cdv_prices', newPrices);
                                                                        }}
                                                                    />
                                                                    <Label htmlFor={`show-${price.id}`} className="text-xs cursor-pointer">Visible</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`soldout-${price.id}`}
                                                                        checked={price.sold_out === true || String(price.sold_out) === 'true' || String(price.sold_out) === '1'}
                                                                        onCheckedChange={(checked) => {
                                                                            const newPrices = [...data.cdv_prices];
                                                                            newPrices[price.originalIndex].sold_out = !!checked;
                                                                            setData('cdv_prices', newPrices);
                                                                        }}
                                                                    />
                                                                    <Label htmlFor={`soldout-${price.id}`} className="text-xs text-red-500 cursor-pointer">Agotado</Label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <div className="p-8 border-2 border-dashed rounded-2xl text-center text-gray-400">
                                            No hay precios sincronizados aún.
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t dark:border-white/5">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                        <MapPin className="size-5 text-[#c90000]" />
                                        Puntos de Venta Físicos
                                    </h3>
                                    
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-sm font-bold uppercase tracking-wider text-gray-400">Grupos de Sucursales</Label>
                                            {salesCenterGroups.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {salesCenterGroups.map((g) => (
                                                        <div key={g.id} className="flex items-center space-x-2 p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-card hover:border-[#c90000]/20 transition-colors">
                                                            <Checkbox
                                                                id={`group-${g.id}`}
                                                                checked={data.sales_center_groups?.includes(g.id)}
                                                                onCheckedChange={(checked) => {
                                                                    const current = data.sales_center_groups || [];
                                                                    setData('sales_center_groups', checked ? [...current, g.id] : current.filter(id => id !== g.id));
                                                                }}
                                                            />
                                                            <Label htmlFor={`group-${g.id}`} className="text-sm cursor-pointer line-clamp-2 leading-tight">{g.name}</Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 border border-dashed rounded-xl text-center text-gray-400 text-xs italic">
                                                    No hay grupos de sucursales definidos en el sistema.
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-sm font-bold uppercase tracking-wider text-gray-400">Centros Individuales</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {salesCenters.map((sc) => (
                                                    <div key={sc.id} className="flex items-center space-x-2 p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-card hover:border-[#c90000]/20 transition-colors">
                                                        <Checkbox
                                                            id={`center-${sc.id}`}
                                                            checked={data.sales_centers?.includes(sc.id)}
                                                            onCheckedChange={(checked) => {
                                                                const current = data.sales_centers || [];
                                                                setData('sales_centers', checked ? [...current, sc.id] : current.filter(id => id !== sc.id));
                                                            }}
                                                        />
                                                        <Label htmlFor={`center-${sc.id}`} className="text-sm cursor-pointer line-clamp-2 leading-tight">{sc.name}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: LINKING & CALENDAR */}
                        <TabsContent value="linking" className="space-y-6">
                            <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-10">
                                {/* CATEGORIES */}
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-6 border-b pb-4 dark:border-white/5">
                                        <div className="w-1.5 h-6 bg-[#c90000] rounded-full" />
                                        Categorías del Evento
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase font-bold">Disponibles</Label>
                                            <div className="border rounded-xl h-64 overflow-y-auto bg-gray-50 dark:bg-card border-gray-100 dark:border-white/5 p-2">
                                                {categories.filter(c => !data.categories?.includes(c.id)).map(c => (
                                                    <div key={c.id} onClick={() => setData('categories', [...(data.categories || []), c.id])} className="p-3 mb-1 rounded-lg hover:bg-white dark:hover:bg-white/10 cursor-pointer text-sm shadow-sm transition-all flex justify-between group">
                                                        {c.name}
                                                        <Badge variant="outline" className="opacity-0 group-hover:opacity-100 text-[10px]">+ Añadir</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-gray-400 uppercase font-bold">Seleccionadas</Label>
                                            <div className="border rounded-xl h-64 overflow-y-auto bg-[#c90000]/5 border-[#c90000]/10 p-2">
                                                {data.categories?.map((id: number) => {
                                                    const c = categories.find(cat => cat.id === id);
                                                    return c && (
                                                        <div key={id} onClick={() => setData('categories', data.categories.filter((catId: number) => catId !== id))} className="p-3 mb-1 rounded-lg bg-white dark:bg-card border border-[#c90000]/20 cursor-pointer text-sm shadow-sm transition-all flex justify-between group">
                                                            <span className="font-bold text-[#c90000]">{c.name}</span>
                                                            <Badge variant="destructive" className="opacity-0 group-hover:opacity-100 text-[10px]">✕ Quitar</Badge>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PARENT EVENT / GRID MODE */}
                                <div className="pt-8 border-t dark:border-white/5">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-6 bg-[#c90000] rounded-full" />
                                        Modo Paraguas (Eventos Vinculados)
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-6">Gestiona festivales o eventos masivos con sub-eventos.</p>
                                    
                                    <div className="flex items-center space-x-4 p-5 rounded-2xl border-2 border-[#c90000]/20 bg-[#c90000]/5 mb-8">
                                        <Checkbox
                                            id="show_linked_events"
                                            checked={data.show_linked_events}
                                            onCheckedChange={(checked) => setData('show_linked_events', !!checked)}
                                            className="size-5 border-[#c90000] data-[state=checked]:bg-[#c90000]"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="show_linked_events" className="text-base font-black cursor-pointer text-[#c90000]">Activar Cuadrícula de Artistas/Sub-eventos</Label>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Convierte esta página en un portal de eventos. Oculta el sidebar y habilita navegación directa.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Input
                                            placeholder="Filtrar eventos..."
                                            value={eventSearch}
                                            onChange={(e) => setEventSearch(e.target.value)}
                                            className="max-w-md rounded-xl"
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div className="border rounded-2xl overflow-hidden bg-gray-50 dark:bg-card">
                                                <div className="bg-gray-100 dark:bg-white/5 p-3 text-xs font-bold uppercase tracking-widest text-gray-500">Disponibles</div>
                                                <div className="h-72 overflow-y-auto">
                                                    {filteredEvents.map(ev => (
                                                        <div key={ev.id} onClick={() => setData('linked_events', [...(data.linked_events || []), ev.id])} className="p-4 border-b dark:border-white/5 hover:bg-white dark:hover:bg-white/5 cursor-pointer flex flex-col gap-1 transition-all group">
                                                            <span className="text-sm font-bold group-hover:text-[#c90000]">{ev.title}</span>
                                                            <span className="text-[10px] text-gray-400">{ev.start_date ? format(new Date(ev.start_date), "dd/MM/yyyy") : 'S/F'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="border rounded-2xl overflow-hidden bg-[#c90000]/5 border-[#c90000]/20">
                                                <div className="bg-[#c90000]/10 p-3 text-xs font-bold uppercase tracking-widest text-[#c90000]">Vinculados (Grid)</div>
                                                <div className="h-72 overflow-y-auto">
                                                    {data.linked_events?.map((id: number) => {
                                                        const ev = allEvents.find(e => e.id === id);
                                                        return ev && (
                                                            <div key={id} onClick={() => setData('linked_events', data.linked_events.filter((vid: number) => vid !== id))} className="p-4 border-b border-[#c90000]/10 bg-white dark:bg-card hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer flex flex-col gap-1 transition-all">
                                                                <span className="text-sm font-bold text-[#c90000]">{ev.title}</span>
                                                                <span className="text-[10px] text-gray-400 italic">Haz clic para desvincular</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CALENDAR / MULTIFUNCTION */}
                                <div className="pt-8 border-t dark:border-white/5">
                                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-6 bg-[#c90000] rounded-full" />
                                        Funciones y Calendario
                                    </h3>
                                    
                                     <div className="mb-8 space-y-6">
                                        <div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-card">
                                            <Checkbox
                                                id="show_calendar"
                                                checked={data.show_calendar}
                                                onCheckedChange={(checked) => setData('show_calendar', !!checked)}
                                            />
                                            <div className="grid gap-1.5 leading-none cursor-pointer" onClick={() => setData('show_calendar', !data.show_calendar)}>
                                                <label className="text-sm font-bold cursor-pointer">Mostrar selector de calendario</label>
                                                <p className="text-xs text-gray-500">Obligatorio si hay más de 20 funciones.</p>
                                            </div>
                                        </div>

                                        {!data.show_calendar && (
                                            <div className="px-1">
                                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">Textos personalizados por función (Recuadros de Reserva)</h4>
                                                <p className="text-sm text-gray-500">Escribe el título/texto corto que aparecerá en el recuadro de cada fecha. Ej: "Reserva tus boletos" o "Función de Estreno".</p>
                                            </div>
                                        )}
                                    </div>
                                            
                                    {!data.show_calendar && (
                                        <div className="space-y-4">
                                            <DragDropContext onDragEnd={onDragEnd}>
                                                <Droppable droppableId="performances">
                                                    {(provided) => (
                                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                                            {orderedPerformances.map((perf: any, i) => (
                                                                <Draggable key={String(perf.PerformanceID)} draggableId={String(perf.PerformanceID)} index={i}>
                                                                    {(p) => (
                                                                        <div ref={p.innerRef} {...p.draggableProps} className="p-5 bg-white dark:bg-card border border-gray-100 dark:border-white/5 rounded-2xl flex gap-5 items-start shadow-sm">
                                                                            <div {...p.dragHandleProps} className="text-gray-300 hover:text-gray-500 pt-3"><GripVertical /></div>
                                                                            
                                                                            <div className="flex-1 space-y-4">
                                                                                {/* Header Row: Function Name & ID Badge */}
                                                                                <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-50 dark:border-white/5">
                                                                                    <span className="font-bold text-gray-900 dark:text-gray-100">
                                                                                        Función {format(new Date(perf.PerformanceDateTime), "PPp", { locale: es })}
                                                                                    </span>
                                                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800 font-mono text-[10px] px-2 py-0.5 rounded-full">
                                                                                        {perf.PerformanceName}
                                                                                    </Badge>
                                                                                </div>

                                                                                {/* Inputs Grid */}
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                    <div className="space-y-1.5">
                                                                                        <Label className="text-xs font-bold text-gray-500">Título del Botón/Recuadro</Label>
                                                                                        <Input
                                                                                            value={typeof data.performance_descriptions?.[perf.PerformanceID] === 'object' ? data.performance_descriptions[perf.PerformanceID].title : (data.performance_descriptions?.[perf.PerformanceID] || '')}
                                                                                            onChange={(e) => {
                                                                                                const current = data.performance_descriptions?.[perf.PerformanceID] || {};
                                                                                                setData('performance_descriptions', { ...data.performance_descriptions, [perf.PerformanceID]: { ...(typeof current === 'object' ? current : {title: current}), title: e.target.value }})
                                                                                            }}
                                                                                            placeholder="Ej. Reserva tus Boletos"
                                                                                            className="h-10 rounded-xl"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="space-y-1.5">
                                                                                        <Label className="text-xs font-bold text-gray-500">Subtítulo (Fecha/Información)</Label>
                                                                                        <Input
                                                                                            value={typeof data.performance_descriptions?.[perf.PerformanceID] === 'object' ? data.performance_descriptions[perf.PerformanceID].subtitle : ''}
                                                                                            onChange={(e) => {
                                                                                                const current = data.performance_descriptions?.[perf.PerformanceID] || {};
                                                                                                setData('performance_descriptions', { ...data.performance_descriptions, [perf.PerformanceID]: { ...(typeof current === 'object' ? current : {title: current}), subtitle: e.target.value }})
                                                                                            }}
                                                                                            placeholder="Ej. domingo 12 de julio 2026"
                                                                                            className="h-10 rounded-xl"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </DragDropContext>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </form>
                </Tabs>

                {/* Sticky Footer for Actions */}
                <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/80 dark:bg-background/80 backdrop-blur-md border-t border-gray-200 dark:border-border p-4 z-50 flex justify-end gap-3 px-8">
                    <div className="max-w-6xl w-full mx-auto flex justify-end gap-3">
                        <Button variant="outline" asChild className="rounded-xl h-11">
                            <Link href={route('admin.events.index')}>Descartar</Link>
                        </Button>
                        <Button onClick={handleSubmit} disabled={processing} className="bg-[#c90000] hover:bg-[#a00000] rounded-xl h-11 px-8 shadow-xl shadow-red-600/20 font-bold">
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

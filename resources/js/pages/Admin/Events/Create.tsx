import AppLayout from '@/layouts/app-layout';
import React from 'react';
import {
    Info,
    MapPin,
    Image as ImageIcon,
    CreditCard,
    Link as LinkIcon,
    Save,
    X,
} from 'lucide-react';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { format } from 'date-fns';
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
    end_date: string | null;
    sales_start_date: string | null;
    button_text: string | null;
    description: string | null;
    sales_centers: number[] | null;
    sales_center_groups?: number[] | null;
    categories?: number[] | null;
    cdv_prices?: any[] | null;
    show_calendar?: boolean;
    calendar_description?: string | null;
    performance_descriptions?: Record<
        string,
        { title?: string; subtitle?: string } | string
    > | null;
    meta_pixel_id?: string | null;
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
    salesCenters?: SalesCenter[];
    salesCenterGroups?: SalesCenterGroup[];
    states: State[];
    cities: City[];
    categories?: Category[];
    venues?: Venue[];
    allEvents?: { id: number; title: string; start_date: string }[];
}

export default function Create({
    salesCenters = [],
    salesCenterGroups = [],
    states = [],
    cities = [],
    categories = [],
    venues = [],
    allEvents = [],
}: Props) {
    const { data, setData, post, processing, errors, transform } = useForm<any>(
        {
            title: '',
            slug: '',
            performance_url: '',
            city: '',
            state_id: '',
            city_id: '',
            venue_id: '',
            category: '',
            image_path: '',
            secondary_image_path: '',
            start_date: '',
            end_date: '',
            sales_start_date: '',
            button_text: '',
            description: '',
            status: 'draft',
            sales_centers: [],
            sales_center_groups: [],
            categories: [],
            cdv_prices: [],
            is_featured: false,
            redirect_external: false,
            show_calendar: true,
            calendar_description: '',
            performance_descriptions: {},
            meta_pixel_id: '',
            linked_events: [],
            show_linked_events: false,
        },
    );

    const [eventSearch, setEventSearch] = React.useState('');
    const filteredEvents = (allEvents || []).filter(
        (ev) =>
            ev.title.toLowerCase().includes(eventSearch.toLowerCase()) &&
            !data.linked_events?.includes(ev.id),
    );

    transform((data) => {
        const submissionData = { ...data };
        if (submissionData.start_date) {
            submissionData.start_date = submissionData.start_date.replace(
                'T',
                ' ',
            );
            if (submissionData.start_date.length === 16) {
                submissionData.start_date += ':00';
            }
        } else {
            submissionData.start_date = null;
        }

        if (submissionData.end_date) {
            submissionData.end_date = submissionData.end_date.replace(
                'T',
                ' ',
            );
            if (submissionData.end_date.length === 16) {
                submissionData.end_date += ':00';
            }
        } else {
            submissionData.end_date = null;
        }

        if (submissionData.sales_start_date) {
            submissionData.sales_start_date =
                submissionData.sales_start_date.replace('T', ' ');
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
        post(route('admin.events.store'), {
            forceFormData: true,
        });
    };

    const renderPrimaryPreview = () => {
        if (typeof data.image_path === 'string' && data.image_path) {
            return (
                <img
                    src={data.image_path}
                    alt="Preview"
                    className="h-[100px] w-[125px] rounded border object-cover"
                />
            );
        }
        if ((data.image_path as any) instanceof File) {
            return (
                <img
                    src={URL.createObjectURL(data.image_path as any)}
                    alt="Preview"
                    className="h-[100px] w-[125px] rounded border object-cover"
                />
            );
        }
        return null;
    };

    const renderSecondaryPreview = () => {
        if (
            typeof data.secondary_image_path === 'string' &&
            data.secondary_image_path
        ) {
            return (
                <img
                    src={data.secondary_image_path}
                    alt="Preview"
                    className="h-[108px] w-[79px] rounded border object-cover"
                />
            );
        }
        if ((data.secondary_image_path as any) instanceof File) {
            return (
                <img
                    src={URL.createObjectURL(data.secondary_image_path as any)}
                    alt="Preview"
                    className="h-[108px] w-[79px] rounded border object-cover"
                />
            );
        }
        return null;
    };

    // Tab Error Indicators
    const hasGeneralErrors = !!(
        errors.title ||
        errors.slug ||
        errors.performance_url ||
        errors.meta_pixel_id ||
        errors.description ||
        errors.status
    );
    const hasLocationErrors = !!(
        errors.venue_id ||
        errors.state_id ||
        errors.city_id ||
        errors.start_date ||
        errors.sales_start_date ||
        errors.button_text
    );
    const hasMediaErrors = !!(errors.image_path || errors.secondary_image_path);
    const hasPricingErrors = !!(
        errors.cdv_prices ||
        errors.sales_centers ||
        errors.sales_center_groups
    );
    const hasLinkErrors = !!(
        errors.categories ||
        errors.linked_events ||
        errors.show_calendar
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Eventos', href: route('admin.events.index') },
                { title: 'Crear Evento', href: '#' },
            ]}
        >
            <Head title="Crear Evento" />

            <div className="mx-auto max-w-6xl p-6 pb-32">
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            Crear Evento
                        </h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            Completa la información para el nuevo evento.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            asChild
                            className="rounded-xl"
                        >
                            <Link href={route('admin.events.index')}>
                                <X className="mr-2 size-4" />
                                Cancelar
                            </Link>
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="rounded-xl bg-[#c90000] shadow-lg shadow-red-600/20 hover:bg-[#a00000]"
                        >
                            <Save className="mr-2 size-4" />
                            Crear Evento
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-8 grid h-auto w-full grid-cols-2 gap-1 p-1 md:w-auto md:grid-cols-5">
                        <TabsTrigger
                            value="general"
                            hasError={hasGeneralErrors}
                            className="gap-2"
                        >
                            <Info className="size-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="location"
                            hasError={hasLocationErrors}
                            className="gap-2"
                        >
                            <MapPin className="size-4" />
                            Ubicación
                        </TabsTrigger>
                        <TabsTrigger
                            value="multimedia"
                            hasError={hasMediaErrors}
                            className="gap-2"
                        >
                            <ImageIcon className="size-4" />
                            Imágenes
                        </TabsTrigger>
                        <TabsTrigger
                            value="pricing"
                            hasError={hasPricingErrors}
                            className="gap-2"
                        >
                            <CreditCard className="size-4" />
                            Ventas y Precios
                        </TabsTrigger>
                        <TabsTrigger
                            value="linking"
                            hasError={hasLinkErrors}
                            className="gap-2"
                        >
                            <LinkIcon className="size-4" />
                            Vínculos
                        </TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        {/* TAB: GENERAL */}
                        <TabsContent value="general" className="space-y-6">
                            <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all dark:border-white/5 dark:bg-[#1a1c20]">
                                <h3 className="mb-4 flex items-center gap-2 border-b pb-4 text-lg font-bold dark:border-white/5">
                                    <div className="h-6 w-1.5 rounded-full bg-[#c90000]" />
                                    Información Básica
                                </h3>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">
                                            Título del Evento
                                        </Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) =>
                                                setData('title', e.target.value)
                                            }
                                            placeholder="Nombre comercial del evento"
                                            className="h-11 rounded-xl"
                                        />
                                        {errors.title && (
                                            <p className="text-sm text-red-500">
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug">
                                            Slug / URL (Opcional)
                                        </Label>
                                        <Input
                                            id="slug"
                                            value={data.slug}
                                            onChange={(e) =>
                                                setData('slug', e.target.value)
                                            }
                                            placeholder="ej. mi-evento-festival"
                                            className="h-11 rounded-xl"
                                        />
                                        {errors.slug && (
                                            <p className="text-sm text-red-500">
                                                {errors.slug}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="performance_url">
                                        Liga de Compra Externa (Performance URL)
                                    </Label>
                                    <Input
                                        id="performance_url"
                                        value={data.performance_url}
                                        onChange={(e) =>
                                            setData(
                                                'performance_url',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="https://boletea.com.mx/ordertickets.asp?p=123"
                                        className="h-11 rounded-xl"
                                    />
                                    {errors.performance_url && (
                                        <p className="text-sm text-red-500">
                                            {errors.performance_url}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6 grid grid-cols-1 gap-6 border-t pt-4 md:grid-cols-2 dark:border-white/5">
                                    <div className="space-y-4">
                                        <Label>Estado de Publicación</Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(
                                                value: 'draft' | 'published',
                                            ) => setData('status', value)}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl">
                                                <SelectValue placeholder="Selecciona un estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">
                                                    Borrador (Oculto)
                                                </SelectItem>
                                                <SelectItem value="published">
                                                    Publicado (Visible)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && (
                                            <p className="text-sm text-red-500">
                                                {errors.status}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4 pt-6">
                                        <div className="flex items-center space-x-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-card">
                                            <Checkbox
                                                id="is_featured"
                                                checked={data.is_featured}
                                                onCheckedChange={(checked) =>
                                                    setData(
                                                        'is_featured',
                                                        !!checked,
                                                    )
                                                }
                                            />
                                            <div
                                                className="grid cursor-pointer gap-1.5 leading-none"
                                                onClick={() =>
                                                    setData(
                                                        'is_featured',
                                                        !data.is_featured,
                                                    )
                                                }
                                            >
                                                <label className="cursor-pointer text-sm font-bold">
                                                    Evento Destacado
                                                </label>
                                                <p className="text-xs text-gray-500">
                                                    Aparecerá en el inicio.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="meta_pixel_id">
                                            Meta (Facebook) Pixel ID
                                        </Label>
                                        <Input
                                            id="meta_pixel_id"
                                            value={data.meta_pixel_id}
                                            onChange={(e) =>
                                                setData(
                                                    'meta_pixel_id',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="ej. 1234567890"
                                            className="h-11 rounded-xl"
                                        />
                                        {errors.meta_pixel_id && (
                                            <p className="text-sm text-red-500">
                                                {errors.meta_pixel_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4 pt-6">
                                        <div className="flex items-center space-x-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-card">
                                            <Checkbox
                                                id="redirect_external"
                                                checked={data.redirect_external}
                                                onCheckedChange={(checked) =>
                                                    setData(
                                                        'redirect_external',
                                                        !!checked,
                                                    )
                                                }
                                            />
                                            <div
                                                className="grid cursor-pointer gap-1.5 leading-none"
                                                onClick={() =>
                                                    setData(
                                                        'redirect_external',
                                                        !data.redirect_external,
                                                    )
                                                }
                                            >
                                                <label className="cursor-pointer text-sm font-bold">
                                                    Redirección Directa
                                                </label>
                                                <p className="text-xs text-gray-500">
                                                    Bypassear la página de
                                                    detalles.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <Label>Descripción del Evento</Label>
                                    <RichTextEditor
                                        value={data.description}
                                        onChange={(val) =>
                                            setData('description', val)
                                        }
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-500">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: LOCATION & DATES */}
                        <TabsContent value="location" className="space-y-6">
                            <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                                <h3 className="mb-4 flex items-center gap-2 border-b pb-4 text-lg font-bold dark:border-white/5">
                                    <div className="h-6 w-1.5 rounded-full bg-[#c90000]" />
                                    Lugar y Recinto
                                </h3>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="state_id">Estado</Label>
                                        <Select
                                            value={
                                                data.state_id
                                                    ? String(data.state_id)
                                                    : ''
                                            }
                                            onValueChange={(value) =>
                                                setData((d: any) => ({
                                                    ...d,
                                                    state_id: Number(value),
                                                    city_id: '',
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="h-11 rounded-xl">
                                                <SelectValue placeholder="Selecciona estado" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {states.map((s) => (
                                                    <SelectItem
                                                        key={s.id}
                                                        value={String(s.id)}
                                                    >
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.state_id && (
                                            <p className="text-sm text-red-500">
                                                {errors.state_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="city_id">Ciudad</Label>
                                        <Select
                                            value={
                                                data.city_id
                                                    ? String(data.city_id)
                                                    : ''
                                            }
                                            onValueChange={(value) =>
                                                setData(
                                                    'city_id',
                                                    Number(value),
                                                )
                                            }
                                            disabled={!data.state_id}
                                        >
                                            <SelectTrigger className="h-11 rounded-xl">
                                                <SelectValue placeholder="Selecciona ciudad" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cities
                                                    .filter(
                                                        (c) =>
                                                            c.state_id ===
                                                            data.state_id,
                                                    )
                                                    .map((c) => (
                                                        <SelectItem
                                                            key={c.id}
                                                            value={String(c.id)}
                                                        >
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.city_id && (
                                            <p className="text-sm text-red-500">
                                                {errors.city_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="venue_id">
                                            Recinto (Venue)
                                        </Label>
                                        <Select
                                            value={
                                                data.venue_id
                                                    ? String(data.venue_id)
                                                    : ''
                                            }
                                            onValueChange={(value) =>
                                                setData(
                                                    'venue_id',
                                                    Number(value),
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-11 rounded-xl">
                                                <SelectValue placeholder="Selecciona recinto" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {venues.map((v) => (
                                                    <SelectItem
                                                        key={v.id}
                                                        value={String(v.id)}
                                                    >
                                                        {v.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.venue_id && (
                                            <p className="text-sm text-red-500">
                                                {errors.venue_id}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <h3 className="mt-8 mb-4 flex items-center gap-2 border-b pb-4 text-lg font-bold dark:border-white/5">
                                    <div className="h-6 w-1.5 rounded-full bg-[#c90000]" />
                                    Fechas y Programación
                                </h3>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">
                                            Fecha y Hora de Inicio
                                        </Label>
                                        <Input
                                            id="start_date"
                                            type="datetime-local"
                                            value={data.start_date}
                                            onChange={(e) =>
                                                setData(
                                                    'start_date',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl"
                                        />
                                        {errors.start_date && (
                                            <p className="text-sm text-red-500">
                                                {errors.start_date as string}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="end_date">
                                            Fecha y Hora de Fin (Opcional)
                                        </Label>
                                        <Input
                                            id="end_date"
                                            type="datetime-local"
                                            value={data.end_date}
                                            onChange={(e) =>
                                                setData(
                                                    'end_date',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl"
                                        />
                                        {errors.end_date && (
                                            <p className="text-sm text-red-500">
                                                {errors.end_date as string}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sales_start_date">
                                            Fecha Inicio Venta (Opcional)
                                        </Label>
                                        <Input
                                            id="sales_start_date"
                                            type="datetime-local"
                                            value={data.sales_start_date}
                                            onChange={(e) =>
                                                setData(
                                                    'sales_start_date',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11 rounded-xl"
                                        />
                                        {errors.sales_start_date && (
                                            <p className="text-sm text-red-500">
                                                {
                                                    errors.sales_start_date as string
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4">
                                    <Label htmlFor="button_text">
                                        Texto Personalizado del Botón de Compra
                                    </Label>
                                    <Input
                                        id="button_text"
                                        value={data.button_text}
                                        onChange={(e) =>
                                            setData(
                                                'button_text',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Ej. Comprar Boletos / Inscribirse"
                                        className="h-11 rounded-xl"
                                    />
                                    {errors.button_text && (
                                        <p className="text-sm text-red-500">
                                            {errors.button_text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: MULTIMEDIA */}
                        <TabsContent value="multimedia" className="space-y-6">
                            <div className="space-y-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                                <h3 className="mb-4 flex items-center gap-2 border-b pb-4 text-lg font-bold dark:border-white/5">
                                    <div className="h-6 w-1.5 rounded-full bg-[#c90000]" />
                                    Imágenes del Evento
                                </h3>

                                <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <Label className="text-base">
                                            Imagen Principal (Fondo / Hero)
                                        </Label>
                                        <div className="flex flex-col gap-4">
                                            <div className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-card">
                                                {renderPrimaryPreview() ? (
                                                    <div className="h-full w-full">
                                                        {React.cloneElement(
                                                            renderPrimaryPreview() as any,
                                                            {
                                                                className:
                                                                    'w-full h-full object-cover',
                                                            },
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-gray-400">
                                                        <ImageIcon className="mb-2 size-10 opacity-20" />
                                                        <span className="text-xs">
                                                            1920x1080
                                                            recomendado
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        id="create-main-image-upload"
                                                        className="hidden"
                                                        onChange={(e) =>
                                                            e.target.files &&
                                                            setData(
                                                                'image_path',
                                                                e.target
                                                                    .files[0],
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-11 w-full gap-2 rounded-xl border-dashed hover:border-[#c90000] hover:bg-red-50 dark:hover:bg-red-900/10"
                                                        onClick={() =>
                                                            document
                                                                .getElementById(
                                                                    'create-main-image-upload',
                                                                )
                                                                ?.click()
                                                        }
                                                    >
                                                        <ImageIcon className="size-4" />
                                                        Subir Local
                                                    </Button>
                                                </div>
                                                <ImageLibrary
                                                    onSelect={(url) =>
                                                        setData(
                                                            'image_path',
                                                            url,
                                                        )
                                                    }
                                                    currentImage={
                                                        typeof data.image_path ===
                                                        'string'
                                                            ? data.image_path
                                                            : null
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {errors.image_path && (
                                            <p className="text-sm text-red-500">
                                                {errors.image_path as string}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-base">
                                            Imagen Secundaria (Poster / Cartel)
                                        </Label>
                                        <div className="flex flex-col gap-4">
                                            <div className="relative mx-auto flex aspect-[3/4] max-w-[200px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-card">
                                                {renderSecondaryPreview() ? (
                                                    <div className="h-full w-full">
                                                        {React.cloneElement(
                                                            renderSecondaryPreview() as any,
                                                            {
                                                                className:
                                                                    'w-full h-full object-cover',
                                                            },
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-gray-400">
                                                        <ImageIcon className="mb-2 size-10 opacity-20" />
                                                        <span className="px-4 text-center text-xs">
                                                            Relación 3:4 (Poster
                                                            móvil)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        id="create-secondary-image-upload"
                                                        className="hidden"
                                                        onChange={(e) =>
                                                            e.target.files &&
                                                            setData(
                                                                'secondary_image_path',
                                                                e.target
                                                                    .files[0],
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="h-11 w-full gap-2 rounded-xl border-dashed hover:border-[#c90000] hover:bg-red-50 dark:hover:bg-red-900/10"
                                                        onClick={() =>
                                                            document
                                                                .getElementById(
                                                                    'create-secondary-image-upload',
                                                                )
                                                                ?.click()
                                                        }
                                                    >
                                                        <ImageIcon className="size-4" />
                                                        Subir Local
                                                    </Button>
                                                </div>
                                                <ImageLibrary
                                                    onSelect={(url) =>
                                                        setData(
                                                            'secondary_image_path',
                                                            url,
                                                        )
                                                    }
                                                    currentImage={
                                                        typeof data.secondary_image_path ===
                                                        'string'
                                                            ? data.secondary_image_path
                                                            : null
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {errors.secondary_image_path && (
                                            <p className="text-sm text-red-500">
                                                {
                                                    errors.secondary_image_path as string
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: PRICING & SALES */}
                        <TabsContent value="pricing" className="space-y-6">
                            <div className="space-y-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 border-b pb-4 text-lg font-bold dark:border-white/5">
                                        <div className="h-6 w-1.5 rounded-full bg-[#c90000]" />
                                        Precios CDV (Sincronizados)
                                    </h3>
                                    <div className="rounded-2xl border-2 border-dashed p-8 text-center text-gray-400">
                                        Guarda el evento primero para
                                        sincronizar precios desde la API de
                                        Boletea.
                                    </div>
                                </div>

                                <div className="border-t pt-8 dark:border-white/5">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                        <CreditCard className="size-5 text-[#c90000]" />
                                        Puntos de Venta Físicos
                                    </h3>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <Label className="text-sm font-bold tracking-wider text-gray-400 uppercase">
                                                Grupos de Sucursales
                                            </Label>
                                            {salesCenterGroups.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                    {salesCenterGroups.map(
                                                        (g) => (
                                                            <div
                                                                key={g.id}
                                                                className="flex items-center space-x-2 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-[#c90000]/20 dark:border-white/5 dark:bg-card"
                                                            >
                                                                <Checkbox
                                                                    id={`group-${g.id}`}
                                                                    checked={data.sales_center_groups?.includes(
                                                                        g.id,
                                                                    )}
                                                                    onCheckedChange={(
                                                                        checked,
                                                                    ) => {
                                                                        const current =
                                                                            data.sales_center_groups ||
                                                                            [];
                                                                        setData(
                                                                            'sales_center_groups',
                                                                            checked
                                                                                ? [
                                                                                      ...current,
                                                                                      g.id,
                                                                                  ]
                                                                                : current.filter(
                                                                                      (
                                                                                          id,
                                                                                      ) =>
                                                                                          id !==
                                                                                          g.id,
                                                                                  ),
                                                                        );
                                                                    }}
                                                                />
                                                                <Label
                                                                    htmlFor={`group-${g.id}`}
                                                                    className="line-clamp-2 cursor-pointer text-sm leading-tight"
                                                                >
                                                                    {g.name}
                                                                </Label>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-dashed p-4 text-center text-xs text-gray-400 italic">
                                                    No hay grupos de sucursales
                                                    definidos en el sistema.
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-sm font-bold tracking-wider text-gray-400 uppercase">
                                                Centros Individuales
                                            </Label>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                {salesCenters.map((sc) => (
                                                    <div
                                                        key={sc.id}
                                                        className="flex items-center space-x-2 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-[#c90000]/20 dark:border-white/5 dark:bg-card"
                                                    >
                                                        <Checkbox
                                                            id={`center-${sc.id}`}
                                                            checked={data.sales_centers?.includes(
                                                                sc.id,
                                                            )}
                                                            onCheckedChange={(
                                                                checked,
                                                            ) => {
                                                                const current =
                                                                    data.sales_centers ||
                                                                    [];
                                                                setData(
                                                                    'sales_centers',
                                                                    checked
                                                                        ? [
                                                                              ...current,
                                                                              sc.id,
                                                                          ]
                                                                        : current.filter(
                                                                              (
                                                                                  id,
                                                                              ) =>
                                                                                  id !==
                                                                                  sc.id,
                                                                          ),
                                                                );
                                                            }}
                                                        />
                                                        <Label
                                                            htmlFor={`center-${sc.id}`}
                                                            className="line-clamp-2 cursor-pointer text-sm leading-tight"
                                                        >
                                                            {sc.name}
                                                        </Label>
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
                            <div className="space-y-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                                {/* CATEGORIES */}
                                <div>
                                    <h3 className="mb-6 flex items-center gap-2 border-b pb-4 text-lg font-bold dark:border-white/5">
                                        <div className="h-6 w-1.5 rounded-full bg-[#c90000]" />
                                        Categorías del Evento
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase">
                                                Disponibles
                                            </Label>
                                            <div className="h-64 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2 dark:border-white/5 dark:bg-card">
                                                {categories
                                                    .filter(
                                                        (c) =>
                                                            !data.categories?.includes(
                                                                c.id,
                                                            ),
                                                    )
                                                    .map((c) => (
                                                        <div
                                                            key={c.id}
                                                            onClick={() =>
                                                                setData(
                                                                    'categories',
                                                                    [
                                                                        ...(data.categories ||
                                                                            []),
                                                                        c.id,
                                                                    ],
                                                                )
                                                            }
                                                            className="group mb-1 flex cursor-pointer justify-between rounded-lg p-3 text-sm shadow-sm transition-all hover:bg-white dark:hover:bg-white/10"
                                                        >
                                                            {c.name}
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] opacity-0 group-hover:opacity-100"
                                                            >
                                                                + Añadir
                                                            </Badge>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-400 uppercase">
                                                Seleccionadas
                                            </Label>
                                            <div className="h-64 overflow-y-auto rounded-xl border border-[#c90000]/10 bg-[#c90000]/5 p-2">
                                                {data.categories?.map(
                                                    (id: number) => {
                                                        const c =
                                                            categories.find(
                                                                (cat) =>
                                                                    cat.id ===
                                                                    id,
                                                            );
                                                        return (
                                                            c && (
                                                                <div
                                                                    key={id}
                                                                    onClick={() =>
                                                                        setData(
                                                                            'categories',
                                                                            data.categories.filter(
                                                                                (
                                                                                    catId: number,
                                                                                ) =>
                                                                                    catId !==
                                                                                    id,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className="group mb-1 flex cursor-pointer justify-between rounded-lg border border-[#c90000]/20 bg-white p-3 text-sm shadow-sm transition-all dark:bg-card"
                                                                >
                                                                    <span className="font-bold text-[#c90000]">
                                                                        {c.name}
                                                                    </span>
                                                                    <Badge
                                                                        variant="destructive"
                                                                        className="text-[10px] opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        ✕ Quitar
                                                                    </Badge>
                                                                </div>
                                                            )
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PARENT EVENT / GRID MODE */}
                                <div className="border-t pt-8 dark:border-white/5">
                                    <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
                                        <div className="h-6 w-1.5 rounded-full bg-[#c90000]" />
                                        Modo Paraguas (Eventos Vinculados)
                                    </h3>

                                    <div className="mb-8 flex items-center space-x-4 rounded-2xl border-2 border-[#c90000]/20 bg-[#c90000]/5 p-5">
                                        <Checkbox
                                            id="show_linked_events"
                                            checked={data.show_linked_events}
                                            onCheckedChange={(checked) =>
                                                setData(
                                                    'show_linked_events',
                                                    !!checked,
                                                )
                                            }
                                            className="size-5 border-[#c90000] data-[state=checked]:bg-[#c90000]"
                                        />
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="show_linked_events"
                                                className="cursor-pointer text-base font-black text-[#c90000]"
                                            >
                                                Activar Cuadrícula de
                                                Artistas/Sub-eventos
                                            </Label>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Oculta el sidebar y habilita la
                                                vista de cuadrícula para los
                                                eventos vinculados.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Input
                                            placeholder="Filtrar eventos..."
                                            value={eventSearch}
                                            onChange={(e) =>
                                                setEventSearch(e.target.value)
                                            }
                                            className="max-w-md rounded-xl"
                                        />
                                        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="overflow-hidden rounded-2xl border bg-gray-50 dark:bg-card">
                                                <div className="bg-gray-100 p-3 text-xs font-bold tracking-widest text-gray-500 uppercase dark:bg-white/5">
                                                    Disponibles
                                                </div>
                                                <div className="h-72 overflow-y-auto">
                                                    {filteredEvents.map(
                                                        (ev) => (
                                                            <div
                                                                key={ev.id}
                                                                onClick={() =>
                                                                    setData(
                                                                        'linked_events',
                                                                        [
                                                                            ...(data.linked_events ||
                                                                                []),
                                                                            ev.id,
                                                                        ],
                                                                    )
                                                                }
                                                                className="group flex cursor-pointer flex-col gap-1 border-b p-4 transition-all hover:bg-white dark:border-white/5 dark:hover:bg-white/10"
                                                            >
                                                                <span className="text-sm font-bold group-hover:text-[#c90000]">
                                                                    {ev.title}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">
                                                                    {ev.start_date
                                                                        ? format(
                                                                              new Date(
                                                                                  ev.start_date,
                                                                              ),
                                                                              'dd/MM/yyyy',
                                                                          )
                                                                        : 'S/F'}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                            <div className="overflow-hidden rounded-2xl border border-[#c90000]/20 bg-[#c90000]/5">
                                                <div className="bg-[#c90000]/10 p-3 text-xs font-bold tracking-widest text-[#c90000] uppercase">
                                                    Vinculados (Grid)
                                                </div>
                                                <div className="h-72 overflow-y-auto">
                                                    {data.linked_events?.map(
                                                        (id: number) => {
                                                            const ev =
                                                                allEvents.find(
                                                                    (e) =>
                                                                        e.id ===
                                                                        id,
                                                                );
                                                            return (
                                                                ev && (
                                                                    <div
                                                                        key={id}
                                                                        onClick={() =>
                                                                            setData(
                                                                                'linked_events',
                                                                                data.linked_events.filter(
                                                                                    (
                                                                                        vid: number,
                                                                                    ) =>
                                                                                        vid !==
                                                                                        id,
                                                                                ),
                                                                            )
                                                                        }
                                                                        className="flex cursor-pointer flex-col gap-1 border-b border-[#c90000]/10 bg-white p-4 transition-all hover:bg-red-50 dark:bg-card dark:hover:bg-red-900/10"
                                                                    >
                                                                        <span className="text-sm font-bold text-[#c90000]">
                                                                            {
                                                                                ev.title
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CALENDAR */}
                                <div className="border-t pt-8 dark:border-white/5">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                        <div className="h-6 w-1.5 rounded-full bg-[#c90000]" />
                                        Funciones y Calendario
                                    </h3>

                                    <div className="mb-8 space-y-6">
                                        <div className="flex items-center space-x-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-card">
                                            <Checkbox
                                                id="show_calendar"
                                                checked={data.show_calendar}
                                                onCheckedChange={(checked) =>
                                                    setData(
                                                        'show_calendar',
                                                        !!checked,
                                                    )
                                                }
                                            />
                                            <div
                                                className="grid cursor-pointer gap-1.5 leading-none"
                                                onClick={() =>
                                                    setData(
                                                        'show_calendar',
                                                        !data.show_calendar,
                                                    )
                                                }
                                            >
                                                <label className="cursor-pointer text-sm font-bold">
                                                    Mostrar selector de
                                                    calendario
                                                </label>
                                                <p className="text-xs text-gray-500">
                                                    Obligatorio si hay más de 20
                                                    funciones.
                                                </p>
                                            </div>
                                        </div>

                                        {!data.show_calendar && (
                                            <div className="px-1">
                                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                                    Textos personalizados por
                                                    función (Recuadros de
                                                    Reserva)
                                                </h4>
                                                <p className="text-sm text-gray-500">
                                                    Escribe el título/texto
                                                    corto que aparecerá en el
                                                    recuadro de cada fecha. Ej:
                                                    "Reserva tus boletos" o
                                                    "Función de Estreno".
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {!data.show_calendar && (
                                        <div className="rounded-2xl border border-dashed bg-gray-50 p-8 text-center text-gray-400 dark:bg-card">
                                            Guarda el evento y sincroniza las
                                            funciones para personalizar los
                                            botones.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </form>
                </Tabs>

                {/* Sticky Footer for Actions */}
                <div className="fixed right-0 bottom-0 left-0 z-50 flex justify-end gap-3 border-t border-gray-200 bg-white/80 p-4 px-8 backdrop-blur-md md:left-64 dark:border-border dark:bg-background/80">
                    <div className="mx-auto flex w-full max-w-6xl justify-end gap-3">
                        <Button
                            variant="outline"
                            asChild
                            className="h-11 rounded-xl"
                        >
                            <Link href={route('admin.events.index')}>
                                Descartar
                            </Link>
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="h-11 rounded-xl bg-[#c90000] px-8 font-bold shadow-xl shadow-red-600/20 hover:bg-[#a00000]"
                        >
                            {processing ? 'Creando...' : 'Crear Evento'}
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

import { useState, FormEventHandler, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    PlusCircle,
    Image as ImageIcon,
    Settings2,
    Trash2,
    Link2,
    Edit,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TicketProgressBar from '@/components/TicketProgressBar';

interface ExternalEvent {
    id: number;
    title: string;
    start_date: string | null;
}

interface WelcomeBanner {
    id: number;
    title: string | null;
    is_active: boolean;
    resolved_image: string | null;
    resolved_link: string | null;
    resolved_title: string;
    external_event_id: number | null;
}

interface PostbackUrl {
    id: number;
    name: string;
    url: string;
    is_active: boolean;
}

interface Bank {
    id: number;
    code: string;
    name: string;
    enabled: boolean;
}

interface Props {
    settings: Record<string, string>;
    events: ExternalEvent[];
    banners: WelcomeBanner[];
    postback_urls: PostbackUrl[];
    banks: Bank[];
}

export default function Index({
    settings,
    events,
    banners,
    postback_urls = [],
    banks = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<
        'general' | 'banners' | 'postbacks' | 'banks'
    >('general');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Postback Dialog State
    const [isPostbackDialogOpen, setIsPostbackDialogOpen] = useState(false);
    const [editingPostback, setEditingPostback] = useState<PostbackUrl | null>(
        null,
    );

    // Form for General Settings
    const {
        data: generalData,
        setData: setGeneralData,
        post: postGeneral,
        processing: processingGeneral,
    } = useForm({
        show_featured_events:
            settings.show_featured_events === '1' ||
            settings.show_featured_events === undefined,
        show_nearby_events:
            settings.show_nearby_events === '1' ||
            settings.show_nearby_events === undefined,
        show_floating_banner:
            settings.show_floating_banner === '1' ||
            settings.show_floating_banner === undefined,
        refund_ticket_sample_image: null as File | null,
    });


    // Form for New Banner (Modal)
    const {
        data: bannerData,
        setData: setBannerData,
        post: postBanner,
        processing: processingBanner,
        reset: resetBanner,
        errors,
        progress: progressBanner,
    } = useForm({
        title: '',
        type: 'manual',
        image_file: null as File | null,
        external_link: '',
        external_event_id: '',
        is_active: true,
    });

    // Form for Postback URLs
    const {
        data: pbData,
        setData: setPbData,
        post: postPb,
        put: putPb,
        delete: destroyPb,
        processing: processingPb,
        reset: resetPb,
        errors: pbErrors,
    } = useForm({
        name: '',
        url: '',
        is_active: true,
    });

    const submitGeneral: FormEventHandler = (e) => {
        e.preventDefault();
        postGeneral(route('admin.settings.update'), {
            preserveScroll: true,
            forceFormData: true,
            onError: () =>
                toast.error('Error al guardar configuración general'),
        });
    };


    const submitBanner: FormEventHandler = (e) => {
        e.preventDefault();
        postBanner(route('admin.banners.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsDialogOpen(false);
                resetBanner();
            },
            onError: (err) => {
                console.error(err);
            },
        });
    };

    const deleteBanner = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar este banner?')) {
            router.delete(route('admin.banners.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const openPostbackDialog = (pb?: PostbackUrl) => {
        if (pb) {
            setEditingPostback(pb);
            setPbData({ name: pb.name, url: pb.url, is_active: pb.is_active });
        } else {
            setEditingPostback(null);
            resetPb();
        }
        setIsPostbackDialogOpen(true);
    };

    const submitPostback: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingPostback) {
            putPb(route('admin.postback-urls.update', editingPostback.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsPostbackDialogOpen(false);
                    resetPb();
                },
            });
        } else {
            postPb(route('admin.postback-urls.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsPostbackDialogOpen(false);
                    resetPb();
                },
            });
        }
    };

    const deletePostback = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta URL?')) {
            destroyPb(route('admin.postback-urls.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: route('admin.dashboard') },
                {
                    title: 'Configuración de la Página',
                    href: route('admin.settings.index'),
                },
            ]}
        >
            <Head title="Configuración del Sitio" />

            <div className="mx-auto w-full max-w-5xl p-6">
                {/* Header & Tabs Navigation */}
                <div className="mb-6">
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
                        <Settings2 className="h-8 w-8" /> Configuración del
                        Proyecto
                    </h1>
                    <p className="mt-2 text-gray-500">
                        Gestiona qué elementos están visibles en tu página
                        principal y administra componentes dinámicos.
                    </p>
                </div>

                <div className="mb-8 flex space-x-1 overflow-x-auto border-b border-gray-200 dark:border-border">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                    >
                        Apariencia Principal
                    </button>
                    <button
                        onClick={() => setActiveTab('banners')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'banners' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                    >
                        Tarjetas y Banners Flotantes
                        <Badge
                            variant="secondary"
                            className="ml-1 min-w-5 px-1.5 text-[10px]"
                        >
                            {banners.length}
                        </Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('postbacks')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'postbacks' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                    >
                        Servicio Postback
                        <Badge
                            variant="secondary"
                            className="ml-1 min-w-5 px-1.5 text-[10px]"
                        >
                            {postback_urls.length}
                        </Badge>
                    </button>

                    <button
                        onClick={() => setActiveTab('banks')}
                        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'banks' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                    >
                        Bancos de Reembolsos 🏦
                    </button>
                </div>

                {/* TAB: General Settings */}
                {activeTab === 'general' && (
                    <div className="animate-in duration-200 zoom-in-95 fade-in">
                        <form
                            onSubmit={submitGeneral}
                            className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card"
                        >
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        Activar/Desactivar Componentes de la
                                        Pantalla de Inicio
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        ¿No tienes eventos destacados por ahora?
                                        Simplemente apaga esa sección completa
                                        desde aquí.
                                    </p>
                                </div>

                                <div className="mt-4 grid gap-4">
                                    <div className="flex items-start space-x-3 rounded-lg border bg-gray-50 p-4 transition-colors hover:border-gray-300 dark:bg-muted/50">
                                        <Checkbox
                                            id="show_featured_events"
                                            checked={
                                                generalData.show_featured_events
                                            }
                                            onCheckedChange={(c) =>
                                                setGeneralData(
                                                    'show_featured_events',
                                                    c as boolean,
                                                )
                                            }
                                        />
                                        <div className="mt-0.5 space-y-1 leading-none">
                                            <Label
                                                htmlFor="show_featured_events"
                                                className="cursor-pointer text-base font-medium"
                                            >
                                                Sección "Eventos Destacados"
                                            </Label>
                                            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                                Muestra el carrusel grande
                                                inicial con los eventos que has
                                                marcado con la estrella de
                                                'Destacado'.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3 rounded-lg border bg-gray-50 p-4 transition-colors hover:border-gray-300 dark:bg-muted/50">
                                        <Checkbox
                                            id="show_nearby_events"
                                            checked={
                                                generalData.show_nearby_events
                                            }
                                            onCheckedChange={(c) =>
                                                setGeneralData(
                                                    'show_nearby_events',
                                                    c as boolean,
                                                )
                                            }
                                        />
                                        <div className="mt-0.5 space-y-1 leading-none">
                                            <Label
                                                htmlFor="show_nearby_events"
                                                className="cursor-pointer text-base font-medium"
                                            >
                                                Sección "Eventos Cerca de ti"
                                            </Label>
                                            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                                Pide permiso de localización al
                                                usuario para sugerirle los más
                                                próximos a él.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3 rounded-lg border bg-gray-50 p-4 transition-colors hover:border-gray-300 dark:bg-muted/50">
                                        <Checkbox
                                            id="show_floating_banner"
                                            checked={
                                                generalData.show_floating_banner
                                            }
                                            onCheckedChange={(c) =>
                                                setGeneralData(
                                                    'show_floating_banner',
                                                    c as boolean,
                                                )
                                            }
                                        />
                                        <div className="mt-0.5 space-y-1 leading-none">
                                            <Label
                                                htmlFor="show_floating_banner"
                                                className="cursor-pointer text-base font-medium"
                                            >
                                                Habilitar Sistema de Banners
                                                Flotantes
                                            </Label>
                                            <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                                Si está apagado, se ocultará
                                                completamente la alerta flotante
                                                de la esquina, sin importar
                                                cuántos banners tengas
                                                configurados.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-gray-200 pt-6 dark:border-border">
                                    <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                                        Imagen Guía de Boleto (Reembolsos)
                                    </h3>
                                    <p className="mb-4 text-sm text-gray-500">
                                        Sube una imagen de muestra para guiar a
                                        los usuarios indicando dónde se ubica el
                                        ID del boleto.
                                    </p>
                                    <div className="grid max-w-md gap-4">
                                        {settings.refund_ticket_sample_image && (
                                            <div className="mb-2">
                                                <span className="mb-1 block text-xs font-semibold text-gray-400">
                                                    Imagen actual:
                                                </span>
                                                <img
                                                    src={
                                                        settings.refund_ticket_sample_image
                                                    }
                                                    alt="Boleto Guía"
                                                    className="h-32 rounded-xl border bg-white object-contain p-1 dark:bg-neutral-900"
                                                />
                                            </div>
                                        )}
                                        <Input
                                            id="refund_ticket_sample_image"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                setGeneralData(
                                                    'refund_ticket_sample_image',
                                                    e.target.files
                                                        ? e.target.files[0]
                                                        : null,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-border">
                                <Button
                                    type="submit"
                                    disabled={processingGeneral}
                                >
                                    Actualizar Visibilidad
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB: Banners Manager */}
                {activeTab === 'banners' && (
                    <div className="w-full animate-in duration-200 zoom-in-95 fade-in">
                        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Galería de Banners
                                </h2>
                                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                    Añade varias imágenes/eventos aquí. Cuando
                                    un visitante entre, se mostrará **una al
                                    azar**.
                                </p>
                            </div>

                            <Dialog
                                open={isDialogOpen}
                                onOpenChange={setIsDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button className="shrink-0 gap-2">
                                        <PlusCircle className="h-4 w-4" /> Nuevo
                                        Banner
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="overflow-hidden sm:max-w-[500px]">
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="text-xl">
                                            Añadir Nuevo Banner Flotante
                                        </DialogTitle>
                                    </DialogHeader>

                                    <form
                                        id="bannerForm"
                                        onSubmit={submitBanner}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-4">
                                            {/* Type Selector Styled Like Tabs */}
                                            <div className="my-2 flex w-full items-center justify-between rounded-lg bg-gray-100 p-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setBannerData(
                                                            'type',
                                                            'manual',
                                                        )
                                                    }
                                                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${bannerData.type === 'manual' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                                                >
                                                    Imagen Personalizada
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setBannerData(
                                                            'type',
                                                            'event',
                                                        )
                                                    }
                                                    className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${bannerData.type === 'event' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                                                >
                                                    Asociar Evento
                                                </button>
                                            </div>

                                            {bannerData.type === 'manual' && (
                                                <div className="animate-in space-y-4 duration-300 fade-in slide-in-from-left-4">
                                                    <div>
                                                        <Label className="mb-1.5 block text-sm font-semibold">
                                                            Subir Fotografía
                                                        </Label>
                                                        <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:bg-gray-50">
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                className="mx-auto max-w-[250px] cursor-pointer text-xs"
                                                                onChange={(e) =>
                                                                    setBannerData(
                                                                        'image_file',
                                                                        e.target
                                                                            .files?.[0] ||
                                                                            null,
                                                                    )
                                                                }
                                                            />
                                                            <p className="mt-2 text-xs text-gray-500">
                                                                Formatos: JPG,
                                                                PNG, WEBP (Max:
                                                                5MB)
                                                            </p>
                                                        </div>
                                                        {errors.image_file && (
                                                            <span className="text-xs font-semibold text-red-500">
                                                                {
                                                                    errors.image_file
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label className="mb-1.5 block text-sm font-semibold">
                                                            URL al hacer clic
                                                        </Label>
                                                        <Input
                                                            type="url"
                                                            placeholder="https://pagina.com/comprar"
                                                            value={
                                                                bannerData.external_link
                                                            }
                                                            onChange={(e) =>
                                                                setBannerData(
                                                                    'external_link',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {bannerData.type === 'event' && (
                                                <div className="animate-in space-y-4 duration-300 fade-in slide-in-from-right-4">
                                                    <div>
                                                        <Label className="mb-1.5 block text-sm font-semibold">
                                                            Selecciona un Evento
                                                            Activo
                                                        </Label>
                                                        <Select
                                                            onValueChange={(
                                                                val,
                                                            ) =>
                                                                setBannerData(
                                                                    'external_event_id',
                                                                    val,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Busca y elige..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {events.map(
                                                                    (evt) => (
                                                                        <SelectItem
                                                                            key={
                                                                                evt.id
                                                                            }
                                                                            value={evt.id.toString()}
                                                                        >
                                                                            {
                                                                                evt.title
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.external_event_id && (
                                                            <span className="text-xs font-semibold text-red-500">
                                                                {
                                                                    errors.external_event_id
                                                                }
                                                            </span>
                                                        )}
                                                        <p className="mt-2 rounded-md bg-blue-50 p-3 text-[13px] text-blue-800 text-gray-500">
                                                            Al usar esta opción,
                                                            el banner adoptará
                                                            la imagen, nombre y
                                                            enlaces oficiales
                                                            del evento sin que
                                                            tengas que
                                                            actualizarlo a mano
                                                            nunca.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <TicketProgressBar
                                            show={!!progressBanner}
                                            progress={
                                                progressBanner?.percentage || 0
                                            }
                                            text="Subiendo banner..."
                                        />
                                        <div className="flex w-full items-center justify-between border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={
                                                        bannerData.is_active
                                                    }
                                                    onCheckedChange={(val) =>
                                                        setBannerData(
                                                            'is_active',
                                                            val,
                                                        )
                                                    }
                                                    id="banner_active"
                                                />
                                                <Label htmlFor="banner_active">
                                                    Encendido
                                                </Label>
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={processingBanner}
                                                className="px-8"
                                            >
                                                {processingBanner
                                                    ? 'Guardando...'
                                                    : 'Guardar'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Banners Grid */}
                        {banners && banners.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {banners.map((banner) => (
                                    <div
                                        key={banner.id}
                                        className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-card ${!banner.is_active ? 'opacity-60' : ''}`}
                                    >
                                        <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gray-100">
                                            {banner.resolved_image ? (
                                                <img
                                                    src={banner.resolved_image}
                                                    alt={banner.resolved_title}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <ImageIcon className="h-10 w-10 text-gray-300" />
                                            )}

                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <Badge
                                                    variant={
                                                        banner.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="shadow-sm"
                                                >
                                                    {banner.is_active
                                                        ? 'Activo'
                                                        : 'Pausado'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div
                                            className="flex flex-col justify-between p-4"
                                            style={{ minHeight: '100px' }}
                                        >
                                            <div>
                                                <h3 className="line-clamp-1 font-semibold text-gray-900 dark:text-white">
                                                    {banner.resolved_title}
                                                </h3>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {banner.external_event_id
                                                        ? 'Vinculado a Sistema'
                                                        : 'Carga Manual'}
                                                </p>
                                            </div>

                                            <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() =>
                                                        deleteBanner(banner.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12 dark:bg-card">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="mb-1 text-lg font-medium text-gray-900">
                                    Tu galería está vacía
                                </h3>
                                <p className="mb-6 max-w-sm text-center text-sm text-gray-500">
                                    Comienza agregando tu primer banner flotante
                                    con el botón superior. Podrás agregar tantos
                                    como quieras.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(true)}
                                >
                                    Agregar Primer Banner
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: Postback URLs Manager */}
                {activeTab === 'postbacks' && (
                    <div className="w-full animate-in duration-200 zoom-in-95 fade-in">
                        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Servicio Postback
                                </h2>
                                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                    Administra las URLs para enviar eventos
                                    postback desde el control de accesos.
                                </p>
                            </div>
                            <Button
                                className="shrink-0 gap-2"
                                onClick={() => openPostbackDialog()}
                            >
                                <PlusCircle className="h-4 w-4" /> Nueva URL
                            </Button>
                        </div>

                        {postback_urls && postback_urls.length > 0 ? (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-border dark:bg-card">
                                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-400">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-4"
                                            >
                                                Nombre
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-4"
                                            >
                                                URL
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-4"
                                            >
                                                Estado
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-4 text-right"
                                            >
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {postback_urls.map((pb) => (
                                            <tr
                                                key={pb.id}
                                                className="border-b border-gray-100 bg-white transition-colors hover:bg-gray-50 dark:border-border dark:bg-card dark:hover:bg-muted/50"
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    {pb.name}
                                                </td>
                                                <td className="max-w-sm px-6 py-4 break-all text-gray-500">
                                                    {pb.url}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant={
                                                            pb.is_active
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {pb.is_active
                                                            ? 'Activo'
                                                            : 'Inactivo'}
                                                    </Badge>
                                                </td>
                                                <td className="space-x-2 px-6 py-4 text-right">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            openPostbackDialog(
                                                                pb,
                                                            )
                                                        }
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            deletePostback(
                                                                pb.id,
                                                            )
                                                        }
                                                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12 dark:bg-card">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                                    <Link2 className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="mb-1 text-lg font-medium text-gray-900">
                                    No hay URLs registradas
                                </h3>
                                <p className="mb-6 max-w-sm text-center text-sm text-gray-500">
                                    Comienza agregando tu primera URL de
                                    postback para usarla en los eventos de
                                    control de acceso.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => openPostbackDialog()}
                                >
                                    Agregar Primera URL
                                </Button>
                            </div>
                        )}

                        <Dialog
                            open={isPostbackDialogOpen}
                            onOpenChange={setIsPostbackDialogOpen}
                        >
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingPostback
                                            ? 'Editar URL de Postback'
                                            : 'Nueva URL de Postback'}
                                    </DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={submitPostback}
                                    className="space-y-4 pt-4"
                                >
                                    <div>
                                        <Label htmlFor="pb-name">
                                            Nombre Identificador
                                        </Label>
                                        <Input
                                            id="pb-name"
                                            value={pbData.name}
                                            onChange={(e) =>
                                                setPbData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ej: Zapier Webhook"
                                            required
                                            className="mt-1.5"
                                        />
                                        {pbErrors.name && (
                                            <span className="mt-1 text-xs text-red-500">
                                                {pbErrors.name}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="pb-url">
                                            URL Destino
                                        </Label>
                                        <Input
                                            id="pb-url"
                                            type="url"
                                            value={pbData.url}
                                            onChange={(e) =>
                                                setPbData('url', e.target.value)
                                            }
                                            placeholder="https://..."
                                            required
                                            className="mt-1.5"
                                        />
                                        {pbErrors.url && (
                                            <span className="mt-1 text-xs text-red-500">
                                                {pbErrors.url}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Switch
                                            id="pb-active"
                                            checked={pbData.is_active}
                                            onCheckedChange={(val) =>
                                                setPbData('is_active', val)
                                            }
                                        />
                                        <Label
                                            htmlFor="pb-active"
                                            className="cursor-pointer"
                                        >
                                            URL Activa
                                        </Label>
                                    </div>
                                    <DialogFooter className="pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setIsPostbackDialogOpen(false)
                                            }
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processingPb}
                                        >
                                            Guardar
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}



                {/* TAB: Banks Settings */}
                {activeTab === 'banks' && (
                    <div className="animate-in duration-200 zoom-in-95 fade-in">
                        <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                    Configuración de Bancos (Reembolsos)
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Habilite o deshabilite los prefijos de las
                                    CLABEs interbancarias de 3 dígitos
                                    oficiales. Los bancos deshabilitados no
                                    serán permitidos en el formulario de
                                    captura.
                                </p>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-border">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-500 dark:divide-border dark:text-gray-400">
                                    <thead className="bg-gray-50 font-semibold text-gray-700 dark:bg-muted dark:text-gray-300">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Código CLABE
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3"
                                            >
                                                Nombre del Banco
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-right"
                                            >
                                                Estatus
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-border dark:bg-card">
                                        {banks.map((bank) => (
                                            <tr
                                                key={bank.id}
                                                className="transition-colors hover:bg-gray-50 dark:hover:bg-muted/50"
                                            >
                                                <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">
                                                    {bank.code}
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                    {bank.name}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="inline-flex items-center">
                                                        <Switch
                                                            checked={
                                                                bank.enabled
                                                            }
                                                            onCheckedChange={() => {
                                                                router.post(
                                                                    route(
                                                                        'admin.settings.banks.toggle',
                                                                        bank.id,
                                                                    ),
                                                                    {},
                                                                    {
                                                                        preserveScroll: true,
                                                                        onSuccess:
                                                                            () =>
                                                                                toast.success(
                                                                                    `Estatus de ${bank.name} actualizado.`,
                                                                                ),
                                                                        onError:
                                                                            () =>
                                                                                toast.error(
                                                                                    'Error al actualizar el estatus del banco.',
                                                                                ),
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

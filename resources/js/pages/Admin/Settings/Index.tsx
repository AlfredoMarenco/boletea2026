import { useState, FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Image as ImageIcon, Settings2, Trash2 } from 'lucide-react';
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

interface Props {
    settings: Record<string, string>;
    events: ExternalEvent[];
    banners: WelcomeBanner[];
}

export default function Index({ settings, events, banners }: Props) {
    const [activeTab, setActiveTab] = useState<'general' | 'banners'>('general');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form for General Settings
    const { data: generalData, setData: setGeneralData, post: postGeneral, processing: processingGeneral } = useForm({
        show_featured_events: settings.show_featured_events === '1' || settings.show_featured_events === undefined,
        show_nearby_events: settings.show_nearby_events === '1' || settings.show_nearby_events === undefined,
        show_floating_banner: settings.show_floating_banner === '1' || settings.show_floating_banner === undefined,
    });

    // Form for New Banner (Modal)
    const { data: bannerData, setData: setBannerData, post: postBanner, processing: processingBanner, reset: resetBanner, errors, progress: progressBanner } = useForm({
        title: '',
        type: 'manual',
        image_file: null as File | null,
        external_link: '',
        external_event_id: '',
        is_active: true,
    });

    const submitGeneral: FormEventHandler = (e) => {
        e.preventDefault();
        postGeneral(route('admin.settings.update'), {
            preserveScroll: true,
            forceFormData: true,
            onError: () => toast.error('Error al guardar configuración general')
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
            }
        });
    };

    const deleteBanner = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar este banner?')) {
            router.delete(route('admin.banners.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: route('admin.dashboard') },
            { title: 'Configuración de la Página', href: route('admin.settings.index') },
        ]}>
            <Head title="Configuración del Sitio" />

            <div className="p-6 max-w-5xl mx-auto w-full">
                
                {/* Header & Tabs Navigation */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings2 className="w-8 h-8" /> Configuración del Proyecto
                    </h1>
                    <p className="text-gray-500 mt-2">Gestiona qué elementos están visibles en tu página principal y administra componentes dinámicos.</p>
                </div>

                <div className="flex space-x-1 mb-8 border-b border-gray-200 dark:border-border overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Apariencia Principal
                    </button>
                    <button 
                        onClick={() => setActiveTab('banners')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'banners' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Tarjetas y Banners Flotantes
                        <Badge variant="secondary" className="ml-1 px-1.5 min-w-5 text-[10px]">{banners.length}</Badge>
                    </button>
                </div>

                {/* TAB: General Settings */}
                {activeTab === 'general' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <form onSubmit={submitGeneral} className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-border space-y-6">
                            
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        Activar/Desactivar Componentes de la Pantalla de Inicio
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        ¿No tienes eventos destacados por ahora? Simplemente apaga esa sección completa desde aquí.
                                    </p>
                                </div>

                                <div className="grid gap-4 mt-4">
                                    <div className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50 dark:bg-muted/50 hover:border-gray-300 transition-colors">
                                        <Checkbox
                                            id="show_featured_events"
                                            checked={generalData.show_featured_events}
                                            onCheckedChange={(c) => setGeneralData('show_featured_events', c as boolean)}
                                        />
                                        <div className="space-y-1 leading-none mt-0.5">
                                            <Label htmlFor="show_featured_events" className="text-base font-medium cursor-pointer">
                                                Sección "Eventos Destacados"
                                            </Label>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                                                Muestra el carrusel grande inicial con los eventos que has marcado con la estrella de 'Destacado'.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50 dark:bg-muted/50 hover:border-gray-300 transition-colors">
                                        <Checkbox
                                            id="show_nearby_events"
                                            checked={generalData.show_nearby_events}
                                            onCheckedChange={(c) => setGeneralData('show_nearby_events', c as boolean)}
                                        />
                                        <div className="space-y-1 leading-none mt-0.5">
                                            <Label htmlFor="show_nearby_events" className="text-base font-medium cursor-pointer">
                                                Sección "Eventos Cerca de ti"
                                            </Label>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                                                Pide permiso de localización al usuario para sugerirle los más próximos a él.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50 dark:bg-muted/50 hover:border-gray-300 transition-colors">
                                        <Checkbox
                                            id="show_floating_banner"
                                            checked={generalData.show_floating_banner}
                                            onCheckedChange={(c) => setGeneralData('show_floating_banner', c as boolean)}
                                        />
                                        <div className="space-y-1 leading-none mt-0.5">
                                            <Label htmlFor="show_floating_banner" className="text-base font-medium cursor-pointer">
                                                Habilitar Sistema de Banners Flotantes
                                            </Label>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                                                Si está apagado, se ocultará completamente la alerta flotante de la esquina, sin importar cuántos banners tengas configurados.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-border">
                                <Button type="submit" disabled={processingGeneral}>
                                    Actualizar Visibilidad
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB: Banners Manager */}
                {activeTab === 'banners' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 w-full">
                        
                        <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Galería de Banners</h2>
                                <p className="text-sm text-gray-500 leading-relaxed mt-1">
                                    Añade varias imágenes/eventos aquí. Cuando un visitante entre, se mostrará **una al azar**.
                                </p>
                            </div>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 shrink-0">
                                        <PlusCircle className="w-4 h-4" /> Nuevo Banner
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] overflow-hidden">
                                    <DialogHeader className="mb-4">
                                        <DialogTitle className="text-xl">Añadir Nuevo Banner Flotante</DialogTitle>
                                    </DialogHeader>
                                    
                                    <form id="bannerForm" onSubmit={submitBanner} className="space-y-6">
                                        <div className="space-y-4">
                                            
                                            {/* Type Selector Styled Like Tabs */}
                                            <div className="bg-gray-100 p-1 rounded-lg w-full flex items-center justify-between my-2">
                                                <button type="button" onClick={() => setBannerData('type', 'manual')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${bannerData.type === 'manual' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                                                    Imagen Personalizada
                                                </button>
                                                <button type="button" onClick={() => setBannerData('type', 'event')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${bannerData.type === 'event' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}>
                                                    Asociar Evento
                                                </button>
                                            </div>

                                            {bannerData.type === 'manual' && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                                    <div>
                                                        <Label className="text-sm font-semibold mb-1.5 block">Subir Fotografía</Label>
                                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                                                            <Input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                className="cursor-pointer mx-auto max-w-[250px] text-xs" 
                                                                onChange={(e) => setBannerData('image_file', e.target.files?.[0] || null)}
                                                            />
                                                            <p className="text-xs text-gray-500 mt-2">Formatos: JPG, PNG, WEBP (Max: 5MB)</p>
                                                        </div>
                                                        {errors.image_file && <span className="text-red-500 text-xs font-semibold">{errors.image_file}</span>}
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-semibold mb-1.5 block">URL al hacer clic</Label>
                                                        <Input 
                                                            type="url" 
                                                            placeholder="https://pagina.com/comprar" 
                                                            value={bannerData.external_link} 
                                                            onChange={(e) => setBannerData('external_link', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {bannerData.type === 'event' && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                                    <div>
                                                        <Label className="text-sm font-semibold mb-1.5 block">Selecciona un Evento Activo</Label>
                                                        <Select onValueChange={(val) => setBannerData('external_event_id', val)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Busca y elige..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {events.map((evt) => (
                                                                    <SelectItem key={evt.id} value={evt.id.toString()}>
                                                                        {evt.title}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.external_event_id && <span className="text-red-500 text-xs font-semibold">{errors.external_event_id}</span>}
                                                        <p className="text-[13px] text-gray-500 mt-2 bg-blue-50 text-blue-800 p-3 rounded-md">
                                                            Al usar esta opción, el banner adoptará la imagen, nombre y enlaces oficiales del evento sin que tengas que actualizarlo a mano nunca.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                        <TicketProgressBar show={!!progressBanner} progress={progressBanner?.percentage || 0} text="Subiendo banner..." />
                                        <div className="flex w-full items-center justify-between border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-2">
                                                <Switch checked={bannerData.is_active} onCheckedChange={(val) => setBannerData('is_active', val)} id="banner_active" />
                                                <Label htmlFor="banner_active">Encendido</Label>
                                            </div>
                                            <Button type="submit" disabled={processingBanner} className="px-8">
                                                {processingBanner ? 'Guardando...' : 'Guardar'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Banners Grid */}
                        {banners && banners.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {banners.map((banner) => (
                                    <div key={banner.id} className={`group bg-white dark:bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative ${!banner.is_active ? 'opacity-60' : ''}`}>
                                        <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden flex items-center justify-center">
                                            {banner.resolved_image ? (
                                                <img src={banner.resolved_image} alt={banner.resolved_title} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                                            ) : (
                                                <ImageIcon className="w-10 h-10 text-gray-300" />
                                            )}
                                            
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <Badge variant={banner.is_active ? 'default' : 'secondary'} className="shadow-sm">
                                                    {banner.is_active ? 'Activo' : 'Pausado'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col justify-between" style={{ minHeight: '100px' }}>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{banner.resolved_title}</h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {banner.external_event_id ? 'Vinculado a Sistema' : 'Carga Manual'}
                                                </p>
                                            </div>
                                            
                                            <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteBanner(banner.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-card border border-dashed border-gray-300 rounded-xl">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">Tu galería está vacía</h3>
                                <p className="text-gray-500 text-center max-w-sm mb-6 text-sm">
                                    Comienza agregando tu primer banner flotante con el botón superior. Podrás agregar tantos como quieras.
                                </p>
                                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                                    Agregar Primer Banner
                                </Button>
                            </div>
                        )}
                        
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

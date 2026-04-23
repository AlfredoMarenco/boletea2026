import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useRef } from 'react';
import { Monitor, Smartphone, Mail, Code, Users } from 'lucide-react';

interface Audience {
    id: number;
    name: string;
    contacts_count: number;
}

interface Props {
    audiences: Audience[];
    defaultMessage: string;
}

export default function CampaignForm({ audiences, defaultMessage }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    const { data, setData, processing, errors } = useForm({
        name:                '',
        subject:             'Código de vestimenta – Gala con Causa',
        message:             defaultMessage,
        mailing_audience_id: '',
        event_name:          'Gala con Causa',
        image:               null as File | null,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('image', file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const fd = new FormData();
        fd.append('name', data.name);
        fd.append('subject', data.subject);
        fd.append('message', data.message);
        fd.append('mailing_audience_id', data.mailing_audience_id);
        fd.append('event_name', data.event_name);
        if (data.image) {
            fd.append('image', data.image);
        }

        import('@inertiajs/react').then(({ router }) => {
            router.post(route('admin.mailing.campaigns.store'), fd);
        });
    };

    // Reemplazar variables para la vista previa
    const getPreviewHtml = () => {
        return data.message
            .replace(/\[Nombre\]/g, 'Juan Pérez')
            .replace(/\[Evento\]/g, data.event_name || 'Evento de Prueba')
            .replace(/\[Nombre del Destinatario\]/g, 'Juan Pérez');
    };

    const selectedAudience = audiences.find(a => a.id.toString() === data.mailing_audience_id);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Mailing', href: route('admin.mailing.campaigns.index') },
            { title: 'Campañas', href: route('admin.mailing.campaigns.index') },
            { title: 'Nueva Campaña', href: '#' },
        ]}>
            <Head title="Nueva Campaña de Mailing" />

            <div className="p-6 max-w-full mx-auto">

                {flash?.error && (
                    <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 text-red-800 dark:text-red-300 text-sm">
                        {flash.error}
                    </div>
                )}

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nueva Campaña</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {selectedAudience 
                            ? `Esta campaña se enviará a ${selectedAudience.contacts_count} contactos de la lista "${selectedAudience.name}".`
                            : 'Selecciona una audiencia para comenzar.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    
                    {/* Panel de Configuración (Superior - Full Width) */}
                    <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg p-6 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="f-list">Audiencia Destino (Obligatorio)</Label>
                                <select 
                                    id="f-list"
                                    value={data.mailing_audience_id}
                                    onChange={e => setData('mailing_audience_id', e.target.value)}
                                    className="w-full mt-1 bg-white dark:bg-background border border-gray-200 dark:border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    required
                                >
                                    <option value="">Selecciona quién recibirá este correo...</option>
                                    {audiences.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.contacts_count} contactos)</option>
                                    ))}
                                </select>
                                {errors.mailing_audience_id && <p className="text-red-500 text-xs mt-1">{errors.mailing_audience_id}</p>}
                            </div>

                            <div>
                                <Label htmlFor="f-name">Nombre interno de la campaña</Label>
                                <Input
                                    id="f-name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Ej: Dress Code  Gala Abril 2026"
                                    className="mt-1"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="f-subject">Asunto del correo</Label>
                                <Input
                                    id="f-subject"
                                    value={data.subject}
                                    onChange={e => setData('subject', e.target.value)}
                                    placeholder="Asunto que verá el destinatario"
                                    className="mt-1"
                                    required
                                />
                                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-border/50">
                            <div>
                                <Label htmlFor="f-event">Nombre del evento (Visual)</Label>
                                <Input
                                    id="f-event"
                                    value={data.event_name}
                                    onChange={e => setData('event_name', e.target.value)}
                                    placeholder="Ej: Gala con Causa"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="f-image">Imagen adjunta (opcional)</Label>
                                <input
                                    ref={fileRef}
                                    id="f-image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="block w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 mt-2 border-t border-border justify-end">
                            <Button asChild variant="outline">
                                <Link href={route('admin.mailing.campaigns.index')}>Cancelar</Link>
                            </Button>
                            <Button type="submit" disabled={processing} className="px-8 font-semibold">
                                {processing ? 'Guardando...' : 'Crear campaña y ver resumen'}
                            </Button>
                        </div>
                    </div>

                    {/* Panel de Editor/Preview (Gigante) */}
                    <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg shadow-sm flex flex-col min-h-[800px]">
                        <Tabs defaultValue="editor" className="w-full flex flex-col flex-1">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-gray-50 dark:bg-muted/30">
                                <TabsList className="grid w-[300px] grid-cols-2">
                                    <TabsTrigger value="editor" className="flex items-center gap-2">
                                        <Code className="w-4 h-4" /> Código HTML
                                    </TabsTrigger>
                                    <TabsTrigger value="preview" className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> Vista Previa
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="preview" className="mt-0">
                                    <div className="flex bg-muted rounded-md p-1 gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => setViewMode('desktop')}
                                            className={`p-1 rounded ${viewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                                        >
                                            <Monitor className="w-4 h-4" />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setViewMode('mobile')}
                                            className={`p-1 rounded ${viewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                                        >
                                            <Smartphone className="w-4 h-4" />
                                        </button>
                                    </div>
                                </TabsContent>
                            </div>

                            <TabsContent value="editor" className="flex-1 m-0 p-0 relative">
                                <Textarea
                                    id="f-message"
                                    value={data.message}
                                    onChange={e => setData('message', e.target.value)}
                                    className="w-full h-full min-h-[500px] border-0 rounded-none font-mono text-sm resize-none focus-visible:ring-0 p-4"
                                    placeholder="Pega aquí tu código HTML..."
                                />
                                {errors.message && <p className="text-red-500 text-xs absolute bottom-4 left-4">{errors.message}</p>}
                            </TabsContent>

                            <TabsContent value="preview" className="flex-1 m-0 p-0 bg-gray-50 dark:bg-gray-950 flex justify-center overflow-auto">
                                <div className={`transition-all duration-300 ${viewMode === 'desktop' ? 'w-full h-full' : 'w-[375px] h-[667px] mt-8 bg-white shadow-2xl rounded-xl border border-border overflow-hidden'}`}>
                                    <iframe
                                        title="Preview"
                                        srcDoc={getPreviewHtml()}
                                        className="w-full h-full min-h-[800px] border-0"
                                        sandbox="allow-popups allow-popups-to-escape-sandbox"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

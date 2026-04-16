import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useRef } from 'react';

interface Props {
    totalContacts: number;
    defaultMessage: string;
}

export default function CampaignForm({ totalContacts, defaultMessage }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    const { data, setData, processing, errors } = useForm({
        name:       '',
        subject:    'Código de vestimenta – Gala con Causa',
        message:    defaultMessage,
        event_name: 'Gala con Causa',
        image:      null as File | null,
    });

    const [preview, setPreview] = useState<string | null>(null);
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

        // Usar FormData nativo para manejar el archivo
        const fd = new FormData();
        fd.append('name', data.name);
        fd.append('subject', data.subject);
        fd.append('message', data.message);
        fd.append('event_name', data.event_name);
        if (data.image) {
            fd.append('image', data.image);
        }

        // Inertia router.post con FormData
        import('@inertiajs/react').then(({ router }) => {
            router.post(route('admin.mailing.campaigns.store'), fd);
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Mailing', href: route('admin.mailing.campaigns.index') },
            { title: 'Campañas', href: route('admin.mailing.campaigns.index') },
            { title: 'Nueva Campaña', href: '#' },
        ]}>
            <Head title="Nueva Campaña de Mailing" />

            <div className="p-6 max-w-3xl mx-auto">

                {/* Flash */}
                {flash?.error && (
                    <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 text-red-800 dark:text-red-300 text-sm">
                        {flash.error}
                    </div>
                )}

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nueva Campaña</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Se enviará a <strong>{totalContacts}</strong> contacto{totalContacts !== 1 ? 's' : ''} activo{totalContacts !== 1 ? 's' : ''}.
                    </p>
                </div>

                <form onSubmit={handleSubmit}
                      className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg p-6 space-y-5">

                    {/* Nombre interno */}
                    <div>
                        <Label htmlFor="f-name">Nombre interno de la campaña</Label>
                        <Input
                            id="f-name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Ej: Dress Code – Gala Abril 2026"
                            className="mt-1"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Nombre del evento */}
                    <div>
                        <Label htmlFor="f-event">Nombre del evento</Label>
                        <Input
                            id="f-event"
                            value={data.event_name}
                            onChange={e => setData('event_name', e.target.value)}
                            placeholder="Ej: Gala con Causa"
                            className="mt-1"
                        />
                        {errors.event_name && <p className="text-red-500 text-xs mt-1">{errors.event_name}</p>}
                    </div>

                    {/* Asunto */}
                    <div>
                        <Label htmlFor="f-subject">Asunto del correo</Label>
                        <Input
                            id="f-subject"
                            value={data.subject}
                            onChange={e => setData('subject', e.target.value)}
                            placeholder="Asunto que verá el destinatario"
                            className="mt-1"
                        />
                        {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                    </div>

                    {/* Mensaje */}
                    <div>
                        <Label htmlFor="f-message">Mensaje</Label>
                        <Textarea
                            id="f-message"
                            rows={8}
                            value={data.message}
                            onChange={e => setData('message', e.target.value)}
                            className="mt-1 font-mono text-sm"
                        />
                        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                    </div>

                    {/* Imagen */}
                    <div>
                        <Label htmlFor="f-image">Imagen del código de vestimenta (adjunto)</Label>
                        <p className="text-xs text-gray-500 mt-0.5 mb-2">
                            Se adjuntará al correo y se mostrará en el cuerpo del mismo. Formatos: JPG, PNG, WEBP · Máx 10 MB.
                        </p>
                        <input
                            ref={fileRef}
                            id="f-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                        />
                        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}

                        {preview && (
                            <div className="mt-3 relative inline-block">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="max-h-64 rounded-lg border border-gray-200 dark:border-border object-contain"
                                />
                                <button
                                    type="button"
                                    onClick={() => { setPreview(null); setData('image', null); if (fileRef.current) fileRef.current.value = ''; }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing} className="flex-1">
                            {processing ? 'Guardando…' : 'Guardar campaña como borrador'}
                        </Button>
                        <Button asChild variant="ghost">
                            <Link href={route('admin.mailing.campaigns.index')}>Cancelar</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

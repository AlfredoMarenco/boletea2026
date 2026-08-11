import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Trash, Image as ImageIcon, Copy } from 'lucide-react';

interface Image {
    id: number;
    url: string;
    created_at: string;
}

interface Props {
    images: Image[];
}

export default function Index({ images }: Props) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            await axios.post(route('admin.images.store'), formData, {
                headers: { Accept: 'application/json' },
            });
            router.reload({ only: ['images'] });
        } catch (error: any) {
            console.error(
                'Error uploading image:',
                error.response?.data || error,
            );
            let msg =
                error.response?.data?.message ||
                error.message ||
                'Error desconocido';
            if (error.response?.data?.errors?.image) {
                msg = error.response.data.errors.image[0];
            }
            alert('Error al subir: ' + msg);
        } finally {
            setUploading(false);
            if (event.target) {
                event.target.value = ''; // reset file input
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (
            !confirm(
                '¿Seguro que deseas eliminar esta imagen para siempre? Si está vinculada a un evento, dejará de verse.',
            )
        )
            return;

        try {
            await axios.delete(route('admin.images.destroy', id), {
                headers: { Accept: 'application/json' },
            });
            router.reload({ only: ['images'] });
        } catch (error: any) {
            console.error(
                'Error deleting image:',
                error.response?.data || error,
            );
            const msg =
                error.response?.data?.message ||
                error.message ||
                'Error desconocido';
            alert('Error al eliminar: ' + msg);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(window.location.origin + url);
        alert('URL copiada al portapapeles');
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Multimedia', href: '#' }]}>
            <Head title="Biblioteca de Medios" />

            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center text-2xl font-bold text-gray-800 dark:text-gray-100">
                            <ImageIcon className="mr-2 h-6 w-6" />
                            Biblioteca de Medios
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Administra todas las imágenes subidas al sistema.
                            Estas imágenes pueden ser reutilizadas en eventos y
                            puntos de venta.
                        </p>
                    </div>

                    <div className="relative mt-4 sm:mt-0">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            className="hidden"
                            id="global-upload"
                            disabled={uploading}
                        />
                        <label htmlFor="global-upload">
                            <Button
                                variant="default"
                                asChild
                                disabled={uploading}
                            >
                                <span>
                                    {uploading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="mr-2 h-4 w-4" />
                                    )}
                                    Subir Nueva Imagen
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-border dark:bg-background">
                    {images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {images.map((img) => (
                                <div
                                    key={img.id}
                                    className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-all hover:shadow-md dark:border-border dark:bg-card"
                                >
                                    <div className="aspect-square overflow-hidden border-b border-gray-100 bg-gray-100 dark:border-border dark:bg-background">
                                        <a
                                            href={img.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <img
                                                src={img.url}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                alt="Library item"
                                                loading="lazy"
                                            />
                                        </a>
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-2 dark:bg-card">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-xs"
                                            onClick={() =>
                                                copyToClipboard(img.url)
                                            }
                                            title="Copiar URL"
                                        >
                                            <Copy className="mr-1 h-3.5 w-3.5" />{' '}
                                            URL
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                            onClick={() => handleDelete(img.id)}
                                            title="Eliminar"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center text-gray-500 dark:text-muted-foreground">
                            <ImageIcon className="mx-auto mb-4 h-12 w-12 opacity-20" />
                            <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-gray-100">
                                Biblioteca vacía
                            </h3>
                            <p>No has subido ninguna imagen todavía.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

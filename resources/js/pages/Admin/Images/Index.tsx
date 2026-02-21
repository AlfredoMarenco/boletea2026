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
                headers: { 'Accept': 'application/json' }
            });
            router.reload({ only: ['images'] });
        } catch (error: any) {
            console.error('Error uploading image:', error.response?.data || error);
            let msg = error.response?.data?.message || error.message || 'Error desconocido';
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
        if (!confirm('¿Seguro que deseas eliminar esta imagen para siempre? Si está vinculada a un evento, dejará de verse.')) return;

        try {
            await axios.delete(route('admin.images.destroy', id), {
                headers: { 'Accept': 'application/json' }
            });
            router.reload({ only: ['images'] });
        } catch (error: any) {
            console.error('Error deleting image:', error.response?.data || error);
            const msg = error.response?.data?.message || error.message || 'Error desconocido';
            alert('Error al eliminar: ' + msg);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(window.location.origin + url);
        alert('URL copiada al portapapeles');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Multimedia', href: '#' }
        ]}>
            <Head title="Biblioteca de Medios" />

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <ImageIcon className="w-6 h-6 mr-2" />
                            Biblioteca de Medios
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Administra todas las imágenes subidas al sistema. Estas imágenes pueden ser reutilizadas en eventos y puntos de venta.
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
                            <Button variant="default" asChild disabled={uploading}>
                                <span>
                                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                    Subir Nueva Imagen
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-700 p-6">
                    {images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {images.map((img) => (
                                <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
                                    <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                                        <a href={img.url} target="_blank" rel="noreferrer">
                                            <img
                                                src={img.url}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                alt="Library item"
                                                loading="lazy"
                                            />
                                        </a>
                                    </div>
                                    <div className="p-2 flex justify-between items-center bg-white dark:bg-gray-800">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs px-2"
                                            onClick={() => copyToClipboard(img.url)}
                                            title="Copiar URL"
                                        >
                                            <Copy className="w-3.5 h-3.5 mr-1" /> URL
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => handleDelete(img.id)}
                                            title="Eliminar"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Biblioteca vacía</h3>
                            <p>No has subido ninguna imagen todavía.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

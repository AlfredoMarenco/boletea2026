import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Upload, Trash, Image as ImageIcon } from 'lucide-react';
import { route } from 'ziggy-js';

interface Image {
    id: number;
    url: string;
}

interface ImageLibraryProps {
    onSelect: (url: string) => void;
    currentImage?: string | null;
    triggerText?: string;
}

export default function ImageLibrary({ onSelect, currentImage, triggerText = "Seleccionar de la Biblioteca" }: ImageLibraryProps) {
    const [images, setImages] = useState<Image[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [open, setOpen] = useState(false);

    const loadImages = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.images.index'), {
                headers: { 'Accept': 'application/json' }
            });
            setImages(response.data);
        } catch (error) {
            console.error('Error loading images:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadImages();
        }
    }, [open]);

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
            loadImages();
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
        if (!confirm('¿Seguro que deseas eliminar esta imagen?')) return;

        try {
            await axios.delete(route('admin.images.destroy', id), {
                headers: { 'Accept': 'application/json' }
            });
            loadImages();
        } catch (error: any) {
            console.error('Error deleting image:', error.response?.data || error);
            const msg = error.response?.data?.message || error.message || 'Error desconocido';
            alert('Error al eliminar: ' + msg);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" type="button" className="w-full">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {triggerText}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Biblioteca de Imágenes</DialogTitle>
                </DialogHeader>

                <div className="flex justify-between items-center py-4 border-b">
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            className="hidden"
                            id="library-upload"
                            disabled={uploading}
                        />
                        <label htmlFor="library-upload">
                            <Button variant="default" asChild disabled={uploading}>
                                <span>
                                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                    Subir Nueva Imagen
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map((img) => (
                                <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-gray-50 border-gray-200">
                                    <div
                                        className="aspect-square cursor-pointer overflow-hidden bg-gray-100"
                                        onClick={() => {
                                            onSelect(img.url);
                                            setOpen(false);
                                        }}
                                    >
                                        <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Library item" />
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No hay imágenes en la biblioteca.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

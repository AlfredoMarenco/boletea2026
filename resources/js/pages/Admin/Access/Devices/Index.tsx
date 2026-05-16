import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Upload, Smartphone } from 'lucide-react';
import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import TicketProgressBar from '@/components/TicketProgressBar';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
}

interface AccessDevice {
    id: number;
    name: string;
    device_identifier: string;
    api_token: string | null;
    status: 'active' | 'inactive';
    last_sync_at: string | null;
}

interface Props {
    devices: PaginatedData<AccessDevice>;
}

export default function Index({ devices }: Props) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Dispositivos de Acceso', href: route('admin.access.devices.index') }]}>
            <Head title="Dispositivos Zebra" />

            <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Dispositivos (Scanners Zebra)
                        </h1>
                        <p className="text-sm text-gray-500">Gestión de dispositivos autorizados para escaneo</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <ApkManagerDialog />
                        <Button asChild variant="default">
                            <Link href={route('admin.access.devices.create')}>Registrar Dispositivo</Link>
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-md shadow overflow-hidden dark:bg-background border border-gray-200 dark:border-border flex flex-col">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Identificador (MAC/UUID)</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Última Sincronización</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {devices.data && devices.data.length > 0 ? (
                                    devices.data.map((device) => (
                                        <TableRow key={device.id}>
                                            <TableCell>{device.id}</TableCell>
                                            <TableCell className="font-medium">{device.name}</TableCell>
                                            <TableCell><code>{device.device_identifier}</code></TableCell>
                                            <TableCell>
                                                <Badge variant={device.status === 'active' ? 'default' : 'secondary'}>
                                                    {device.status === 'active' ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{device.last_sync_at ? new Date(device.last_sync_at).toLocaleString() : 'Nunca'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <PairDialog device={device} />
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => router.post(route('admin.access.devices.toggle', device.id))}
                                                    >
                                                        {device.status === 'active' ? 'Desactivar' : 'Activar'}
                                                    </Button>
                                                    <Button asChild size="sm" variant="ghost">
                                                        <Link href={route('admin.access.devices.edit', device.id)}>
                                                            Editar
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            if (confirm('¿Estás seguro de que deseas eliminar este dispositivo?')) {
                                                                router.delete(route('admin.access.devices.destroy', device.id));
                                                            }
                                                        }}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            No hay dispositivos registrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {devices.total > 0 && (
                        <div className="p-4 border-t border-gray-200 dark:border-border flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Mostrando {devices.from} a {devices.to} de {devices.total} resultados
                            </div>
                            <div className="flex gap-1">
                                {devices.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`px-3 py-1 text-sm rounded-md transition-colors ${link.active
                                                ? 'bg-primary text-primary-foreground font-medium'
                                                : 'hover:bg-accent text-foreground'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="px-3 py-1 text-sm text-gray-400"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function PairDialog({ device }: { device: AccessDevice }) {
    const [copied, setCopied] = useState(false);
    
    // The payload for the app to scan
    const configPayload = JSON.stringify({
        server_url: window.location.origin,
        device_identifier: device.device_identifier,
        api_token: device.api_token
    });

    const copyToClipboard = () => {
        if (device.api_token) {
            navigator.clipboard.writeText(device.api_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                    <QrCode className="size-4" />
                    Vincular
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">Vincular Scanner</DialogTitle>
                    <DialogDescription className="text-center">
                        Escanea este código desde la App BoleteAccessos para auto-configurar el dispositivo.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-4 space-y-6 overflow-hidden">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                        <QRCodeSVG 
                            value={configPayload} 
                            size={Math.min(window.innerWidth * 0.6, 200)} 
                            level="H" 
                            includeMargin={true} 
                            className="max-w-full h-auto"
                        />
                    </div>
                    
                    <div className="w-full space-y-3">
                        <div className="p-3 bg-muted rounded-lg flex items-center justify-between border border-border min-w-0">
                            <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                                <span className="text-[10px] uppercase font-bold text-gray-500">API TOKEN</span>
                                <span className="text-sm font-mono truncate pr-2" title={device.api_token || ''}>
                                    {device.api_token || 'N/A'}
                                </span>
                            </div>
                            <Button size="icon" variant="ghost" className="shrink-0" onClick={copyToClipboard}>
                                {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                            </Button>
                        </div>
                        
                        <div className="p-3 bg-muted rounded-lg flex items-center justify-between border border-border min-w-0">
                            <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                                <span className="text-[10px] uppercase font-bold text-gray-500">IDENTIFIER</span>
                                <span className="text-sm font-mono truncate" title={device.device_identifier}>
                                    {device.device_identifier}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ApkManagerDialog() {
    const { data, setData, post, processing, errors, reset, progress } = useForm({
        apk: null as File | null,
        version_name: '',
        version_code: '',
        description: '',
        force_update: false,
    });
    
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const downloadUrl = route('scanner.download');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.access.apk.upload'), {
            forceFormData: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                    <Smartphone className="size-4" />
                    Actualizar App Scanner
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Gestión de App Scanner (APK)</DialogTitle>
                    <DialogDescription>
                        Sube una nueva versión de la aplicación para los dispositivos Zebra.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid md:grid-cols-5 gap-6 py-4">
                    {/* Sección de Descarga */}
                    <div className="flex flex-col items-center space-y-4 p-4 border rounded-xl bg-slate-50 dark:bg-slate-900 md:col-span-2">
                        <h3 className="font-semibold text-sm text-slate-500 uppercase">Descargar / Instalar</h3>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            <QRCodeSVG 
                                value={downloadUrl} 
                                size={150} 
                                level="M" 
                            />
                        </div>
                        <p className="text-xs text-center text-slate-500 px-2">
                            Escanea este código con el dispositivo Zebra para descargar la última versión del APK.
                        </p>
                        <Button variant="secondary" size="sm" asChild className="w-full">
                            <a href={downloadUrl} download>
                                Descargar APK Directo
                            </a>
                        </Button>
                    </div>

                    {/* Sección de Subida */}
                    <div className="flex flex-col space-y-4 p-4 border rounded-xl md:col-span-3">
                        <h3 className="font-semibold text-sm text-slate-500 uppercase">Subir Nueva Versión</h3>
                        <form onSubmit={submit} className="flex flex-col flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre de Versión (Ej: 1.0.5)</label>
                                    <input
                                        type="text"
                                        required
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.version_name}
                                        onChange={(e) => setData('version_name', e.target.value)}
                                        placeholder="1.0.5"
                                    />
                                    {errors.version_name && <p className="text-xs text-red-500">{errors.version_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Código de Versión (Ej: 5)</label>
                                    <input
                                        type="number"
                                        required
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.version_code}
                                        onChange={(e) => setData('version_code', e.target.value)}
                                        placeholder="5"
                                    />
                                    {errors.version_code && <p className="text-xs text-red-500">{errors.version_code}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Descripción de Cambios</label>
                                <textarea
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="- Corrección de errores\n- Mejoras en escaneo"
                                />
                                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="force_update"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={data.force_update}
                                    onChange={(e) => setData('force_update', e.target.checked)}
                                />
                                <label htmlFor="force_update" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Forzar actualización
                                </label>
                                {errors.force_update && <p className="text-xs text-red-500">{errors.force_update}</p>}
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium">Archivo .apk</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".apk"
                                    className="hidden"
                                    onChange={(e) => setData('apk', e.target.files?.[0] || null)}
                                />
                                <div 
                                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${data.apk ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className={`size-8 mx-auto mb-2 ${data.apk ? 'text-primary' : 'text-slate-400'}`} />
                                    <p className="text-sm font-medium truncate">
                                        {data.apk ? data.apk.name : 'Seleccionar APK'}
                                    </p>
                                </div>
                                {errors.apk && <p className="text-xs text-red-500">{errors.apk}</p>}
                            </div>

                            <TicketProgressBar show={!!progress} progress={progress?.percentage || 0} text="Subiendo APK..." />

                            <Button type="submit" disabled={!data.apk || processing || !data.version_name || !data.version_code} className="w-full mt-auto">
                                {processing ? 'Subiendo...' : 'Publicar Versión'}
                            </Button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

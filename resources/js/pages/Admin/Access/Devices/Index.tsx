import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check } from 'lucide-react';
import { useState } from 'react';
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

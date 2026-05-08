import AppLayout from '@/layouts/app-layout';
import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, CheckCircle2, XCircle, Clock, Smartphone } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Props {
    event: {
        id: number;
        name: string;
    };
    stats: {
        total: number;
        used: number;
        pending: number;
        logs_count: number;
        recent_logs: any[];
    };
}

export default function Stats({ event, stats }: Props) {
    const { data, setData, post, processing } = useForm({
        file: null as File | null,
    });

    const percentUsed = stats.total > 0 ? (stats.used / stats.total) * 100 : 0;

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.access.events.import', event.id), {
            onSuccess: () => setData('file', null),
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Control de Acceso', href: route('admin.access.events.index') },
            { title: event.name, href: '#' },
            { title: 'Estadísticas', href: '#' }
        ]}>
            <Head title={`Estadísticas - ${event.name}`} />

            <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            {event.name}
                        </h1>
                        <p className="text-gray-500">Monitorización de acceso en tiempo real</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={route('admin.access.events.devices', event.id)}>
                                Puertas y Dispositivos
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={route('admin.access.events.logs', event.id)}>
                                Reporte de Escaneos
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={route('admin.access.events.codes', event.id)}>
                                Ver Listado de Códigos
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Códigos</p>
                        <p className="text-3xl font-black">{stats.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Escaneados OK</p>
                        <p className="text-3xl font-black text-green-600">{stats.used.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Pendientes</p>
                        <p className="text-3xl font-black text-blue-600">{stats.pending.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Total Intentos</p>
                        <p className="text-3xl font-black text-purple-600">{stats.logs_count.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Progress and Import */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <h3 className="font-bold mb-4">Progreso de Entrada</h3>
                            <div className="space-y-2">
                                <Progress value={percentUsed} className="h-4 bg-gray-100" />
                                <div className="flex justify-between text-sm font-medium">
                                    <span>{percentUsed.toFixed(1)}% Completo</span>
                                    <span>{stats.used} / {stats.total}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1a1c20] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Upload className="size-4 text-primary" />
                                    Cargar Base de Datos
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <form onSubmit={handleImport} className="space-y-4">
                                    <div 
                                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative group ${
                                            data.file ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                        }`}
                                    >
                                        <input 
                                            type="file" 
                                            accept=".csv,.txt"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                        />
                                        <div className="space-y-3">
                                            <div className={`size-12 mx-auto rounded-full flex items-center justify-center transition-colors ${
                                                data.file ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                                            }`}>
                                                <Download className="size-6" />
                                            </div>
                                            <div>
                                                {data.file ? (
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-primary truncate px-4">{data.file.name}</p>
                                                        <p className="text-[10px] text-primary/60 uppercase font-bold">Archivo listo</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-gray-600">Haz clic o arrastra tu CSV</p>
                                                        <p className="text-xs text-gray-400">Formatos permitidos: .csv, .txt</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={!data.file || processing} className="w-full h-12 text-md font-bold shadow-lg shadow-primary/20">
                                        {processing ? (
                                            <span className="flex items-center gap-2">
                                                <Clock className="size-4 animate-spin" /> Procesando...
                                            </span>
                                        ) : 'Comenzar Importación'}
                                    </Button>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                                            <strong>Nota:</strong> El CSV debe contener el código en la primera columna. Se detectará automáticamente la sección y el titular si están presentes.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Right: Recent Activity */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-[#1a1c20] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Clock className="size-4" />
                                Actividad Reciente
                            </h3>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 dark:bg-white/5">
                                        <TableHead className="w-[120px]">Tiempo / Scanner</TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead className="w-[100px]">Resultado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.recent_logs.length > 0 ? (
                                        stats.recent_logs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold">
                                                            {new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-[9px] text-gray-500 uppercase truncate max-w-[80px]" title={log.device?.name}>
                                                            <Smartphone className="size-2" />
                                                            {log.device?.name || 'Scanner'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-[11px] font-black tracking-tight truncate max-w-[100px] block" title={log.scanned_code}>
                                                        {log.scanned_code}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {log.result === 'success' ? (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-1.5 h-5 text-[10px] gap-1">
                                                            <CheckCircle2 className="size-2.5" /> OK
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="px-1.5 h-5 text-[10px] gap-1">
                                                            <XCircle className="size-2.5" /> {log.result === 'invalid_zone' ? 'Zona' : log.result}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-gray-400 italic">
                                                Esperando escaneos...
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

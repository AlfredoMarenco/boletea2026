import AppLayout from '@/layouts/app-layout';
import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Upload,
    Download,
    CheckCircle2,
    XCircle,
    Clock,
    Smartphone,
} from 'lucide-react';
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
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Control de Acceso',
                    href: route('admin.access.events.index'),
                },
                { title: event.name, href: '#' },
                { title: 'Estadísticas', href: '#' },
            ]}
        >
            <Head title={`Estadísticas - ${event.name}`} />

            <div className="mx-auto max-w-6xl space-y-8 p-6 pb-20">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                            {event.name}
                        </h1>
                        <p className="text-gray-500">
                            Monitorización de acceso en tiempo real
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'admin.access.events.devices',
                                    event.id,
                                )}
                            >
                                Puertas y Dispositivos
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'admin.access.events.logs',
                                    event.id,
                                )}
                            >
                                Reporte de Escaneos
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                            <Link
                                href={route(
                                    'admin.access.events.postback-logs',
                                    event.id,
                                )}
                            >
                                Logs de Postback
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'admin.access.events.codes',
                                    event.id,
                                )}
                            >
                                Ver Listado de Códigos
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                        <p className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                            Total Códigos
                        </p>
                        <p className="text-3xl font-black">
                            {stats.total.toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                        <p className="mb-1 text-xs font-bold tracking-wider text-green-500 uppercase">
                            Escaneados OK
                        </p>
                        <p className="text-3xl font-black text-green-600">
                            {stats.used.toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                        <p className="mb-1 text-xs font-bold tracking-wider text-blue-500 uppercase">
                            Pendientes
                        </p>
                        <p className="text-3xl font-black text-blue-600">
                            {stats.pending.toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                        <p className="mb-1 text-xs font-bold tracking-wider text-purple-500 uppercase">
                            Total Intentos
                        </p>
                        <p className="text-3xl font-black text-purple-600">
                            {stats.logs_count.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left: Progress and Import */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                            <h3 className="mb-4 font-bold">
                                Progreso de Entrada
                            </h3>
                            <div className="space-y-2">
                                <Progress
                                    value={percentUsed}
                                    className="h-4 bg-gray-100"
                                />
                                <div className="flex justify-between text-sm font-medium">
                                    <span>
                                        {percentUsed.toFixed(1)}% Completo
                                    </span>
                                    <span>
                                        {stats.used} / {stats.total}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                            <div className="border-b border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-white/5">
                                <h3 className="flex items-center gap-2 font-bold">
                                    <Upload className="size-4 text-primary" />
                                    Cargar Base de Datos
                                </h3>
                            </div>
                            <div className="space-y-4 p-6">
                                <form
                                    onSubmit={handleImport}
                                    className="space-y-4"
                                >
                                    <div
                                        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                                            data.file
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="file"
                                            accept=".csv,.txt"
                                            className="absolute inset-0 cursor-pointer opacity-0"
                                            onChange={(e) =>
                                                setData(
                                                    'file',
                                                    e.target.files?.[0] || null,
                                                )
                                            }
                                        />
                                        <div className="space-y-3">
                                            <div
                                                className={`mx-auto flex size-12 items-center justify-center rounded-full transition-colors ${
                                                    data.file
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                                                }`}
                                            >
                                                <Download className="size-6" />
                                            </div>
                                            <div>
                                                {data.file ? (
                                                    <div className="space-y-1">
                                                        <p className="truncate px-4 text-sm font-bold text-primary">
                                                            {data.file.name}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-primary/60 uppercase">
                                                            Archivo listo
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-gray-600">
                                                            Haz clic o arrastra
                                                            tu CSV
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Formatos permitidos:
                                                            .csv, .txt
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={!data.file || processing}
                                        className="text-md h-12 w-full font-bold shadow-lg shadow-primary/20"
                                    >
                                        {processing ? (
                                            <span className="flex items-center gap-2">
                                                <Clock className="size-4 animate-spin" />{' '}
                                                Procesando...
                                            </span>
                                        ) : (
                                            'Comenzar Importación'
                                        )}
                                    </Button>
                                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-900/20">
                                        <p className="text-[10px] leading-relaxed font-medium text-amber-700 dark:text-amber-400">
                                            <strong>Nota:</strong> El CSV debe
                                            contener el código en la primera
                                            columna. Se detectará
                                            automáticamente la sección y el
                                            titular si están presentes.
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Right: Recent Activity */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1a1c20]">
                            <h3 className="mb-4 flex items-center gap-2 font-bold">
                                <Clock className="size-4" />
                                Actividad Reciente
                            </h3>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 dark:bg-white/5">
                                        <TableHead className="w-[120px]">
                                            Tiempo / Scanner
                                        </TableHead>
                                        <TableHead>Código</TableHead>
                                        <TableHead className="w-[100px]">
                                            Resultado
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.recent_logs.length > 0 ? (
                                        stats.recent_logs.map((log) => (
                                            <TableRow
                                                key={log.id}
                                                className="transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                                            >
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold">
                                                            {new Date(
                                                                log.scanned_at,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                        <div
                                                            className="flex max-w-[80px] items-center gap-1 truncate text-[9px] text-gray-500 uppercase"
                                                            title={
                                                                log.device?.name
                                                            }
                                                        >
                                                            <Smartphone className="size-2" />
                                                            {log.device?.name ||
                                                                'Scanner'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className="block max-w-[100px] truncate font-mono text-[11px] font-black tracking-tight"
                                                        title={log.scanned_code}
                                                    >
                                                        {log.scanned_code}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {log.result ===
                                                    'success' ? (
                                                        <Badge className="h-5 gap-1 border-none bg-green-100 px-1.5 text-[10px] text-green-700 hover:bg-green-100">
                                                            <CheckCircle2 className="size-2.5" />{' '}
                                                            OK
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="destructive"
                                                            className="h-5 gap-1 px-1.5 text-[10px]"
                                                        >
                                                            <XCircle className="size-2.5" />{' '}
                                                            {log.result ===
                                                            'invalid_zone'
                                                                ? 'Zona'
                                                                : log.result}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="py-4 text-center text-gray-400 italic"
                                            >
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

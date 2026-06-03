import AppLayout from '@/layouts/app-layout';
import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Trash2,
    MoreHorizontal,
    Check,
    X,
    Clock,
    Plus,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Filter,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

interface AccessCode {
    id: number;
    code: string;
    type: string | null;
    status: 'pending' | 'used' | 'cancelled';
    scanned_at: string | null;
    metadata: any;
}

interface Props {
    event: {
        id: number;
        name: string;
    };
    codes: PaginatedData<AccessCode>;
    types: string[];
    filters: {
        search?: string | null;
        status?: string | null;
        type?: string | null;
        sort_by?: string | null;
        sort_order?: string | null;
    };
}

export default function Codes({ event, codes, types, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        code: '',
        type: 'General',
        owner: '',
        details: '',
        row: '',
        seat: '',
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get(
                    route('admin.access.events.codes', event.id),
                    {
                        ...filters,
                        search: searchQuery,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, filters?.search]);

    const handleSort = (field: string) => {
        let order = 'asc';
        if (filters.sort_by === field && filters.sort_order === 'asc') {
            order = 'desc';
        }
        router.get(
            route('admin.access.events.codes', event.id),
            {
                ...filters,
                sort_by: field,
                sort_order: order,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleFilterChange = (key: string, value: string | null) => {
        router.get(
            route('admin.access.events.codes', event.id),
            {
                ...filters,
                [key]: value === 'all' ? null : value,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const renderSortableHeader = (
        label: string,
        field: string,
        className?: string,
    ) => {
        const isSorted = filters.sort_by === field;
        const isAsc = filters.sort_order === 'asc';

        return (
            <TableHead
                className={`group cursor-pointer transition-colors select-none hover:text-foreground ${className || ''}`}
                onClick={() => handleSort(field)}
            >
                <div className="flex items-center gap-1.5">
                    <span>{label}</span>
                    {isSorted ? (
                        isAsc ? (
                            <ArrowUp className="size-3.5 text-primary" />
                        ) : (
                            <ArrowDown className="size-3.5 text-primary" />
                        )
                    ) : (
                        <ArrowUpDown className="size-3.5 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
                    )}
                </div>
            </TableHead>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'used':
                return (
                    <Badge
                        variant="default"
                        className="border-none bg-green-100 text-green-700 hover:bg-green-100"
                    >
                        Escaneado
                    </Badge>
                );
            case 'cancelled':
                return <Badge variant="destructive">Cancelado</Badge>;
            default:
                return <Badge variant="secondary">Pendiente</Badge>;
        }
    };

    const deleteCode = (codeId: number) => {
        if (confirm('¿Estás seguro de eliminar este código?')) {
            router.delete(
                route('admin.access.events.codes.delete', [event.id, codeId]),
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const updateStatus = (codeId: number, status: string) => {
        router.patch(
            route('admin.access.events.codes.status', [event.id, codeId]),
            { status },
            {
                preserveScroll: true,
            },
        );
    };

    const clearAll = () => {
        router.delete(route('admin.access.events.clear', event.id), {
            preserveScroll: true,
        });
    };

    const submitAddCode = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.access.events.codes.store', event.id), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
            },
            preserveScroll: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Control de Acceso',
                    href: route('admin.access.events.index'),
                },
                {
                    title: event.name,
                    href: route('admin.access.events.stats', event.id),
                },
                { title: 'Códigos', href: '#' },
            ]}
        >
            <Head title={`Códigos - ${event.name}`} />

            <div className="p-6">
                <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Códigos: {event.name}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Lista completa de códigos cargados
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-full lg:w-64">
                            <Input
                                type="text"
                                placeholder="Buscar código..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'admin.access.events.logs',
                                    event.id,
                                )}
                            >
                                Reporte
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'admin.access.events.devices',
                                    event.id,
                                )}
                            >
                                Puertas
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link
                                href={route(
                                    'admin.access.events.stats',
                                    event.id,
                                )}
                            >
                                Volver a Estadísticas
                            </Link>
                        </Button>

                        <Dialog
                            open={isAddModalOpen}
                            onOpenChange={setIsAddModalOpen}
                        >
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-primary">
                                    <Plus className="size-4" />
                                    Añadir Código
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>
                                        Añadir Código Individual
                                    </DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={submitAddCode}
                                    className="space-y-4 py-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Código / Barcode
                                            </label>
                                            <Input
                                                value={data.code}
                                                onChange={(e) =>
                                                    setData(
                                                        'code',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Ej. 05555519166..."
                                                required
                                            />
                                            {errors.code && (
                                                <p className="text-xs text-red-500">
                                                    {errors.code}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Categoría (Resultado)
                                            </label>
                                            <Input
                                                value={data.type}
                                                onChange={(e) =>
                                                    setData(
                                                        'type',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Ej. General, VIP..."
                                                required
                                            />
                                            {errors.type && (
                                                <p className="text-xs text-red-500">
                                                    {errors.type}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Propietario / Nombre
                                        </label>
                                        <Input
                                            value={data.owner}
                                            onChange={(e) =>
                                                setData('owner', e.target.value)
                                            }
                                            placeholder="Nombre del cliente"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Detalles (Sección/Puerta)
                                        </label>
                                        <Input
                                            value={data.details}
                                            onChange={(e) =>
                                                setData(
                                                    'details',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ej. Sección A, Puerta 5"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Fila
                                            </label>
                                            <Input
                                                value={data.row}
                                                onChange={(e) =>
                                                    setData(
                                                        'row',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Fila"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Asiento
                                            </label>
                                            <Input
                                                value={data.seat}
                                                onChange={(e) =>
                                                    setData(
                                                        'seat',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Asiento"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Guardando...'
                                                : 'Guardar Código'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="gap-2">
                                    <Trash2 className="size-4" />
                                    Vaciar Base
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        ¿Vaciar base de datos?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción eliminará todos los códigos
                                        y registros de escaneo asociados a este
                                        evento. No se puede deshacer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={clearAll}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Eliminar Todo
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                <div className="flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow dark:border-border dark:bg-background">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b bg-gray-50/50 dark:bg-white/5">
                                    {renderSortableHeader(
                                        'ID',
                                        'id',
                                        'w-[70px]',
                                    )}
                                    {renderSortableHeader('Código', 'code')}
                                    <TableHead className="w-[200px]">
                                        <div className="flex items-center justify-between gap-1.5">
                                            <div
                                                className="group flex cursor-pointer items-center gap-1.5 transition-colors select-none hover:text-foreground"
                                                onClick={() =>
                                                    handleSort('type')
                                                }
                                            >
                                                <span>Categoría / Sección</span>
                                                {filters.sort_by === 'type' ? (
                                                    filters.sort_order ===
                                                    'asc' ? (
                                                        <ArrowUp className="size-3.5 text-primary" />
                                                    ) : (
                                                        <ArrowDown className="size-3.5 text-primary" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="size-3.5 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-7 w-7 p-0 hover:bg-muted ${
                                                            filters.type
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        <Filter className="size-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48 border border-gray-200 bg-white shadow-md dark:border-border dark:bg-background"
                                                >
                                                    <DropdownMenuLabel className="text-xs">
                                                        Filtrar por Categoría
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                'type',
                                                                'all',
                                                            )
                                                        }
                                                        className="flex cursor-pointer items-center justify-between text-xs"
                                                    >
                                                        <span>Todas</span>
                                                        {!filters.type && (
                                                            <Check className="size-3.5 text-primary" />
                                                        )}
                                                    </DropdownMenuItem>
                                                    {types.map((type) => (
                                                        <DropdownMenuItem
                                                            key={type}
                                                            onClick={() =>
                                                                handleFilterChange(
                                                                    'type',
                                                                    type,
                                                                )
                                                            }
                                                            className="flex cursor-pointer items-center justify-between text-xs"
                                                        >
                                                            <span>{type}</span>
                                                            {filters.type ===
                                                                type && (
                                                                <Check className="size-3.5 text-primary" />
                                                            )}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[155px]">
                                        <div className="flex items-center justify-between gap-1.5">
                                            <div
                                                className="group flex cursor-pointer items-center gap-1.5 transition-colors select-none hover:text-foreground"
                                                onClick={() =>
                                                    handleSort('status')
                                                }
                                            >
                                                <span>Estado</span>
                                                {filters.sort_by ===
                                                'status' ? (
                                                    filters.sort_order ===
                                                    'asc' ? (
                                                        <ArrowUp className="size-3.5 text-primary" />
                                                    ) : (
                                                        <ArrowDown className="size-3.5 text-primary" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="size-3.5 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
                                                )}
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-7 w-7 p-0 hover:bg-muted ${
                                                            filters.status
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        <Filter className="size-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48 border border-gray-200 bg-white shadow-md dark:border-border dark:bg-background"
                                                >
                                                    <DropdownMenuLabel className="text-xs">
                                                        Filtrar por Estado
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                'status',
                                                                'all',
                                                            )
                                                        }
                                                        className="flex cursor-pointer items-center justify-between text-xs"
                                                    >
                                                        <span>Todos</span>
                                                        {!filters.status && (
                                                            <Check className="size-3.5 text-primary" />
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                'status',
                                                                'pending',
                                                            )
                                                        }
                                                        className="flex cursor-pointer items-center justify-between text-xs"
                                                    >
                                                        <span>Pendiente</span>
                                                        {filters.status ===
                                                            'pending' && (
                                                            <Check className="size-3.5 text-primary" />
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                'status',
                                                                'used',
                                                            )
                                                        }
                                                        className="flex cursor-pointer items-center justify-between text-xs"
                                                    >
                                                        <span>Escaneado</span>
                                                        {filters.status ===
                                                            'used' && (
                                                            <Check className="size-3.5 text-primary" />
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                'status',
                                                                'cancelled',
                                                            )
                                                        }
                                                        className="flex cursor-pointer items-center justify-between text-xs"
                                                    >
                                                        <span>Cancelado</span>
                                                        {filters.status ===
                                                            'cancelled' && (
                                                            <Check className="size-3.5 text-primary" />
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableHead>
                                    {renderSortableHeader(
                                        'Escaneo',
                                        'scanned_at',
                                        'w-[150px]',
                                    )}
                                    <TableHead className="w-[120px] text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {codes.data && codes.data.length > 0 ? (
                                    codes.data.map((code) => (
                                        <TableRow key={code.id}>
                                            <TableCell className="text-[10px] text-gray-400">
                                                {code.id}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs font-black tracking-tight">
                                                    {code.code}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                                        {code.type || 'General'}
                                                    </span>
                                                    <span
                                                        className="max-w-[150px] truncate text-[10px] text-primary italic"
                                                        title={
                                                            code.metadata
                                                                ?.details
                                                        }
                                                    >
                                                        {code.metadata
                                                            ?.details || '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(code.status)}
                                            </TableCell>
                                            <TableCell>
                                                {code.scanned_at ? (
                                                    <div className="flex flex-col text-[10px]">
                                                        <span className="font-medium">
                                                            {new Date(
                                                                code.scanned_at,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {new Date(
                                                                code.scanned_at,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-2"
                                                            >
                                                                <QrCode className="size-4" />
                                                                Ver QR
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-center">
                                                                    Código de
                                                                    Acceso
                                                                </DialogTitle>
                                                            </DialogHeader>
                                                            <div className="flex flex-col items-center justify-center space-y-4 p-6">
                                                                <div className="rounded-xl bg-white p-4">
                                                                    <QRCodeSVG
                                                                        value={
                                                                            code.code
                                                                        }
                                                                        size={
                                                                            200
                                                                        }
                                                                    />
                                                                </div>
                                                                <p className="font-mono text-xl font-bold tracking-widest">
                                                                    {code.code}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {code.type ||
                                                                        'General'}
                                                                </p>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <MoreHorizontal className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>
                                                                Acciones
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger className="gap-2">
                                                                    <Clock className="size-4" />
                                                                    Cambiar
                                                                    Estado
                                                                </DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            updateStatus(
                                                                                code.id,
                                                                                'pending',
                                                                            )
                                                                        }
                                                                        className="gap-2"
                                                                    >
                                                                        <Clock className="size-4" />{' '}
                                                                        Pendiente
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            updateStatus(
                                                                                code.id,
                                                                                'used',
                                                                            )
                                                                        }
                                                                        className="gap-2 text-green-600"
                                                                    >
                                                                        <Check className="size-4" />{' '}
                                                                        Escaneado
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            updateStatus(
                                                                                code.id,
                                                                                'cancelled',
                                                                            )
                                                                        }
                                                                        className="gap-2 text-red-600"
                                                                    >
                                                                        <X className="size-4" />{' '}
                                                                        Cancelado
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    deleteCode(
                                                                        code.id,
                                                                    )
                                                                }
                                                                className="gap-2 text-red-600"
                                                            >
                                                                <Trash2 className="size-4" />{' '}
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-8 text-center text-gray-500"
                                        >
                                            No se encontraron códigos.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {codes.total > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-border">
                            <div className="text-sm text-gray-500">
                                Total: {codes.total} códigos
                            </div>
                            <div className="flex gap-1">
                                {codes.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`rounded-md px-3 py-1 text-sm transition-colors ${
                                                link.active
                                                    ? 'bg-primary font-medium text-primary-foreground'
                                                    : 'text-foreground hover:bg-accent'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="px-3 py-1 text-sm text-gray-400"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

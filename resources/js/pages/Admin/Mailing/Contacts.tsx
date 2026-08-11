import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useRef, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    Trash2,
    Filter,
    CheckSquare,
    Square,
    MoreHorizontal,
    UploadCloud,
    UserPlus,
    X,
    UserCheck,
} from 'lucide-react';
import TicketProgressBar from '@/components/TicketProgressBar';

interface Audience {
    id: number;
    name: string;
}

interface MailingContact {
    id: number;
    name: string;
    email: string;
    zone: string | null;
    active: boolean;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
}

interface Props {
    contacts: PaginatedData<MailingContact>;
    audiences: Audience[];
    currentAudienceId?: string;
}

export default function Contacts({
    contacts,
    audiences,
    currentAudienceId,
}: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;

    // ── Estados de Selección ──
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [audienceFilter, setAudienceFilter] = useState(
        currentAudienceId || '',
    );

    // ── Formulario agregar contacto ──
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        zone: '',
        audience_id:
            audienceFilter ||
            (audiences.length > 0 ? audiences[0].id.toString() : ''),
    });

    useEffect(() => {
        if (audienceFilter) setData('audience_id', audienceFilter);
    }, [audienceFilter]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.mailing.contacts.store'), {
            onSuccess: () => {
                reset('name', 'email', 'zone');
                setSelectedIds([]);
            },
        });
    };

    // ── Import CSV ──
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const csvRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvFile || !data.audience_id) return;
        setImporting(true);
        setImportProgress(0);
        const fd = new FormData();
        fd.append('csv_file', csvFile);
        fd.append('audience_id', data.audience_id);

        router.post(route('admin.mailing.contacts.import'), fd as any, {
            onProgress: (progressEvent) => {
                if (progressEvent && progressEvent.percentage) {
                    setImportProgress(progressEvent.percentage);
                }
            },
            onFinish: () => {
                setImporting(false);
                setImportProgress(0);
                setCsvFile(null);
                if (csvRef.current) csvRef.current.value = '';
            },
        });
    };

    // ── Acciones en Lote ──
    const toggleSelectAll = () => {
        if (selectedIds.length === contacts.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(contacts.data.map((c) => c.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleBulkDelete = () => {
        if (
            confirm(
                `¿Eliminar los ${selectedIds.length} contactos seleccionados?`,
            )
        ) {
            router.post(
                route('admin.mailing.contacts.bulk-destroy'),
                { ids: selectedIds },
                {
                    onSuccess: () => setSelectedIds([]),
                },
            );
        }
    };

    const handleFilterChange = (val: string) => {
        setAudienceFilter(val);
        router.get(
            route('admin.mailing.contacts.index'),
            { audience_id: val },
            { preserveState: true },
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Mailing',
                    href: route('admin.mailing.campaigns.index'),
                },
                { title: 'Contactos', href: '#' },
            ]}
        >
            <Head title="Contactos de Mailing" />

            <div className="mx-auto max-w-7xl space-y-6 p-6">
                {/* Mensajes Flash */}
                {flash?.success && (
                    <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" /> {flash.success}
                        </div>
                        <button onClick={() => router.reload()}>
                            <X className="h-4 w-4 opacity-50" />
                        </button>
                    </div>
                )}

                {/* Header con Filtro */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            Contactos
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Gestiona tus listas de correo y segmentación.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Label
                            htmlFor="audience-filter"
                            className="hidden border-b text-xs font-bold text-gray-400 uppercase md:block"
                        >
                            Filtrar por Lista:
                        </Label>
                        <select
                            id="audience-filter"
                            value={audienceFilter}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="min-w-[200px] rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-background"
                        >
                            <option value="">Todas las listas</option>
                            {audiences.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                        <Button asChild variant="outline" size="sm">
                            <Link href={route('admin.mailing.audiences.index')}>
                                Ver Audiencias
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Formularios Expandibles / Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Agregar contacto */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-border dark:bg-background">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                            <UserPlus className="h-4 w-4 text-primary" />{' '}
                            Agregar a esta lista
                        </h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="c-name">Nombre</Label>
                                    <Input
                                        id="c-name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="Nombre completo"
                                        className="mt-1"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="c-email">Correo</Label>
                                    <Input
                                        id="c-email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        placeholder="correo@ejemplo.com"
                                        className="mt-1"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="c-zone">
                                        Zona (opcional)
                                    </Label>
                                    <Input
                                        id="c-zone"
                                        value={data.zone}
                                        onChange={(e) =>
                                            setData('zone', e.target.value)
                                        }
                                        placeholder="VIP, Platinum..."
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="c-list">
                                        Lista Destino
                                    </Label>
                                    <select
                                        id="c-list"
                                        value={data.audience_id}
                                        onChange={(e) =>
                                            setData(
                                                'audience_id',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-border dark:bg-background"
                                        required
                                    >
                                        <option value="">
                                            Seleccionar lista...
                                        </option>
                                        {audiences.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full"
                            >
                                {processing
                                    ? 'Agregando...'
                                    : 'Guardar Contacto'}
                            </Button>
                        </form>
                    </div>

                    {/* Importar CSV */}
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-border dark:bg-background">
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
                            <UploadCloud className="h-4 w-4 text-primary" />{' '}
                            Importar CSV a lista
                        </h2>
                        <form onSubmit={handleImport} className="space-y-4">
                            <div>
                                <Label htmlFor="i-list">
                                    Audiencia de Destino
                                </Label>
                                <select
                                    id="i-list"
                                    value={data.audience_id}
                                    onChange={(e) =>
                                        setData('audience_id', e.target.value)
                                    }
                                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-border dark:bg-background"
                                    required
                                >
                                    <option value="">
                                        Seleccionar lista...
                                    </option>
                                    {audiences.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="csv-file">
                                    Archivo CSV{' '}
                                    <span className="font-normal text-gray-400">
                                        (correo, nombre, zona)
                                    </span>
                                </Label>
                                <input
                                    ref={csvRef}
                                    id="csv-file"
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={(e) =>
                                        setCsvFile(e.target.files?.[0] ?? null)
                                    }
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
                                />
                            </div>
                            <TicketProgressBar
                                show={importing && importProgress > 0}
                                progress={importProgress}
                                text="Importando CSV..."
                            />
                            <Button
                                type="submit"
                                disabled={
                                    !csvFile || importing || !data.audience_id
                                }
                                className="w-full"
                                variant="secondary"
                            >
                                {importing
                                    ? 'Importando...'
                                    : 'Comenzar Importación'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Acciones en Lote (Sticky Bar) */}
                {selectedIds.length > 0 && (
                    <div className="flex animate-in items-center justify-between rounded-lg bg-primary p-3 text-primary-foreground duration-300 fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold">
                                {selectedIds.length} seleccionados
                            </span>
                            <div className="h-4 w-px bg-primary-foreground/30" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIds([])}
                                className="h-8 hover:bg-primary-foreground/10"
                            >
                                Deseleccionar
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                                className="h-8 bg-red-600 hover:bg-red-700"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                permanentemente
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tabla de contactos */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-border dark:bg-background">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={
                                                selectedIds.length ===
                                                    contacts.data.length &&
                                                contacts.data.length > 0
                                            }
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Nombre / Email</TableHead>
                                    <TableHead>Listas (Audiencias)</TableHead>
                                    <TableHead>Zona</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.data.length > 0 ? (
                                    contacts.data.map((c) => (
                                        <TableRow
                                            key={c.id}
                                            className={
                                                selectedIds.includes(c.id)
                                                    ? 'bg-primary/5'
                                                    : ''
                                            }
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(
                                                        c.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleSelectOne(c.id)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {c.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {c.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {(c as any).audiences?.map(
                                                        (a: any) => (
                                                            <span
                                                                key={a.id}
                                                                className="rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                                            >
                                                                {a.name}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {c.zone ?? (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        c.active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {c.active
                                                        ? 'Activo'
                                                        : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="space-x-2 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.patch(
                                                            route(
                                                                'admin.mailing.contacts.toggle',
                                                                c.id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    {c.active
                                                        ? 'Desactivar'
                                                        : 'Activar'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                `¿Eliminar a ${c.name}?`,
                                                            )
                                                        ) {
                                                            router.delete(
                                                                route(
                                                                    'admin.mailing.contacts.destroy',
                                                                    c.id,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-16 text-center text-gray-400"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="h-8 w-8 opacity-20" />
                                                No se encontraron contactos en
                                                esta lista.
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    {contacts.total > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-border">
                            <div className="text-sm text-gray-500">
                                Mostrando {contacts.from} a {contacts.to} de{' '}
                                {contacts.total}
                            </div>
                            <div className="flex gap-1">
                                {contacts.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`rounded-md px-3 py-1 text-sm transition-all ${link.active ? 'bg-primary font-medium text-primary-foreground' : 'hover:bg-accent'}`}
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

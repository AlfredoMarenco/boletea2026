import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
}

export default function Contacts({ contacts }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    // ── Formulario agregar contacto ──
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        zone: '',
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.mailing.contacts.store'), {
            onSuccess: () => reset(),
        });
    };

    // ── Import CSV ──
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const csvRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);

    const handleImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvFile) return;
        setImporting(true);
        const fd = new FormData();
        fd.append('csv_file', csvFile);
        router.post(route('admin.mailing.contacts.import'), fd, {
            onFinish: () => {
                setImporting(false);
                setCsvFile(null);
                if (csvRef.current) csvRef.current.value = '';
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Mailing', href: route('admin.mailing.campaigns.index') },
            { title: 'Contactos', href: route('admin.mailing.contacts.index') },
        ]}>
            <Head title="Contactos de Mailing" />

            <div className="p-6 space-y-6">

                {/* Flash messages */}
                {flash?.success && (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 text-green-800 dark:text-green-300 text-sm">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 text-red-800 dark:text-red-300 text-sm">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Contactos de Mailing</h1>
                        <p className="text-sm text-gray-500 mt-1">{contacts.total} contacto{contacts.total !== 1 ? 's' : ''} en total</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={route('admin.mailing.campaigns.index')}>Ver Campañas →</Link>
                    </Button>
                </div>

                {/* Add + Import */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Agregar contacto */}
                    <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg p-5">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Agregar contacto</h2>
                        <form onSubmit={handleAdd} className="space-y-3">
                            <div>
                                <Label htmlFor="c-name">Nombre</Label>
                                <Input id="c-name" value={data.name} onChange={e => setData('name', e.target.value)}
                                    placeholder="Nombre completo" className="mt-1" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <Label htmlFor="c-email">Correo electrónico</Label>
                                <Input id="c-email" type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    placeholder="correo@ejemplo.com" className="mt-1" />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <Label htmlFor="c-zone">Zona (opcional)</Label>
                                <Input id="c-zone" value={data.zone} onChange={e => setData('zone', e.target.value)}
                                    placeholder="Ej: Platinum, Gold, VIP…" className="mt-1" />
                            </div>
                            <Button type="submit" disabled={processing} className="w-full">
                                {processing ? 'Agregando…' : 'Agregar contacto'}
                            </Button>
                        </form>
                    </div>

                    {/* Importar CSV */}
                    <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg p-5">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Importar desde CSV</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            El archivo debe tener columnas: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">nombre, correo, zona</code> (la primera fila se omite como encabezado).
                        </p>
                        <form onSubmit={handleImport} className="space-y-3">
                            <div>
                                <Label htmlFor="csv-file">Archivo CSV</Label>
                                <input
                                    ref={csvRef}
                                    id="csv-file"
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={e => setCsvFile(e.target.files?.[0] ?? null)}
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                                />
                            </div>
                            <Button type="submit" disabled={!csvFile || importing} className="w-full" variant="secondary">
                                {importing ? 'Importando…' : 'Importar CSV'}
                            </Button>
                        </form>

                        {/* Template download hint */}
                        <p className="text-xs text-gray-400 mt-3">
                            Formato esperado del CSV:
                            <br />
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 block p-2 mt-1 rounded">
                                nombre,correo,zona<br />
                                Juan Pérez,juan@mail.com,Platinum<br />
                                Ana López,ana@mail.com,Gold
                            </code>
                        </p>
                    </div>
                </div>

                {/* Tabla de contactos */}
                <div className="bg-white dark:bg-background border border-gray-200 dark:border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Zona</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.data.length > 0 ? contacts.data.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell>{c.email}</TableCell>
                                        <TableCell>{c.zone ?? <span className="text-gray-400">—</span>}</TableCell>
                                        <TableCell>
                                            <Badge variant={c.active ? 'default' : 'secondary'}>
                                                {c.active ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => router.patch(route('admin.mailing.contacts.toggle', c.id))}
                                            >
                                                {c.active ? 'Desactivar' : 'Activar'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    if (confirm(`¿Eliminar a ${c.name}?`)) {
                                                        router.delete(route('admin.mailing.contacts.destroy', c.id));
                                                    }
                                                }}
                                            >
                                                Eliminar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                                            No hay contactos aún. Agrega uno o importa un CSV.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    {contacts.total > 0 && (
                        <div className="p-4 border-t border-gray-200 dark:border-border flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Mostrando {contacts.from} a {contacts.to} de {contacts.total}
                            </div>
                            <div className="flex gap-1">
                                {contacts.links.map((link, i) => (
                                    link.url ? (
                                        <Link key={i} href={link.url}
                                            className={`px-3 py-1 text-sm rounded-md ${link.active ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-accent'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span key={i} className="px-3 py-1 text-sm text-gray-400"
                                            dangerouslySetInnerHTML={{ __html: link.label }} />
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

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Pencil,
    Trash2,
    Calendar,
    Layers,
    MapPin,
    Search,
    Filter,
    X,
    Building2,
    CheckCircle2,
    Clock,
    Sparkles,
} from 'lucide-react';

interface Showtime {
    id: number;
    name: string;
    date_time: string;
    status: string;
    total_seats: number;
    sold_seats: number;
    venue?: { id: number; name: string };
}

interface Event {
    id: number;
    name: string;
    venue?: {
        id: number;
        name: string;
    };
    status: string;
    showtimes?: Showtime[];
}

interface Props {
    events: Event[];
}

export default function Index({ events = [] }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVenue, setSelectedVenue] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
    
    const searchRef = useRef<HTMLDivElement>(null);

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsAutocompleteOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Extraer lista única de recintos
    const uniqueVenues = useMemo(() => {
        const set = new Set<string>();
        events.forEach((e) => {
            if (e.venue?.name) {
                set.add(e.venue.name);
            }
            if (e.showtimes) {
                e.showtimes.forEach((st) => {
                    if (st.venue?.name) set.add(st.venue.name);
                });
            }
        });
        return Array.from(set);
    }, [events]);

    // Métricas para los KPIs superiores
    const stats = useMemo(() => {
        const totalEvents = events.length;
        const publishedEvents = events.filter((e) => e.status === 'published').length;
        const draftEvents = events.filter((e) => e.status !== 'published').length;
        const totalShowtimes = events.reduce((acc, e) => acc + (e.showtimes?.length || 0), 0);
        return { totalEvents, publishedEvents, draftEvents, totalShowtimes };
    }, [events]);

    // Sugerencias de Autocompletado mientras escribe
    const autocompleteSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().trim();
        const suggestions: { label: string; type: 'event' | 'venue' }[] = [];

        events.forEach((e) => {
            if (e.name.toLowerCase().includes(q) && !suggestions.some((s) => s.label === e.name)) {
                suggestions.push({ label: e.name, type: 'event' });
            }
            const vName = e.venue?.name;
            if (vName && vName.toLowerCase().includes(q) && !suggestions.some((s) => s.label === vName)) {
                suggestions.push({ label: vName, type: 'venue' });
            }
        });

        return suggestions.slice(0, 6);
    }, [events, searchQuery]);

    // Eventos filtrados en tiempo real
    const filteredEvents = useMemo(() => {
        return events.filter((e) => {
            const q = searchQuery.toLowerCase().trim();
            const eventVenues = [
                ...(e.venue?.name ? [e.venue.name] : []),
                ...(e.showtimes?.map((st) => st.venue?.name).filter(Boolean) as string[]),
            ];

            const matchSearch =
                !q ||
                e.name.toLowerCase().includes(q) ||
                eventVenues.some((v) => v.toLowerCase().includes(q));

            const matchVenue =
                selectedVenue === 'all' ||
                (selectedVenue === 'sin_recinto'
                    ? eventVenues.length === 0
                    : eventVenues.includes(selectedVenue));

            const matchStatus =
                selectedStatus === 'all' || e.status === selectedStatus;

            return matchSearch && matchVenue && matchStatus;
        });
    }, [events, searchQuery, selectedVenue, selectedStatus]);

    const hasActiveFilters = searchQuery !== '' || selectedVenue !== 'all' || selectedStatus !== 'all';

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedVenue('all');
        setSelectedStatus('all');
        setIsAutocompleteOpen(false);
    };

    const handleDelete = (id: number) => {
        if (
            confirm(
                '¿Estás seguro de eliminar este evento? No se podrá eliminar si tiene funciones con boletos vendidos.',
            )
        ) {
            router.delete(route('admin.local-events.destroy', id));
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Eventos Locales',
                    href: route('admin.local-events.index'),
                },
            ]}
        >
            <Head title="Eventos Locales" />

            <div className="w-full max-w-[1700px] mx-auto p-4 md:p-8 space-y-6">
                {/* Header Principal */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                                Eventos Gestionados
                            </h1>
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-extrabold bg-[#c90000]/10 text-[#c90000] border border-[#c90000]/20">
                                {events.length} Totales
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Administra espectáculos, funciones, recintos e inventarios interactivos de mapas de venta.
                        </p>
                    </div>

                    <Button asChild className="bg-[#c90000] hover:bg-[#a00000] text-white font-bold shadow-md shadow-[#c90000]/20 h-11 px-6">
                        <Link href={route('admin.local-events.create')}>
                            <Plus className="mr-2 h-5 w-5" />
                            Nuevo Evento
                        </Link>
                    </Button>
                </div>

                {/* Tarjetas de Métricas KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border p-4 bg-card shadow-sm border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                            <span>Total Eventos</span>
                            <Calendar className="h-4 w-4 text-indigo-500" />
                        </div>
                        <p className="text-3xl font-black mt-2 text-foreground">{stats.totalEvents}</p>
                    </div>

                    <div className="rounded-2xl border p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 shadow-sm">
                        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                            <span>Publicados</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-black mt-2 text-emerald-600 dark:text-emerald-400">{stats.publishedEvents}</p>
                    </div>

                    <div className="rounded-2xl border p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 shadow-sm">
                        <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
                            <span>Borradores</span>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="text-3xl font-black mt-2 text-amber-600 dark:text-amber-400">{stats.draftEvents}</p>
                    </div>

                    <div className="rounded-2xl border p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 shadow-sm">
                        <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                            <span>Funciones Activas</span>
                            <Layers className="h-4 w-4 text-indigo-500" />
                        </div>
                        <p className="text-3xl font-black mt-2 text-indigo-600 dark:text-indigo-400">{stats.totalShowtimes}</p>
                    </div>
                </div>

                {/* Panel de Filtros Interactivos & Buscador Inteligente con Autocompletado */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                            <Filter className="h-4 w-4 text-[#c90000]" />
                            <span>Búsqueda y Filtros Avanzados</span>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="h-8 text-xs text-muted-foreground hover:text-foreground font-semibold"
                            >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Limpiar Filtros
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Buscador con Autocompletado */}
                        <div className="md:col-span-6 relative" ref={searchRef}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar evento por nombre o recinto..."
                                    value={searchQuery}
                                    onFocus={() => setIsAutocompleteOpen(true)}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setIsAutocompleteOpen(true);
                                    }}
                                    className="pl-9 pr-8 h-10 bg-background"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown de Autocompletado */}
                            {isAutocompleteOpen && autocompleteSuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border bg-popover text-popover-foreground shadow-lg overflow-hidden border-slate-200 dark:border-slate-800 py-1">
                                    <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40">
                                        Sugerencias de búsqueda
                                    </div>
                                    {autocompleteSuggestions.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center justify-between gap-2"
                                            onClick={() => {
                                                setSearchQuery(item.label);
                                                setIsAutocompleteOpen(false);
                                            }}
                                        >
                                            <span className="font-semibold truncate">{item.label}</span>
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                {item.type === 'event' ? 'Evento' : 'Recinto'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Filtro por Recinto */}
                        <div className="md:col-span-3">
                            <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                                <SelectTrigger className="h-10 bg-background font-medium">
                                    <div className="flex items-center gap-2 truncate">
                                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <SelectValue placeholder="Todos los Recintos" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Recintos</SelectItem>
                                    {uniqueVenues.map((venueName) => (
                                        <SelectItem key={venueName} value={venueName}>
                                            {venueName}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="sin_recinto">Sin Recinto Asignado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filtro por Estado */}
                        <div className="md:col-span-3">
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-10 bg-background font-medium">
                                    <div className="flex items-center gap-2 truncate">
                                        <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <SelectValue placeholder="Todos los Estados" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Estados</SelectItem>
                                    <SelectItem value="published">Publicados</SelectItem>
                                    <SelectItem value="draft">Borradores</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Tabla de Resultados (Aprovechando el ancho completo) */}
                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm border-slate-200/80 dark:border-slate-800">
                    <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                            <TableRow>
                                <TableHead className="font-bold text-xs uppercase tracking-wider py-4">Evento</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider py-4">Funciones Programadas</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider py-4">Estado</TableHead>
                                <TableHead className="font-bold text-xs uppercase tracking-wider text-right py-4">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((event) => (
                                    <TableRow key={event.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-[#c90000]/10 flex items-center justify-center shrink-0 text-[#c90000]">
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-foreground block">{event.name}</span>
                                                    <span className="text-[11px] text-muted-foreground">ID: #{event.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3.5">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                <Layers className="h-3.5 w-3.5" />
                                                {event.showtimes?.length || 0} función(es)
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3.5">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                                                    event.status === 'published'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${event.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {event.status === 'published' ? 'Publicado' : 'Borrador'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right py-3.5">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="gap-1.5 font-bold border-[#c90000]/30 hover:border-[#c90000] text-[#c90000] hover:bg-[#c90000]/10 text-xs h-9 px-3.5"
                                                >
                                                    <Link href={route('admin.local-events.showtimes.index', event.id)}>
                                                        <Layers className="h-3.5 w-3.5" />
                                                        Gestionar Funciones
                                                    </Link>
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    className="h-9 w-9"
                                                >
                                                    <Link href={route('admin.local-events.edit', event.id)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50"
                                                    onClick={() => handleDelete(event.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
                                                <Search className="h-5 w-5" />
                                            </div>
                                            <p className="font-bold text-sm text-foreground">
                                                No se encontraron eventos que coincidan con la búsqueda.
                                            </p>
                                            {hasActiveFilters && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={clearFilters}
                                                    className="text-[#c90000] font-bold text-xs"
                                                >
                                                    Limpiar Filtros
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}

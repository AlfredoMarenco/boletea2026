import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface FilterBarProps {
    filters: {
        search?: string;
        city?: string;
        venue_id?: string;
        category?: string;
        date_start?: string;
        date_end?: string;
    };
    options: {
        cities: string[];
        venues: { id: number; name: string }[];
        categories: string[];
    };
}

export default function FilterBar({ filters, options }: FilterBarProps) {
    const [values, setValues] = useState({
        search: filters.search || '',
        city: filters.city || '',
        venue_id: filters.venue_id || '',
        category: filters.category || '',
        date_start: filters.date_start ? new Date(filters.date_start) : undefined,
        date_end: filters.date_end ? new Date(filters.date_end) : undefined,
    });

    const [isPending, setIsPending] = useState(false);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (values.search !== (filters.search || '')) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [values.search]);

    const applyFilters = () => {
        setIsPending(true);
        const query: any = { ...values };

        // Format dates for URL
        if (values.date_start) query.date_start = format(values.date_start, 'yyyy-MM-dd');
        else delete query.date_start;

        if (values.date_end) query.date_end = format(values.date_end, 'yyyy-MM-dd');
        else delete query.date_end;

        // Clean empty values
        Object.keys(query).forEach(key => {
            if (!query[key]) delete query[key];
        });

        router.get(route('home'), query, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsPending(false),
        });
    };

    const handleReset = () => {
        setValues({
            search: '',
            city: '',
            venue_id: '',
            category: '',
            date_start: undefined,
            date_end: undefined,
        });
        router.get(route('home'), {}, { preserveState: true });
    };

    return (
        <div className="w-full bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm sticky top-0 z-30">
            <div className="container mx-auto px-4 py-3">
                <div className="flex flex-col md:flex-row gap-3 items-center">

                    {/* Search Input */}
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <Input
                            placeholder="Buscar evento, artista..."
                            className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            value={values.search}
                            onChange={(e) => setValues({ ...values, search: e.target.value })}
                        />
                    </div>

                    {/* Filters Group */}
                    <div className="flex flex-1 gap-2 overflow-x-auto w-full pb-1 md:pb-0 no-scrollbar">

                        {/* City Filter */}
                        <Select
                            value={values.city}
                            onValueChange={(val) => {
                                const newValue = val === 'all' ? '' : val;
                                setValues({ ...values, city: newValue });
                                // Trigger filter immediately for dropdowns? Or wait for button?
                                // Let's trigger immediately for better UX
                                setTimeout(() => {
                                    // We need to pass the new value because setValues is async
                                    // Actually, let's just use a useEffect for specific fields or call applyFilters with new val
                                    // For simplicity/safety with closure, let's use a button or make applyFilters read form state
                                    // But ApplyFilters reads 'values' state which might be stale here.
                                    // Better approach: update state, then use useEffect to trigger router.
                                    // Or just call router directly here.
                                    // Let's rely on a separate useEffect for non-text fields if we want auto-submit,
                                    // or add an "Apply" button. The user asked for "Improve UX", usually auto-apply is nicer.
                                    // But let's verify if we want auto-apply for dropdowns. Yes.
                                }, 0);
                            }}
                        >
                            <SelectTrigger className="w-[140px] min-w-[140px]">
                                <SelectValue placeholder="Ciudad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {options.cities.map((city) => (
                                    <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Categories Filter */}
                        <Select
                            value={values.category}
                            onValueChange={(val) => setValues({ ...values, category: val === 'all' ? '' : val })}
                        >
                            <SelectTrigger className="w-[150px] min-w-[150px]">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {options.categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Venue Filter */}
                        <Select
                            value={values.venue_id}
                            onValueChange={(val) => setValues({ ...values, venue_id: val === 'all' ? '' : val })}
                        >
                            <SelectTrigger className="w-[160px] min-w-[160px]">
                                <SelectValue placeholder="Recinto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {options.venues.map((venue) => (
                                    <SelectItem key={venue.id} value={String(venue.id)}>{venue.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date Range Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !values.date_start && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {values.date_start ? (
                                        values.date_end ? (
                                            <>
                                                {format(values.date_start, "dd/MM/y", { locale: es })} -{" "}
                                                {format(values.date_end, "dd/MM/y", { locale: es })}
                                            </>
                                        ) : (
                                            format(values.date_start, "dd/MM/y", { locale: es })
                                        )
                                    ) : (
                                        <span>Fecha</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <div className="p-3 space-y-3">
                                    <div className="space-y-1">
                                        <Label>Desde</Label>
                                        <Calendar
                                            mode="single"
                                            selected={values.date_start}
                                            onSelect={(date) => setValues({ ...values, date_start: date })}
                                            initialFocus
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Hasta</Label>
                                        <Calendar
                                            mode="single"
                                            selected={values.date_end}
                                            onSelect={(date) => setValues({ ...values, date_end: date })}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-auto">
                        <Button onClick={() => applyFilters()} disabled={isPending}>
                            {isPending ? 'Filtrando...' : 'Aplicar'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleReset} title="Limpiar Filtros">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

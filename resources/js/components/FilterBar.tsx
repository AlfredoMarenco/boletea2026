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
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Search, X, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

import { DateRange } from 'react-day-picker';

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
    });

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: filters.date_start ? new Date(filters.date_start) : undefined,
        to: filters.date_end ? new Date(filters.date_end) : undefined,
    });

    const [isPending, setIsPending] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

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
        if (dateRange?.from)
            query.date_start = format(dateRange.from, 'yyyy-MM-dd');
        else delete query.date_start;

        if (dateRange?.to) query.date_end = format(dateRange.to, 'yyyy-MM-dd');
        else delete query.date_end;

        // Clean empty values
        Object.keys(query).forEach((key) => {
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
        });
        setDateRange(undefined);
        router.get(route('home'), {}, { preserveState: true });
    };

    return (
        <div className="sticky top-20 z-30 w-full border-b bg-white/95 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all duration-300 dark:border-slate-800 dark:bg-background/95 dark:shadow-none">
            <div className="container mx-auto px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    {/* Top row for mobile: Search + Filter Toggle */}
                    <div className="flex w-full shrink-0 items-center gap-2 md:w-1/3">
                        <div className="relative w-full">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-500 dark:text-muted-foreground" />
                            <Input
                                placeholder="BUSCAR EVENTO, ARTISTA..."
                                className="border-gray-200 bg-gray-50 pl-9 shadow-sm transition-all focus:ring-2 focus:ring-[#c90000]/20 dark:border-slate-700 dark:bg-card"
                                value={values.search}
                                onChange={(e) =>
                                    setValues({
                                        ...values,
                                        search: e.target.value,
                                    })
                                }
                            />
                        </div>
                        {/* Mobile Filter Toggle */}
                        <Button
                            variant={showFilters ? 'default' : 'outline'}
                            size="icon"
                            className="shrink-0 shadow-sm md:hidden"
                            onClick={() => setShowFilters(!showFilters)}
                            aria-label="Toggle filters"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Filters Group - hidden on mobile unless toggled */}
                    <div
                        className={cn(
                            'w-full flex-1 flex-col gap-3 md:flex-row',
                            showFilters
                                ? 'flex animate-in duration-200 fade-in slide-in-from-top-2'
                                : 'hidden md:flex',
                        )}
                    >
                        {/* Selects Grid */}
                        <div className="grid w-full grid-cols-2 gap-2 md:flex md:flex-1">
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
                                <SelectTrigger className="w-full font-semibold tracking-wide md:w-[140px]">
                                    <SelectValue placeholder="CIUDAD" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">TODAS</SelectItem>
                                    {options.cities.map((city) => (
                                        <SelectItem key={city} value={city}>
                                            {city.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Categories Filter */}
                            <Select
                                value={values.category}
                                onValueChange={(val) =>
                                    setValues({
                                        ...values,
                                        category: val === 'all' ? '' : val,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full font-semibold tracking-wide md:w-[150px]">
                                    <SelectValue placeholder="CATEGORÍA" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">TODAS</SelectItem>
                                    {options.categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Venue Filter */}
                            <Select
                                value={values.venue_id}
                                onValueChange={(val) =>
                                    setValues({
                                        ...values,
                                        venue_id: val === 'all' ? '' : val,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full font-semibold tracking-wide md:w-[160px]">
                                    <SelectValue placeholder="RECINTO" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">TODOS</SelectItem>
                                    {options.venues.map((venue) => (
                                        <SelectItem
                                            key={venue.id}
                                            value={String(venue.id)}
                                        >
                                            {venue.name.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Date Range Popover */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={'outline'}
                                        className={cn(
                                            'col-span-2 w-full justify-start text-left font-normal md:col-span-1 md:w-[260px]',
                                            !dateRange &&
                                                'text-muted-foreground',
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-[#c90000]" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <span className="text-xs font-semibold uppercase">
                                                    {format(
                                                        dateRange.from,
                                                        'dd/MM/y',
                                                        { locale: es },
                                                    )}{' '}
                                                    -{' '}
                                                    {format(
                                                        dateRange.to,
                                                        'dd/MM/y',
                                                        { locale: es },
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-semibold uppercase">
                                                    {format(
                                                        dateRange.from,
                                                        'dd/MM/y',
                                                        { locale: es },
                                                    )}
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-xs font-semibold tracking-wide uppercase">
                                                SELECCIONAR FECHAS
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                        locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Actions */}
                        <div className="mt-2 flex w-full gap-2 border-t border-gray-100 pt-2 md:mt-0 md:ml-auto md:w-auto md:border-t-0 md:pt-0 dark:border-slate-800">
                            <Button
                                className="flex-1 bg-[#c90000] font-bold tracking-widest text-white uppercase shadow-md transition-all hover:bg-[#a30000] active:scale-95 md:flex-none"
                                onClick={() => {
                                    applyFilters();
                                    setShowFilters(false);
                                }}
                                disabled={isPending}
                            >
                                {isPending ? 'FILTRANDO...' : 'APLICAR'}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-gray-400"
                                onClick={handleReset}
                                title="LIMPIAR FILTROS"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

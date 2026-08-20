import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Plus, Loader2 } from 'lucide-react';
import { Event, Showtime, PriceType, Price } from '../../types';

interface Props {
    event: Event;
    showtime: Showtime;
    priceTypes: PriceType[];
}

export default function PricingTab({ event, showtime, priceTypes }: Props) {
    const snapshot = showtime.layout_snapshot || showtime.seating_map?.layout_json || {};
    const categories = snapshot.config?.categories || [];

    const existingPricesByCategory = (showtime.prices || []).reduce<Record<string, Price[]>>((acc, curr) => {
        if (!acc[curr.name]) acc[curr.name] = [];
        acc[curr.name].push(curr);
        return acc;
    }, {});

    const [openModalCategory, setOpenModalCategory] = useState<string | null>(null);
    const [modalPrices, setModalPrices] = useState<Price[]>([]);
    const [filterText, setFilterText] = useState('');
    const [isSavingPrices, setIsSavingPrices] = useState(false);

    const priceForm = useForm({
        prices: showtime.prices || [],
    });

    const openPricingModalForCategory = (catName: string, catColor?: string) => {
        const catPrices = existingPricesByCategory[catName] || [];

        const initialized: Price[] = priceTypes.map((pt) => {
            const found = catPrices.find((cp) => cp.price_type_id === pt.id);
            return {
                id: found?.id,
                price_type_id: pt.id,
                name: catName,
                price: found ? found.price : 0,
                printed_price: found ? found.printed_price : 0,
                service_charge: found ? found.service_charge : 0,
                bank_commission: found ? found.bank_commission : 0,
                admin_fee: found ? found.admin_fee : 0,
                is_enabled: found ? Boolean(found.is_enabled) : false,
                web_sales_enabled: found ? Boolean(found.web_sales_enabled) : false,
                box_office_sales_enabled: found ? Boolean(found.box_office_sales_enabled) : false,
                is_web_default: found ? Boolean(found.is_web_default) : false,
                is_pos_default: found ? Boolean(found.is_pos_default) : false,
                color: catColor || found?.color || '#64748b',
                price_type: pt,
            };
        });

        setModalPrices(initialized);
        setOpenModalCategory(catName);
    };

    const handleSaveCategoryPrices = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPrices(true);

        const otherPrices = (showtime.prices || []).filter((p) => p.name !== openModalCategory);

        const payloadPrices = [...otherPrices, ...modalPrices]
            .filter((p) => p.is_enabled)
            .map((p) => ({
                id: p.id,
                price_type_id: p.price_type_id,
                name: p.name,
                price: p.price,
                printed_price: p.printed_price || p.price,
                service_charge: p.service_charge,
                bank_commission: p.bank_commission,
                admin_fee: p.admin_fee,
                is_enabled: Boolean(p.is_enabled),
                web_sales_enabled: Boolean(p.web_sales_enabled),
                box_office_sales_enabled: Boolean(p.box_office_sales_enabled),
                is_web_default: Boolean(p.is_web_default),
                is_pos_default: Boolean(p.is_pos_default),
                color: p.color || null,
            }));

        router.post(
            route('admin.local-events.showtimes.prices.update', [event.id, showtime.id]),
            { prices: payloadPrices },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSavingPrices(false);
                    setOpenModalCategory(null);
                },
                onError: () => setIsSavingPrices(false),
                onFinish: () => setIsSavingPrices(false),
            }
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold">Matriz de Precios por Categoría y Tipo de Boleto</h3>
                    <p className="text-xs text-muted-foreground">
                        Configura los tipos de boleto disponibles (Adultos, Niños, VIP, etc.), cargos por servicio y comisión bancaria por zona.
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900/60">
                            <TableHead className="w-12 font-bold text-center">Acción</TableHead>
                            <TableHead className="font-bold">Categoría / Zona</TableHead>
                            <TableHead className="font-bold">Tipos de Boleto Habilitados</TableHead>
                            <TableHead className="font-bold text-center">Venta Web</TableHead>
                            <TableHead className="font-bold">Precio Base</TableHead>
                            <TableHead className="font-bold">Cargos (Serv. | Banc. | Admin)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category: any) => {
                            const catPrices = existingPricesByCategory[category.name] || [];

                            return (
                                <TableRow key={category.name}>
                                    <TableCell className="text-center">
                                        <Dialog
                                            open={openModalCategory === category.name}
                                            onOpenChange={(open) => {
                                                if (!open) setOpenModalCategory(null);
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openPricingModalForCategory(category.name, category.color)}
                                                    className="h-8 text-xs font-bold gap-1"
                                                >
                                                    <Settings className="h-3.5 w-3.5" />
                                                    Precios
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-7xl max-w-[96vw] w-[96vw] h-[92vh] max-h-[92vh] flex flex-col p-6 overflow-hidden">
                                                <DialogHeader className="shrink-0">
                                                    <DialogTitle className="text-xl font-bold flex items-center justify-between gap-2 pr-6">
                                                        <div className="flex items-center gap-2">
                                                            {category.color && (
                                                                <span
                                                                    className="h-4 w-4 rounded-full border shadow-sm shrink-0"
                                                                    style={{ backgroundColor: category.color }}
                                                                />
                                                            )}
                                                            <span>Configuración de Precios: Zona {category.name}</span>
                                                        </div>
                                                    </DialogTitle>
                                                </DialogHeader>

                                                <form onSubmit={handleSaveCategoryPrices} className="flex-1 flex flex-col min-h-0 space-y-4 pt-2">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs font-semibold text-muted-foreground">Filter By:</span>
                                                        <Input
                                                            type="text"
                                                            placeholder="Filtrar por tipo o nombre..."
                                                            value={filterText}
                                                            onChange={(e) => setFilterText(e.target.value)}
                                                            className="h-8 text-xs max-w-xs"
                                                        />
                                                    </div>

                                                    <div className="flex-1 rounded-xl border overflow-auto min-h-0">
                                                        <Table className="w-full min-w-[1100px] text-xs">
                                                            <TableHeader>
                                                                <TableRow className="bg-muted/50 text-[11px] uppercase tracking-wider">
                                                                    <TableHead className="font-bold w-20 px-2">Tipo</TableHead>
                                                                    <TableHead className="font-bold min-w-[160px] px-2">Nombre (Grupo de Tipos)</TableHead>
                                                                    <TableHead className="font-bold min-w-[120px] w-32 px-2 text-center">Precio Boleto</TableHead>
                                                                    <TableHead className="font-bold min-w-[120px] w-32 px-2 text-center">Precio Impreso</TableHead>
                                                                    <TableHead className="w-20 text-center font-bold px-1">Habilitado</TableHead>
                                                                    <TableHead className="w-24 text-center font-bold px-1">Disponible Web</TableHead>
                                                                    <TableHead className="w-24 text-center font-bold px-1">Web por Defecto</TableHead>
                                                                    <TableHead className="w-24 text-center font-bold px-1">Taquilla por Defecto</TableHead>
                                                                    <TableHead className="font-bold min-w-[100px] w-24 text-center px-2">CxServ.</TableHead>
                                                                    <TableHead className="font-bold min-w-[100px] w-24 text-center px-2">T.C.</TableHead>
                                                                    <TableHead className="font-bold min-w-[100px] w-24 text-center px-2">CxADM</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {modalPrices
                                                                    .filter((item) => {
                                                                        if (!filterText.trim()) return true;
                                                                        const q = filterText.toLowerCase();
                                                                        const code = (item.price_type?.code || '').toLowerCase();
                                                                        const name = (item.price_type?.name || '').toLowerCase();
                                                                        return code.includes(q) || name.includes(q);
                                                                    })
                                                                    .map((item) => {
                                                                        const idx = modalPrices.findIndex((p) => p.price_type_id === item.price_type_id);
                                                                        const isActive = item.is_enabled;
                                                                        return (
                                                                            <TableRow
                                                                                key={item.price_type_id}
                                                                                className={cn(
                                                                                    "transition-colors duration-150",
                                                                                    isActive
                                                                                        ? "bg-emerald-500/10 dark:bg-emerald-500/15 hover:bg-emerald-500/20 text-foreground font-medium"
                                                                                        : "opacity-40 grayscale hover:opacity-75 bg-muted/20 text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                <TableCell className="font-mono font-bold text-xs uppercase px-2">
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <span
                                                                                            className={cn(
                                                                                                "h-2 w-2 rounded-full shrink-0",
                                                                                                isActive ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" : "bg-slate-300 dark:bg-slate-700"
                                                                                            )}
                                                                                        />
                                                                                        <span>{item.price_type?.code || item.price_type?.name?.substring(0, 4)}</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="font-semibold text-xs px-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span>{item.price_type?.name}</span>
                                                                                        {isActive ? (
                                                                                            <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                                                                Activo
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="text-[10px] bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium">
                                                                                                Inactivo
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="px-2">
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        disabled={!isActive}
                                                                                        className={cn(
                                                                                            "h-8 text-xs font-bold px-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                            isActive ? "bg-background border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-xs" : "bg-muted/50 cursor-not-allowed"
                                                                                        )}
                                                                                        value={item.price}
                                                                                        onChange={(e) => {
                                                                                            const updated = [...modalPrices];
                                                                                            updated[idx].price = parseFloat(e.target.value) || 0;
                                                                                            setModalPrices(updated);
                                                                                        }}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="px-2">
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        disabled={!isActive}
                                                                                        className={cn(
                                                                                            "h-8 text-xs font-bold px-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                            isActive ? "bg-background border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-xs" : "bg-muted/50 cursor-not-allowed"
                                                                                        )}
                                                                                        value={item.printed_price}
                                                                                        onChange={(e) => {
                                                                                            const updated = [...modalPrices];
                                                                                            updated[idx].printed_price = parseFloat(e.target.value) || 0;
                                                                                            setModalPrices(updated);
                                                                                        }}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="text-center px-1">
                                                                                    <div className="flex items-center justify-center">
                                                                                        <Checkbox
                                                                                            checked={item.is_enabled}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const updated = [...modalPrices];
                                                                                                const enabled = Boolean(checked);
                                                                                                updated[idx].is_enabled = enabled;
                                                                                                if (!enabled) {
                                                                                                    updated[idx].web_sales_enabled = false;
                                                                                                    updated[idx].box_office_sales_enabled = false;
                                                                                                    updated[idx].is_web_default = false;
                                                                                                    updated[idx].is_pos_default = false;
                                                                                                }
                                                                                                setModalPrices(updated);
                                                                                            }}
                                                                                            className="size-5 rounded-md border-emerald-500/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 focus-visible:ring-emerald-500 shadow-sm"
                                                                                        />
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-center px-1">
                                                                                    <div className="flex items-center justify-center">
                                                                                        <Checkbox
                                                                                            disabled={!isActive}
                                                                                            checked={item.web_sales_enabled}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const updated = [...modalPrices];
                                                                                                updated[idx].web_sales_enabled = Boolean(checked);
                                                                                                setModalPrices(updated);
                                                                                            }}
                                                                                            className="size-5 rounded-md border-emerald-500/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 focus-visible:ring-emerald-500 shadow-sm disabled:opacity-30"
                                                                                        />
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-center px-1">
                                                                                    <div className="flex items-center justify-center">
                                                                                        <button
                                                                                            type="button"
                                                                                            disabled={!isActive}
                                                                                            onClick={() => {
                                                                                                if (!isActive) return;
                                                                                                const updated = modalPrices.map((p, i) => ({
                                                                                                    ...p,
                                                                                                    is_web_default: i === idx,
                                                                                                }));
                                                                                                setModalPrices(updated);
                                                                                            }}
                                                                                            className={cn(
                                                                                                "size-5 rounded-full border flex items-center justify-center transition-all duration-150 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                                                                                item.is_web_default
                                                                                                    ? "border-emerald-600 bg-emerald-600 dark:bg-emerald-500 dark:border-emerald-500 text-white"
                                                                                                    : "border-slate-300 dark:border-slate-600 bg-background hover:border-emerald-400",
                                                                                                !isActive && "opacity-30 cursor-not-allowed pointer-events-none"
                                                                                            )}
                                                                                        >
                                                                                            {item.is_web_default && (
                                                                                                <span className="size-2 rounded-full bg-white shadow-xs" />
                                                                                            )}
                                                                                        </button>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-center px-1">
                                                                                    <div className="flex items-center justify-center">
                                                                                        <button
                                                                                            type="button"
                                                                                            disabled={!isActive}
                                                                                            onClick={() => {
                                                                                                if (!isActive) return;
                                                                                                const updated = modalPrices.map((p, i) => ({
                                                                                                    ...p,
                                                                                                    is_pos_default: i === idx,
                                                                                                }));
                                                                                                setModalPrices(updated);
                                                                                            }}
                                                                                            className={cn(
                                                                                                "size-5 rounded-full border flex items-center justify-center transition-all duration-150 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                                                                                item.is_pos_default
                                                                                                    ? "border-blue-600 bg-blue-600 dark:bg-blue-500 dark:border-blue-500 text-white"
                                                                                                    : "border-slate-300 dark:border-slate-600 bg-background hover:border-blue-400",
                                                                                                !isActive && "opacity-30 cursor-not-allowed pointer-events-none"
                                                                                            )}
                                                                                        >
                                                                                            {item.is_pos_default && (
                                                                                                <span className="size-2 rounded-full bg-white shadow-xs" />
                                                                                            )}
                                                                                        </button>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="px-2">
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        disabled={!isActive}
                                                                                        className={cn(
                                                                                            "h-8 text-xs px-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                            isActive ? "bg-background border-slate-200 dark:border-slate-700" : "bg-muted/50 cursor-not-allowed"
                                                                                        )}
                                                                                        value={item.service_charge}
                                                                                        onChange={(e) => {
                                                                                            const updated = [...modalPrices];
                                                                                            updated[idx].service_charge = parseFloat(e.target.value) || 0;
                                                                                            setModalPrices(updated);
                                                                                        }}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="px-2">
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        disabled={!isActive}
                                                                                        className={cn(
                                                                                            "h-8 text-xs px-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                            isActive ? "bg-background border-slate-200 dark:border-slate-700" : "bg-muted/50 cursor-not-allowed"
                                                                                        )}
                                                                                        value={item.bank_commission}
                                                                                        onChange={(e) => {
                                                                                            const updated = [...modalPrices];
                                                                                            updated[idx].bank_commission = parseFloat(e.target.value) || 0;
                                                                                            setModalPrices(updated);
                                                                                        }}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="px-2">
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        disabled={!isActive}
                                                                                        className={cn(
                                                                                            "h-8 text-xs px-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                                            isActive ? "bg-background border-slate-200 dark:border-slate-700" : "bg-muted/50 cursor-not-allowed"
                                                                                        )}
                                                                                        value={item.admin_fee}
                                                                                        onChange={(e) => {
                                                                                            const updated = [...modalPrices];
                                                                                            updated[idx].admin_fee = parseFloat(e.target.value) || 0;
                                                                                            setModalPrices(updated);
                                                                                        }}
                                                                                    />
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                            </TableBody>
                                                        </Table>
                                                    </div>

                                                    <div className="flex justify-end gap-2 pt-3 border-t">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setOpenModalCategory(null)}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={isSavingPrices}
                                                            className="bg-[#c90000] hover:bg-[#a00000] text-white font-bold"
                                                        >
                                                            {isSavingPrices ? 'Guardando...' : 'Actualizar Fijación de Precios'}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                    <TableCell className="font-extrabold text-base">
                                        <div className="flex items-center gap-2">
                                            {category.color && (
                                                <span
                                                    className="h-3.5 w-3.5 rounded-full border shadow-sm"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                            )}
                                            <span>{category.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {catPrices.length > 0 ? (
                                            <div className="space-y-1">
                                                {catPrices.map((cp) => (
                                                    <div key={cp.price_type_id} className="text-xs font-semibold flex items-center gap-1.5">
                                                        <span className="text-foreground">{cp.price_type?.code || cp.price_type?.name}</span>
                                                        <span className="text-muted-foreground font-normal">- {cp.price_type?.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-amber-600 font-medium">Sin tipos de precio configurados</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center font-bold">
                                        {catPrices.some((cp) => cp.web_sales_enabled) ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-black">X</span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {catPrices.length > 0 ? (
                                            <div className="space-y-1 text-xs font-bold">
                                                {catPrices.map((cp) => (
                                                    <p key={cp.price_type_id}>${parseFloat(cp.price as any).toFixed(2)}</p>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">$0.00</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {catPrices.length > 0 ? (
                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                {catPrices.map((cp) => (
                                                    <p key={cp.price_type_id}>
                                                        ${parseFloat(cp.service_charge as any).toFixed(2)} | ${parseFloat(cp.bank_commission as any).toFixed(2)} | ${parseFloat(cp.admin_fee as any).toFixed(2)}
                                                    </p>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">$0.00 | $0.00 | $0.00</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

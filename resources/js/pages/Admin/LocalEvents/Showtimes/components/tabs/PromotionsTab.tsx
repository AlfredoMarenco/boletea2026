import { router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { Event, Showtime } from '../../types';

interface Props {
    event: Event;
    showtime: Showtime;
}

export default function PromotionsTab({ event, showtime }: Props) {
    const promoForm = useForm({
        name: '',
        code: '',
        type: 'percentage_discount',
        value: 0,
        usage_limit: '',
        is_active: true,
    });

    const handleCreatePromo = (e: React.FormEvent) => {
        e.preventDefault();
        promoForm.post(route('admin.local-events.showtimes.promotions.store', [event.id, showtime.id]), {
            onSuccess: () => promoForm.reset(),
        });
    };

    const handleDeletePromotion = (promoId: number) => {
        if (confirm('¿Eliminar esta promoción?')) {
            router.delete(route('admin.local-events.showtimes.promotions.destroy', [event.id, showtime.id, promoId]));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold">Promociones y Descuentos Específicos</h3>
                    <p className="text-xs text-muted-foreground">
                        Crea códigos promocionales, ofertas 2x1 o cupones de descuento válidos únicamente para esta función.
                    </p>
                </div>
            </div>

            <form onSubmit={handleCreatePromo} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-900 space-y-4">
                <span className="font-bold text-sm">Nueva Promoción / Código</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="p_name" className="text-xs">Nombre Promoción</Label>
                        <Input
                            id="p_name"
                            value={promoForm.data.name}
                            onChange={(e) => promoForm.setData('name', e.target.value)}
                            placeholder="Ej: Descuento Preventa"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="p_code" className="text-xs">Código Cupón</Label>
                        <Input
                            id="p_code"
                            value={promoForm.data.code}
                            onChange={(e) => promoForm.setData('code', e.target.value.toUpperCase())}
                            placeholder="PROMO20"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="p_type" className="text-xs">Tipo Oferta</Label>
                        <Select
                            value={promoForm.data.type}
                            onValueChange={(val) => promoForm.setData('type', val)}
                        >
                            <SelectTrigger className="bg-card">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage_discount">Porcentaje Descuento (%)</SelectItem>
                                <SelectItem value="fixed_discount">Monto Fijo Descuento ($)</SelectItem>
                                <SelectItem value="2x1">Promoción 2x1</SelectItem>
                                <SelectItem value="access_code">Código de Acceso Especial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="p_val" className="text-xs">Valor / %</Label>
                        <Input
                            id="p_val"
                            type="number"
                            step="0.01"
                            value={promoForm.data.value}
                            onChange={(e) => promoForm.setData('value', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={promoForm.processing} size="sm" className="bg-[#c90000] text-white font-bold gap-2">
                        <Plus className="h-4 w-4" />
                        Agregar Promoción
                    </Button>
                </div>
            </form>

            <div className="rounded-xl border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900/60">
                            <TableHead className="font-bold">Código</TableHead>
                            <TableHead className="font-bold">Nombre</TableHead>
                            <TableHead className="font-bold">Tipo</TableHead>
                            <TableHead className="font-bold">Valor</TableHead>
                            <TableHead className="font-bold">Estado</TableHead>
                            <TableHead className="text-right font-bold">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {showtime.promotions && showtime.promotions.length > 0 ? (
                            showtime.promotions.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-mono font-bold text-xs">{p.code || '-'}</TableCell>
                                    <TableCell className="font-semibold text-xs">{p.name}</TableCell>
                                    <TableCell className="text-xs">{p.type}</TableCell>
                                    <TableCell className="font-bold text-xs">
                                        {p.type === 'percentage_discount' ? `${p.value}%` : `$${p.value}`}
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            {p.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:bg-red-50"
                                            onClick={() => handleDeletePromotion(p.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                                    No hay promociones registradas para esta función.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

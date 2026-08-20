import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Users, Layers, Loader2 } from 'lucide-react';
import ShowtimeInteractiveMap from '../ShowtimeInteractiveMap';
import { Event, Showtime } from '../../types';

interface Props {
    event: Event;
    showtime: Showtime;
}

interface CapacityNodeInfo {
    id: string;
    name: string;
    capacity: number;
    soldCount: number;
    reservedCount: number;
    blockedCount: number;
    committedCount: number;
    minAllowed: number;
}

export default function AvailabilityMapTab({ event, showtime }: Props) {
    const inventories = showtime.seat_inventories || [];
    const stats = {
        total: inventories.length,
        available: inventories.filter((i) => i.status === 'available').length,
        sold: inventories.filter((i) => i.status === 'sold').length,
        reserved: inventories.filter((i) => i.status === 'reserved').length,
        disabled: inventories.filter((i) => ['disabled', 'hidden', 'hold_courtesy'].includes(i.status)).length,
    };

    const [selectedSeatUuids, setSelectedSeatUuids] = useState<string[]>([]);
    const [mapMode, setMapMode] = useState<'status' | 'category'>('status');
    const [newSeatStatus, setNewSeatStatus] = useState<string>('available');
    const [newSeatCategory, setNewSeatCategory] = useState<string>('');

    // Estado para el modal UI/UX elegante de Aforo de Sección General con métricas detalladas
    const [editingCapacityNode, setEditingCapacityNode] = useState<CapacityNodeInfo | null>(null);
    const [capacityValue, setCapacityValue] = useState<number | string>(0);
    const [isSavingCapacity, setIsSavingCapacity] = useState<boolean>(false);

    const handleUpdateSeatStatus = () => {
        if (selectedSeatUuids.length === 0) return;
        router.post(
            route('admin.local-events.showtimes.seats.status', [event.id, showtime.id]),
            {
                seat_uuids: selectedSeatUuids,
                status: newSeatStatus,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setSelectedSeatUuids([]),
            }
        );
    };

    const handleUpdateSeatCategory = () => {
        if (selectedSeatUuids.length === 0 || !newSeatCategory) return;
        router.post(
            route('admin.local-events.showtimes.seats.category', [event.id, showtime.id]),
            {
                seat_uuids: selectedSeatUuids,
                category: newSeatCategory,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setSelectedSeatUuids([]),
            }
        );
    };

    const handleOpenCapacityModal = (node: any) => {
        const nodeName = node.section || node.name || node.title || 'Sección General';
        const currentCap = node.capacity || 0;
        const nodeId = node.id;

        // Filtrar los boletos de inventario asociados a esta sección
        const sectionInventories = inventories.filter((i) => {
            if (nodeId && i.seat_uuid.startsWith(`gen-${nodeId}-`)) return true;
            return i.section === nodeName || i.category === nodeName;
        });

        const soldCount = sectionInventories.filter((i) => i.status === 'sold').length;
        const reservedCount = sectionInventories.filter((i) => i.status === 'reserved').length;
        const blockedCount = sectionInventories.filter((i) => ['hold_courtesy', 'disabled', 'hidden'].includes(i.status)).length;
        
        const committedCount = soldCount + reservedCount + blockedCount;
        const minAllowed = committedCount;

        setEditingCapacityNode({
            id: nodeId,
            name: nodeName,
            capacity: currentCap,
            soldCount,
            reservedCount,
            blockedCount,
            committedCount,
            minAllowed,
        });
        setCapacityValue(currentCap);
    };

    const handleSaveGeneralCapacity = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCapacityNode) return;

        const parsedCap = parseInt(String(capacityValue));
        if (isNaN(parsedCap) || parsedCap < editingCapacityNode.minAllowed) return;

        setIsSavingCapacity(true);

        router.post(
            route('admin.local-events.showtimes.general-capacity.update', [event.id, showtime.id]),
            {
                section_node_id: editingCapacityNode.id,
                capacity: parsedCap,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setEditingCapacityNode(null);
                    setIsSavingCapacity(false);
                },
                onError: () => setIsSavingCapacity(false),
                onFinish: () => setIsSavingCapacity(false),
            }
        );
    };

    const isBelowMinimum = editingCapacityNode !== null && Number(capacityValue) < editingCapacityNode.minAllowed;

    return (
        <div className="space-y-4">
            {/* Tarjetas KPI compactas con diseño optimizado */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="rounded-lg border px-3 py-2.5 bg-card flex items-center justify-between shadow-xs">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total</span>
                    <span className="text-lg font-black">{stats.total}</span>
                </div>
                <div className="rounded-lg border px-3 py-2.5 bg-emerald-500/10 border-emerald-500/20 flex items-center justify-between shadow-xs">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Disponibles</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.available}</span>
                </div>
                <div className="rounded-lg border px-3 py-2.5 bg-blue-500/10 border-blue-500/20 flex items-center justify-between shadow-xs">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Vendidos</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">{stats.sold}</span>
                </div>
                <div className="rounded-lg border px-3 py-2.5 bg-amber-500/10 border-amber-500/20 flex items-center justify-between shadow-xs">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Reservados</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">{stats.reserved}</span>
                </div>
                <div className="rounded-lg border px-3 py-2.5 bg-purple-500/10 border-purple-500/20 col-span-2 sm:col-span-1 flex items-center justify-between shadow-xs">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Bloq. / Ocultos</span>
                    <span className="text-lg font-black text-purple-600 dark:text-purple-400">{stats.disabled}</span>
                </div>
            </div>

            {/* Cintillo de Control Unificado UI/UX */}
            <div className="rounded-xl border p-3 bg-card shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Selector de Modo y contador de Selección */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg shrink-0 border">
                        <button
                            type="button"
                            onClick={() => setMapMode('status')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                mapMode === 'status'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            🔴 Modo Estatus
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapMode('category')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                                mapMode === 'category'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            🏷️ Modo Categoría
                        </button>
                    </div>

                    <div className="text-xs">
                        {selectedSeatUuids.length > 0 ? (
                            <span className="font-bold text-[#c90000] bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                                {selectedSeatUuids.length} asientos seleccionados
                            </span>
                        ) : (
                            <span className="text-muted-foreground italic hidden sm:inline">
                                Haz clic o arrastra para seleccionar asientos
                            </span>
                        )}
                    </div>
                </div>

                {/* Acciones de Selección y Cambio */}
                <div className="flex items-center gap-2 justify-end">
                    {selectedSeatUuids.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSeatUuids([])}
                            className="text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground"
                        >
                            Limpiar Selección
                        </Button>
                    )}

                    {mapMode === 'status' ? (
                        <>
                            <Select value={newSeatStatus} onValueChange={setNewSeatStatus}>
                                <SelectTrigger className="w-48 h-8 text-xs font-medium bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Disponible (Venta)</SelectItem>
                                    <SelectItem value="disabled">Desactivado / No Disponible</SelectItem>
                                    <SelectItem value="hidden">Oculto / Invisible</SelectItem>
                                    <SelectItem value="hold_courtesy">Bloqueo Cortesía</SelectItem>
                                    <SelectItem value="box_office_only">Solo Taquilla</SelectItem>
                                    <SelectItem value="web_only">Solo Web</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={handleUpdateSeatStatus}
                                disabled={selectedSeatUuids.length === 0}
                                size="sm"
                                className="bg-[#c90000] hover:bg-[#a00000] text-white font-bold h-8 px-3.5 text-xs shadow-xs"
                            >
                                Aplicar Estatus ({selectedSeatUuids.length})
                            </Button>
                        </>
                    ) : (
                        <>
                            <Select value={newSeatCategory} onValueChange={setNewSeatCategory}>
                                <SelectTrigger className="w-48 h-8 text-xs font-medium bg-background">
                                    <SelectValue placeholder="Seleccionar Categoría..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(showtime.prices || []).map((p: any) => (
                                        <SelectItem key={p.id || p.name} value={p.name}>
                                            <div className="flex items-center gap-2">
                                                {p.color && (
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full border shrink-0"
                                                        style={{ backgroundColor: p.color }}
                                                    />
                                                )}
                                                <span>{p.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={handleUpdateSeatCategory}
                                disabled={selectedSeatUuids.length === 0 || !newSeatCategory}
                                size="sm"
                                className="bg-[#c90000] hover:bg-[#a00000] text-white font-bold h-8 px-3.5 text-xs shadow-xs"
                            >
                                Aplicar Categoría ({selectedSeatUuids.length})
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <ShowtimeInteractiveMap
                showtime={showtime}
                inventories={inventories}
                selectedSeatUuids={selectedSeatUuids}
                mapMode={mapMode}
                onSetSelectedSeatUuids={setSelectedSeatUuids}
                onToggleSeat={(uuid) => {
                    setSelectedSeatUuids((prev) =>
                        prev.includes(uuid)
                            ? prev.filter((id) => id !== uuid)
                            : [...prev, uuid]
                    );
                }}
                onEditGeneralCapacity={handleOpenCapacityModal}
            />

            {/* Modal UI/UX Elegante para Modificar Aforo de Sección General */}
            <Dialog open={!!editingCapacityNode} onOpenChange={(open) => { if (!open) setEditingCapacityNode(null); }}>
                <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl rounded-2xl p-6">
                    <DialogHeader className="space-y-1.5 text-left">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-foreground">Aforo de Sección General</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Ajusta la capacidad de boletos disponibles para esta zona no numerada.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSaveGeneralCapacity} className="space-y-4 pt-2">
                        {/* Tarjeta de Métricas y Cálculos de Aforo */}
                        <div className="rounded-xl bg-muted/40 p-3 border border-border/50 space-y-2 text-xs">
                            <div className="flex items-center justify-between font-bold border-b border-border/40 pb-1.5">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Layers className="h-4 w-4 text-slate-500" />
                                    {editingCapacityNode?.name}
                                </span>
                                <span className="text-foreground">
                                    Aforo Actual: <strong className="text-primary">{editingCapacityNode?.capacity}</strong>
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-1.5">
                                    <span className="text-[10px] uppercase font-bold block text-blue-700 dark:text-blue-400">Vendidos</span>
                                    <span className="font-black text-sm text-blue-600 dark:text-blue-400">{editingCapacityNode?.soldCount}</span>
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-1.5">
                                    <span className="text-[10px] uppercase font-bold block text-amber-700 dark:text-amber-400">En Reserva</span>
                                    <span className="font-black text-sm text-amber-600 dark:text-amber-400">{editingCapacityNode?.reservedCount}</span>
                                </div>

                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-1.5">
                                    <span className="text-[10px] uppercase font-bold block text-purple-700 dark:text-purple-400">Bloqueos</span>
                                    <span className="font-black text-sm text-purple-600 dark:text-purple-400">{editingCapacityNode?.blockedCount}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40 font-semibold">
                                <span className="text-muted-foreground">Mínimo Permitido (Comprometido):</span>
                                <span className="font-black text-rose-600 dark:text-rose-400">
                                    {editingCapacityNode?.minAllowed} personas
                                </span>
                            </div>
                        </div>

                        {/* Input y Alerta de Validación */}
                        <div className="space-y-2">
                            <Label htmlFor="capacity_input" className="text-xs font-bold text-foreground">
                                Nueva Capacidad (Aforo Total)
                            </Label>
                            <div className="relative">
                                <Input
                                    id="capacity_input"
                                    type="number"
                                    min={editingCapacityNode?.minAllowed || 0}
                                    step="1"
                                    autoFocus
                                    value={capacityValue}
                                    onChange={(e) => setCapacityValue(e.target.value)}
                                    placeholder="Ej. 500"
                                    className={`h-10 text-sm font-bold pl-9 bg-background focus-visible:ring-primary ${
                                        isBelowMinimum ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                                    }`}
                                />
                                <Users className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                            </div>

                            {isBelowMinimum ? (
                                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                    ⚠️ No puedes reducir el aforo a menos de {editingCapacityNode?.minAllowed} personas ya que existen boletos vendidos o en transacción.
                                </p>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">
                                    Al guardar, se actualizará el aforo total disponible para esta sección general.
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/40">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingCapacityNode(null)}
                                disabled={isSavingCapacity}
                                className="h-9 text-xs font-bold"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSavingCapacity || capacityValue === '' || isBelowMinimum}
                                className="h-9 text-xs font-bold bg-[#c90000] hover:bg-[#a00000] text-white gap-1.5 shadow-xs disabled:opacity-50"
                            >
                                {isSavingCapacity ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <span>Guardar Capacidad</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { useMemo, useRef, useState, useCallback } from 'react';
import SeatingCanvas, { SeatingCanvasRef, getPolygonCentroid } from '@/components/SeatingBuilder/SeatingCanvas';
import { Showtime, SeatInventoryItem, Price } from '../types';
import { cn } from '@/lib/utils';
import {
    Ticket,
    Tag,
    DollarSign,
    ShieldAlert,
    Layers,
    Sparkles,
    CheckCircle2,
    XCircle,
    Clock,
    Lock,
    EyeOff,
    Store,
    Globe
} from 'lucide-react';

interface TooltipState {
    seatNode: any;
    item?: SeatInventoryItem;
    category?: string;
    section?: string;
    row?: string;
    number?: string;
    webPrice?: number;
    boxOfficePrice?: number;
    printedPrice?: number;
    statusLabel: string;
    statusBadgeColor: string;
    categoryColor: string;
    x: number;
    y: number;
}

export default function ShowtimeInteractiveMap({
    showtime,
    inventories,
    selectedSeatUuids,
    mapMode = 'status',
    isCustomerView = false,
    onSetSelectedSeatUuids,
    onEditGeneralCapacity,
}: {
    showtime: Showtime;
    inventories: SeatInventoryItem[] | Record<string, SeatInventoryItem>;
    selectedSeatUuids: string[];
    mapMode?: 'status' | 'category';
    isCustomerView?: boolean;
    onToggleSeat?: (uuid: string) => void;
    onSetSelectedSeatUuids?: (uuids: string[]) => void;
    onEditGeneralCapacity?: (node: any) => void;
}) {
    const canvasRef = useRef<SeatingCanvasRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    const snapshot = useMemo(() => {
        return showtime.layout_snapshot || showtime.seating_map?.layout_json || { nodes: [], config: {} };
    }, [showtime]);

    const categories = snapshot.config?.categories || [];
    const nodes = snapshot.nodes || [];

    const inventoryMap = useMemo(() => {
        const map: Record<string, SeatInventoryItem> = {};
        if (Array.isArray(inventories)) {
            inventories.forEach((item) => {
                if (item?.seat_uuid) {
                    map[item.seat_uuid] = item;
                }
            });
        } else if (inventories && typeof inventories === 'object') {
            Object.entries(inventories).forEach(([uuid, item]) => {
                map[uuid] = {
                    ...item,
                    seat_uuid: item.seat_uuid || uuid,
                };
            });
        }
        return map;
    }, [inventories]);

    // Mapa de Categoría -> Precios (Web & Taquilla) agrupados por el nombre exacto de la categoría
    const categoryPricesMap = useMemo(() => {
        const map: Record<string, {
            webPrice?: number;
            boxOfficePrice?: number;
            printedPrice?: number;
            prices: Price[];
        }> = {};

        (showtime.prices || []).forEach((p: Price) => {
            if (!p.name || p.is_enabled === false) return;
            const key = p.name.trim().toLowerCase();
            if (!map[key]) {
                map[key] = { prices: [] };
            }
            map[key].prices.push(p);
        });

        Object.keys(map).forEach((key) => {
            const catPrices = map[key].prices;

            const webDefault = catPrices.find((p) => p.is_web_default && p.web_sales_enabled !== false);
            const webFirst = catPrices.find((p) => p.web_sales_enabled !== false);
            const posDefault = catPrices.find((p) => p.is_pos_default && p.box_office_sales_enabled !== false);
            const posFirst = catPrices.find((p) => p.box_office_sales_enabled !== false);
            const fallback = catPrices[0];

            const targetWeb = webDefault || webFirst || fallback;
            const targetPos = posDefault || posFirst || fallback;

            if (targetWeb && targetWeb.price !== undefined && targetWeb.price !== null) {
                map[key].webPrice = Number(targetWeb.price);
            }
            if (targetPos && targetPos.price !== undefined && targetPos.price !== null) {
                map[key].boxOfficePrice = Number(targetPos.price);
            }

            const activePrintedPrice = targetWeb?.printed_price ?? targetPos?.printed_price;
            if (activePrintedPrice !== undefined && activePrintedPrice !== null) {
                map[key].printedPrice = Number(activePrintedPrice);
            }
        });

        return map;
    }, [showtime.prices]);

    // Map category_id from layout snapshot to category object
    const snapshotCategoriesById = useMemo(() => {
        const map: Record<string, any> = {};
        categories.forEach((cat: any) => {
            if (cat.id) map[cat.id] = cat;
            if (cat.name) map[cat.name] = cat;
        });
        return map;
    }, [categories]);

    const categoryColors = useMemo(() => {
        const colors: Record<string, string> = {};
        categories.forEach((cat: any) => {
            if (cat.name) colors[cat.name] = cat.color || '#64748b';
        });
        (showtime.prices || []).forEach((p: any) => {
            if (p.color && p.name) {
                colors[p.name] = p.color;
            }
        });
        return colors;
    }, [categories, showtime.prices]);

    const getStatusInfo = useCallback((item?: SeatInventoryItem) => {
        const status = item?.status || 'available';
        switch (status) {
            case 'available':
                return { label: 'Disponible', color: '#10b981', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
            case 'sold':
                return { label: 'Vendido', color: '#3b82f6', bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30', icon: Ticket };
            case 'reserved':
                return { label: 'Reservado', color: '#f59e0b', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', icon: Clock };
            case 'disabled':
                return { label: 'Desactivado', color: '#94a3b8', bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30', icon: XCircle };
            case 'hidden':
                return { label: 'Oculto', color: '#475569', bg: 'bg-slate-700/15 text-slate-400 dark:text-slate-400 border-slate-700/30', icon: EyeOff };
            case 'hold_courtesy':
                return { label: 'Bloqueo Cortesía', color: '#8b5cf6', bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30', icon: Lock };
            case 'box_office_only':
                return { label: 'Solo Taquilla', color: '#06b6d4', bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30', icon: Store };
            case 'web_only':
                return { label: 'Solo Web', color: '#6366f1', bg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30', icon: Globe };
            default:
                return { label: 'Disponible', color: '#10b981', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
        }
    }, []);

    const getStatusColor = (item?: SeatInventoryItem, isSelected?: boolean, baseColor?: string) => {
        if (isSelected) return '#c90000';
        if (!item) return baseColor || '#94a3b8';

        switch (item.status) {
            case 'available':
                return baseColor || '#10b981';
            case 'disabled':
                return '#94a3b8';
            case 'hidden':
                return '#475569';
            case 'hold_courtesy':
                return '#8b5cf6';
            case 'sold':
                return '#3b82f6';
            case 'reserved':
                return '#f59e0b';
            case 'box_office_only':
                return '#06b6d4';
            case 'web_only':
                return '#6366f1';
            default:
                return baseColor || '#94a3b8';
        }
    };

    const displayLayout = useMemo(() => {
        const processedNodes = nodes.map((node: any) => {
            if (node.type === 'seat') {
                const item = inventoryMap[node.id];
                const isSelected = selectedSeatUuids.includes(node.id);

                const currentCategory = (node.category_id && snapshotCategoriesById[node.category_id]?.name) || (item?.category && item.category !== item?.section ? item.category : undefined) || node.category || node.section || 'General';
                const baseColor = categoryColors[currentCategory] || node.fill || '#64748b';

                let color = baseColor;
                if (mapMode === 'status') {
                    color = getStatusColor(item, isSelected, baseColor);
                } else {
                    if (isSelected) color = '#c90000';
                }

                const isHiddenStatus = item?.status === 'hidden';

                return {
                    ...node,
                    fill: color,
                    stroke: isSelected ? '#ffffff' : (isHiddenStatus ? '#ef4444' : (node.stroke || '#475569')),
                    strokeWidth: isSelected ? 3 : (isHiddenStatus ? 2 : 1),
                    opacity: isHiddenStatus ? 0.6 : 1,
                };
            }
            return node;
        });

        return {
            ...snapshot,
            nodes: processedNodes,
        };
    }, [nodes, snapshot, inventoryMap, selectedSeatUuids, categoryColors, mapMode, snapshotCategoriesById]);

    const handleSeatHover = useCallback((node: any | null, e?: any) => {
        if (!node || node.type !== 'seat') {
            setTooltip(null);
            return;
        }

        const item = inventoryMap[node.id];

        // Resolución estricta de Categoría:
        // 1. Priorizar category_id del nodo del mapa (layout snapshot)
        // 2. Si item.category existe y no coincide con la sección (evita contaminación por B1/B3)
        // 3. Fallback a node.category o node.section
        let categoryName: string | undefined = undefined;
        if (node.category_id && snapshotCategoriesById[node.category_id]?.name) {
            categoryName = snapshotCategoriesById[node.category_id].name;
        } else if (item?.category && item.category !== item?.section && item.category !== node.section) {
            categoryName = item.category;
        } else if (node.category) {
            categoryName = node.category;
        } else {
            categoryName = node.section || 'General';
        }

        // Resolución de Sección/Zona (ubicación geográfica)
        const sectionName = node.section || item?.section || 'Zona General';

        // Buscar información de precio estrictamente por nombre de categoría
        const catKey = categoryName.trim().toLowerCase();
        const categoryPriceData = categoryPricesMap[catKey];

        let webPriceVal: number | undefined = categoryPriceData?.webPrice;
        let boxOfficePriceVal: number | undefined = categoryPriceData?.boxOfficePrice;
        let printedPriceVal: number | undefined = categoryPriceData?.printedPrice;

        // Override a nivel asiento si seat_inventory tiene un precio asignado específico
        if (item && item.price !== undefined && item.price !== null && Number(item.price) > 0) {
            webPriceVal = Number(item.price);
            boxOfficePriceVal = Number(item.price);
        }

        const statusInfo = getStatusInfo(item);
        const catColor = categoryColors[categoryName] || node.fill || '#64748b';

        // Calculate absolute position relative to wrapper container
        let x = 0;
        let y = 0;

        if (e && containerRef.current) {
            const stage = e.target.getStage();
            if (stage) {
                const pointerPos = stage.getPointerPosition();
                if (pointerPos) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const stageRect = stage.container().getBoundingClientRect();
                    x = (stageRect.left - rect.left) + pointerPos.x;
                    y = (stageRect.top - rect.top) + pointerPos.y;
                }
            }
        }

        setTooltip({
            seatNode: node,
            item,
            category: categoryName,
            section: sectionName,
            row: node.row || item?.row || '-',
            number: node.number || node.name || item?.number || '-',
            webPrice: webPriceVal,
            boxOfficePrice: boxOfficePriceVal,
            printedPrice: printedPriceVal,
            statusLabel: statusInfo.label,
            statusBadgeColor: statusInfo.bg,
            categoryColor: catColor,
            x,
            y,
        });
    }, [inventoryMap, categoryPricesMap, snapshotCategoriesById, categoryColors, getStatusInfo]);

    // Lista de Secciones/Zonas disponibles en el mapa para el navegador de zoom rápido
    const availableSections = useMemo(() => {
        const set = new Set<string>();
        nodes.forEach((n: any) => {
            if (n.section) set.add(n.section);
            if (n.name && ['section_container', 'block', 'zone', 'rect', 'circle_zone'].includes(n.type)) {
                set.add(n.name);
            }
        });
        return Array.from(set).sort();
    }, [nodes]);

    // Función para centrar y hacer zoom in automático a una sección o contenedor
    const zoomToNodeOrSection = useCallback((target: any) => {
        if (!target) return;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        let targetNode = typeof target === 'string'
            ? nodes.find((n: any) => n.id === target || n.name === target || n.section === target)
            : target;

        if (!targetNode) return;

        const sectionName = typeof target === 'string' ? target : (targetNode.name || targetNode.section);

        // 1. Si el objetivo es una sección o contenedor (polígono, zona o bloque)
        if (targetNode.points && targetNode.points.length >= 6) {
            const centroid = getPolygonCentroid(targetNode.points);
            const scaleX = targetNode.scaleX ?? 1;
            const scaleY = targetNode.scaleY ?? 1;

            minX = targetNode.x + centroid.minX * scaleX;
            maxX = targetNode.x + centroid.maxX * scaleX;
            minY = targetNode.y + centroid.minY * scaleY;
            maxY = targetNode.y + centroid.maxY * scaleY;
        } else if (targetNode.type === 'seat') {
            // Si el objetivo directo fue un asiento individual
            const r = targetNode.radius || 10;
            minX = targetNode.x - r;
            maxX = targetNode.x + r;
            minY = targetNode.y - r;
            maxY = targetNode.y + r;
        } else {
            const w = targetNode.width || (targetNode.radius ? targetNode.radius * 2 : 40);
            const h = targetNode.height || (targetNode.radius ? targetNode.radius * 2 : 40);
            const ox = targetNode.radius ? -targetNode.radius : 0;
            const oy = targetNode.radius ? -targetNode.radius : 0;
            minX = targetNode.x + ox;
            maxX = targetNode.x + ox + w;
            minY = targetNode.y + oy;
            maxY = targetNode.y + oy + h;
        }

        // 2. Si la sección tiene asientos numerados asignados explícitamente (ej: n.section === "B1")
        if (sectionName) {
            const seatsInSection = nodes.filter((n: any) => n.type === 'seat' && n.section === sectionName);
            if (seatsInSection.length > 0) {
                seatsInSection.forEach((s: any) => {
                    const r = s.radius || 10;
                    minX = Math.min(minX, s.x - r);
                    maxX = Math.max(maxX, s.x + r);
                    minY = Math.min(minY, s.y - r);
                    maxY = Math.max(maxY, s.y + r);
                });
            }
        }

        if (minX !== Infinity && maxX !== -Infinity) {
            canvasRef.current?.zoomToBoundingBox({
                minX,
                minY,
                maxX,
                maxY,
            });
        }
    }, [nodes]);

    return (
        <div ref={containerRef} className="relative flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden shadow-sm h-[750px] min-h-[600px]">
            <div className="relative flex-1 h-full w-full overflow-hidden bg-background">
                {/* Selector Rápido de Sección y Control de Centrado */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-md p-1.5 rounded-xl border border-border shadow-lg">
                    {availableSections.length > 0 && (
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    zoomToNodeOrSection(e.target.value);
                                }
                            }}
                            defaultValue=""
                            className="h-8 text-xs font-semibold bg-background text-foreground border border-border/60 rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer"
                        >
                            <option value="" disabled>📍 Ir a Sección / Zona...</option>
                            {availableSections.map((sec) => (
                                <option key={sec} value={sec}>
                                    {sec}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        type="button"
                        onClick={() => canvasRef.current?.fitView()}
                        className="h-8 px-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-lg border border-border/60 flex items-center gap-1.5 transition-all shadow-xs"
                        title="Centrar mapa completo"
                    >
                        <span>🎯</span>
                        <span className="hidden sm:inline">Vista General</span>
                    </button>
                </div>

                <SeatingCanvas
                    ref={canvasRef}
                    layout={displayLayout as any}
                    onChange={() => {}}
                    mode="preview"
                    externalSelectedIds={selectedSeatUuids}
                    onSeatHover={handleSeatHover}
                    onSelectionChange={(selectedIds) => {
                        const ids = selectedIds || [];

                        if (ids.length === 1) {
                            const firstId = ids[0];
                            const targetNode = nodes.find((n: any) => n.id === firstId);

                            if (targetNode) {
                                // 1. Sección General de Aforo No Numerado
                                if (targetNode.sectionType === 'general' || (targetNode.capacity !== undefined && targetNode.capacity > 0)) {
                                    onEditGeneralCapacity?.(targetNode);
                                    return;
                                }

                                // 2. Contenedor de Sección o Bloque de Asientos Numerados: Zoom In y Centrado automático
                                if (['section_container', 'block', 'row', 'table', 'zone', 'rect', 'circle_zone'].includes(targetNode.type)) {
                                    zoomToNodeOrSection(targetNode);
                                    return;
                                }
                            }
                        }

                        const seatIds = ids.filter((id) => {
                            const n = nodes.find((node: any) => node.id === id);
                            return !n || n.type === 'seat';
                        });

                        if (onSetSelectedSeatUuids) {
                            onSetSelectedSeatUuids(seatIds);
                        }
                    }}
                />

                {/* Micro Tooltip de Asiento Inteligente y Elegante */}
                {tooltip && (
                    <div
                        className="pointer-events-none absolute z-50 transition-all duration-75 ease-out"
                        style={{
                            left: `${Math.min(Math.max(tooltip.x, 140), (containerRef.current?.clientWidth || 800) - 140)}px`,
                            top: `${tooltip.y - 22}px`,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <div className="w-64 rounded-xl border border-slate-200 dark:border-white/15 bg-background/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 shadow-xl ring-1 ring-black/5 dark:ring-white/10 space-y-2.5">
                            {/* Header: Número de Asiento & Badge de Estado */}
                            <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                                <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-black">
                                        {tooltip.number}
                                    </span>
                                    <span>Asiento {tooltip.number}</span>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${tooltip.statusBadgeColor}`}>
                                    {tooltip.statusLabel}
                                </span>
                            </div>

                            {/* Detalles Principales: Fila & Zona */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 p-1.5 rounded-lg border border-border/40">
                                    <Layers className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                                    <div className="truncate">
                                        <span className="text-[10px] block text-muted-foreground uppercase font-semibold">Fila</span>
                                        <span className="font-bold text-foreground">{tooltip.row}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 p-1.5 rounded-lg border border-border/40">
                                    <Tag className="h-3.5 w-3.5 shrink-0" style={{ color: tooltip.categoryColor }} />
                                    <div className="truncate">
                                        <span className="text-[10px] block text-muted-foreground uppercase font-semibold">Zona</span>
                                        <span className="font-bold text-foreground truncate block">{tooltip.section}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Categoría y Desglose de Precios */}
                            <div className="pt-0.5 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-amber-500" /> Categoría:
                                    </span>
                                    <span className="font-bold text-foreground flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full inline-block shadow-xs" style={{ backgroundColor: tooltip.categoryColor }} />
                                        {tooltip.category}
                                    </span>
                                </div>

                                <div className="rounded-lg bg-muted/40 p-2 border border-border/40 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium text-[11px]">
                                            <Globe className="h-3.5 w-3.5 text-indigo-500" /> Precio Web:
                                        </span>
                                        <span className={cn(
                                            "font-black text-xs",
                                            tooltip.webPrice !== undefined
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-muted-foreground italic font-normal"
                                        )}>
                                            {tooltip.webPrice !== undefined ? `$${Number(tooltip.webPrice).toFixed(2)}` : 'Sin Asignar'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-border/30 pt-1.5">
                                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium text-[11px]">
                                            <Store className="h-3.5 w-3.5 text-cyan-500" /> Precio Taquilla:
                                        </span>
                                        <span className={cn(
                                            "font-black text-xs",
                                            tooltip.boxOfficePrice !== undefined
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-muted-foreground italic font-normal"
                                        )}>
                                            {tooltip.boxOfficePrice !== undefined ? `$${Number(tooltip.boxOfficePrice).toFixed(2)}` : 'Sin Asignar'}
                                        </span>
                                    </div>

                                    {tooltip.printedPrice !== undefined && tooltip.printedPrice > 0 && (
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/30 pt-1">
                                            <span>Precio Impreso:</span>
                                            <span className="font-semibold text-foreground">${Number(tooltip.printedPrice).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Flechita del Tooltip */}
                        <div className="w-3 h-3 bg-background dark:bg-slate-900 border-r border-b border-slate-200 dark:border-white/15 rotate-45 mx-auto -mt-1.5 shadow-xs" />
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => canvasRef.current?.fitView()}
                    className="absolute bottom-3 right-3 z-10 bg-background/90 backdrop-blur-xs hover:bg-background border border-border text-foreground font-semibold text-xs px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                    title="Centrar mapa en pantalla"
                >
                    <span>🎯</span>
                    <span>Centrar Mapa</span>
                </button>
            </div>

            {/* Leyenda de Estatus / Simbología visual del Mapa */}
            <div className="border-t bg-muted/40 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-muted-foreground uppercase text-[10px] tracking-wider shrink-0">
                    <span>Simbología de Estatus:</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#10b981] border border-emerald-600 inline-block shrink-0" />
                        <span className="font-medium text-foreground">Disponible</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#3b82f6] border border-blue-600 inline-block shrink-0" />
                        <span className="font-medium text-foreground">Vendido</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#f59e0b] border border-amber-600 inline-block shrink-0" />
                        <span className="font-medium text-foreground">Reservado</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#94a3b8] border border-slate-500 inline-block shrink-0" />
                        <span className="font-medium text-foreground">Desactivado</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#475569] border border-red-500 border-2 inline-block shrink-0 opacity-70" />
                        <span className="font-medium text-foreground">Oculto</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#8b5cf6] border border-violet-600 inline-block shrink-0" />
                        <span className="font-medium text-foreground">Bloqueo Cortesía</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#06b6d4] border border-cyan-600 inline-block shrink-0" />
                        <span className="font-medium text-foreground">Solo Taquilla</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#6366f1] border border-indigo-600 inline-block shrink-0" />
                        <span className="font-medium text-foreground">Solo Web</span>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                        <span className="h-3 w-3 rounded-full bg-[#c90000] border border-white inline-block shrink-0 shadow-xs" />
                        <span className="font-bold text-[#c90000]">Seleccionado</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


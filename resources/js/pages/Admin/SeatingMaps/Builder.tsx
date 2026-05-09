import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import SeatingCanvas from '@/components/SeatingBuilder/SeatingCanvas';
import Inspector from '@/components/SeatingBuilder/Inspector';
import CalibrationWizard from '@/components/SeatingBuilder/CalibrationWizard';
import { Button } from '@/components/ui/button';
import { 
    Save, Eye, Edit3, Settings, MousePointer2, Grid, Square, LayoutList,
    Circle as CircleIcon, Type, Trash2, Undo2, Redo2, Hexagon, PenTool, Hand, Maximize2,
    ChevronRight, MoreHorizontal, Users, Image as ImageIcon, Plus, Layers, AlertTriangle
} from 'lucide-react';
import { 
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

interface SeatingMap {
    id: number;
    name: string;
    layout_json: any;
    venue: {
        name: string;
    };
}

interface Props {
    seatingMap: SeatingMap;
}

const isPointInRect = (px: number, py: number, rx: number, ry: number, rw: number, rh: number) => {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};

const isPointInPolygon = (px: number, py: number, points: number[], offsetX = 0, offsetY = 0) => {
    let inside = false;
    for (let i = 0, j = points.length - 2; i < points.length; i += 2) {
        const xi = points[i] + offsetX, yi = points[i+1] + offsetY;
        const xj = points[j] + offsetX, yj = points[j+1] + offsetY;
        const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
        j = i;
    }
    return inside;
};

export default function Builder({ seatingMap }: Props) {
    const canvasRef = useRef<any>();
    const [layout, setLayout] = useState(seatingMap.layout_json || { nodes: [], config: {} });
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'seat' | 'row' | 'honeycomb' | 'rect' | 'circle_zone' | 'zone' | 'text' | 'section_container'>('select');
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
    const [openPopover, setOpenPopover] = useState<'seating' | 'shapes' | null>(null);

    const handleSave = () => {
        setIsSaving(true);
        router.put(route('admin.seating-maps.update', seatingMap.id), {
            layout_json: layout
        }, {
            onSuccess: () => {
                toast.success('Mapa guardado correctamente');
                setIsSaving(false);
            },
            onError: () => {
                toast.error('Error al guardar el mapa');
                setIsSaving(false);
            }
        });
    };

    const handleUpdateNodes = useCallback((properties: any) => {
        // Detect if these are structural changes that require re-generation
        const structuralFields = [
            'numSeats', 'curve', 'seatSpacing', 'rowSpacing', 
            'row', 'rowLabelStart', 'rowLabelType', 'rowLabelSkip',
            'seatLabelType', 'seatLabelStart', 'seatLabelDirection',
            'shape' // For tables
        ];
        const isStructural = Object.keys(properties).some(key => structuralFields.includes(key));

        if (canvasRef.current && selectedIds.length > 0) {
            const selectedNodes = layout.nodes.filter((n: any) => selectedIds.includes(n.id));
            
            const tableUuid = selectedNodes.find(n => n.table_uuid)?.table_uuid;
            if (tableUuid && (isStructural || properties.name || properties.radius || properties.width || properties.height)) {
                canvasRef.current.updateTableStructure(tableUuid, properties);
                return;
            }

            if (isStructural) {
                const blockUuid = selectedNodes.find(n => n.block_uuid)?.block_uuid;
                if (blockUuid) {
                    canvasRef.current.updateBlockStructure(blockUuid, properties);
                    return;
                }

                const uniqueRowUuids = Array.from(new Set(
                    selectedNodes.filter((n: any) => n.row_uuid).map((n: any) => n.row_uuid)
                ));

                if (uniqueRowUuids.length === 1) {
                    canvasRef.current.updateRowStructure(uniqueRowUuids[0], properties);
                    return;
                }
            }
        }

        let updatedNodes = layout.nodes.map((node: any) => 
            selectedIds.includes(node.id) ? { ...node, ...properties } : node
        );

        // Cascading updates for section containers
        const sectionUpdates = selectedIds.filter(id => {
            const node = layout.nodes.find((n: any) => n.id === id);
            return node?.type === 'section_container';
        });

        if (sectionUpdates.length > 0 && (properties.name || properties.fill || properties.category_id)) {
            sectionUpdates.forEach(sectionId => {
                const sectionNode = updatedNodes.find((n: any) => n.id === sectionId);
                if (!sectionNode) return;

                updatedNodes = updatedNodes.map((node: any) => {
                    let isInside = false;
                    if (node.type === 'seat') {
                        if (sectionNode.points) {
                            isInside = isPointInPolygon(node.x, node.y, sectionNode.points, sectionNode.x, sectionNode.y);
                        } else {
                            isInside = isPointInRect(node.x, node.y, sectionNode.x, sectionNode.y, (sectionNode.width || 400) * (sectionNode.scaleX || 1), (sectionNode.height || 300) * (sectionNode.scaleY || 1));
                        }
                    }
                    if (isInside) {
                        return { 
                            ...node, 
                            section: properties.name || node.section,
                            fill: properties.fill || node.fill,
                            category_id: properties.category_id !== undefined ? properties.category_id : node.category_id
                        };
                    }
                    return node;
                });
            });
        }

        // Cascading updates for tables
        const tableUpdates = selectedIds.filter(id => {
            const node = layout.nodes.find((n: any) => n.id === id);
            return node?.type === 'table_shape';
        });

        if (tableUpdates.length > 0 && (properties.fill || properties.category_id)) {
            tableUpdates.forEach(tableId => {
                const tableNode = updatedNodes.find((n: any) => n.id === tableId);
                if (!tableNode) return;
                const tableUuid = tableNode.table_uuid;
                updatedNodes = updatedNodes.map((node: any) => {
                    if (node.table_uuid === tableUuid && node.type === 'seat') {
                        return {
                            ...node,
                            fill: properties.fill || node.fill,
                            category_id: properties.category_id !== undefined ? properties.category_id : node.category_id
                        };
                    }
                    return node;
                });
            });
        }

        setLayout({ ...layout, nodes: updatedNodes });
    }, [layout, selectedIds]);

    const handleUpdateConfig = useCallback((newConfig: any) => {
        setLayout({
            ...layout,
            config: { ...layout.config, ...newConfig }
        });
    }, [layout]);

    const handleCalibrationFinish = (calibrationData: any) => {
        setLayout({
            ...layout,
            config: {
                ...layout.config,
                bgImageUrl: calibrationData.url,
                bgScale: calibrationData.imgScale,
                bgX: calibrationData.imgX,
                bgY: calibrationData.imgY,
                bgOpacity: calibrationData.opacity,
                defaultRadius: calibrationData.seatRadius,
                defaultSpacing: calibrationData.seatSpacing
            }
        });
        toast.success('Calibración aplicada correctamente');
    };

    const handleDeleteSelected = useCallback(() => {
        if (canvasRef.current) {
            canvasRef.current.deleteSelected();
        }
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (mode !== 'edit' || (e.target as HTMLElement).tagName === 'INPUT') return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                handleDeleteSelected();
            } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
                canvasRef.current?.redo();
            } else if (e.key.toLowerCase() === 'h') {
                setActiveTool('pan');
            } else if (e.key.toLowerCase() === 'v') {
                setActiveTool('select');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mode, handleDeleteSelected]);

    const selectedNodes = layout.nodes.filter((n: any) => selectedIds.includes(n.id));

    const duplicateWarnings = useMemo(() => {
        const seats = layout.nodes.filter((n: any) => n.type === 'seat');
        const seen = new Set();
        const duplicates = new Set();

        for (const seat of seats) {
            const section = seat.section?.trim() || 'General';
            const row = seat.row?.trim() || '';
            const number = seat.number;
            const key = `${section}|${row}|${number}`;
            
            if (seen.has(key)) {
                duplicates.add(key);
            } else {
                seen.add(key);
            }
        }

        return Array.from(duplicates).map((key: any) => {
            const [section, row, number] = key.split('|');
            return `Duplicado: ${section} > Fila ${row} > Asiento ${number}`;
        });
    }, [layout.nodes]);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Mapas de Asientos', href: route('admin.seating-maps.index') },
            { title: 'Editor: ' + seatingMap.name, href: '#' },
        ]}>
            <Head title={`Builder - ${seatingMap.name}`} />

            <div className="flex flex-col h-[calc(100vh-101px)] overflow-hidden bg-background">
                {/* Top Toolbar */}
                <div className="flex items-center justify-between px-6 py-2 bg-card border-b shadow-sm z-10 h-14">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold leading-tight">{seatingMap.name}</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{seatingMap.venue.name}</p>
                        </div>
                        <div className="h-6 w-[1px] bg-border mx-2" />
                        <div className="flex bg-muted p-1 rounded-lg">
                            <Button 
                                variant={mode === 'edit' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-7 px-3 text-xs"
                                onClick={() => setMode('edit')}
                            >
                                <Edit3 className="h-3 w-3 mr-2" />
                                Diseñar
                            </Button>
                            <Button 
                                variant={mode === 'preview' ? 'secondary' : 'ghost'} 
                                size="sm" 
                                className="h-7 px-3 text-xs"
                                onClick={() => setMode('preview')}
                            >
                                <Eye className="h-3 w-3 mr-2" />
                                Comprar
                            </Button>
                        </div>
                        <div className="h-6 w-[1px] bg-border mx-2" />
                        <Button 
                            variant={snapToGrid ? 'secondary' : 'ghost'} 
                            size="sm" 
                            className="h-7 px-3 text-xs"
                            onClick={() => setSnapToGrid(!snapToGrid)}
                        >
                            <Grid className="h-3.5 w-3.5 mr-2" />
                            Snap: {snapToGrid ? 'ON' : 'OFF'}
                        </Button>
                        <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => canvasRef.current?.undo()} title="Deshacer (Ctrl+Z)">
                                <Undo2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => canvasRef.current?.redo()} title="Rehacer (Ctrl+Y)">
                                <Redo2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => canvasRef.current?.fitView()} title="Ajustar Vista (F)">
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {duplicateWarnings.length > 0 && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="destructive" size="sm" className="h-8 text-xs font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 animate-pulse">
                                        <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                                        {duplicateWarnings.length} Error{duplicateWarnings.length > 1 ? 'es' : ''}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="bottom" align="end" className="w-80 p-0 shadow-2xl border-red-200">
                                    <div className="bg-red-50 text-red-900 px-4 py-3 border-b border-red-100 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        <div>
                                            <h4 className="font-bold text-sm">Asientos Duplicados</h4>
                                            <p className="text-xs opacity-80">Hay asientos con la misma numeración en la misma sección.</p>
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                                        {duplicateWarnings.map((warn, i) => (
                                            <div key={i} className="text-xs bg-white px-3 py-2 rounded border border-red-100 text-red-800 shadow-sm">
                                                {warn}
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold uppercase tracking-widest text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100" onClick={() => setIsCalibrationOpen(true)}>
                            <Maximize2 className="h-3.5 w-3.5 mr-2" />
                            Calibrar Plano
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Settings className="h-3.5 w-3.5 mr-2" />
                            Ajustes
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8 px-5 bg-blue-600 hover:bg-blue-700 text-xs shadow-md shadow-blue-500/20">
                            <Save className="h-3.5 w-3.5 mr-2" />
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Left Sidebar: Tools (Seats.io style) */}
                    <div className="w-16 bg-card border-r flex flex-col items-center py-4 gap-4 shadow-sm z-10">
                        <TooltipProvider delayDuration={0}>
                            {/* Selection Tools */}
                            <div className="flex flex-col gap-1 w-full px-2">
                                <ToolButton 
                                    icon={<MousePointer2 />} 
                                    active={activeTool === 'select'} 
                                    tooltip="Seleccionar (V)" 
                                    onClick={() => setActiveTool('select')} 
                                />
                                <ToolButton 
                                    icon={<Hand />} 
                                    active={activeTool === 'pan'} 
                                    tooltip="Mano / Pan (H)" 
                                    onClick={() => setActiveTool('pan')} 
                                />
                            </div>

                            <Separator className="w-8 mx-auto" />

                             {/* Seating Tools Group */}
                            <div className="flex flex-col gap-1 w-full px-2">
                                <Popover open={openPopover === 'seating'} onOpenChange={(open) => setOpenPopover(open ? 'seating' : null)}>
                                    <PopoverTrigger asChild>
                                        <ToolButton 
                                            icon={<MoreHorizontal />} 
                                            active={['seat', 'row', 'rect_block', 'honeycomb_block', 'table'].includes(activeTool)} 
                                            tooltip="Asientos y Mesas" 
                                            hasArrow
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent side="right" align="start" className="w-56 p-2 ml-2 shadow-2xl border-border bg-popover z-[100]">
                                        <div className="space-y-1">
                                            <ToolMenuItem 
                                                icon={<CircleIcon className="text-blue-500" />} 
                                                title="Asiento Unitario" 
                                                shortcut="Click"
                                                onClick={() => { setActiveTool('seat'); setOpenPopover(null); }}
                                                active={activeTool === 'seat'}
                                            />
                                            <ToolMenuItem 
                                                icon={<LayoutList className="text-indigo-400" />} 
                                                title="Fila de Asientos" 
                                                shortcut="F"
                                                onClick={() => { setActiveTool('row'); setOpenPopover(null); }}
                                                active={activeTool === 'row'}
                                            />
                                            <ToolMenuItem 
                                                icon={<Grid className="text-indigo-600" />} 
                                                title="Bloque Rectangular" 
                                                shortcut="R"
                                                onClick={() => { setActiveTool('rect_block'); setOpenPopover(null); }}
                                                active={activeTool === 'rect_block'}
                                            />
                                            <ToolMenuItem 
                                                icon={<Hexagon className="text-amber-500" />} 
                                                title="Bloque Panal" 
                                                shortcut="H"
                                                onClick={() => { setActiveTool('honeycomb_block'); setOpenPopover(null); }}
                                                active={activeTool === 'honeycomb_block'}
                                            />
                                            <ToolMenuItem 
                                                icon={<CircleIcon className="text-orange-500" />} 
                                                title="Mesa con Asientos" 
                                                shortcut="M"
                                                onClick={() => { setActiveTool('table'); setOpenPopover(null); }}
                                                active={activeTool === 'table'}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Popover open={openPopover === 'shapes'} onOpenChange={(open) => setOpenPopover(open ? 'shapes' : null)}>
                                    <PopoverTrigger asChild>
                                        <ToolButton 
                                            icon={<Plus />} 
                                            active={['rect', 'circle_zone', 'zone', 'section_container'].includes(activeTool)} 
                                            tooltip="Zonas y Formas" 
                                            hasArrow
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent side="right" align="start" className="w-56 p-2 ml-2 shadow-2xl border-border bg-popover z-[100]">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">Dibujar Áreas</h4>
                                            <ToolMenuItem 
                                                icon={<Square className="text-emerald-500" />} 
                                                title="Zona Rectangular" 
                                                onClick={() => { setActiveTool('rect'); setOpenPopover(null); }}
                                                active={activeTool === 'rect'}
                                            />
                                            <ToolMenuItem 
                                                icon={<CircleIcon className="text-pink-500" />} 
                                                title="Zona Oblicua / Círculo" 
                                                onClick={() => { setActiveTool('circle_zone'); setOpenPopover(null); }}
                                                active={activeTool === 'circle_zone'}
                                            />
                                            <ToolMenuItem 
                                                icon={<PenTool className="text-purple-500" />} 
                                                title="Zona Polígono Libre" 
                                                onClick={() => { setActiveTool('zone'); setOpenPopover(null); }}
                                                active={activeTool === 'zone'}
                                            />
                                            <Separator className="my-1 opacity-50" />
                                            <ToolMenuItem 
                                                icon={<Layers className="text-blue-500" />} 
                                                title="Contenedor de Sección" 
                                                onClick={() => { 
                                                    setActiveTool('section_container'); 
                                                    setOpenPopover(null); 
                                                }}
                                                active={activeTool === 'section_container'}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Separator className="w-8 mx-auto" />

                            {/* Object Tools */}
                            <div className="flex flex-col gap-1 w-full px-2">
                                <ToolButton 
                                    icon={<Users />} 
                                    active={activeTool === 'standing'} 
                                    tooltip="Admisión General" 
                                    onClick={() => setActiveTool('standing')} 
                                />
                                <ToolButton 
                                    icon={<Type />} 
                                    active={activeTool === 'text'} 
                                    tooltip="Etiqueta de Texto (T)" 
                                    onClick={() => setActiveTool('text')} 
                                />
                                <ToolButton 
                                    icon={<ImageIcon />} 
                                    active={isCalibrationOpen} 
                                    tooltip="Plano de Fondo / Imagen" 
                                    onClick={() => setIsCalibrationOpen(true)} 
                                />
                            </div>

                        </TooltipProvider>
                    </div>

                    {/* Main Canvas Area */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-auto flex justify-center items-center relative">
                        {/* Overlay helpers */}
                        {mode === 'edit' && (
                            <div className="absolute top-4 right-4 bg-white/80 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm text-[10px] font-medium z-10">
                                Ctrl+Z para deshacer • Del para borrar • Rueda para Zoom
                            </div>
                        )}
                        
                        <SeatingCanvas 
                            ref={canvasRef}
                            layout={layout} 
                            mode={mode}
                            tool={activeTool}
                            snapToGrid={snapToGrid}
                            onSelectionChange={setSelectedIds}
                            onChange={setLayout} 
                            onToolComplete={() => setActiveTool('select')}
                        />
                    </div>

                    {/* Right Sidebar: Inspector */}
                    <div className="w-80 bg-card border-l flex flex-col shadow-sm z-10 transition-all">
                        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center text-muted-foreground">
                                <Settings className="h-3.5 w-3.5 mr-2" />
                                Propiedades
                            </h2>
                        </div>
                        
                        <Inspector 
                            layout={layout}
                            onUpdateConfig={handleUpdateConfig}
                            selectedNodes={selectedNodes}
                            onUpdate={handleUpdateNodes}
                            onDelete={handleDeleteSelected}
                            onAlign={(dir) => canvasRef.current?.align(dir)}
                            onRedistribute={(params) => canvasRef.current?.redistributeSelected(params)}
                        />
                    </div>
                </div>

                <CalibrationWizard 
                    isOpen={isCalibrationOpen} 
                    onClose={() => setIsCalibrationOpen(false)}
                    onFinish={handleCalibrationFinish}
                    initialImage={layout.config?.bgImageUrl}
                />
            </div>
        </AppLayout>
    );
}

function ToolButton({ icon, active, onClick, tooltip, hasArrow = false, ...props }: any) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button 
                    {...props}
                    onClick={onClick}
                    className={cn(
                        "group relative p-2.5 w-full aspect-square rounded-xl transition-all duration-200 flex items-center justify-center outline-none",
                        active 
                            ? "bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.4)] text-white" 
                            : "hover:bg-muted text-muted-foreground opacity-70 hover:opacity-100"
                    )}
                >
                    <div className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")}>
                        {React.cloneElement(icon, { size: 18, strokeWidth: active ? 2.5 : 1.5 })}
                    </div>
                    {hasArrow && (
                        <ChevronRight className={cn(
                            "absolute -right-1 h-3 w-3 transition-transform", 
                            active ? "text-white" : "text-muted-foreground/30 group-hover:translate-x-0.5"
                        )} />
                    )}
                </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="z-[110]">
                <p className="text-xs font-medium">{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
}

function ToolMenuItem({ icon, title, shortcut, onClick, active }: any) {
    return (
        <button 
            onClick={onClick}
            className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                ${active ? 'bg-blue-600 text-white' : 'hover:bg-muted text-foreground'}
            `}
        >
            <div className="flex items-center gap-2">
                {React.cloneElement(icon, { size: 14, strokeWidth: 2 })}
                <span className="font-medium text-[13px]">{title}</span>
            </div>
            {shortcut && (
                <span className={`text-[10px] font-mono px-1.5 rounded border border-current opacity-60`}>
                    {shortcut}
                </span>
            )}
        </button>
    );
}

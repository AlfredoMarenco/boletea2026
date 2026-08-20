import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Settings,
    Hash,
    Map as MapIcon,
    Palette,
    Trash2,
    Layers,
    AlignLeft,
    AlignRight,
    AlignStartVertical,
    AlignEndVertical,
    ChevronDown,
    ChevronRight,
    Info,
    Languages,
    Navigation,
    Image as ImageIcon,
    MoreHorizontal,
    ArrowLeftRight,
    ArrowUpDown,
    Check,
    Plus,
    Users,
    LayoutList,
    ArrowUp,
    ArrowDown,
    Type,
    AlignCenter,
    Bold,
    Italic,
    RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SeatingLayout, SeatingNode } from './types';

interface SectionHeaderProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    isOpen: boolean;
    onToggle: () => void;
    Action?: React.ComponentType<any> | (() => React.ReactNode);
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    icon: Icon,
    isOpen,
    onToggle,
    Action,
}) => (
    <div className="flex w-full items-center justify-between pr-2">
        <button
            type="button"
            onClick={onToggle}
            className="group flex flex-1 items-center justify-between px-1 py-3 transition-colors hover:bg-muted/50"
        >
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        'rounded bg-muted p-1 transition-colors group-hover:bg-background',
                        isOpen && 'bg-blue-600/10 text-blue-600',
                    )}
                >
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    {title}
                </span>
            </div>
            {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
            ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
        </button>
        {Action &&
            (typeof Action === 'function' ? (Action as any)() : Action)}
    </div>
);

interface PropertyRowProps {
    label: string;
    children: React.ReactNode;
    info?: string;
}

const PropertyRow: React.FC<PropertyRowProps> = ({ label, children, info }) => (
    <div className="flex items-center justify-between gap-4 py-1.5">
        <div className="flex min-w-[100px] items-center gap-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">
                {label}
            </Label>
            {info && (
                <Info className="h-3 w-3 cursor-help text-muted-foreground/30" />
            )}
        </div>
        <div className="max-w-[120px] flex-1">{children}</div>
    </div>
);

const getHexFromFill = (fill?: string, defaultHex: string = '#3b82f6') => {
    if (!fill) return defaultHex;
    if (fill.startsWith('#')) return fill;
    if (fill.startsWith('rgba') || fill.startsWith('rgb')) {
        const match = fill.match(/\d+/g);
        if (match && match.length >= 3) {
            const r = parseInt(match[0], 10).toString(16).padStart(2, '0');
            const g = parseInt(match[1], 10).toString(16).padStart(2, '0');
            const b = parseInt(match[2], 10).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
    }
    return defaultHex;
};

const getOpacityFromFillOrNode = (fill?: string, fillOpacity?: number, sectionType?: string) => {
    if (fillOpacity !== undefined && fillOpacity !== null) return fillOpacity;
    if (fill && (fill.startsWith('rgba') || fill.startsWith('hsla'))) {
        const match = fill.match(/rgba?\(.*?,\s*.*?,\s*.*?,\s*([\d.]+)\)/);
        if (match && match[1]) {
            return parseFloat(match[1]);
        }
    }
    return sectionType === 'general' ? 0.15 : 0.08;
};

interface InspectorProps {
    layout: SeatingLayout;
    onUpdateConfig: (newConfig: any) => void;
    selectedNodes: SeatingNode[];
    onUpdate: (properties: any) => void;
    onDelete: () => void;
    onAlign: (direction: string) => void;
    onRedistribute: (axis: 'x' | 'y') => void;
    onCaptureSeats: (sectionNodeId: string) => void;
}


const DraggableNumberInput = ({ value, onChange, onComplete, className, min = -15, max = 15, step = 0.5, speed = 0.1 }: any) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [localValue, setLocalValue] = React.useState(value);
    const startX = React.useRef(0);
    const startVal = React.useRef(0);

    React.useEffect(() => {
        if (!isDragging) setLocalValue(value);
    }, [value, isDragging]);

    const handlePointerDown = (e: React.PointerEvent) => {
        startX.current = e.clientX;
        startVal.current = localValue || 0;
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - startX.current;
        let newVal = startVal.current + (dx * speed);
        newVal = Math.max(min, Math.min(max, newVal));
        newVal = Math.round(newVal / step) * step;
        newVal = parseFloat(newVal.toFixed(4));
        setLocalValue(newVal);
        onChange(newVal);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (isDragging) {
            setIsDragging(false);
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            if (onComplete) onComplete();
        }
    };

    return (
        <Input
            type="number"
            step={step}
            value={isDragging ? localValue : value}
            onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    onChange(val);
                    if (onComplete) onComplete();
                }
            }}
            onBlur={onComplete}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={cn("cursor-ew-resize select-none", className)}
            style={{ touchAction: 'none' }}
        />
    );
};

const Inspector: React.FC<InspectorProps> = ({
    layout,
    onUpdateConfig,
    selectedNodes,
    onUpdate,
    onDelete,
    onAlign,
    onRedistribute,
    onCaptureSeats,
}) => {
    const categories = layout?.config?.categories || [];

    const handleAddCategory = () => {
        const newCat = {
            id: 'cat-' + Math.random().toString(36).substr(2, 9),
            name: 'Nueva Categoría',
            color:
                '#' +
                Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, '0'),
        };
        onUpdateConfig({ categories: [...categories, newCat] });
    };

    const handleUpdateCategory = (id: string, field: string, value: any) => {
        const updated = categories.map((c: any) =>
            c.id === id ? { ...c, [field]: value } : c,
        );
        onUpdateConfig({ categories: updated });
    };

    const handleDeleteCategory = (id: string) => {
        const isAssigned = layout.nodes.some((n) => n.category_id === id);
        if (isAssigned) {
            alert(
                'No se puede eliminar esta categoría porque ya está asignada a algunos asientos.',
            );
            return;
        }
        onUpdateConfig({
            categories: categories.filter((c: any) => c.id !== id),
        });
    };

    const [isEditingCategories, setIsEditingCategories] = useState(false);

    const [sections, setSections] = useState<Record<string, boolean>>({
        category: true,
        row: true,
        sectionLabeling: false,
        rowLabeling: true,
        seatLabeling: true,
        view: false,
    });

    const [formData, setFormData] = useState<Record<string, any>>({
        section: '',
        row: '',
        fill: '#94a3b8',
        radius: 10,
        numSeats: 10,
        curve: 0,
        seatSpacing: 35,
        rowSpacing: 40,
        rowLabelEnabled: true,
        rowLabelType: 'ABC',
        rowLabelStart: 'A',
        rowLabelSkip: '',
        rowLabelPosition: 'both',
        rowLabelOverride: '',
        rowLabelDisplayType: 'Row',
        seatLabelType: '123',
        seatLabelStart: 1,
        seatLabelDirection: 'LR',
        rowLabelDirection: 'TB',
        category_id: null,
        capacity: 100,
    });

    // Tracking pending changes for structural fields
    const [pendingStructural, setPendingStructural] = useState<
        Record<string, any>
    >({});

    const selectedIdsStr = selectedNodes
        .map((n) => n.id)
        .sort()
        .join(',');

    const uniqueRows = Array.from(new Set(selectedNodes.filter(n => n.row_uuid).map(n => n.row_uuid)));
    const isSingleRow = uniqueRows.length === 1;
    const isMultipleRows = uniqueRows.length > 1;

    useEffect(() => {
        if (selectedNodes.length > 0) {
            const first = selectedNodes[0];

            // Aggregate values to find commonalities
            const getCommon = (
                field: keyof SeatingNode,
                defaultValue: any = '',
            ) => {
                const firstVal = first[field];
                return selectedNodes.every((n) => n[field] === firstVal)
                    ? firstVal
                    : defaultValue;
            };

            // Enhanced logic for seat count
            const rowUuids = Array.from(
                new Set(selectedNodes.map((n) => n.row_uuid).filter(Boolean)),
            );
            let commonNumSeats = 0;
            if (rowUuids.length > 0) {
                const counts = rowUuids.map(
                    (uuid) =>
                        layout?.nodes?.filter((n) => n.row_uuid === uuid)
                            .length || 0,
                );
                if (counts.length > 0 && counts.every((v) => v === counts[0]))
                    commonNumSeats = counts[0];
            }

            const tableUuids = Array.from(
                new Set(selectedNodes.map((n) => n.table_uuid).filter(Boolean)),
            );
            if (tableUuids.length > 0 && layout?.nodes) {
                const counts = tableUuids.map(
                    (uuid) =>
                        layout.nodes.filter(
                            (n) => n.table_uuid === uuid && n.type === 'seat',
                        ).length,
                );
                if (counts.length > 0 && counts.every((v) => v === counts[0]))
                    commonNumSeats = counts[0];
            }

            const totalSelectedSeats = selectedNodes.filter(
                (n) => n.type === 'seat',
            ).length;
            const totalRowSeats = rowUuids.reduce(
                (sum, uuid) =>
                    sum +
                    (layout?.nodes?.filter((n) => n.row_uuid === uuid).length ||
                        0),
                0,
            );
            const totalTableSeats = tableUuids.reduce(
                (sum, uuid) =>
                    sum +
                    (layout?.nodes?.filter(
                        (n) => n.table_uuid === uuid && n.type === 'seat',
                    ).length || 0),
                0,
            );

            const commonCurvature = (() => {
                const firstCurve = first.curvature !== undefined ? first.curvature : (first.curve !== undefined ? first.curve : 0);
                const isSame = selectedNodes.every((n) => {
                    const c = n.curvature !== undefined ? n.curvature : (n.curve !== undefined ? n.curve : 0);
                    return c === firstCurve;
                });
                return isSame ? firstCurve : 0;
            })();

            const data = {
                section: getCommon('section'),
                category_id: getCommon('category_id', null),
                capacity: getCommon('capacity', 100),
                row: rowUuids.length === 1 ? first.row || '' : '',
                fill: getCommon('fill', '#94a3b8'),
                radius: getCommon('radius', 10),
                shape: getCommon('shape', 'circle'),
                numSeats: commonNumSeats || 0,
                totalSeats:
                    totalRowSeats || totalTableSeats || totalSelectedSeats || 0,
                seatSpacing: getCommon('spacing', getCommon('seatSpacing', 35)),
                rowSpacing: (() => {
                    if (rowUuids.length > 1) {
                        const rowsList = rowUuids.map(uuid => {
                            const rowNodes = layout?.nodes?.filter(n => n.row_uuid === uuid && n.type === 'seat') || [];
                            if (rowNodes.length === 0) return null;
                            const sorted = [...rowNodes].sort((a, b) => (a.number || 0) - (b.number || 0));
                            return {
                                uuid,
                                startNode: sorted[0],
                                lastNode: sorted[sorted.length - 1]
                            };
                        }).filter((r): r is { uuid: string; startNode: any; lastNode: any } => !!r && !!r.startNode && !!r.lastNode);

                        if (rowsList.length > 1) {
                            const refRow = rowsList[0];
                            const dxRaw = refRow.lastNode.x - refRow.startNode.x;
                            const dyRaw = refRow.lastNode.y - refRow.startNode.y;
                            const rowAngle = Math.atan2(dyRaw, dxRaw);
                            const normalAngle = rowAngle + Math.PI / 2;

                            const sorted = [...rowsList].sort((a, b) => {
                                const projA = a.startNode.x * Math.cos(normalAngle) + a.startNode.y * Math.sin(normalAngle);
                                const projB = b.startNode.x * Math.cos(normalAngle) + b.startNode.y * Math.sin(normalAngle);
                                return projA - projB;
                            });

                            let totalDist = 0;
                            for (let i = 1; i < sorted.length; i++) {
                                const projA = sorted[i-1].startNode.x * Math.cos(normalAngle) + sorted[i-1].startNode.y * Math.sin(normalAngle);
                                const projB = sorted[i].startNode.x * Math.cos(normalAngle) + sorted[i].startNode.y * Math.sin(normalAngle);
                                totalDist += Math.abs(projB - projA);
                            }
                            return Math.round(totalDist / (sorted.length - 1));
                        }
                    }
                    return layout?.config?.rowSpacing || 40;
                })(),
                seatLabelDirection: getCommon('seat_label_direction', getCommon('seatLabelDirection', 'LR')),
                seatNumberingMode: getCommon('seat_numbering_mode', getCommon('seatNumberingMode', 'consecutive')),
                seatLabelStart: (() => {
                    const explicitStart = getCommon('seat_start_number', getCommon('seatLabelStart', null));
                    if (explicitStart !== null && explicitStart !== undefined && explicitStart !== '') return parseInt(String(explicitStart), 10) || 1;
                    const nums = selectedNodes.map(n => typeof n.number === 'number' ? n.number : (parseInt(n.number) || 1)).filter(n => !isNaN(n));
                    return nums.length > 0 ? Math.min(...nums) : 1;
                })(),
                seatLabelType: getCommon('seat_label_type', getCommon('seatLabelType', '123')),
                rowLabelDirection: getCommon('row_label_direction', 'TB'),
                rowLabelType: getCommon('row_label_type', ''),
                rowLabelStart: getCommon('row_label_start', 'A'),
                rowLabelSkip: getCommon('row_label_skip', ''),
                rowLabelEnabled: getCommon('row_label_enabled', true),
                rowLabelPosition: getCommon('row_label_position', 'both'),
                rowLabelOverride: getCommon('row_label_override', ''),
                rowLabelDisplayType: getCommon('row_label_display_type', 'Row'),
                name: getCommon('name', ''),
                width: getCommon('width', 0),
                height: getCommon('height', 0),
                fillOpacity: getCommon('fillOpacity', undefined),
                stroke: getCommon('stroke', '#3b82f6'),
                showTitle: getCommon('showTitle', true),
                titlePosition: getCommon('titlePosition', 'top'),
                titleColor: getCommon('titleColor', ''),
                fontSize: getCommon('fontSize', 28),
                sectionType: getCommon('sectionType', 'numbered'),
                rotation: getCommon('rotation', 0),
                align: getCommon('align', 'center'),
                fontStyle: getCommon('fontStyle', 'bold'),
                curve: commonCurvature,
            };

            setFormData((prev) => ({ ...prev, ...data }));
            setPendingStructural({});
        }
    }, [selectedIdsStr, layout?.nodes]);

    const toggleSection = (section: string) => {
        setSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const handleImmediateChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        onUpdate({ [field]: value });
    };

    const handleRowLabelUpdate = (updates: any) => {
        const merged = {
            rowLabelType: formData.rowLabelType,
            rowLabelStart: formData.rowLabelStart,
            rowLabelSkip: formData.rowLabelSkip,
            rowLabelDirection: formData.rowLabelDirection,
            ...updates
        };
        setFormData(prev => ({ ...prev, ...merged }));
        onUpdate(merged);
    };

    const handlePendingChange = (field: string, value: any) => {
        setPendingStructural((prev) => ({ ...prev, [field]: value }));
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleStructuralBlur = () => {
        if (Object.keys(pendingStructural).length > 0) {
            onUpdate(pendingStructural);
            setPendingStructural({});
        }
    };

    if (selectedNodes.length === 0) {
        return (
            <div className="flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-12">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center text-xs font-bold tracking-widest text-muted-foreground uppercase">
                        <Palette className="mr-2 h-4 w-4" />
                        Categorías de Precio
                    </h3>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={handleAddCategory}
                    >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Agregar
                    </Button>
                </div>

                <div className="space-y-3">
                    {categories.map((cat: any) => (
                        <div
                            key={cat.id}
                            className="group relative space-y-2 rounded-lg border bg-muted/20 p-3"
                        >
                            <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="absolute top-2 right-2 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                            <div className="flex items-center gap-2 pr-6">
                                <input
                                    type="color"
                                    value={cat.color}
                                    onChange={(e) =>
                                        handleUpdateCategory(
                                            cat.id,
                                            'color',
                                            e.target.value,
                                        )
                                    }
                                    className="h-6 w-6 cursor-pointer rounded border-none"
                                />
                                <Input
                                    value={cat.name}
                                    onChange={(e) =>
                                        handleUpdateCategory(
                                            cat.id,
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    className="h-7 flex-1 text-xs font-bold"
                                    placeholder="Nombre"
                                />
                            </div>
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                            No hay categorías creadas
                        </div>
                    )}
                </div>

                <Separator className="my-4" />
                <div className="flex flex-col items-center justify-center space-y-2 py-4 text-center opacity-60">
                    <p className="text-sm font-medium tracking-widest uppercase">
                        Inspector Vacío
                    </p>
                    <p className="max-w-[200px] text-xs text-muted-foreground">
                        Selecciona asientos o bloques para configurarlos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 animate-in space-y-1 overflow-y-auto px-4 pb-12 duration-300 fade-in slide-in-from-right-4">
            {selectedNodes.some((n) =>
                [
                    'section_container',
                    'zone',
                    'rect_zone',
                    'circle_zone',
                ].includes(n.type),
            ) && (
                <>
                    <SectionHeader
                        title="Configuración de Sección"
                        icon={MapIcon}
                        isOpen={sections.category}
                        onToggle={() => toggleSection('category')}
                    />
                    <div className="space-y-3 px-1 py-3 pb-4">
                        <PropertyRow label="Nombre">
                            <Input
                                value={formData.name || ''}
                                onChange={(e) =>
                                    handlePendingChange('name', e.target.value)
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-xs"
                            />
                        </PropertyRow>
                        <PropertyRow label="Tipo Sección">
                            <select
                                value={formData.sectionType || 'numbered'}
                                onChange={(e) =>
                                    handleImmediateChange(
                                        'sectionType',
                                        e.target.value,
                                    )
                                }
                                className="h-7 w-full rounded border-none bg-muted/20 px-2 text-[11px] outline-none"
                            >
                                <option value="numbered">
                                    Numerada (Asientos)
                                </option>
                                <option value="general">
                                    General (Aforo sin asientos)
                                </option>
                            </select>
                        </PropertyRow>
                        {formData.sectionType === 'general' && (
                            <PropertyRow label="Aforo Total">
                                <Input
                                    type="number"
                                    value={formData.capacity || 0}
                                    onChange={(e) =>
                                        handlePendingChange(
                                            'capacity',
                                            parseInt(e.target.value) || 0,
                                        )
                                    }
                                    onBlur={handleStructuralBlur}
                                    className="h-7 bg-muted/20 text-center text-xs"
                                />
                            </PropertyRow>
                        )}
                        {selectedNodes.some((n) => n.type === 'circle_zone') ? (
                            <PropertyRow label="Radio">
                                <Input
                                    type="number"
                                    value={formData.radius || 0}
                                    onChange={(e) =>
                                        handlePendingChange(
                                            'radius',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    onBlur={handleStructuralBlur}
                                    className="h-7 bg-muted/20 text-center text-xs"
                                />
                            </PropertyRow>
                        ) : (
                            <>
                                <PropertyRow label="Ancho">
                                    <Input
                                        type="number"
                                        value={formData.width || 0}
                                        onChange={(e) =>
                                            handlePendingChange(
                                                'width',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        onBlur={handleStructuralBlur}
                                        className="h-7 bg-muted/20 text-center text-xs"
                                    />
                                </PropertyRow>
                                <PropertyRow label="Alto">
                                    <Input
                                        type="number"
                                        value={formData.height || 0}
                                        onChange={(e) =>
                                            handlePendingChange(
                                                'height',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        onBlur={handleStructuralBlur}
                                        className="h-7 bg-muted/20 text-center text-xs"
                                    />
                                </PropertyRow>
                            </>
                        )}
                        <PropertyRow label="Color Relleno">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={getHexFromFill(
                                        formData.fill,
                                        formData.sectionType === 'general' ? '#10b981' : '#3b82f6'
                                    )}
                                    onChange={(e) => {
                                        const hexColor = e.target.value;
                                        const currentOpacity = getOpacityFromFillOrNode(
                                            formData.fill,
                                            formData.fillOpacity,
                                            formData.sectionType
                                        );
                                        onUpdate({
                                            fill: hexColor,
                                            fillOpacity: currentOpacity,
                                        });
                                        setFormData((prev) => ({
                                            ...prev,
                                            fill: hexColor,
                                            fillOpacity: currentOpacity,
                                        }));
                                    }}
                                    className="h-8 w-8 cursor-pointer rounded border-none"
                                />
                                <div className="flex flex-1 items-center rounded bg-muted/20 px-2 py-1 font-mono text-[10px]">
                                    {formData.fill || (formData.sectionType === 'general' ? '#10b981' : '#3b82f6')}
                                </div>
                            </div>
                        </PropertyRow>
                        <PropertyRow label="Transparencia">
                            <div className="flex w-full min-w-0 items-center gap-1.5">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={Math.round(
                                        getOpacityFromFillOrNode(
                                            formData.fill,
                                            formData.fillOpacity,
                                            formData.sectionType
                                        ) * 100
                                    )}
                                    onChange={(e) => {
                                        const pct = parseInt(e.target.value, 10);
                                        const opacityVal = pct / 100;
                                        const hexColor = getHexFromFill(
                                            formData.fill,
                                            formData.sectionType === 'general' ? '#10b981' : '#3b82f6'
                                        );
                                        onUpdate({
                                            fill: hexColor,
                                            fillOpacity: opacityVal,
                                        });
                                        setFormData((prev) => ({
                                            ...prev,
                                            fill: hexColor,
                                            fillOpacity: opacityVal,
                                        }));
                                    }}
                                    className="h-1.5 w-full min-w-0 flex-1 cursor-pointer accent-blue-600"
                                />
                                <span className="w-8 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                                    {Math.round(
                                        getOpacityFromFillOrNode(
                                            formData.fill,
                                            formData.fillOpacity,
                                            formData.sectionType
                                        ) * 100
                                    )}%
                                </span>
                            </div>
                        </PropertyRow>
                        <PropertyRow label="Mostrar Título">
                            <Checkbox
                                checked={formData.showTitle !== false}
                                onCheckedChange={(val) =>
                                    handleImmediateChange('showTitle', val)
                                }
                            />
                        </PropertyRow>
                        <PropertyRow label="Color Título">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={
                                        formData.titleColor?.startsWith('rgba')
                                            ? '#3b82f6'
                                            : formData.titleColor || '#3b82f6'
                                    }
                                    onChange={(e) =>
                                        handleImmediateChange(
                                            'titleColor',
                                            e.target.value,
                                        )
                                    }
                                    className="h-7 w-7 cursor-pointer rounded border-none"
                                />
                                <div className="flex flex-1 items-center justify-between rounded bg-muted/20 px-2 py-1 font-mono text-[10px]">
                                    <span className="truncate">{formData.titleColor || 'Auto'}</span>
                                    {formData.titleColor && (
                                        <button
                                            type="button"
                                            onClick={() => handleImmediateChange('titleColor', '')}
                                            className="ml-1 text-[9px] text-muted-foreground hover:text-foreground underline"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        </PropertyRow>
                        <PropertyRow label="Tamaño Título" info="Pulsaciones en px (0 para tamaño automático)">
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    value={formData.fontSize || ''}
                                    placeholder="Auto"
                                    onChange={(e) =>
                                        handleImmediateChange(
                                            'fontSize',
                                            e.target.value ? parseInt(e.target.value) : 0,
                                        )
                                    }
                                    className="h-7 bg-muted/20 text-center text-xs font-mono"
                                />
                                {formData.fontSize > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleImmediateChange('fontSize', 0)}
                                        className="text-[9px] text-muted-foreground hover:text-foreground px-1"
                                    >
                                        Auto
                                    </button>
                                )}
                            </div>
                        </PropertyRow>

                        {selectedNodes.length === 1 && (
                            <div className="pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-full gap-2 border-blue-200 text-[10px] text-blue-600 hover:bg-blue-50"
                                    onClick={() =>
                                        onCaptureSeats(selectedNodes[0].id)
                                    }
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    Vincular Asientos en Zona
                                </Button>
                            </div>
                        )}
                    </div>
                    <Separator className="opacity-50" />
                </>
            )}

            {selectedNodes.some((n) => n.type === 'seat') && (
                <>
                    <SectionHeader
                        title="Propiedades de Asiento"
                        icon={Settings}
                        isOpen={sections.category}
                        onToggle={() => toggleSection('category')}
                    />
                    <div className="space-y-3 px-1 py-3 pb-4">
                        {formData.totalSeats > 0 && (
                            <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-600/10 bg-blue-600/5 px-3 py-2">
                                <span className="text-[10px] font-bold tracking-wider text-blue-600/70 uppercase">
                                    Asientos en Selección
                                </span>
                                <span className="font-mono text-sm font-black text-blue-700">
                                    {formData.totalSeats}
                                </span>
                            </div>
                        )}
                        <PropertyRow label="Sección">
                            <Input
                                value={formData.section || ''}
                                onChange={(e) =>
                                    handlePendingChange(
                                        'section',
                                        e.target.value,
                                    )
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-xs"
                            />
                        </PropertyRow>
                    </div>
                    <Separator className="opacity-50" />
                </>
            )}

            <SectionHeader
                title="Categoría"
                icon={Palette}
                isOpen={sections.category}
                onToggle={() => toggleSection('category')}
                Action={() => (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                'h-6 w-6',
                                isEditingCategories &&
                                    'bg-blue-500/10 text-blue-500',
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingCategories(!isEditingCategories);
                            }}
                            title="Gestionar Categorías"
                        >
                            <Settings className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAddCategory();
                                if (!isEditingCategories)
                                    setIsEditingCategories(true);
                            }}
                            title="Nueva Categoría"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            />
            {sections.category && (
                <div className="space-y-3 px-1 py-3 pb-6">
                    <div className="flex flex-col gap-2">
                        {categories.map((cat: any) => (
                            <div key={cat.id} className="group relative">
                                {isEditingCategories ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-muted/10 p-2">
                                        <input
                                            type="color"
                                            value={cat.color}
                                            onChange={(e) =>
                                                handleUpdateCategory(
                                                    cat.id,
                                                    'color',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-6 w-6 shrink-0 cursor-pointer rounded border-none"
                                        />
                                        <Input
                                            value={cat.name}
                                            onChange={(e) =>
                                                handleUpdateCategory(
                                                    cat.id,
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-7 flex-1 border-none bg-transparent px-1 text-xs font-bold focus-visible:ring-0"
                                            placeholder="Nombre"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDeleteCategory(cat.id)
                                            }
                                            className="p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleImmediateChange(
                                                'category_id',
                                                cat.id,
                                            );
                                            handleImmediateChange(
                                                'fill',
                                                cat.color,
                                            );
                                        }}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors',
                                            formData.category_id === cat.id
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-transparent hover:bg-muted/50',
                                        )}
                                    >
                                        <div
                                            className="h-6 w-6 shrink-0 rounded-md border border-white/20 shadow-inner"
                                            style={{
                                                backgroundColor: cat.color,
                                            }}
                                        />
                                        <div className="flex-1 overflow-hidden">
                                            <div className="truncate text-xs font-bold">
                                                {cat.name}
                                            </div>
                                        </div>
                                        {formData.category_id === cat.id && (
                                            <Check className="h-4 w-4 shrink-0 text-blue-500" />
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="rounded-lg border border-dashed p-4 text-center">
                                <p className="mb-2 text-[10px] text-muted-foreground">
                                    No hay categorías de precio
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px]"
                                    onClick={handleAddCategory}
                                >
                                    Crear Primera Categoría
                                </Button>
                            </div>
                        )}
                        {!isEditingCategories && (
                            <div className="mt-2 flex items-center gap-2 border-t border-muted pt-2">
                                <Label className="shrink-0 text-[10px] text-muted-foreground">
                                    Color Libre:
                                </Label>
                                <div className="flex flex-1 items-center gap-2">
                                    <input
                                        type="color"
                                        value={
                                            formData.fill?.startsWith('rgba')
                                                ? '#94a3b8'
                                                : formData.fill || '#94a3b8'
                                        }
                                        onChange={(e) => {
                                            handleImmediateChange(
                                                'category_id',
                                                null,
                                            );
                                            handleImmediateChange(
                                                'fill',
                                                e.target.value,
                                            );
                                        }}
                                        className="h-5 w-5 cursor-pointer rounded border-none"
                                    />
                                    <span className="truncate font-mono text-[10px] text-muted-foreground uppercase">
                                        {formData.fill}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedNodes.some((n) => n.type === 'text') && (
                <>
                    <SectionHeader
                        title="Etiqueta de Texto"
                        icon={Type}
                        isOpen={true}
                        onToggle={() => {}}
                    />
                    <div className="space-y-3 px-1 py-3 pb-4">
                        <PropertyRow label="Texto">
                            <Input
                                value={formData.name || ''}
                                onChange={(e) =>
                                    handlePendingChange('name', e.target.value)
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-xs font-bold"
                                placeholder="Ej. Escenario"
                            />
                        </PropertyRow>

                        <PropertyRow label="Tamaño (px)">
                            <Input
                                type="number"
                                min="8"
                                max="150"
                                value={formData.fontSize || 28}
                                onChange={(e) =>
                                    handlePendingChange(
                                        'fontSize',
                                        parseInt(e.target.value) || 12,
                                    )
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-center font-mono text-xs font-bold"
                            />
                        </PropertyRow>

                        <PropertyRow label="Color Texto">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={
                                        formData.fill?.startsWith('rgba')
                                            ? '#1e293b'
                                            : formData.fill || '#1e293b'
                                    }
                                    onChange={(e) =>
                                        handleImmediateChange(
                                            'fill',
                                            e.target.value,
                                        )
                                    }
                                    className="h-7 w-7 cursor-pointer rounded border-none"
                                />
                                <div className="flex flex-1 items-center justify-between rounded bg-muted/20 px-2 py-1 font-mono text-[10px] uppercase">
                                    <span className="truncate">{formData.fill || '#1e293b'}</span>
                                </div>
                            </div>
                        </PropertyRow>

                        <PropertyRow label="Transparencia">
                            <div className="flex w-full min-w-0 items-center gap-1.5">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={Math.round(
                                        (formData.fillOpacity !== undefined
                                            ? formData.fillOpacity
                                            : 1) * 100,
                                    )}
                                    onChange={(e) => {
                                        const pct = parseInt(e.target.value, 10);
                                        const opacityVal = pct / 100;
                                        handleImmediateChange('fillOpacity', opacityVal);
                                    }}
                                    className="h-1.5 w-full min-w-0 flex-1 cursor-pointer accent-blue-600"
                                />
                                <span className="w-8 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                                    {Math.round(
                                        (formData.fillOpacity !== undefined
                                            ? formData.fillOpacity
                                            : 1) * 100,
                                    )}
                                    %
                                </span>
                            </div>
                        </PropertyRow>

                        <PropertyRow label="Rotación (°)">
                            <Input
                                type="number"
                                min="0"
                                max="360"
                                value={Math.round(formData.rotation || 0)}
                                onChange={(e) =>
                                    handleImmediateChange(
                                        'rotation',
                                        parseInt(e.target.value) || 0,
                                    )
                                }
                                className="h-7 bg-muted/20 text-center font-mono text-xs font-bold"
                            />
                        </PropertyRow>

                        <PropertyRow label="Alineación">
                            <div className="flex bg-muted p-0.5 rounded-md gap-0.5 w-full">
                                <button
                                    type="button"
                                    onClick={() => handleImmediateChange('align', 'left')}
                                    className={cn(
                                        "flex-1 py-1 flex justify-center items-center rounded text-xs transition-colors",
                                        formData.align === 'left' ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title="Izquierda"
                                >
                                    <AlignLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleImmediateChange('align', 'center')}
                                    className={cn(
                                        "flex-1 py-1 flex justify-center items-center rounded text-xs transition-colors",
                                        (formData.align === 'center' || !formData.align) ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title="Centro"
                                >
                                    <AlignCenter className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleImmediateChange('align', 'right')}
                                    className={cn(
                                        "flex-1 py-1 flex justify-center items-center rounded text-xs transition-colors",
                                        formData.align === 'right' ? "bg-background text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title="Derecha"
                                >
                                    <AlignRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </PropertyRow>

                        <PropertyRow label="Estilo Fuente">
                            <div className="flex bg-muted p-0.5 rounded-md gap-1 w-full">
                                <button
                                    type="button"
                                    onClick={() => handleImmediateChange('fontStyle', formData.fontStyle === 'bold' ? 'normal' : 'bold')}
                                    className={cn(
                                        "flex-1 py-1 flex justify-center items-center rounded text-xs transition-colors font-bold",
                                        formData.fontStyle?.includes('bold') ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Bold className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleImmediateChange('fontStyle', formData.fontStyle === 'italic' ? 'normal' : 'italic')}
                                    className={cn(
                                        "flex-1 py-1 flex justify-center items-center rounded text-xs transition-colors italic",
                                        formData.fontStyle?.includes('italic') ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Italic className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </PropertyRow>

                        <PropertyRow label="Curvatura (Arco)">
                            <DraggableNumberInput
                                value={formData.curve || 0}
                                step={0.2}
                                speed={0.05}
                                min={-15}
                                max={15}
                                onChange={(val: number) => handleImmediateChange('curve', val)}
                                className="h-7 bg-muted/20 text-center font-mono text-xs font-bold"
                            />
                        </PropertyRow>

                        <div className="flex bg-muted p-0.5 rounded-md gap-1 w-full">
                            <button
                                type="button"
                                onClick={() => handleImmediateChange('curve', 0)}
                                className={cn(
                                    "flex-1 py-1 text-[10px] font-bold rounded transition-colors",
                                    (!formData.curve || formData.curve === 0) ? "bg-background text-foreground shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Recto
                            </button>
                            <button
                                type="button"
                                onClick={() => handleImmediateChange('curve', 3)}
                                className={cn(
                                    "flex-1 py-1 text-[10px] font-bold rounded transition-colors",
                                    formData.curve === 3 ? "bg-background text-foreground shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Arco (3)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleImmediateChange('curve', 6)}
                                className={cn(
                                    "flex-1 py-1 text-[10px] font-bold rounded transition-colors",
                                    formData.curve === 6 ? "bg-background text-foreground shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Alto (6)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleImmediateChange('curve', -4)}
                                className={cn(
                                    "flex-1 py-1 text-[10px] font-bold rounded transition-colors",
                                    formData.curve === -4 ? "bg-background text-foreground shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Invertido
                            </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="pt-2 border-t space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Presets Rápidos</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {['ESCENARIO', 'ENTRADA', 'ZONA VIP', 'BAR', 'BAÑOS', 'SALIDA'].map((preset) => (
                                    <Button
                                        key={preset}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 font-bold uppercase justify-start"
                                        onClick={() => handleImmediateChange('name', preset)}
                                    >
                                        {preset}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <Separator className="opacity-50" />
                </>
            )}

            {selectedNodes.some((n) => n.type === 'standing') && (
                <>
                    <SectionHeader
                        title="Acceso General"
                        icon={Users}
                        isOpen={true}
                        onToggle={() => {}}
                    />
                    <div className="space-y-3 px-1 py-3 pb-4">
                        <PropertyRow label="Nombre">
                            <Input
                                value={formData.name || ''}
                                onChange={(e) =>
                                    handlePendingChange('name', e.target.value)
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-xs"
                            />
                        </PropertyRow>
                        <PropertyRow
                            label="Capacidad"
                            info="Cantidad de personas permitidas"
                        >
                            <Input
                                type="number"
                                value={formData.capacity || 0}
                                onChange={(e) =>
                                    handlePendingChange(
                                        'capacity',
                                        parseInt(e.target.value),
                                    )
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-center font-mono text-xs font-bold text-emerald-600"
                            />
                        </PropertyRow>
                        <PropertyRow label="Ancho">
                            <Input
                                type="number"
                                value={formData.width || 0}
                                onChange={(e) =>
                                    handlePendingChange(
                                        'width',
                                        parseInt(e.target.value),
                                    )
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-center text-xs"
                            />
                        </PropertyRow>
                        <PropertyRow label="Alto">
                            <Input
                                type="number"
                                value={formData.height || 0}
                                onChange={(e) =>
                                    handlePendingChange(
                                        'height',
                                        parseInt(e.target.value),
                                    )
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-center text-xs"
                            />
                        </PropertyRow>
                        <PropertyRow label="Color">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={
                                        formData.fill?.startsWith('rgba')
                                            ? '#10b981'
                                            : formData.fill || '#10b981'
                                    }
                                    onChange={(e) =>
                                        handleImmediateChange(
                                            'fill',
                                            e.target.value,
                                        )
                                    }
                                    className="h-8 w-8 rounded border-none"
                                />
                                <div className="flex flex-1 items-center rounded bg-muted/20 px-2 py-1 font-mono text-[10px]">
                                    {formData.fill}
                                </div>
                            </div>
                        </PropertyRow>
                        <PropertyRow label="Posición Título">
                            <select
                                value={formData.titlePosition || 'top'}
                                onChange={(e) =>
                                    handleImmediateChange(
                                        'titlePosition',
                                        e.target.value,
                                    )
                                }
                                className="h-7 w-full rounded border-none bg-muted/20 px-2 text-[11px] outline-none"
                            >
                                <option value="top">Arriba</option>
                                <option value="center">Centro</option>
                                <option value="bottom">Abajo</option>
                            </select>
                        </PropertyRow>
                        <div className="mt-4 space-y-2 border-t border-muted/30 pt-4">
                            <SectionHeader
                                title="Categoría de Precio"
                                icon={LayoutList}
                                isOpen={sections.category}
                                onToggle={() => toggleSection('category')}
                                Action={() => (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={handleAddCategory}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                )}
                            />
                            {sections.category && (
                                <div className="grid grid-cols-1 gap-2 pt-2">
                                    {categories.map((cat: any) => (
                                        <button
                                            type="button"
                                            key={cat.id}
                                            onClick={() => {
                                                handleImmediateChange(
                                                    'category_id',
                                                    cat.id,
                                                );
                                                handleImmediateChange(
                                                    'fill',
                                                    cat.color,
                                                );
                                            }}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors',
                                                formData.category_id === cat.id
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-transparent hover:bg-muted/50',
                                            )}
                                        >
                                            <div
                                                className="h-6 w-6 shrink-0 rounded-md border border-white/20 shadow-inner"
                                                style={{
                                                    backgroundColor: cat.color,
                                                }}
                                            />
                                            <div className="flex-1 overflow-hidden">
                                                <div className="truncate text-xs font-bold">
                                                    {cat.name}
                                                </div>
                                            </div>
                                            {formData.category_id ===
                                                cat.id && (
                                                <Check className="h-4 w-4 shrink-0 text-blue-500" />
                                            )}
                                        </button>
                                    ))}
                                    {categories.length === 0 && (
                                        <p className="py-2 text-center text-[10px] text-muted-foreground italic">
                                            Crea categorías para asignar precios
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <Separator className="opacity-50" />
                </>
            )}

            {selectedNodes.some((n) => n.type === 'table_shape') && (
                <>
                    <SectionHeader
                        title="Configuración de Mesa"
                        icon={LayoutList}
                        isOpen={true}
                        onToggle={() => {}}
                    />
                    <div className="space-y-3 px-1 py-3 pb-4">
                        <PropertyRow label="Nombre">
                            <Input
                                value={formData.name || ''}
                                onChange={(e) =>
                                    handlePendingChange('name', e.target.value)
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-xs"
                            />
                        </PropertyRow>
                        <PropertyRow label="Forma">
                            <select
                                value={formData.shape || 'circle'}
                                onChange={(e) =>
                                    handleImmediateChange(
                                        'shape',
                                        e.target.value,
                                    )
                                }
                                className="h-7 w-full rounded border-none bg-muted/20 px-2 text-[11px] outline-none"
                            >
                                <option value="circle">Redonda</option>
                                <option value="rect">
                                    Cuadrada/Rectangular
                                </option>
                            </select>
                        </PropertyRow>
                        <PropertyRow
                            label="Asientos/Fila"
                            info="Número de asientos en cada fila seleccionada"
                        >
                            <Input
                                type="number"
                                value={formData.numSeats || 0}
                                onChange={(e) =>
                                    handlePendingChange(
                                        'numSeats',
                                        parseInt(e.target.value),
                                    )
                                }
                                onBlur={handleStructuralBlur}
                                className="h-7 bg-muted/20 text-center text-xs font-bold"
                            />
                        </PropertyRow>

                        {formData.totalSeats > 0 && (
                            <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-600/10 bg-blue-600/5 px-3 py-2">
                                <span className="text-[10px] font-bold tracking-wider text-blue-600/70 uppercase">
                                    Asientos Vinculados
                                </span>
                                <span className="font-mono text-sm font-black text-blue-700">
                                    {formData.totalSeats}
                                </span>
                            </div>
                        )}
                        {formData.shape === 'circle' ? (
                            <PropertyRow label="Radio">
                                <Input
                                    type="number"
                                    value={formData.radius || 0}
                                    onChange={(e) =>
                                        handlePendingChange(
                                            'radius',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    onBlur={handleStructuralBlur}
                                    className="h-7 bg-muted/20 text-center text-xs"
                                />
                            </PropertyRow>
                        ) : (
                            <>
                                <PropertyRow label="Ancho">
                                    <Input
                                        type="number"
                                        value={formData.width || 0}
                                        onChange={(e) =>
                                            handlePendingChange(
                                                'width',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        onBlur={handleStructuralBlur}
                                        className="h-7 bg-muted/20 text-center text-xs"
                                    />
                                </PropertyRow>
                                <PropertyRow label="Alto">
                                    <Input
                                        type="number"
                                        value={formData.height || 0}
                                        onChange={(e) =>
                                            handlePendingChange(
                                                'height',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        onBlur={handleStructuralBlur}
                                        className="h-7 bg-muted/20 text-center text-xs"
                                    />
                                </PropertyRow>
                            </>
                        )}
                    </div>
                    <Separator className="opacity-50" />
                </>
            )}

            {/* 3. ROW PROPERTIES - Only show if seats or tables selected */}
            {selectedNodes.some(
                (n) => n.type === 'seat' || n.type === 'table_shape',
            ) && (
                <>
                    <SectionHeader
                        title="Fila"
                        icon={Hash}
                        isOpen={sections.row}
                        onToggle={() => toggleSection('row')}
                    />
                    {sections.row && (
                        <div className="space-y-1 px-1 py-2 pb-6">
                            <PropertyRow
                                label="Asientos/Fila"
                                info="Número de asientos en cada fila seleccionada"
                            >
                                <Input
                                    type="number"
                                    value={formData.numSeats || 0}
                                    onChange={(e) =>
                                        handlePendingChange(
                                            'numSeats',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    onBlur={handleStructuralBlur}
                                    className="h-7 bg-muted/20 text-center text-xs font-bold"
                                />
                            </PropertyRow>

                            {formData.totalSeats > 0 && (
                                <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-600/10 bg-blue-600/5 px-3 py-2">
                                    <span className="text-[10px] font-bold tracking-wider text-blue-600/70 uppercase">
                                        Asientos Vinculados
                                    </span>
                                    <span className="font-mono text-sm font-black text-blue-700">
                                        {formData.totalSeats}
                                    </span>
                                </div>
                            )}

                            <PropertyRow label="Fila">
                                <Input
                                    value={formData.row || ''}
                                    onChange={(e) =>
                                        handlePendingChange(
                                            'row',
                                            e.target.value,
                                        )
                                    }
                                    onBlur={handleStructuralBlur}
                                    className="h-7 bg-muted/20 text-center text-xs font-bold"
                                />
                            </PropertyRow>
                            <PropertyRow label="Curva">
                                <DraggableNumberInput
                                    value={formData.curve || 0}
                                    step={0.002}
                                    speed={0.002}
                                    onChange={(val: number) => handleImmediateChange('curve', val)}
                                    className="h-7 bg-muted/20 text-center font-mono text-xs"
                                />
                            </PropertyRow>
                            {Array.from(new Set(selectedNodes.filter(n => n.row_uuid).map(n => n.row_uuid))).length > 1 && (
                                <PropertyRow label="Espacio Filas">
                                    <DraggableNumberInput
                                        value={formData.rowSpacing || 40}
                                        min={(formData.radius || 10) * 2 + 1}
                                        max={200}
                                        step={1}
                                        speed={0.5}
                                        onChange={(val: number) => handleImmediateChange('rowSpacing', val)}
                                        className="h-7 bg-muted/20 text-center font-mono text-xs"
                                    />
                                </PropertyRow>
                            )}
                            <PropertyRow label="Espaciado" info="Distancia entre asientos en píxeles">
                                <DraggableNumberInput
                                    value={formData.seatSpacing || 35}
                                    min={(formData.radius || 10) * 2 + 1}
                                    max={200}
                                    step={0.1}
                                    speed={0.1}
                                    onChange={(val: number) => handleImmediateChange('seatSpacing', val)}
                                    className="h-7 bg-muted/20 text-center font-mono text-xs"
                                />
                            </PropertyRow>

                            <PropertyRow label="Tamaño Asiento" info="Radio del asiento en píxeles">
                                <DraggableNumberInput
                                    value={formData.radius || 10}
                                    min={4}
                                    max={100}
                                    step={0.1}
                                    speed={0.1}
                                    onChange={(val: number) => handleImmediateChange('radius', val)}
                                    className="h-7 bg-muted/20 text-center font-mono text-xs"
                                />
                            </PropertyRow>
                        </div>
                    )}
                    <Separator className="opacity-50" />
                </>
            )}

            {/* 4. ROW LABELING - Only show if seats selected */}
            {selectedNodes.some((n) => n.type === 'seat') && (
                <>
                    <SectionHeader
                        title="Etiquetado de Fila"
                        icon={Languages}
                        isOpen={sections.rowLabeling}
                        onToggle={() => toggleSection('rowLabeling')}
                        Action={() => (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const defaults = {
                                        rowLabelEnabled: true,
                                        rowLabelPosition: 'both',
                                        rowLabelOverride: '',
                                        rowLabelDisplayType: 'Row',
                                        rowLabelType: 'ABC',
                                        rowLabelStart: 'A',
                                        rowLabelSkip: '',
                                        rowLabelDirection: 'TB',
                                    };
                                    onUpdate(defaults);
                                }}
                                className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                            >
                                <Trash2 className="h-3 w-3" /> Limpiar
                            </button>
                        )}
                    />
                    {sections.rowLabeling && (
                        <div className="space-y-1 px-1 py-2 pb-6">
                            <PropertyRow label="Habilitado">
                                <Checkbox
                                    checked={formData.rowLabelEnabled ?? false}
                                    onCheckedChange={(val) =>
                                        handleImmediateChange('rowLabelEnabled', val)
                                    }
                                />
                            </PropertyRow>

                            {isSingleRow ? (
                                <PropertyRow label="Etiqueta" info="Letra o número de esta fila (ej: 'VIP', 'A')">
                                    <Input
                                        value={formData.rowLabelOverride || formData.row || ''}
                                        onChange={(e) => {
                                            handlePendingChange('rowLabelOverride', e.target.value);
                                            handlePendingChange('row', e.target.value);
                                        }}
                                        onBlur={handleStructuralBlur}
                                        className="h-7 bg-muted/20 text-xs"
                                        placeholder="Ej: A, VIP..."
                                    />
                                </PropertyRow>
                            ) : (
                                <>
                                    <PropertyRow label="Etiquetas">
                                        <select
                                            value={formData.rowLabelType}
                                            onChange={(e) => {
                                                const type = e.target.value;
                                                const defaultStart = type === 'ABC' ? 'A' : '1';
                                                handleRowLabelUpdate({ rowLabelType: type, rowLabelStart: defaultStart });
                                            }}
                                            className="h-7 w-full rounded border-none bg-muted/20 px-2 text-[11px] outline-none"
                                        >
                                            <option value="">-Selecciona una opción-</option>
                                            <option value="ABC">A, B, C...</option>
                                            <option value="123">1, 2, 3...</option>
                                        </select>
                                    </PropertyRow>

                                    <PropertyRow label="Empieza en" info="Letra o número inicial de la secuencia">
                                        <div className="flex items-center gap-1">
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-7 w-7 text-muted-foreground"
                                                onClick={() => {
                                                    const cur = formData.rowLabelStart || 'A';
                                                    if (formData.rowLabelType === '123') {
                                                        const num = parseInt(cur) || 1;
                                                        handleRowLabelUpdate({ rowLabelStart: Math.max(1, num - 1).toString() });
                                                    } else {
                                                        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                                                        let idx = 0;
                                                        for (let i = 0; i < cur.length; i++) {
                                                            const charPos = alphabet.indexOf(cur[i].toUpperCase());
                                                            if (charPos !== -1) idx = idx * 26 + (charPos + 1);
                                                        }
                                                        let n = Math.max(0, (idx - 1) - 1);
                                                        let label = '';
                                                        while (n >= 0) {
                                                            label = alphabet[n % 26] + label;
                                                            n = Math.floor(n / 26) - 1;
                                                        }
                                                        handleRowLabelUpdate({ rowLabelStart: label || 'A' });
                                                    }
                                                }}
                                            >
                                                <ChevronRight className="h-4 w-4 rotate-180" />
                                            </Button>
                                            <Input
                                                value={formData.rowLabelStart || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, rowLabelStart: e.target.value }))}
                                                onBlur={(e) => handleRowLabelUpdate({ rowLabelStart: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRowLabelUpdate({ rowLabelStart: formData.rowLabelStart });
                                                }}
                                                className="h-7 flex-1 bg-muted/20 text-center font-mono text-xs font-bold"
                                            />
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-7 w-7 text-muted-foreground"
                                                onClick={() => {
                                                    const cur = formData.rowLabelStart || 'A';
                                                    if (formData.rowLabelType === '123') {
                                                        const num = parseInt(cur) || 1;
                                                        handleRowLabelUpdate({ rowLabelStart: (num + 1).toString() });
                                                    } else {
                                                        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                                                        let idx = 0;
                                                        for (let i = 0; i < cur.length; i++) {
                                                            const charPos = alphabet.indexOf(cur[i].toUpperCase());
                                                            if (charPos !== -1) idx = idx * 26 + (charPos + 1);
                                                        }
                                                        let n = (idx - 1) + 1;
                                                        let label = '';
                                                        while (n >= 0) {
                                                            label = alphabet[n % 26] + label;
                                                            n = Math.floor(n / 26) - 1;
                                                        }
                                                        handleRowLabelUpdate({ rowLabelStart: label || 'A' });
                                                    }
                                                }}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </PropertyRow>
                                </>
                            )}

                            <PropertyRow label="Saltar" info="Letras a omitir en la secuencia (separadas por comas)">
                                <div className="flex gap-1">
                                    {['I', 'O', 'Q'].map(char => {
                                        const currentSkips = (formData.rowLabelSkip || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                                        const isSkipped = currentSkips.includes(char);
                                        return (
                                            <Button
                                                key={char}
                                                type="button"
                                                variant={isSkipped ? "default" : "outline"}
                                                size="sm"
                                                className={cn("h-7 flex-1 text-[10px]", isSkipped && "bg-blue-600 hover:bg-blue-700")}
                                                onClick={() => {
                                                    const newSkips = isSkipped 
                                                        ? currentSkips.filter((c: string) => c !== char) 
                                                        : [...currentSkips, char];
                                                    handleRowLabelUpdate({ rowLabelSkip: newSkips.join(',') });
                                                }}
                                            >
                                                {char}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </PropertyRow>

                            {isMultipleRows && (
                                <PropertyRow label="Dirección">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-12 p-0"
                                        onClick={() => {
                                            const newDir = formData.rowLabelDirection === 'TB' ? 'BT' : 'TB';
                                            handleRowLabelUpdate({ rowLabelDirection: newDir });
                                        }}
                                        title={formData.rowLabelDirection === 'TB' ? 'Arriba hacia abajo' : 'Abajo hacia arriba'}
                                    >
                                        <ArrowUpDown className={cn("h-4 w-4 text-muted-foreground transition-transform", formData.rowLabelDirection === 'BT' && "rotate-180")} />
                                    </Button>
                                </PropertyRow>
                            )}

                            <PropertyRow label="Posición">
                                <div className="flex items-center gap-1.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = formData.rowLabelPosition;
                                            if (current === 'both') handleImmediateChange('rowLabelPosition', 'right');
                                            else if (current === 'right') handleImmediateChange('rowLabelPosition', 'both');
                                            else if (current === 'left') handleImmediateChange('rowLabelPosition', 'none');
                                            else handleImmediateChange('rowLabelPosition', 'left');
                                        }}
                                        className={cn(
                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold shadow-sm transition-colors',
                                            formData.rowLabelPosition === 'left' || formData.rowLabelPosition === 'both'
                                                ? 'bg-background border-muted-foreground/30 text-foreground'
                                                : 'bg-muted/50 border-transparent text-muted-foreground/40 hover:text-muted-foreground'
                                        )}
                                    >
                                        F
                                    </button>
                                    <div className="flex flex-1 justify-center gap-[3px]">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-[7px] w-[7px] rounded-full border border-muted-foreground/40" />
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = formData.rowLabelPosition;
                                            if (current === 'both') handleImmediateChange('rowLabelPosition', 'left');
                                            else if (current === 'left') handleImmediateChange('rowLabelPosition', 'both');
                                            else if (current === 'right') handleImmediateChange('rowLabelPosition', 'none');
                                            else handleImmediateChange('rowLabelPosition', 'right');
                                        }}
                                        className={cn(
                                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold shadow-sm transition-colors',
                                            formData.rowLabelPosition === 'right' || formData.rowLabelPosition === 'both'
                                                ? 'bg-background border-muted-foreground/30 text-foreground'
                                                : 'bg-muted/50 border-transparent text-muted-foreground/40 hover:text-muted-foreground'
                                        )}
                                    >
                                        F
                                    </button>
                                </div>
                            </PropertyRow>

                            <PropertyRow label="Mostrar tipo">
                                <select
                                    value={
                                        ['Row', 'Couch', 'Bar', 'Table'].includes(formData.rowLabelDisplayType || 'Row')
                                            ? (formData.rowLabelDisplayType || 'Row')
                                            : 'custom'
                                    }
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'custom') {
                                            handleImmediateChange('rowLabelDisplayType', 'Personalizado');
                                        } else {
                                            handleImmediateChange('rowLabelDisplayType', val);
                                        }
                                    }}
                                    className="h-7 w-full rounded border-none bg-muted/20 px-2 text-[11px] outline-none"
                                >
                                    <option value="Row">Fila</option>
                                    <option value="Couch">Sofá</option>
                                    <option value="Bar">Barra</option>
                                    <option value="Table">Mesa</option>
                                    <option value="custom">Personalizado...</option>
                                </select>
                            </PropertyRow>

                            {!['Row', 'Couch', 'Bar', 'Table'].includes(formData.rowLabelDisplayType || 'Row') && (
                                <PropertyRow label="Nombre Personalizado">
                                    <Input
                                        value={formData.rowLabelDisplayType || ''}
                                        onChange={(e) => handlePendingChange('rowLabelDisplayType', e.target.value)}
                                        onBlur={handleStructuralBlur}
                                        className="h-7 bg-muted/20 text-xs"
                                        placeholder="Ej: Palco, Terraza..."
                                    />
                                </PropertyRow>
                            )}
                        </div>
                    )}
                    <Separator className="opacity-50" />
                </>
            )}

            {/* 5. SEAT LABELING - Only show if seats selected */}
            {selectedNodes.some((n) => n.type === 'seat') && (
                <>
                    <SectionHeader
                        title="Etiquetado de Asiento"
                        icon={Navigation}
                        isOpen={sections.seatLabeling}
                        onToggle={() => toggleSection('seatLabeling')}
                    />
                    {sections.seatLabeling && (
                        <div className="space-y-1 px-1 py-2 pb-6">
                            <PropertyRow label="Etiquetas">
                                <select
                                    value={formData.seatLabelType}
                                    onChange={(e) => handleImmediateChange('seatLabelType', e.target.value)}
                                    className="h-7 w-full rounded border-none bg-muted/20 px-2 text-[11px] outline-none"
                                >
                                    <option value="123">Secuencial (1, 2, 3...)</option>
                                    <option value="Pares">Pares (2, 4, 6...)</option>
                                    <option value="Impares">Impares (1, 3, 5...)</option>
                                </select>
                            </PropertyRow>

                            <PropertyRow label="En Pasillos" info="Numeración al dejar huecos o pasillos intermedios">
                                <select
                                    value={formData.seatNumberingMode || 'consecutive'}
                                    onChange={(e) => handleImmediateChange('seatNumberingMode', e.target.value)}
                                    className="h-7 w-full rounded border-none bg-muted/20 px-2 text-[11px] outline-none"
                                >
                                    <option value="consecutive">Consecutiva (1, 2, 3... 4, 5)</option>
                                    <option value="positional">Posicional (1, 2, 3... 6, 7)</option>
                                </select>
                            </PropertyRow>
                            
                            <PropertyRow label="Empieza en">
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => {
                                        const cur = parseInt(formData.seatLabelStart) || 1;
                                        handleImmediateChange('seatLabelStart', Math.max(1, cur - 1));
                                    }}>
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                    </Button>
                                    <Input
                                        value={formData.seatLabelStart || ''}
                                        onChange={(e) => handlePendingChange('seatLabelStart', e.target.value)}
                                        onBlur={handleStructuralBlur}
                                        className="h-7 flex-1 bg-muted/20 text-center font-mono text-xs"
                                    />
                                    <Button variant="outline" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => {
                                        const cur = parseInt(formData.seatLabelStart) || 1;
                                        handleImmediateChange('seatLabelStart', cur + 1);
                                    }}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </PropertyRow>

                            <PropertyRow label="Dirección">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-12 p-0"
                                    onClick={() => {
                                        const currentDir = formData.seatLabelDirection === 'RL' ? 'RL' : 'LR';
                                        const nextDir = currentDir === 'LR' ? 'RL' : 'LR';
                                        handleImmediateChange('seatLabelDirection', nextDir);
                                    }}
                                    title={formData.seatLabelDirection === 'RL' ? 'Derecha a Izquierda' : 'Izquierda a Derecha'}
                                >
                                    <ArrowLeftRight className={cn("h-4 w-4 text-muted-foreground", formData.seatLabelDirection === 'RL' && "text-blue-600")} />
                                </Button>
                            </PropertyRow>

                            <PropertyRow label="Mostrar tipo">
                                <Input
                                    value="Asiento"
                                    disabled
                                    className="h-7 bg-muted/20 text-xs text-muted-foreground"
                                />
                            </PropertyRow>
                        </div>
                    )}
                    <Separator className="opacity-50" />
                </>
            )}

            {/* ACTIONS */}
            <div className="space-y-3 pt-8">
                <div className="grid grid-cols-4 gap-2 px-1">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-full"
                        onClick={() => onAlign('left')}
                        title="Alinear Izquierda"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-full"
                        onClick={() => onAlign('right')}
                        title="Alinear Derecha"
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-full"
                        onClick={() => onAlign('top')}
                        title="Alinear Arriba"
                    >
                        <AlignStartVertical className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-9 w-full"
                        onClick={() => onAlign('bottom')}
                        title="Alinear Abajo"
                    >
                        <AlignEndVertical className="h-4 w-4" />
                    </Button>
                </div>
                <Button
                    variant="ghost"
                    className="h-10 w-full text-xs font-bold tracking-widest text-destructive uppercase hover:bg-destructive/10 hover:text-destructive"
                    onClick={onDelete}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Selección
                </Button>
            </div>
        </div>
    );
};

export default Inspector;

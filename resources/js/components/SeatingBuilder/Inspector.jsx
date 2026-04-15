import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Settings, Hash, Map, Palette, Trash2, Layers, 
    AlignLeft, AlignRight, AlignStartVertical, AlignEndVertical,
    ChevronDown, ChevronRight, Info, Languages, Navigation,
    Image as ImageIcon, MoreHorizontal, ArrowLeftRight, ArrowUpDown,
    Check
} from 'lucide-react';
import { cn } from "@/lib/utils";

const SectionHeader = ({ title, icon: Icon, isOpen, onToggle, Action }) => (
    <div className="flex items-center justify-between w-full pr-2">
        <button 
            onClick={onToggle}
            className="flex items-center justify-between flex-1 py-3 px-1 hover:bg-muted/50 transition-colors group"
        >
            <div className="flex items-center gap-2">
                <div className={cn("p-1 rounded bg-muted group-hover:bg-background transition-colors", isOpen && "bg-blue-600/10 text-blue-600")}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
            </div>
            {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
        </button>
        {Action && <Action />}
    </div>
);

const PropertyRow = ({ label, children, info }) => (
    <div className="flex items-center justify-between py-1.5 gap-4">
        <div className="flex items-center gap-1.5 min-w-[100px]">
            <Label className="text-[11px] text-muted-foreground font-medium">{label}</Label>
            {info && <Info className="h-3 w-3 text-muted-foreground/30 cursor-help" />}
        </div>
        <div className="flex-1 max-w-[120px]">
            {children}
        </div>
    </div>
);

const Inspector = ({ selectedNodes, onUpdate, onDelete, onAlign, onRedistribute }) => {
    const [sections, setSections] = useState({
        category: true,
        row: true,
        sectionLabeling: false,
        rowLabeling: true,
        seatLabeling: true,
        view: false
    });

    const [formData, setFormData] = useState({
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
        rowLabelSkip: 'I,O,Q',
        rowLabelPosition: 'both',
        rowLabelOverride: '',
        rowLabelDisplayType: 'Row',
        seatLabelType: '123',
        seatLabelStart: 1,
        seatLabelDirection: 'LR'
    });

    // Tracking pending changes for structural fields
    const [pendingStructural, setPendingStructural] = useState({});

    useEffect(() => {
        if (selectedNodes.length > 0) {
            const first = selectedNodes[0];
            
            // Aggregate values to find commonalities
            const getCommon = (field, defaultValue = '') => {
                const firstVal = first[field];
                return selectedNodes.every(n => n[field] === firstVal) ? firstVal : defaultValue;
            };

            // Enhanced logic for seat count
            const rowUuids = Array.from(new Set(selectedNodes.map(n => n.row_uuid).filter(Boolean)));
            let commonNumSeats = 0;
            if (rowUuids.length > 0) {
                const counts = rowUuids.map(uuid => selectedNodes.filter(n => n.row_uuid === uuid).length);
                if (counts.every(v => v === counts[0])) commonNumSeats = counts[0];
            }

            const data = {
                section: getCommon('section'),
                row: rowUuids.length === 1 ? first.row : '', // Only show specific row label if 1 row selected
                fill: getCommon('fill', '#94a3b8'),
                radius: getCommon('radius', 10),
                numSeats: commonNumSeats || (rowUuids.length === 0 ? selectedNodes.length : 0),
                curve: getCommon('curvature', 0),
                seatSpacing: getCommon('spacing', 35),
                seatLabelDirection: getCommon('seat_label_direction', 'LR'),
                rowLabelEnabled: getCommon('row_label_enabled', true),
                rowLabelPosition: getCommon('row_label_position', 'both'),
                rowLabelOverride: getCommon('row_label_override', ''),
                rowLabelDisplayType: getCommon('row_label_display_type', 'Row'),
                // Section Container properties
                name: getCommon('name', 'Nueva Sección'),
                width: getCommon('width', 400),
                height: getCommon('height', 300),
                stroke: getCommon('stroke', '#3b82f6'),
            };
            
            // If it's a block, we might want to prioritize specific block row start
            if (rowUuids.length > 1) {
                // Future: add block-level property detection
            }

            setFormData(prev => ({ ...prev, ...data }));
            setPendingStructural({}); 
        }
    }, [selectedNodes]);

    // Helper to count seats in row
    function nodesInRow(uuid) {
        if (!uuid) return selectedNodes.length;
        // This is a bit hacky as we don't have the full nodes array here, 
        // but we can assume selectedNodes might represent it if selecting a row.
        return selectedNodes.filter(n => n.row_uuid === uuid).length;
    }

    const toggleSection = (section) => {
        setSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleImmediateChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        onUpdate({ [field]: value });
    };

    const handlePendingChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setPendingStructural(prev => ({ ...prev, [field]: value }));
    };

    const applyStructuralChanges = () => {
        if (Object.keys(pendingStructural).length > 0) {
            onUpdate(pendingStructural);
            setPendingStructural({});
        }
    };

    if (selectedNodes.length === 0) {
        return (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                <div className="p-4 rounded-full bg-muted">
                    <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium uppercase tracking-widest">Inspector Vacío</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">Selecciona asientos o bloques para configurarlos.</p>
            </div>
        );
    }

    const hasPending = Object.keys(pendingStructural).length > 0;

    return (
        <div className="flex-1 overflow-y-auto px-4 pb-12 space-y-1 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* 0. SECTION CONTAINER SPECIFIC */}
            {selectedNodes.some(n => n.type === 'section_container') && (
                <>
                <SectionHeader 
                    title="Configuración de Sección" 
                    icon={Map} 
                    isOpen={sections.category} 
                    onToggle={() => toggleSection('category')} 
                />
                <div className="px-1 py-3 space-y-3 pb-4">
                    <PropertyRow label="Nombre">
                        <Input 
                            value={formData.name || ''} 
                            onChange={(e) => handleImmediateChange('name', e.target.value)}
                            className="h-7 text-xs bg-muted/20"
                        />
                    </PropertyRow>
                    <PropertyRow label="Ancho">
                        <Input 
                            type="number"
                            value={formData.width || 0} 
                            onChange={(e) => handleImmediateChange('width', parseInt(e.target.value))}
                            className="h-7 text-xs bg-muted/20 text-center"
                        />
                    </PropertyRow>
                    <PropertyRow label="Alto">
                        <Input 
                            type="number"
                            value={formData.height || 0} 
                            onChange={(e) => handleImmediateChange('height', parseInt(e.target.value))}
                            className="h-7 text-xs bg-muted/20 text-center"
                        />
                    </PropertyRow>
                    <PropertyRow label="Color">
                        <div className="flex gap-2">
                             <input 
                                type="color" 
                                value={formData.fill?.startsWith('rgba') ? '#3b82f6' : (formData.fill || '#3b82f6')} 
                                onChange={(e) => handleImmediateChange('fill', e.target.value)}
                                className="w-8 h-8 rounded border-none"
                            />
                            <div className="flex-1 bg-muted/20 rounded px-2 py-1 text-[10px] items-center flex font-mono">
                                {formData.fill}
                            </div>
                        </div>
                    </PropertyRow>
                </div>
                <Separator className="opacity-50" />
                </>
            )}

            {/* 1. CATEGORY */}
            <SectionHeader 
                title="Categoría" 
                icon={Palette} 
                isOpen={sections.category} 
                onToggle={() => toggleSection('category')} 
            />
            {sections.category && (
                <div className="px-1 py-3 space-y-3 pb-6">
                    <div className="flex items-center gap-3">
                        <div 
                            className="h-8 w-8 rounded-lg shadow-inner border border-white/20" 
                            style={{ backgroundColor: formData.fill }}
                        />
                        <div className="flex-1 bg-muted/40 rounded-full px-4 py-2 text-[11px] font-medium text-muted-foreground border border-border/50">
                            {formData.fill === '#94a3b8' ? 'Sin categoría asignada' : `Color: ${formData.fill.toUpperCase()}`}
                        </div>
                    </div>
                </div>
            )}

            <Separator className="opacity-50" />

            {/* 2. ROW PROPERTIES */}
            <SectionHeader 
                title="Fila" 
                icon={Hash} 
                isOpen={sections.row} 
                onToggle={() => toggleSection('row')} 
            />
            {sections.row && (
                <div className="px-1 py-2 space-y-1 pb-6">
                    <PropertyRow label="Número de asientos">
                        <Input 
                            type="number" 
                            value={formData.numSeats} 
                            onChange={(e) => handlePendingChange('numSeats', parseInt(e.target.value))}
                            className="h-7 text-xs bg-muted/20 text-center font-mono"
                        />
                    </PropertyRow>
                    <PropertyRow label="Curva">
                        <Input 
                            type="number" 
                            value={formData.curve} 
                            onChange={(e) => handlePendingChange('curve', parseFloat(e.target.value))}
                            className="h-7 text-xs bg-muted/20 text-center font-mono"
                        />
                    </PropertyRow>
                    <PropertyRow label="Espaciado asiento">
                        <div className="flex items-center gap-1">
                            <Input 
                                type="number" 
                                value={formData.seatSpacing} 
                                onChange={(e) => handlePendingChange('seatSpacing', parseInt(e.target.value))}
                                className="h-7 text-xs bg-muted/20 text-center font-mono"
                            />
                            <span className="text-[10px] text-muted-foreground">px</span>
                        </div>
                    </PropertyRow>
                    
                    {hasPending && (
                        <div className="pt-2 animate-in fade-in zoom-in-95 duration-200">
                            <Button 
                                onClick={applyStructuralChanges}
                                className="w-full h-8 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg"
                            >
                                <Check className="h-3 w-3" /> APLICAR CAMBIOS
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <Separator className="opacity-50" />

            {/* 4. ROW LABELING */}
            <SectionHeader 
                title="Etiquetado de Fila" 
                icon={Languages} 
                isOpen={sections.rowLabeling} 
                onToggle={() => toggleSection('rowLabeling')} 
                Action={() => (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            // Reset row labeling to defaults
                            const defaults = {
                                rowLabelEnabled: true,
                                rowLabelPosition: 'both',
                                rowLabelOverride: '',
                                rowLabelDisplayType: 'Row'
                            };
                            handleUpdateNodes(defaults);
                        }}
                        className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                    >
                        <Trash2 className="h-3 w-3" /> Limpiar
                    </button>
                )}
            />
            {sections.rowLabeling && (
                <div className="px-1 py-2 space-y-1 pb-6">
                    <PropertyRow label="Habilitado">
                        <Checkbox 
                            checked={formData.rowLabelEnabled}
                            onCheckedChange={(val) => handlePendingChange('rowLabelEnabled', val)}
                        />
                    </PropertyRow>

                    <PropertyRow label="Etiquetas">
                        <select 
                            value={formData.rowLabelType}
                            onChange={(e) => {
                                const type = e.target.value;
                                const defaultStart = type === 'ABC' ? 'A' : '1';
                                handlePendingChange('rowLabelType', type);
                                handlePendingChange('row', defaultStart);
                                handlePendingChange('rowLabelStart', defaultStart);
                            }}
                            className="w-full h-7 text-[11px] rounded bg-muted/20 border-none outline-none px-2"
                        >
                            <option value="ABC">Letras (A, B, C...)</option>
                            <option value="123">Números (1, 2, 3...)</option>
                        </select>
                    </PropertyRow>

                    <PropertyRow label="Etiqueta Visual" info="Sobreescribe la letra de la fila">
                        <div className="flex gap-1">
                            <Input 
                                value={formData.rowLabelOverride} 
                                onChange={(e) => handlePendingChange('rowLabelOverride', e.target.value)}
                                className="h-7 text-xs bg-muted/20"
                                placeholder="Automático"
                            />
                        </div>
                    </PropertyRow>

                    <PropertyRow label="Empieza en">
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => {
                                    // Implementation for prev label if numeric
                                }}
                            >
                                <ArrowUpDown className="h-3 w-3 opacity-30 rotate-90" />
                            </Button>
                            <Input 
                                value={formData.row} 
                                onChange={(e) => {
                                    handlePendingChange('row', e.target.value);
                                    handlePendingChange('rowLabelStart', e.target.value);
                                }}
                                className="h-7 text-xs bg-muted/20 text-center font-mono flex-1"
                            />
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6"
                            >
                                <ArrowUpDown className="h-3 w-3 opacity-30 -rotate-90" />
                            </Button>
                        </div>
                    </PropertyRow>

                    <PropertyRow label="Saltar">
                         <Input 
                            value={formData.rowLabelSkip} 
                            onChange={(e) => handleImmediateChange('rowLabelSkip', e.target.value)}
                            className="h-7 text-xs bg-muted/20 text-center font-mono text-blue-500 font-bold"
                            placeholder="I,O,Q"
                        />
                    </PropertyRow>

                    <PropertyRow label="Dirección">
                        <Button 
                            variant={formData.seatLabelDirection === 'RL' ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 w-full text-[10px] gap-1"
                            onClick={() => handlePendingChange('seatLabelDirection', formData.seatLabelDirection === 'LR' ? 'RL' : 'LR')}
                        >
                            <ArrowLeftRight className="h-3.5 w-3.5" />
                            Invertir
                        </Button>
                    </PropertyRow>

                    <PropertyRow label="Posición">
                        <div className="flex bg-muted/20 rounded p-0.5">
                            <button 
                                onClick={() => handlePendingChange('rowLabelPosition', 'left')}
                                className={cn(
                                    "flex-1 h-7 text-[10px] rounded flex items-center justify-center font-bold",
                                    formData.rowLabelPosition === 'left' ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground"
                                )}
                            >A</button>
                            <button 
                                onClick={() => handlePendingChange('rowLabelPosition', 'both')}
                                className={cn(
                                    "flex-1 h-7 text-[10px] rounded flex items-center justify-center font-bold border-l border-r border-muted",
                                    formData.rowLabelPosition === 'both' ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground"
                                )}
                            >A-A</button>
                            <button 
                                onClick={() => handlePendingChange('rowLabelPosition', 'right')}
                                className={cn(
                                    "flex-1 h-7 text-[10px] rounded flex items-center justify-center font-bold",
                                    formData.rowLabelPosition === 'right' ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground"
                                )}
                            >A</button>
                        </div>
                    </PropertyRow>

                    <PropertyRow label="Mostrar tipo">
                        <select 
                            value={formData.rowLabelDisplayType}
                            onChange={(e) => handlePendingChange('rowLabelDisplayType', e.target.value)}
                            className="w-full h-7 text-[11px] rounded bg-muted/20 border-none outline-none px-2"
                        >
                            <option value="Row">Fila</option>
                            <option value="Section">Sección</option>
                            <option value="None">Ninguno</option>
                        </select>
                    </PropertyRow>
                </div>
            )}

            <Separator className="opacity-50" />

            {/* 5. SEAT LABELING */}
            <SectionHeader 
                title="Etiquetado de Asiento" 
                icon={Navigation} 
                isOpen={sections.seatLabeling} 
                onToggle={() => toggleSection('seatLabeling')} 
            />
            {sections.seatLabeling && (
                <div className="px-1 py-2 space-y-1 pb-6">
                    <PropertyRow label="Tipo Numeración">
                        <select 
                            value={formData.seatLabelType}
                            onChange={(e) => handlePendingChange('seatLabelType', e.target.value)}
                            className="w-full h-7 text-[11px] rounded bg-muted/20 border-none outline-none px-2"
                        >
                            <option value="123">Secuencial (1, 2, 3...)</option>
                            <option value="Pares">Pares (2, 4, 6...)</option>
                            <option value="Impares">Impares (1, 3, 5...)</option>
                        </select>
                    </PropertyRow>
                    <PropertyRow label="Empieza en">
                        <Input 
                            type="number"
                            value={formData.seatLabelStart} 
                            onChange={(e) => handlePendingChange('seatLabelStart', parseInt(e.target.value))}
                            className="h-7 text-xs bg-muted/20 text-center font-mono"
                        />
                    </PropertyRow>
                    <PropertyRow label="Dirección">
                        <select 
                            value={formData.seatLabelDirection}
                            onChange={(e) => handlePendingChange('seatLabelDirection', e.target.value)}
                            className="w-full h-7 text-[11px] rounded bg-muted/20 border-none outline-none px-2"
                        >
                            <option value="LR">Izq → Der</option>
                            <option value="RL">Der → Izq</option>
                        </select>
                    </PropertyRow>
                </div>
            )}

            <Separator className="opacity-50" />

            {/* ACTIONS */}
            <div className="pt-8 space-y-3">
                <div className="grid grid-cols-4 gap-2 px-1">
                    <Button variant="secondary" size="icon" className="h-9 w-full" onClick={() => onAlign('left')} title="Alinear Izquierda">
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-9 w-full" onClick={() => onAlign('right')} title="Alinear Derecha">
                        <AlignRight className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-9 w-full" onClick={() => onAlign('top')} title="Alinear Arriba">
                        <AlignStartVertical className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-9 w-full" onClick={() => onAlign('bottom')} title="Alinear Abajo">
                        <AlignEndVertical className="h-4 w-4" />
                    </Button>
                </div>
                <Button 
                    variant="ghost" 
                    className="w-full h-10 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs font-bold uppercase tracking-widest"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Selección
                </Button>
            </div>
        </div>
    );
};

export default Inspector;

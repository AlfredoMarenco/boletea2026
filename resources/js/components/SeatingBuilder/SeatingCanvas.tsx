import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    Stage,
    Layer,
    Rect,
    Circle,
    Group,
    Text,
    Transformer,
    Line,
    Image as KonvaImage,
} from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';
import {
    generateRow,
    generateGrid,
    getRowLabel,
    getNextRowLabel,
    generateHoneycomb,
    getSeatNumber,
} from './RowGenerator';
import { SeatingLayout, SeatingNode } from './types';
import Konva from 'konva';
import { toast } from 'sonner';

// Helper to get coordinates relative to the zoom/pan of the stage
const getRelativePointerPosition = (stage: Konva.Stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    return pos ? transform.point(pos) : { x: 0, y: 0 };
};

const isPointInRect = (
    px: number,
    py: number,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
) => {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};

const isPointInPolygon = (
    px: number,
    py: number,
    points: number[],
    offsetX = 0,
    offsetY = 0,
) => {
    let inside = false;
    for (let i = 0, j = points.length - 2; i < points.length; i += 2) {
        const xi = points[i] + offsetX,
            yi = points[i + 1] + offsetY;
        const xj = points[j] + offsetX,
            yj = points[j + 1] + offsetY;
        const intersect =
            yi > py !== yj > py &&
            px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
        j = i;
    }
    return inside;
};

// --- MEMOIZED COMPONENTS FOR PERFORMANCE ---

interface SeatNodeProps {
    node: SeatingNode;
    mode: 'edit' | 'preview';
    isSelected: boolean;
    isHovered: boolean;
    isInCart: boolean;
    stageScale: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
    onTap: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

const SeatNode = React.memo<SeatNodeProps>(
    ({
        node,
        mode,
        isSelected,
        isHovered,
        isInCart,
        stageScale,
        onMouseEnter,
        onMouseLeave,
        onDragStart,
        onDragMove,
        onDragEnd,
        onClick,
        onTap,
    }) => {
        const radius = node.radius || 10;
        return (
            <Group
                id={node.id}
                name="selectable"
                x={node.x}
                y={node.y}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                draggable={mode === 'edit'}
                transformsEnabled="position"
                perfectDrawEnabled={false}
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
            >
                <Circle
                    id={node.id}
                    radius={
                        mode === 'preview' && isHovered ? radius * 1.2 : radius
                    }
                    fill={
                        isInCart
                            ? '#10b981'
                            : isSelected
                              ? '#fbbf24'
                              : node.fill || '#e2e8f0'
                    }
                    stroke={isSelected ? '#d97706' : node.stroke || '#94a3b8'}
                    strokeWidth={isSelected ? 2 : 1}
                    name="selectable"
                    perfectDrawEnabled={false}
                    shadowForStrokeEnabled={false}
                    listening={true}
                />
                {stageScale >= 0.5 && (
                    <Text
                        text={node.number !== undefined && node.number !== null ? `${node.number}` : '?'}
                        fontSize={radius * 0.8}
                        x={-radius}
                        y={-radius / 1.7}
                        fill="#475569"
                        align="center"
                        verticalAlign="middle"
                        width={radius * 2}
                        fontStyle="bold"
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                )}
            </Group>
        );
    },
);

SeatNode.displayName = 'SeatNode';

interface TableNodeProps {
    node: SeatingNode;
    mode: 'edit' | 'preview';
    isSelected: boolean;
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

const TableNode = React.memo<TableNodeProps>(
    ({ node, mode, isSelected, onDragEnd }) => {
        const radius = node.radius || 45;
        const width = node.width || 90;
        const height = node.height || 90;
        return (
            <Group
                id={node.id}
                name="selectable"
                x={node.x}
                y={node.y}
                draggable={mode === 'edit'}
                onDragEnd={onDragEnd}
            >
                {node.shape === 'circle' ? (
                    <Circle
                        radius={radius}
                        fill={node.fill}
                        stroke={isSelected ? '#3b82f6' : node.stroke}
                        strokeWidth={isSelected ? 3 : 2}
                    />
                ) : (
                    <Rect
                        x={-width / 2}
                        y={-height / 2}
                        width={width}
                        height={height}
                        fill={node.fill}
                        stroke={isSelected ? '#3b82f6' : node.stroke}
                        strokeWidth={isSelected ? 3 : 2}
                        cornerRadius={8}
                    />
                )}
                <Text
                    text={node.name}
                    x={node.shape === 'circle' ? -radius : -width / 2}
                    y={-6}
                    width={node.shape === 'circle' ? radius * 2 : width}
                    align="center"
                    fill="#475569"
                    fontStyle="bold"
                    fontSize={12}
                    listening={false}
                />
            </Group>
        );
    },
);

TableNode.displayName = 'TableNode';

interface SectionNodeProps {
    node: SeatingNode;
    isSelected: boolean;
    stageScale: number;
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

const SectionNode = React.memo<SectionNodeProps>(
    ({
        node,
        isSelected,
        onDragStart,
        onDragMove,
        onDragEnd,
        onTransformEnd,
    }) => {
        const width = node.width || 200;
        const height = node.height || 150;
        const radius = node.radius || 80;

        let shape;
        if (node.type === 'rect_zone') {
            shape = (
                <Rect
                    width={width}
                    height={height}
                    fill={node.fill || 'rgba(52, 211, 153, 0.15)'}
                    stroke={isSelected ? '#fbbf24' : node.stroke || '#10b981'}
                    strokeWidth={isSelected ? 3 : node.strokeWidth || 2}
                    cornerRadius={8}
                    name="selectable"
                    id={node.id}
                />
            );
        } else if (node.type === 'circle_zone') {
            shape = (
                <Circle
                    radius={radius}
                    fill={node.fill || 'rgba(59, 130, 246, 0.15)'}
                    stroke={isSelected ? '#fbbf24' : node.stroke || '#3b82f6'}
                    strokeWidth={isSelected ? 3 : node.strokeWidth || 2}
                    name="selectable"
                    id={node.id}
                />
            );
        } else {
            shape = (
                <Line
                    points={node.points}
                    fill={node.fill || 'rgba(59, 130, 246, 0.08)'}
                    stroke={isSelected ? '#fbbf24' : (node.type === 'section_container' ? 'transparent' : node.stroke || '#3b82f6')}
                    strokeWidth={isSelected ? 3 : node.strokeWidth || 2}
                    closed={true}
                    name="selectable"
                    id={node.id}
                />
            );
        }

        return (
            <Group
                id={node.id}
                x={node.x}
                y={node.y}
                scaleX={node.scaleX ?? 1}
                scaleY={node.scaleY ?? 1}
                draggable
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                onTransformEnd={onTransformEnd}
            >
                {shape}
                {node.showTitle !== false && (
                    <Text
                        text={node.name}
                        x={node.type === 'circle_zone' ? -radius : 0}
                        y={
                            node.type === 'circle_zone'
                                ? -10
                                : node.titlePosition === 'center'
                                  ? height / 2 - 10
                                  : node.titlePosition === 'bottom'
                                    ? height + 10
                                    : -25
                        }
                        width={node.type === 'circle_zone' ? radius * 2 : width}
                        align="center"
                        fill={node.stroke || '#3b82f6'}
                        fontSize={16}
                        fontStyle="bold"
                        listening={false}
                    />
                )}
            </Group>
        );
    },
);

SectionNode.displayName = 'SectionNode';

interface StandingNodeProps {
    node: SeatingNode;
    isSelected: boolean;
    stageScale: number;
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}

const StandingNode = React.memo<StandingNodeProps>(
    ({ node, isSelected, onDragEnd }) => {
        const width = node.width || 400;
        const height = node.height || 300;
        return (
            <Group
                x={node.x}
                y={node.y}
                id={node.id}
                draggable
                onDragEnd={onDragEnd}
            >
                <Rect
                    id={node.id}
                    width={width}
                    height={height}
                    fill={node.fill || 'rgba(16, 185, 129, 0.1)'}
                    stroke={isSelected ? '#fbbf24' : node.stroke || '#10b981'}
                    strokeWidth={isSelected ? 3 : 2}
                    name="selectable"
                    cornerRadius={4}
                />
                {node.showTitle !== false && (
                    <Text
                        text={`${node.name}\n(Capacidad: ${node.capacity || 0})`}
                        x={0}
                        y={
                            node.titlePosition === 'center'
                                ? height / 2 - 15
                                : node.titlePosition === 'bottom'
                                  ? height + 10
                                  : -35
                        }
                        width={width}
                        align="center"
                        fill={node.stroke || '#10b981'}
                        fontSize={14}
                        fontStyle="bold"
                        listening={false}
                    />
                )}
            </Group>
        );
    },
);

StandingNode.displayName = 'StandingNode';

// --- END MEMOIZED COMPONENTS ---

interface SeatingCanvasRef {
    undo: () => void;
    redo: () => void;
    addRow: (x?: number, y?: number) => void;
    addGrid: (x?: number, y?: number) => void;
    addHoneycomb: (x?: number, y?: number) => void;
    addRectZone: (x?: number, y?: number) => void;
    addCircleZone: (x?: number, y?: number) => void;
    addSectionContainer: (x: number, y: number) => void;
    redistributeSelected: (params: any) => void;
    deleteSelected: () => void;
    align: (direction: string) => void;
    updateRowStructure: (rowUuid: string, newProps: any) => void;
    updateRowLabels: (rowUuid: string, newProps: any) => void;
    updateBlockStructure: (blockUuid: string, newProps: any) => void;
    updateBlockLabels: (blockUuid: string, newProps: any) => void;
    updateTableStructure: (tableUuid: string, newProps: any) => void;
    fitView: () => void;
    getCurrentFocus: () => { x: number; y: number; zoom: number };
    zoomToFocus: (focus?: { x: number; y: number; zoom: number }) => void;
}

interface SeatingCanvasProps {
    layout: SeatingLayout;
    onChange: (layout: SeatingLayout) => void;
    mode?: 'edit' | 'preview';
    onSelectionChange?: (selectedIds: string[]) => void;
    tool?: string;
    snapToGrid?: boolean;
    onToolComplete?: () => void;
    onSectionContainerCreated?: (node: SeatingNode) => void;
}

const SeatingCanvas = React.forwardRef<SeatingCanvasRef, SeatingCanvasProps>(
    (
        {
            layout,
            onChange,
            mode = 'edit',
            onSelectionChange,
            tool = 'select',
            snapToGrid = true,
            onToolComplete,
            onSectionContainerCreated,
        },
        ref,
    ) => {
        const stageRef = useRef<Konva.Stage>(null);
        const [nodes, setNodes] = useState<SeatingNode[]>(layout?.nodes || []);
        const [selectedIds, setSelectedIds] = useState<string[]>([]);
        const [drawingPoints, setDrawingPoints] = useState<number[]>([]); // For polygon drawing
        const [currentMousePos, setCurrentMousePos] = useState<{
            x: number;
            y: number;
        } | null>(null);
        const [editingPolygonId, setEditingPolygonId] = useState<string | null>(
            null,
        );

        // Row & Block Drawing State
        const [isDrawingRow, setIsDrawingRow] = useState(false);
        const [rowStartPos, setRowStartPos] = useState<{
            x: number;
            y: number;
        } | null>(null);
        
        // Advanced Block Drawing State
        const [drawingStep, setDrawingStep] = useState<number>(0);
        const [drawingStartPos, setDrawingStartPos] = useState<{ x: number; y: number } | null>(null);
        const [drawingVectorEnd, setDrawingVectorEnd] = useState<{ x: number; y: number } | null>(null);
        const [previewNodes, setPreviewNodes] = useState<any[]>([]);
        const [guides, setGuides] = useState<any[]>([]);
        const [rotationGuide, setRotationGuide] = useState<{ x: number; y: number; angle: number } | null>(null);
        const [isResizing, setIsResizing] = useState(false);
        const [resizingData, setResizingData] = useState<any>(null);
        const [isCCurvePressed, setIsCCurvePressed] = useState(false);
        const [blockDragOffset, setBlockDragOffset] = useState<{x: number, y: number} | null>(null);
        const isCCurvePressedRef = useRef(false);

        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if ((e.target as HTMLElement).tagName === 'INPUT') return;
                if (e.key === 'c' || e.key === 'C') {
                    setIsCCurvePressed(true);
                    isCCurvePressedRef.current = true;
                }
            };
            const handleKeyUp = (e: KeyboardEvent) => {
                if (e.key === 'c' || e.key === 'C') {
                    setIsCCurvePressed(false);
                    isCCurvePressedRef.current = false;
                }
            };
            window.addEventListener('keyup', handleKeyUp);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }, []);

        // Refs for Konva interaction (prevents stale closures)
        const nodesRef = useRef(nodes);
        const selectedIdsRef = useRef<string[]>([]);
        const mouseDownAlreadySelected = useRef(false);

        useEffect(() => {
            nodesRef.current = nodes;
        }, [nodes]);

        useEffect(() => {
            if (editingPolygonId && !selectedIds.includes(editingPolygonId)) {
                setEditingPolygonId(null);
            }
            selectedIdsRef.current = selectedIds;
        }, [selectedIds, editingPolygonId]);

        // Global drag start positions map: { id: { x, y } }
        const dragStartRef = useRef<
            Record<string, { x: number; y: number; konvaNode?: any }>
        >({});

        const checkActiveSection = (relativePos: {
            x: number;
            y: number;
        }): SeatingNode | null => {
            const activeSection = nodesRef.current.find(
                (n) =>
                    selectedIdsRef.current.includes(n.id) &&
                    ['section_container', 'rect_zone', 'circle_zone'].includes(
                        n.type,
                    ),
            );
            if (!activeSection) {
                toast.error(
                    'Por favor, selecciona primero una sección numerada en el mapa para colocar asientos.',
                );
                return null;
            }
            if (activeSection.sectionType === 'general') {
                toast.error(
                    'No se pueden colocar asientos en una sección de Aforo General.',
                );
                return null;
            }

            let isInside = false;
            if (activeSection.points) {
                isInside = isPointInPolygon(
                    relativePos.x,
                    relativePos.y,
                    activeSection.points,
                    activeSection.x,
                    activeSection.y,
                );
            } else if (activeSection.type === 'rect_zone') {
                const scaleX = activeSection.scaleX ?? 1;
                const scaleY = activeSection.scaleY ?? 1;
                const w = (activeSection.width || 200) * scaleX;
                const h = (activeSection.height || 150) * scaleY;
                isInside = isPointInRect(
                    relativePos.x,
                    relativePos.y,
                    activeSection.x,
                    activeSection.y,
                    w,
                    h,
                );
            } else if (activeSection.type === 'circle_zone') {
                const scaleX = activeSection.scaleX ?? 1;
                const radius = (activeSection.radius || 80) * scaleX;
                const dx = relativePos.x - activeSection.x;
                const dy = relativePos.y - activeSection.y;
                isInside = dx * dx + dy * dy <= radius * radius;
            } else {
                const scaleX = activeSection.scaleX ?? 1;
                const scaleY = activeSection.scaleY ?? 1;
                const w = (activeSection.width || 400) * scaleX;
                const h = (activeSection.height || 300) * scaleY;
                isInside = isPointInRect(
                    relativePos.x,
                    relativePos.y,
                    activeSection.x,
                    activeSection.y,
                    w,
                    h,
                );
            }

            if (!isInside) {
                toast.error(
                    `Debes colocar los asientos dentro de los límites de la sección "${activeSection.name || 'Seleccionada'}".`,
                );
                return null;
            }

            return activeSection;
        };

        // History (Undo/Redo)
        const [history, setHistory] = useState<SeatingNode[][]>([
            layout?.nodes || [],
        ]);
        const [historyStep, setHistoryStep] = useState(0);

        // Viewport (Zoom & Pan)
        const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
        const [stageScale, setStageScale] = useState(1);

        const [cart, setCart] = useState<string[]>([]); // Selected seats for purchase
        const [hoveredId, setHoveredId] = useState<string | null>(null);
        const [selectionRect, setSelectionRect] = useState<{
            x1: number;
            y1: number;
            x2: number;
            y2: number;
        } | null>(null); // { x1, y1, x2, y2 }

        const containerRef = useRef<HTMLDivElement>(null);
        const [stageSize, setStageSize] = useState({
            width: 800,
            height: 600,
        });

        useEffect(() => {
            if (!containerRef.current) return;
            const resizeObserver = new ResizeObserver((entries) => {
                if (entries[0]) {
                    setStageSize({
                        width: entries[0].contentRect.width,
                        height: entries[0].contentRect.height,
                    });
                }
            });
            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
        }, []);

        const [bgImage] = useImage(
            layout?.config?.bgImageUrl || layout?.config?.bgImage || '',
        );
        const transformerRef = useRef<Konva.Transformer>(null);

        const fitView = () => {
            const currentNodes = nodesRef.current;

            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;

            if (currentNodes.length > 0) {
                const xs = currentNodes.map((n) => n.x);
                const ys = currentNodes.map((n) => n.y);
                minX = Math.min(...xs) - 100;
                maxX = Math.max(...xs) + 100;
                minY = Math.min(...ys) - 100;
                maxY = Math.max(...ys) + 100;
            } else if (bgImage) {
                const bgX = layout.config?.bgX || 0;
                const bgY = layout.config?.bgY || 0;
                const bgScale = layout.config?.bgScale || 1;
                const w = bgImage.width * bgScale;
                const h = bgImage.height * bgScale;
                minX = bgX - 50;
                maxX = bgX + w + 50;
                minY = bgY - 50;
                maxY = bgY + h + 50;
            }

            if (minX === Infinity) {
                setStageScale(1);
                setStagePos({ x: 0, y: 0 });
                return;
            }

            const w = maxX - minX;
            const h = maxY - minY;

            const scaleX = stageSize.width / w;
            const scaleY = stageSize.height / h;
            const newScale = Math.min(scaleX, scaleY, 2);

            setStageScale(newScale);
            setStagePos({
                x: -minX * newScale + (stageSize.width - w * newScale) / 2,
                y: -minY * newScale + (stageSize.height - h * newScale) / 2,
            });
        };

        const zoomToFocus = (focus?: {
            x: number;
            y: number;
            zoom: number;
        }) => {
            const target = focus || layout.config?.focus;
            if (!target) return;
            setStageScale(target.zoom);
            setStagePos({
                x: stageSize.width / 2 - target.x * target.zoom,
                y: stageSize.height / 2 - target.y * target.zoom,
            });
        };

        const getCurrentFocus = () => {
            const cx = stageSize.width / 2;
            const cy = stageSize.height / 2;
            const x = (cx - stagePos.x) / stageScale;
            const y = (cy - stagePos.y) / stageScale;
            return {
                x,
                y,
                zoom: stageScale,
            };
        };

        const hasFocusedRef = useRef(false);
        useEffect(() => {
            if (
                layout.config?.focus &&
                stageSize.width > 0 &&
                stageSize.height > 0 &&
                !hasFocusedRef.current
            ) {
                zoomToFocus(layout.config.focus);
                hasFocusedRef.current = true;
            }
        }, [stageSize.width, stageSize.height, layout.config?.focus]);

        useEffect(() => {
            if (bgImage && nodes.length === 0 && !layout.config?.focus) {
                const timer = setTimeout(() => {
                    fitView();
                }, 150);
                return () => clearTimeout(timer);
            }
        }, [
            bgImage,
            nodes.length,
            stageSize.width,
            stageSize.height,
            layout.config?.focus,
        ]);

        const pushToHistory = useCallback((newNodes: SeatingNode[]) => {
            const nextHistory = history.slice(0, historyStep + 1);
            setHistory([...nextHistory, newNodes]);
            setHistoryStep(nextHistory.length);
        }, [history, historyStep]);

        
        const updateMultipleRowsStructureFn = useCallback((rowUuids: string[], newProps: any) => {
            const currentNodes = nodesRef.current;
            let updatedNodes = [...currentNodes];

            rowUuids.forEach(rowUuid => {
                const rowNodesUnsorted = currentNodes.filter((n) => n.row_uuid === rowUuid);
                const rowNodes = [...rowNodesUnsorted].sort((a, b) => (a.number || 0) - (b.number || 0));
                if (rowNodes.length === 0) return;

                const anchor = rowNodes[0];
                const last = rowNodes[rowNodes.length - 1];

                let realSpacing = anchor.spacing;
                if (!realSpacing && rowNodes.length > 1) {
                    const dxRaw = last.x - anchor.x;
                    const dyRaw = last.y - anchor.y;
                    const distRaw = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);
                    const lastIdx = (last.number || rowNodes.length) - 1;
                    realSpacing = distRaw / (lastIdx || 1);
                }
                const configSpacing = newProps.seatSpacing !== undefined ? newProps.seatSpacing : (realSpacing || 35);

                const curvature = newProps.curve !== undefined ? newProps.curve : (anchor.curvature || 0);

                let angle = 0;
                if (rowNodes.length > 1) {
                    const dxRaw = last.x - anchor.x;
                    const dyRaw = last.y - anchor.y;
                    angle = Math.atan2(dyRaw, dxRaw);
                }

                const count = rowNodes.length;
                const mid = (count - 1) / 2;
                const currentCurve = anchor.curvature || 0;
                const currentCurveOffset = currentCurve * Math.pow(-mid, 2) * (configSpacing / 10);
                const currentCenter = { x: (anchor.x + last.x) / 2, y: (anchor.y + last.y) / 2 };
                const baselineCenter = {
                    x: currentCenter.x + currentCurveOffset * Math.sin(angle),
                    y: currentCenter.y - currentCurveOffset * Math.cos(angle),
                };

                const config = {
                    count: newProps.numSeats || rowNodes.length,
                    startX: anchor.x,
                    startY: anchor.y,
                    spacing: configSpacing,
                    curvature: curvature,
                    section: newProps.section || anchor.section,
                    rowLabel: newProps.row || anchor.row,
                    rowLabelEnabled: newProps.rowLabelEnabled !== undefined ? newProps.rowLabelEnabled : (anchor.row_label_enabled ?? true),
                    rowLabelPosition: newProps.rowLabelPosition || anchor.row_label_position || 'both',
                    rowLabelOverride: newProps.rowLabelOverride !== undefined ? newProps.rowLabelOverride : anchor.row_label_override || '',
                    rowLabelDisplayType: newProps.rowLabelDisplayType || anchor.row_label_display_type || 'Row',
                    seatLabelType: newProps.seatLabelType || '123',
                    seatStartNumber: newProps.seatLabelStart || 1,
                    seatLabelDirection: newProps.seatLabelDirection || anchor.seat_label_direction || 'LR',
                    radius: newProps.radius || anchor.radius,
                    color: newProps.fill || anchor.fill,
                    rowUuid: rowUuid,
                    blockUuid: anchor.block_uuid,
                };

                updatedNodes = updatedNodes.filter((n) => n.row_uuid !== rowUuid);
                const newRowSeats = generateRow(config).map((seat, index) => {
                    const oldSeat = rowNodes[index];
                    const i = (seat.number || 1) - config.seatStartNumber;
                    const cOffset = i - mid;
                    const lx = cOffset * config.spacing;
                    
                    const rawCurveY = config.curvature * Math.pow(cOffset, 2) * (config.spacing / 10);
                    const rx = lx * Math.cos(angle) - rawCurveY * Math.sin(angle);
                    const ry = lx * Math.sin(angle) + rawCurveY * Math.cos(angle);

                    return {
                        ...seat,
                        id: oldSeat ? oldSeat.id : seat.id,
                        permanent_uuid: oldSeat ? oldSeat.permanent_uuid : seat.permanent_uuid,
                        x: baselineCenter.x + rx,
                        y: baselineCenter.y + ry,
                        spacing: config.spacing,
                        curvature: config.curvature,
                        seat_label_direction: config.seatLabelDirection,
                        row_label_enabled: config.rowLabelEnabled,
                        row_label_position: config.rowLabelPosition,
                        row_label_override: config.rowLabelOverride,
                        row_label_display_type: config.rowLabelDisplayType,
                    };
                });
                updatedNodes.push(...newRowSeats);
            });

            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        }, [layout, pushToHistory, onChange]);

const updateRowStructureFn = useCallback((rowUuid: string, newProps: any) => {
            const currentNodes = nodesRef.current;
            const rowNodesUnsorted = currentNodes.filter(
                (n) => n.row_uuid === rowUuid,
            );
            const rowNodes = [...rowNodesUnsorted].sort((a, b) => (a.number || 0) - (b.number || 0));
            if (rowNodes.length === 0) return;

            const anchor = rowNodes[0];
            const last = rowNodes[rowNodes.length - 1];
            
            let realSpacing = anchor.spacing;
            if (!realSpacing && rowNodes.length > 1) {
                const dxRaw = last.x - anchor.x;
                const dyRaw = last.y - anchor.y;
                const distRaw = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);
                const lastIdx = (last.number || rowNodes.length) - 1;
                realSpacing = distRaw / (lastIdx || 1);
            }
            const configSpacing = newProps.seatSpacing !== undefined ? newProps.seatSpacing : (realSpacing || 35);
            
            const curvature = newProps.curve !== undefined ? newProps.curve : (anchor.curvature || 0);

            let angle = 0;
            if (rowNodes.length > 1) {
                const dxRaw = last.x - anchor.x;
                const dyRaw = last.y - anchor.y;
                angle = Math.atan2(dyRaw, dxRaw);
            }

            const count = rowNodes.length;
            const mid = (count - 1) / 2;
            const currentCurve = anchor.curvature || 0;
            const currentCurveOffset = currentCurve * Math.pow(-mid, 2) * (configSpacing / 10);
            const currentCenter = { x: (anchor.x + last.x) / 2, y: (anchor.y + last.y) / 2 };
            const baselineCenter = {
                x: currentCenter.x + currentCurveOffset * Math.sin(angle),
                y: currentCenter.y - currentCurveOffset * Math.cos(angle),
            };

            const config = {
                count: newProps.numSeats || rowNodes.length,
                startX: anchor.x,
                startY: anchor.y,
                spacing: configSpacing,
                curvature: curvature,
                section: newProps.section || anchor.section,
                rowLabel: newProps.row || anchor.row,
                rowLabelEnabled: newProps.rowLabelEnabled !== undefined ? newProps.rowLabelEnabled : (anchor.row_label_enabled ?? true),
                rowLabelPosition: newProps.rowLabelPosition || anchor.row_label_position || 'both',
                rowLabelOverride: newProps.rowLabelOverride !== undefined ? newProps.rowLabelOverride : anchor.row_label_override || '',
                rowLabelDisplayType: newProps.rowLabelDisplayType || anchor.row_label_display_type || 'Row',
                seatLabelType: newProps.seatLabelType || '123',
                seatStartNumber: newProps.seatLabelStart || 1,
                seatLabelDirection: newProps.seatLabelDirection || anchor.seat_label_direction || 'LR',
                radius: newProps.radius || anchor.radius,
                color: newProps.fill || anchor.fill,
                rowUuid: rowUuid,
                blockUuid: anchor.block_uuid,
            };

            const updatedNodes = currentNodes.filter((n) => n.row_uuid !== rowUuid);
            const newRowSeats = generateRow(config).map((seat, index) => {
                const oldSeat = rowNodes[index];
                const i = (seat.number || 1) - config.seatStartNumber;
                const cOffset = i - mid;
                const lx = cOffset * config.spacing;
                
                const rawCurveY = config.curvature * Math.pow(cOffset, 2) * (config.spacing / 10);
                const rx = lx * Math.cos(angle) - rawCurveY * Math.sin(angle);
                const ry = lx * Math.sin(angle) + rawCurveY * Math.cos(angle);

                return {
                    ...seat,
                    id: oldSeat ? oldSeat.id : seat.id,
                    permanent_uuid: oldSeat ? oldSeat.permanent_uuid : seat.permanent_uuid,
                    x: baselineCenter.x + rx,
                    y: baselineCenter.y + ry,
                    spacing: config.spacing,
                    curvature: config.curvature,
                    seat_label_direction: config.seatLabelDirection,
                    row_label_enabled: config.rowLabelEnabled,
                    row_label_position: config.rowLabelPosition,
                    row_label_override: config.rowLabelOverride,
                    row_label_display_type: config.rowLabelDisplayType,
                };
            });
            updatedNodes.push(...newRowSeats);

            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        }, [layout, pushToHistory, onChange]);

        const updateRowLabelsFn = useCallback((rowUuid: string, newProps: any) => {
            const currentNodes = nodesRef.current;
            const rowNodesUnsorted = currentNodes.filter((n) => n.row_uuid === rowUuid);
            if (rowNodesUnsorted.length === 0) return;
            
            const dx = rowNodesUnsorted[rowNodesUnsorted.length - 1].x - rowNodesUnsorted[0].x;
            const dy = rowNodesUnsorted[rowNodesUnsorted.length - 1].y - rowNodesUnsorted[0].y;
            
            const rowNodes = [...rowNodesUnsorted].sort((a, b) => {
                if (Math.abs(dx) > Math.abs(dy)) {
                    return a.x - b.x;
                } else {
                    return a.y - b.y;
                }
            });

            const updatedNodes = currentNodes.map(node => {
                if (node.row_uuid !== rowUuid) return node;
                
                const idx = rowNodes.findIndex(n => n.id === node.id);
                const seatLabelDirection = newProps.seatLabelDirection !== undefined ? newProps.seatLabelDirection : (newProps.seat_label_direction !== undefined ? newProps.seat_label_direction : (node.seat_label_direction || 'LR'));
                const seatLabelType = newProps.seatLabelType !== undefined ? newProps.seatLabelType : '123';
                const seatStartNumber = newProps.seatLabelStart !== undefined ? newProps.seatLabelStart : 1;
                
                let number = getSeatNumber(idx, seatLabelType, seatStartNumber, rowNodes.length, seatLabelDirection);

                return {
                    ...node,
                    row: newProps.row !== undefined ? newProps.row : node.row,
                    row_label_enabled: newProps.rowLabelEnabled !== undefined ? newProps.rowLabelEnabled : node.row_label_enabled,
                    row_label_position: newProps.rowLabelPosition !== undefined ? newProps.rowLabelPosition : node.row_label_position,
                    row_label_override: newProps.rowLabelOverride !== undefined ? newProps.rowLabelOverride : node.row_label_override,
                    row_label_display_type: newProps.rowLabelDisplayType !== undefined ? newProps.rowLabelDisplayType : node.row_label_display_type,
                    seat_label_direction: seatLabelDirection,
                    number: number
                };
            });

            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        }, [layout, pushToHistory, onChange]);

        const updateBlockLabelsFn = useCallback((blockUuid: string, newProps: any) => {
            const initialNodes = nodesRef.current;
            const blockNodes = initialNodes.filter((n) => n.block_uuid === blockUuid);
            if (blockNodes.length === 0) return;

            const sampleNode = blockNodes[0] || {};
            const rowLabelType = newProps.rowLabelType !== undefined ? newProps.rowLabelType : (sampleNode.row_label_type || 'ABC');
            const rowLabelStart = newProps.rowLabelStart !== undefined ? newProps.rowLabelStart : (sampleNode.row_label_start || 'A');
            const rowLabelSkipStr = newProps.rowLabelSkip !== undefined ? newProps.rowLabelSkip : (sampleNode.row_label_skip || '');
            const rowLabelDirection = newProps.rowLabelDirection !== undefined ? newProps.rowLabelDirection : (newProps.row_label_direction !== undefined ? newProps.row_label_direction : (sampleNode.row_label_direction || 'TB'));
            const rowLabelSkip = (rowLabelSkipStr || '').split(',').map((s: string) => s.trim()).filter(Boolean);

            const rowUuids = Array.from(new Set(blockNodes.map((n) => n.row_uuid).filter(Boolean)));
            const rows = rowUuids.map((uuid) => {
                const rowSeats = blockNodes.filter((n) => n.row_uuid === uuid);
                return {
                    uuid,
                    y: Math.min(...rowSeats.map((s) => s.y)),
                    nodes: rowSeats,
                };
            }).sort((a, b) => {
                return rowLabelDirection === 'BT' ? b.y - a.y : a.y - b.y;
            });

            let currentNodes = [...initialNodes];

            rows.forEach((row, index) => {
                const calculatedRowLabel = getRowLabel(
                    index,
                    rowLabelType,
                    rowLabelStart,
                    rowLabelSkip,
                );

                const rowNodesUnsorted = currentNodes.filter((n) => n.row_uuid === row.uuid);
                if (rowNodesUnsorted.length === 0) return;
                
                const dx = rowNodesUnsorted[rowNodesUnsorted.length - 1].x - rowNodesUnsorted[0].x;
                const dy = rowNodesUnsorted[rowNodesUnsorted.length - 1].y - rowNodesUnsorted[0].y;
                
                const rowNodes = [...rowNodesUnsorted].sort((a, b) => {
                    return Math.abs(dx) > Math.abs(dy) ? a.x - b.x : a.y - b.y;
                });

                currentNodes = currentNodes.map((node) => {
                    if (node.row_uuid !== row.uuid) return node;

                    const idx = rowNodes.findIndex(n => n.id === node.id);
                    const seatLabelDirection = newProps.seatLabelDirection !== undefined ? newProps.seatLabelDirection : (newProps.seat_label_direction !== undefined ? newProps.seat_label_direction : (node.seat_label_direction || 'LR'));
                    const seatLabelType = newProps.seatLabelType !== undefined ? newProps.seatLabelType : '123';
                    const seatStartNumber = newProps.seatLabelStart !== undefined ? newProps.seatLabelStart : 1;
                    
                    let number = getSeatNumber(idx, seatLabelType, seatStartNumber, rowNodes.length, seatLabelDirection);

                    const nextRowLabelPosition = newProps.rowLabelPosition !== undefined ? newProps.rowLabelPosition : (newProps.row_label_position !== undefined ? newProps.row_label_position : node.row_label_position);
                    const nextRowLabelEnabled = newProps.rowLabelEnabled !== undefined ? newProps.rowLabelEnabled : (newProps.row_label_enabled !== undefined ? newProps.row_label_enabled : node.row_label_enabled);
                    const nextRowLabelDisplayType = newProps.rowLabelDisplayType !== undefined ? newProps.rowLabelDisplayType : (newProps.row_label_display_type !== undefined ? newProps.row_label_display_type : node.row_label_display_type);
                    const nextRowLabelOverride = newProps.rowLabelOverride !== undefined ? newProps.rowLabelOverride : (newProps.row_label_override !== undefined ? newProps.row_label_override : node.row_label_override);

                    return {
                        ...node,
                        row: calculatedRowLabel,
                        row_label_type: rowLabelType,
                        row_label_start: rowLabelStart,
                        row_label_skip: rowLabelSkipStr,
                        row_label_direction: rowLabelDirection,
                        row_label_enabled: nextRowLabelEnabled,
                        row_label_position: nextRowLabelPosition,
                        row_label_override: nextRowLabelOverride,
                        row_label_display_type: nextRowLabelDisplayType,
                        seat_label_direction: seatLabelDirection,
                        number: number
                    };
                });
            });

            setNodes(currentNodes);
            pushToHistory(currentNodes);
            onChange({ ...layout, nodes: currentNodes });
        }, [layout, pushToHistory, onChange]);

        // Expose methods to parent
        React.useImperativeHandle(ref, () => ({
            undo,
            redo,
            addRow,
            addGrid,
            addHoneycomb,
            addRectZone,
            addCircleZone,
            addSectionContainer: (x, y) => {
                const newSection: SeatingNode = {
                    id: 'section-' + uuidv4(),
                    type: 'section_container',
                    x: x,
                    y: y,
                    width: 400,
                    height: 300,
                    name: 'Nueva Sección',
                    fill: 'rgba(59, 130, 246, 0.1)',
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    sectionType: 'numbered',
                };
                const updatedNodes = [...nodes, newSection];
                setNodes(updatedNodes);
                pushToHistory(updatedNodes);
                onChange({ ...layout, nodes: updatedNodes });
            },
            redistributeSelected: (params) => {
                if (selectedIds.length === 0) return;
                const selectedNodes = nodes.filter((n) =>
                    selectedIds.includes(n.id),
                );

                // 1. Sort based on direction
                const flow = params.direction || 'LR';
                let sorted = [...selectedNodes].sort((a, b) => {
                    return flow === 'LR' ? a.x - b.x : b.x - a.x;
                });

                // 2. Calculate anchor (center of selection)
                const sumX = sorted.reduce((acc, n) => acc + n.x, 0);
                const sumY = sorted.reduce((acc, n) => acc + n.y, 0);
                const anchor = {
                    x: sumX / sorted.length,
                    y: sumY / sorted.length,
                };
                const midIndex = (sorted.length - 1) / 2;

                const spacing =
                    params.spacing || layout?.config?.defaultSpacing || 35;
                const curvature = params.curvature || 0;
                const startNum = params.startNumber || 1;

                const updatedNodes = nodes.map((node) => {
                    const idx = sorted.findIndex((n) => n.id === node.id);
                    if (idx === -1) return node;

                    const distFromMid = idx - midIndex;
                    const newX = anchor.x + distFromMid * spacing;
                    const newY =
                        anchor.y + curvature * Math.pow(distFromMid, 2);

                    return {
                        ...node,
                        x: newX,
                        y: newY,
                        number: startNum + idx,
                        row: params.row || node.row,
                    };
                });

                setNodes(updatedNodes);
                pushToHistory(updatedNodes);
                onChange({ ...layout, nodes: updatedNodes });
            },
            deleteSelected: () => {
                if (selectedIds.length > 0) {
                    const updatedNodes = nodes.filter(
                        (n) => !selectedIds.includes(n.id),
                    );
                    setNodes(updatedNodes);
                    setSelectedIds([]);
                    if (onSelectionChange) onSelectionChange([]);
                    pushToHistory(updatedNodes);
                    onChange({ ...layout, nodes: updatedNodes });
                }
            },
            align: (direction) => {
                if (selectedIds.length < 2) return;
                const selectedNodes = nodes.filter((n) =>
                    selectedIds.includes(n.id),
                );
                let updatedNodes = [...nodes];

                if (direction === 'left') {
                    const minX = Math.min(...selectedNodes.map((n) => n.x));
                    updatedNodes = nodes.map((n) =>
                        selectedIds.includes(n.id) ? { ...n, x: minX } : n,
                    );
                } else if (direction === 'right') {
                    const maxX = Math.max(...selectedNodes.map((n) => n.x));
                    updatedNodes = nodes.map((n) =>
                        selectedIds.includes(n.id) ? { ...n, x: maxX } : n,
                    );
                } else if (direction === 'top') {
                    const minY = Math.min(...selectedNodes.map((n) => n.y));
                    updatedNodes = nodes.map((n) =>
                        selectedIds.includes(n.id) ? { ...n, y: minY } : n,
                    );
                } else if (direction === 'bottom') {
                    const maxY = Math.max(...selectedNodes.map((n) => n.y));
                    updatedNodes = nodes.map((n) =>
                        selectedIds.includes(n.id) ? { ...n, y: maxY } : n,
                    );
                }

                setNodes(updatedNodes);
                pushToHistory(updatedNodes);
                onChange({ ...layout, nodes: updatedNodes });
            },
            updateRowStructure: updateRowStructureFn,
            updateRowLabels: updateRowLabelsFn,
            updateMultipleRowsStructure: updateMultipleRowsStructureFn,
            updateBlockLabels: updateBlockLabelsFn,
            updateBlockStructure: (blockUuid, newProps) => {

                const initialNodes = nodesRef.current;
                const blockNodes = initialNodes.filter(
                    (n) => n.block_uuid === blockUuid,
                );
                const rowUuids = Array.from(
                    new Set(blockNodes.map((n) => n.row_uuid).filter(Boolean)),
                );

                if (rowUuids.length === 0) return;

                // 1. Group seats by row_uuid and compute row center
                const rowsData = rowUuids.map((uuid) => {
                    const rowSeats = blockNodes.filter((n) => n.row_uuid === uuid);
                    const sortedSeats = [...rowSeats].sort((a, b) => (a.number || 0) - (b.number || 0));
                    const meanX = rowSeats.reduce((acc, s) => acc + s.x, 0) / rowSeats.length;
                    const meanY = rowSeats.reduce((acc, s) => acc + s.y, 0) / rowSeats.length;
                    return {
                        uuid,
                        center: { x: meanX, y: meanY },
                        nodes: sortedSeats,
                    };
                });

                // 2. Find original block bounding center across all seats in block
                const originalBlockCenterX = blockNodes.reduce((acc, s) => acc + s.x, 0) / blockNodes.length;
                const originalBlockCenterY = blockNodes.reduce((acc, s) => acc + s.y, 0) / blockNodes.length;

                // 3. Compute block orientation angle from first row
                const sampleRowSeats = rowsData[0].nodes;
                if (sampleRowSeats.length === 0) return;
                const firstAnchor = sampleRowSeats[0];
                const firstLast = sampleRowSeats[sampleRowSeats.length - 1];
                let blockAngle = 0;
                if (sampleRowSeats.length > 1) {
                    blockAngle = Math.atan2(firstLast.y - firstAnchor.y, firstLast.x - firstAnchor.x);
                }

                // Perpendicular direction vector (normal to row direction)
                let perpX = -Math.sin(blockAngle);
                let perpY = Math.cos(blockAngle);

                // Sort rows by projection onto perpendicular vector
                const rows = rowsData.sort((a, b) => {
                    const projA = a.center.x * perpX + a.center.y * perpY;
                    const projB = b.center.x * perpX + b.center.y * perpY;
                    return projA - projB;
                });

                // Ensure perpendicular vector points in direction of row indices
                if (rows.length > 1) {
                    const projFirst = rows[0].center.x * perpX + rows[0].center.y * perpY;
                    const projLast = rows[rows.length - 1].center.x * perpX + rows[rows.length - 1].center.y * perpY;
                    if (projLast < projFirst) {
                        perpX = -perpX;
                        perpY = -perpY;
                        rows.reverse();
                    }
                }

                // 4. Calculate target row spacing
                const currentSpacings: number[] = [];
                for (let k = 0; k < rows.length - 1; k++) {
                    const dX = rows[k + 1].center.x - rows[k].center.x;
                    const dY = rows[k + 1].center.y - rows[k].center.y;
                    currentSpacings.push(Math.sqrt(dX * dX + dY * dY));
                }
                const avgCurrentRowSpacing = currentSpacings.length > 0 ? (currentSpacings.reduce((a, b) => a + b, 0) / currentSpacings.length) : 40;
                const targetRowSpacing = newProps.rowSpacing !== undefined ? newProps.rowSpacing : avgCurrentRowSpacing;

                // Row centers relative to block center
                const numRows = rows.length;
                const rowCenterOffsets = rows.map((_, idx) => (idx - (numRows - 1) / 2) * targetRowSpacing);

                let currentNodes = [...initialNodes];

                rows.forEach((row, index) => {
                    const rowProps = { ...newProps };
                    rowProps.row = getRowLabel(
                        index,
                        newProps.rowLabelType || 'ABC',
                        newProps.rowLabelStart || 'A',
                        (newProps.rowLabelSkip || '')
                            .split(',')
                            .map((s: string) => s.trim())
                            .filter(Boolean),
                    );

                    const rowNodes = row.nodes;
                    if (rowNodes.length === 0) return;

                    const anchor = rowNodes[0];
                    const last = rowNodes[rowNodes.length - 1];

                    let angle = blockAngle;
                    if (rowNodes.length > 1) {
                        angle = Math.atan2(last.y - anchor.y, last.x - anchor.x);
                    }

                    const configSpacing = newProps.seatSpacing !== undefined ? newProps.seatSpacing : (anchor.spacing || 35);
                    const curvature = newProps.curve !== undefined ? newProps.curve : (anchor.curvature || 0);
                    const count = newProps.numSeats || rowNodes.length;
                    const mid = (count - 1) / 2;

                    // Row baseline center anchored strictly at the invariant block center
                    const rowOffset = rowCenterOffsets[index];
                    const baselineCenter = {
                        x: originalBlockCenterX + rowOffset * perpX,
                        y: originalBlockCenterY + rowOffset * perpY,
                    };

                    const config = {
                        count: count,
                        startX: anchor.x,
                        startY: anchor.y,
                        spacing: configSpacing,
                        curvature: curvature,
                        section: rowProps.section || anchor.section,
                        rowLabel: rowProps.row || anchor.row,
                        rowLabelEnabled:
                            newProps.rowLabelEnabled !== undefined
                                ? newProps.rowLabelEnabled
                                : (anchor.row_label_enabled ?? true),
                        rowLabelPosition:
                            newProps.rowLabelPosition ||
                            anchor.row_label_position ||
                            'both',
                        rowLabelOverride:
                            newProps.rowLabelOverride !== undefined
                                ? newProps.rowLabelOverride
                                : anchor.row_label_override || '',
                        rowLabelDisplayType:
                            newProps.rowLabelDisplayType ||
                            anchor.row_label_display_type ||
                            'Row',
                        seatLabelType: rowProps.seatLabelType || '123',
                        seatStartNumber: rowProps.seatLabelStart || 1,
                        seatLabelDirection:
                            newProps.seatLabelDirection ||
                            newProps.seat_label_direction ||
                            anchor.seat_label_direction ||
                            'LR',
                        radius: rowProps.radius || anchor.radius,
                        color: rowProps.fill || anchor.fill,
                        rowUuid: row.uuid,
                        blockUuid: blockUuid,
                    };

                    const newRowSeats = generateRow(config).map((seat, seatIdx) => {
                        const oldSeat = rowNodes[seatIdx];
                        const seatId = oldSeat ? oldSeat.id : seat.id;
                        const permUuid = oldSeat
                            ? oldSeat.permanent_uuid
                            : seat.permanent_uuid;

                        const cOffset = seatIdx - mid;
                        const lx = cOffset * config.spacing;
                        const rawCurveY = config.curvature * Math.pow(cOffset, 2) * (config.spacing / 10);
                        const rx = lx * Math.cos(angle) - rawCurveY * Math.sin(angle);
                        const ry = lx * Math.sin(angle) + rawCurveY * Math.cos(angle);

                        return {
                            ...seat,
                            id: seatId,
                            permanent_uuid: permUuid,
                            x: baselineCenter.x + rx,
                            y: baselineCenter.y + ry,
                            spacing: config.spacing,
                            curvature: config.curvature,
                            seat_label_direction: config.seatLabelDirection,
                            row_label_enabled: config.rowLabelEnabled,
                            row_label_position: config.rowLabelPosition,
                            row_label_override: config.rowLabelOverride,
                            row_label_display_type: config.rowLabelDisplayType,
                        };
                    });

                    currentNodes = [
                        ...currentNodes.filter((n) => n.row_uuid !== row.uuid),
                        ...newRowSeats,
                    ];
                });

                setNodes(currentNodes);
                pushToHistory(currentNodes);
                onChange({ ...layout, nodes: currentNodes });
            },
            updateTableStructure: (tableUuid, newProps) => {
                const currentNodes = nodesRef.current;
                const tableShape = currentNodes.find(
                    (n) => n.id === `table-${tableUuid}`,
                );
                if (!tableShape) return;

                const existingSeats = currentNodes.filter(
                    (n) => n.table_uuid === tableUuid && n.type === 'seat',
                );
                const newCount = newProps.numSeats || existingSeats.length;
                const tableRadius = newProps.radius || tableShape.radius || 45;
                const seatRadius = layout?.config?.defaultRadius || 10;
                const tableFill =
                    newProps.fill ||
                    tableShape.fill ||
                    'rgba(255, 255, 255, 0.8)';
                const section =
                    newProps.section || tableShape.section || 'General';

                const newSeats: SeatingNode[] = [];
                for (let i = 0; i < newCount; i++) {
                    const oldSeat = existingSeats[i];
                    const seatId = oldSeat ? oldSeat.id : 'seat-' + uuidv4();
                    const permUuid = oldSeat
                        ? oldSeat.permanent_uuid
                        : uuidv4();

                    const angle = (Math.PI * 2 * i) / newCount;
                    const distance = tableRadius + seatRadius + 5;

                    newSeats.push({
                        id: seatId,
                        type: 'seat',
                        x: tableShape.x + Math.cos(angle) * distance,
                        y: tableShape.y + Math.sin(angle) * distance,
                        radius: seatRadius,
                        fill: newProps.fill || oldSeat?.fill || '#cbd5e1',
                        section: section,
                        row: newProps.name || tableShape.name,
                        number: i + 1,
                        table_uuid: tableUuid,
                        permanent_uuid: permUuid,
                    });
                }

                const updatedNodes = [
                    ...currentNodes.filter(
                        (n) =>
                            n.table_uuid !== tableUuid &&
                            n.id !== `table-${tableUuid}`,
                    ),
                    {
                        ...tableShape,
                        radius: tableRadius,
                        width: tableRadius * 2,
                        height: tableRadius * 2,
                        name: newProps.name || tableShape.name,
                        shape: newProps.shape || tableShape.shape,
                        fill: tableFill,
                        section: section,
                    },
                    ...newSeats,
                ];

                setNodes(updatedNodes);
                pushToHistory(updatedNodes);
                onChange({ ...layout, nodes: updatedNodes });
            },
            fitView,
            getCurrentFocus,
            zoomToFocus,
        }));

        // Selection synchronization
        useEffect(() => {
            if (layout?.nodes) {
                setNodes(layout.nodes);
            }
        }, [layout?.nodes]);

        // Handle Transform effect on selection
        useEffect(() => {
            if (mode !== 'edit' || !transformerRef.current) return;
            const stage = stageRef.current;
            if (!stage) return;

            // Exclude section_container nodes — they are reshaped via polygon vertex handles only
            const transformableIds = selectedIds.filter(id => {
                const node = nodes.find(n => n.id === id);
                return node && node.type !== 'section_container';
            });

            const selectedKonvaNodes = transformableIds
                .map((id) => stage.findOne('#' + id))
                .filter((node): node is Konva.Node => node !== undefined);

            transformerRef.current.nodes(selectedKonvaNodes);
            transformerRef.current.getLayer()?.batchDraw();
        }, [selectedIds, nodes, mode]);



        const undo = () => {
            if (historyStep > 0) {
                const step = historyStep - 1;
                setHistoryStep(step);
                const prevNodes = history[step];
                setNodes(prevNodes);
                onChange({ ...layout, nodes: prevNodes });
                setSelectedIds([]);
            }
        };

        const redo = () => {
            if (historyStep < history.length - 1) {
                const step = historyStep + 1;
                setHistoryStep(step);
                const nextNodes = history[step];
                setNodes(nextNodes);
                onChange({ ...layout, nodes: nextNodes });
                setSelectedIds([]);
            }
        };

        // Filtered lists for rendering performance
        const zones = useMemo(
            () =>
                nodes.filter((n) =>
                    [
                        'section_container',
                        'zone',
                        'rect_zone',
                        'circle_zone',
                        'standing',
                    ].includes(n.type),
                ),
            [nodes],
        );
        const seats = useMemo(
            () => nodes.filter((n) => n.type === 'seat'),
            [nodes],
        );
        const tables = useMemo(
            () => nodes.filter((n) => n.type === 'table_shape'),
            [nodes],
        );

        // Zoom on wheel
        const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
            e.evt.preventDefault();
            const stage = stageRef.current;
            if (!stage) return;

            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            const zoomFactor = 1.15;
            const newScale =
                e.evt.deltaY < 0
                    ? oldScale * zoomFactor
                    : oldScale / zoomFactor;

            // Clip scale to reasonable bounds
            const scale = Math.max(0.1, Math.min(newScale, 10));

            setStageScale(scale);
            setStagePos({
                x: pointer.x - mousePointTo.x * scale,
                y: pointer.y - mousePointTo.y * scale,
            });
        };

        const performSelection = (
            e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
            clickedId: string,
        ) => {
            let newSelection = [...selectedIds];
            const isMulti = e.evt.shiftKey || e.evt.ctrlKey;

            // Seat Hierarchical logic (if we click on a seat that belongs to a block/row)
            const node = nodes.find((n) => n.id === clickedId);
            if (node && node.type === 'seat' && mode === 'edit') {
                if (node.block_uuid) {
                    // If it's a block, select all seats in block on second click
                    const blockSeats = nodes
                        .filter((n) => n.block_uuid === node.block_uuid)
                        .map((n) => n.id);
                    const isBlockAlreadySelected = blockSeats.every((id) =>
                        selectedIds.includes(id),
                    );
                    const isSeatSelected = selectedIds.includes(node.id);

                    if (isSeatSelected && !isBlockAlreadySelected) {
                        // Upgrade to full block
                        newSelection = isMulti
                            ? [...newSelection, ...blockSeats]
                            : blockSeats;
                    } else {
                        // If Ctrl/Cmd click is used specifically for deletion/toggling seat out of block
                        if (e.evt.ctrlKey || e.evt.metaKey) {
                            // Remove clicked seat from canvas
                            const remainingNodes = nodesRef.current.filter(n => n.id !== node.id);
                            setNodes(remainingNodes);
                            pushToHistory(remainingNodes);
                            onChange({ ...layout, nodes: remainingNodes });
                            setSelectedIds(selectedIds.filter(id => id !== node.id));
                            return;
                        }

                        // Select single seat or toggle
                        if (isMulti) {
                            newSelection = selectedIds.includes(node.id)
                                ? selectedIds.filter((id) => id !== node.id)
                                : [...selectedIds, node.id];
                        } else {
                            newSelection = [node.id];
                        }
                    }
                } else if (node.row_uuid) {
                    // If it's a row, select all seats in row on second click
                    const rowSeats = nodes
                        .filter((n) => n.row_uuid === node.row_uuid)
                        .map((n) => n.id);
                    const isRowAlreadySelected = rowSeats.every((id) =>
                        selectedIds.includes(id),
                    );
                    const isSeatSelected = selectedIds.includes(node.id);

                    if (isSeatSelected && !isRowAlreadySelected) {
                        newSelection = isMulti
                            ? [...newSelection, ...rowSeats]
                            : rowSeats;
                    } else {
                        if (isMulti) {
                            newSelection = selectedIds.includes(node.id)
                                ? selectedIds.filter((id) => id !== node.id)
                                : [...selectedIds, node.id];
                        } else {
                            newSelection = [node.id];
                        }
                    }
                } else {
                    if (isMulti) {
                        newSelection = selectedIds.includes(node.id)
                            ? selectedIds.filter((id) => id !== node.id)
                            : [...selectedIds, node.id];
                    } else {
                        newSelection = [node.id];
                    }
                }
            } else {
                // General select / toggle
                if (isMulti) {
                    newSelection = selectedIds.includes(clickedId)
                        ? selectedIds.filter((id) => id !== clickedId)
                        : [...selectedIds, clickedId];
                } else {
                    newSelection = [clickedId];
                }
            }

            setSelectedIds(newSelection);
            if (onSelectionChange) onSelectionChange(newSelection);
        };

        const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
            const stage = stageRef.current;
            if (!stage) return;

            const relativePos = getRelativePointerPosition(stage);

            // Right-click or middle-click cancels any drawing tool
            if (e.evt.button === 2 || e.evt.button === 1) {
                setDrawingPoints([]);
                if (e.evt.button === 1) {
                    stage.startDrag();
                }
                return;
            }

            if (mode === 'preview') {
                const clickedId = e.target.id() || e.target.getParent()?.id();
                if (clickedId) {
                    const node = nodes.find((n) => n.id === clickedId);
                    if (node && node.type === 'seat') {
                        if (cart.includes(clickedId)) {
                            setCart(cart.filter((id) => id !== clickedId));
                        } else {
                            setCart([...cart, clickedId]);
                        }
                    }
                }
                return;
            }

            // Polygon drawing tools
            if (['zone', 'section_container', 'standing'].includes(tool)) {
                // Check if clicked close to start point to close
                if (drawingPoints.length >= 6) {
                    const dx = relativePos.x - drawingPoints[0];
                    const dy = relativePos.y - drawingPoints[1];
                    if (Math.sqrt(dx * dx + dy * dy) < 12) {
                        // Close polygon and create
                        const polygonId = 'polygon-' + uuidv4();
                        const newPolygon: SeatingNode = {
                            id: polygonId,
                            type:
                                tool === 'section_container'
                                    ? 'section_container'
                                    : tool === 'standing'
                                      ? 'standing'
                                      : 'zone',
                            x: 0,
                            y: 0,
                            points: [...drawingPoints],
                            fill:
                                tool === 'section_container'
                                    ? 'rgba(59, 130, 246, 0.07)'
                                    : tool === 'standing'
                                      ? 'rgba(16, 185, 129, 0.1)'
                                      : 'rgba(59, 130, 246, 0.2)',
                            name:
                                tool === 'section_container'
                                    ? 'Nueva Sección'
                                    : tool === 'standing'
                                      ? 'General'
                                      : 'Zona',
                            stroke: tool === 'standing' ? '#10b981' : '#3b82f6',
                            strokeWidth: 2,
                        };
                        setDrawingPoints([]);
                        if (tool === 'section_container' && onSectionContainerCreated) {
                            // Delegate to Builder to show the config modal before adding
                            onSectionContainerCreated(newPolygon);
                            if (onToolComplete) onToolComplete();
                        } else {
                            const updatedNodes = [...nodes, newPolygon];
                            setNodes(updatedNodes);
                            pushToHistory(updatedNodes);
                            onChange({ ...layout, nodes: updatedNodes });
                            if (onToolComplete) onToolComplete();
                        }
                        return;
                    }
                }
                setDrawingPoints([
                    ...drawingPoints,
                    relativePos.x,
                    relativePos.y,
                ]);
                return;
            }

            // Standard seat placement
            if (tool === 'seat') {
                const activeSection = checkActiveSection(relativePos);
                if (!activeSection) return;

                const newSeat: SeatingNode = {
                    id: 'seat-' + uuidv4(),
                    type: 'seat',
                    x: relativePos.x,
                    y: relativePos.y,
                    radius: layout?.config?.defaultRadius || 10,
                    fill: activeSection.fill || '#e2e8f0',
                    section: activeSection.name || 'General',
                    row: '?',
                    number:
                        nodes.filter(
                            (n) =>
                                n.type === 'seat' &&
                                n.section === activeSection.name,
                        ).length + 1,
                    permanent_uuid: uuidv4(),
                };
                const updatedNodes = [...nodes, newSeat];
                setNodes(updatedNodes);
                pushToHistory(updatedNodes);
                onChange({ ...layout, nodes: updatedNodes });
                if (onToolComplete) onToolComplete();
                return;
            }

            if (['row', 'rect_block', 'honeycomb_block'].includes(tool)) {
                const activeSection = checkActiveSection(relativePos);
                if (!activeSection) return;

                if (drawingStep === 0) {
                    setDrawingStep(1);
                    setDrawingStartPos(relativePos);
                } else if (drawingStep === 1) {
                    if (drawingStartPos) {
                        const dx = relativePos.x - drawingStartPos.x;
                        const dy = relativePos.y - drawingStartPos.y;
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                            if (tool === 'row') {
                                finishAdvancedBlock();
                            } else {
                                setDrawingStep(2);
                                setDrawingVectorEnd(relativePos);
                            }
                        } else {
                            setDrawingStep(0);
                            setDrawingStartPos(null);
                            setPreviewNodes([]);
                        }
                    }
                } else if (drawingStep === 2) {
                    finishAdvancedBlock();
                }
                return;
            }

            if (tool === 'rect') {
                addRectZone(relativePos.x, relativePos.y);
                return;
            }

            if (tool === 'circle_zone') {
                addCircleZone(relativePos.x, relativePos.y);
                return;
            }

            if (tool === 'table') {
                const activeSection = checkActiveSection(relativePos);
                if (!activeSection) return;

                const tableUuid = uuidv4();
                const seatsCount = 8;
                const tableRadius = 45;
                const seatRadius = layout?.config?.defaultRadius || 10;

                const tableNumber =
                    nodes.filter((n) => n.type === 'table_shape').length + 1;
                const tableName = 'Mesa ' + tableNumber;

                const tableNode: SeatingNode = {
                    id: 'table-' + tableUuid,
                    type: 'table_shape',
                    shape: 'circle',
                    x: relativePos.x,
                    y: relativePos.y,
                    radius: tableRadius,
                    width: tableRadius * 2,
                    height: tableRadius * 2,
                    fill: 'rgba(255, 255, 255, 0.8)',
                    stroke: '#94a3b8',
                    name: tableName,
                    table_uuid: tableUuid,
                    section: activeSection.name || 'General',
                };

                const newSeats: SeatingNode[] = [];
                for (let i = 0; i < seatsCount; i++) {
                    const angle = (Math.PI * 2 * i) / seatsCount;
                    const distance = tableRadius + seatRadius + 5;
                    newSeats.push({
                        id: 'seat-' + uuidv4(),
                        type: 'seat',
                        x: relativePos.x + Math.cos(angle) * distance,
                        y: relativePos.y + Math.sin(angle) * distance,
                        radius: seatRadius,
                        fill: activeSection.fill || '#cbd5e1',
                        section: activeSection.name || 'General',
                        row: tableName,
                        number: i + 1,
                        table_uuid: tableUuid,
                        permanent_uuid: uuidv4(),
                    });
                }

                const updatedNodes = [...nodes, tableNode, ...newSeats];
                setNodes(updatedNodes);
                pushToHistory(updatedNodes);
                onChange({ ...layout, nodes: updatedNodes });
                if (onToolComplete) onToolComplete();
                return;
            }

            const isStage =
                e.target === stage ||
                e.target.name() === 'grid' ||
                e.target.name() === 'background';
            if (isStage) {
                setSelectedIds([]);
                setDrawingPoints([]);
                if (onSelectionChange) onSelectionChange([]);
                if (tool === 'pan') return;
                setSelectionRect({
                    x1: relativePos.x,
                    y1: relativePos.y,
                    x2: relativePos.x,
                    y2: relativePos.y,
                });
                return;
            }

            const clickedId = e.target.id() || e.target.getParent()?.id();

            if (!clickedId) {
                mouseDownAlreadySelected.current = false;
                return;
            }

            mouseDownAlreadySelected.current =
                selectedIdsRef.current.includes(clickedId);

            // If not already selected, select it now so drag works properly
            if (!mouseDownAlreadySelected.current) {
                performSelection(e, clickedId);
            }
        };

        const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (e.evt && e.evt.button === 1) return; // Ignore middle click for selection
            if (e.target.isDragging && e.target.isDragging()) return;

            const clickedId = e.target.id() || e.target.getParent()?.id();
            if (!clickedId) return;

            if (mouseDownAlreadySelected.current && !e.evt?.shiftKey) {
                performSelection(e, clickedId);
            }
        };

        const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
            const clickedId = e.target.id() || e.target.getParent()?.id();
            if (clickedId) {
                const node = nodes.find((n) => n.id === clickedId);
                if (node && node.points) {
                    setEditingPolygonId(clickedId);
                }
            }
        };

        const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
            const stage = e.target.getStage();
            if (!stage) return;
            const relativePos = getRelativePointerPosition(stage);

            if (
                ['zone', 'section_container', 'standing'].includes(tool) &&
                drawingPoints.length > 0
            ) {
                setCurrentMousePos(relativePos);
            }

            if (drawingStep > 0 && drawingStartPos) {
                setCurrentMousePos(relativePos);
                const spacingX = layout?.config?.defaultSpacing || 35;
                const spacingY = spacingX + 10;
                const ghosts: any[] = [];

                if (drawingStep === 1) {
                    // Step 1: Drawing the first row
                    const dx = relativePos.x - drawingStartPos.x;
                    const dy = relativePos.y - drawingStartPos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    const count = Math.max(1, Math.floor(distance / spacingX) + 1);

                    for (let i = 0; i < count; i++) {
                        ghosts.push({
                            id: 'ghost-0-' + i,
                            x: drawingStartPos.x + Math.cos(angle) * i * spacingX,
                            y: drawingStartPos.y + Math.sin(angle) * i * spacingX,
                            rowIndex: 0,
                            colIndex: i,
                        });
                    }
                    setPreviewNodes(ghosts);
                } else if (drawingStep === 2 && drawingVectorEnd) {
                    // Step 2: Extruding the rows
                    const dxRow = drawingVectorEnd.x - drawingStartPos.x;
                    const dyRow = drawingVectorEnd.y - drawingStartPos.y;
                    const distRow = Math.sqrt(dxRow * dxRow + dyRow * dyRow);
                    const angleRow = Math.atan2(dyRow, dxRow);
                    const cols = Math.max(1, Math.floor(distRow / spacingX) + 1);

                    // Calculate perpendicular distance to cursor
                    const cursorDx = relativePos.x - drawingStartPos.x;
                    const cursorDy = relativePos.y - drawingStartPos.y;
                    
                    // Cross product to find perpendicular distance (with sign for direction)
                    // Normal vector to the row: (-sin, cos)
                    const perpDist = cursorDx * (-Math.sin(angleRow)) + cursorDy * Math.cos(angleRow);
                    
                    const rows = tool === 'row' ? 1 : Math.max(1, Math.floor(Math.abs(perpDist) / spacingY) + 1);
                    const dirY = perpDist >= 0 ? 1 : -1;

                    for (let r = 0; r < rows; r++) {
                        const rowOffsetDist = r * spacingY * dirY;
                        const rowOffsetX = -Math.sin(angleRow) * rowOffsetDist;
                        const rowOffsetY = Math.cos(angleRow) * rowOffsetDist;

                        const hexOffset = (tool === 'honeycomb_block' && r % 2 !== 0) ? spacingX / 2 : 0;
                        
                        for (let c = 0; c < cols; c++) {
                            const seatDist = c * spacingX + hexOffset;
                            ghosts.push({
                                id: `ghost-${r}-${c}`,
                                x: drawingStartPos.x + Math.cos(angleRow) * seatDist + rowOffsetX,
                                y: drawingStartPos.y + Math.sin(angleRow) * seatDist + rowOffsetY,
                                rowIndex: r,
                                colIndex: c,
                            });
                        }
                    }
                    setPreviewNodes(ghosts);
                }
                return;
            }

            if (!selectionRect || mode !== 'edit') return;
            setSelectionRect({
                ...selectionRect,
                x2: relativePos.x,
                y2: relativePos.y,
            });
        };

        const finishAdvancedBlock = () => {
            if (drawingStep > 0 && drawingStartPos && previewNodes.length > 0) {
                const blockUuid = uuidv4();
                const rowMap: Record<number, string> = {};

                const sections = nodesRef.current.filter((n) =>
                    ['section_container', 'rect_zone', 'circle_zone'].includes(
                        n.type,
                    ),
                );
                const parentSection = sections.find((s) =>
                    selectedIdsRef.current.includes(s.id),
                );
                const section = parentSection?.name || 'General';

                const rowIndices = Array.from(
                    new Set(previewNodes.map((p) => p.rowIndex ?? 0)),
                ).sort((a, b) => a - b);
                const newSeats: SeatingNode[] = previewNodes.map((ghost) => {
                    const rIdx = ghost.rowIndex ?? 0;
                    if (!rowMap[rIdx]) rowMap[rIdx] = uuidv4();

                    return {
                        id: 'seat-' + uuidv4(),
                        type: 'seat',
                        x: ghost.x,
                        y: ghost.y,
                        radius: layout?.config?.defaultRadius || 10,
                        fill: parentSection?.fill || '#cbd5e1',
                        section: section,
                        row: '',
                        row_uuid: rowMap[rIdx],
                        block_uuid: tool === 'row' ? null : blockUuid,
                        number: undefined,
                        row_label_enabled: false,
                        spacing: layout?.config?.defaultSpacing || 35,
                        curvature: 0,
                        permanent_uuid: uuidv4(),
                    };
                });
                const updatedNodes = [...nodes, ...newSeats];
                setNodes(updatedNodes);
                pushToHistory(updatedNodes);
                onChange({ ...layout, nodes: updatedNodes });

                setDrawingStep(0);
                setDrawingStartPos(null);
                setDrawingVectorEnd(null);
                setPreviewNodes([]);
                setGuides([]);
                if (onToolComplete) onToolComplete();
            }
        };

        const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {

            if (!selectionRect || mode !== 'edit') return;

            const xmin = Math.min(selectionRect.x1, selectionRect.x2);
            const xmax = Math.max(selectionRect.x1, selectionRect.x2);
            const ymin = Math.min(selectionRect.y1, selectionRect.y2);
            const ymax = Math.max(selectionRect.y1, selectionRect.y2);

            const newlySelected = nodesRef.current
                .filter(
                    (node) =>
                        node.x >= xmin &&
                        node.x <= xmax &&
                        node.y >= ymin &&
                        node.y <= ymax,
                )
                .map((node) => node.id);

            if (newlySelected.length > 0) {
                setSelectedIds(newlySelected);
                if (onSelectionChange) onSelectionChange(newlySelected);
            }

            setSelectionRect(null);
        };

        const addRow = (x = 50, y = 100) => {
            const nextLabel = getNextRowLabel(nodesRef.current, 'VIP');

            const newSeats = generateRow({
                count: 12,
                startX: x,
                startY: y,
                spacing: layout?.config?.defaultSpacing || 35,
                radius: layout?.config?.defaultRadius || 10,
                curvature: 2,
                section: 'VIP',
                rowLabel: nextLabel,
            });
            const updatedNodes = [...nodes, ...newSeats];
            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        };

        const addGrid = (x = 50, y = 200) => {
            const newSeats = generateGrid({
                rows: 5,
                cols: 10,
                startX: x,
                startY: y,
                spacingX: layout?.config?.defaultSpacing || 35,
                spacingY: (layout?.config?.defaultSpacing || 35) + 10,
                radius: layout?.config?.defaultRadius || 10,
                section: 'General',
                rowLabelStart: '',
            });
            const updatedNodes = [...nodes, ...newSeats];
            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        };

        const addHoneycomb = (x = 100, y = 100) => {
            const newSeats = generateHoneycomb({
                rows: 8,
                cols: 12,
                startX: x,
                startY: y,
                spacingX: layout?.config?.defaultSpacing || 35,
                spacingY: 35,
                radius: layout?.config?.defaultRadius || 10,
                section: 'General Panal',
                rowLabelStart: '',
            });
            const updatedNodes = [...nodes, ...newSeats];
            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        };

        const addRectZone = (x = 100, y = 100) => {
            const newZone: SeatingNode = {
                id: 'zone-' + uuidv4(),
                type: 'rect_zone',
                x: x,
                y: y,
                width: 200,
                height: 150,
                fill: 'rgba(52, 211, 153, 0.2)',
                name: 'Nueva Sección Rect',
                sectionType: 'numbered',
            };
            const updatedNodes = [...nodes, newZone];
            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
            if (onToolComplete) onToolComplete();
        };

        const addCircleZone = (x = 100, y = 100) => {
            const newZone: SeatingNode = {
                id: 'zone-' + uuidv4(),
                type: 'circle_zone',
                x: x,
                y: y,
                radius: 80,
                fill: 'rgba(59, 130, 246, 0.2)',
                name: 'Nueva Sección Circ',
                sectionType: 'numbered',
            };
            const updatedNodes = [...nodes, newZone];
            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
            if (onToolComplete) onToolComplete();
        };

        return (
            <div
                ref={containerRef}
                className="relative h-full w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-200 shadow-inner"
            >
                <Stage
                    width={stageSize.width}
                    height={stageSize.height}
                    onMouseDown={handleMouseDown}
                    onClick={handleClick}
                    onDblClick={handleDblClick}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheel}
                    scaleX={stageScale}
                    scaleY={stageScale}
                    x={stagePos.x}
                    y={stagePos.y}
                    draggable={mode === 'edit'}
                    onDragStart={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (tool !== 'pan' && e.evt?.button !== 1) {
                            e.target.stopDrag();
                        }
                    }}
                    onDragEnd={(e) => {
                        setGuides([]);
                        e.cancelBubble = true;
                        if (e.target !== e.currentTarget) return;
                        setStagePos({ x: e.target.x(), y: e.target.y() });
                    }}
                    ref={stageRef}
                    className="bg-white"
                    onContextMenu={(e) => e.evt.preventDefault()}
                >
                    <Layer name="canvas-bottom" listening={false}>
                        {/* Render Grid Lines */}
                        {mode === 'edit' &&
                            (() => {
                                const lines = [];
                                const grid = 20;

                                const minX = -stagePos.x / stageScale;
                                const maxX =
                                    minX + stageSize.width / stageScale;
                                const minY = -stagePos.y / stageScale;
                                const maxY =
                                    minY + stageSize.height / stageScale;

                                const startX = Math.floor(minX / grid) * grid;
                                const endX = Math.ceil(maxX / grid) * grid;
                                const startY = Math.floor(minY / grid) * grid;
                                const endY = Math.ceil(maxY / grid) * grid;

                                const paddingX = grid * 5;
                                const paddingY = grid * 5;

                                for (
                                    let x = startX - paddingX;
                                    x <= endX + paddingX;
                                    x += grid
                                ) {
                                    const isMajor =
                                        Math.abs(x) % (grid * 5) === 0;
                                    lines.push(
                                        <Line
                                            key={`v-${x}`}
                                            points={[
                                                x,
                                                startY - paddingY,
                                                x,
                                                endY + paddingY,
                                            ]}
                                            stroke={
                                                isMajor ? '#94a3b8' : '#cbd5e1'
                                            }
                                            strokeWidth={isMajor ? 1 : 0.5}
                                            dash={isMajor ? [] : [2, 4]}
                                            opacity={isMajor ? 0.5 : 0.3}
                                        />,
                                    );
                                }
                                for (
                                    let y = startY - paddingY;
                                    y <= endY + paddingY;
                                    y += grid
                                ) {
                                    const isMajor =
                                        Math.abs(y) % (grid * 5) === 0;
                                    lines.push(
                                        <Line
                                            key={`h-${y}`}
                                            points={[
                                                startX - paddingX,
                                                y,
                                                endX + paddingX,
                                                y,
                                            ]}
                                            stroke={
                                                isMajor ? '#94a3b8' : '#cbd5e1'
                                            }
                                            strokeWidth={isMajor ? 1 : 0.5}
                                            dash={isMajor ? [] : [2, 4]}
                                            opacity={isMajor ? 0.5 : 0.3}
                                        />,
                                    );
                                }
                                return lines;
                            })()}
                        {bgImage && (
                            <KonvaImage
                                image={bgImage}
                                x={layout.config?.bgX || 0}
                                y={layout.config?.bgY || 0}
                                scaleX={layout.config?.bgScale || 1}
                                scaleY={layout.config?.bgScale || 1}
                                opacity={layout.config?.bgOpacity ?? 0.8}
                            />
                        )}
                    </Layer>
                    <Layer name="zones">
                        {zones.map((node) => {
                            if (
                                [
                                    'section_container',
                                    'zone',
                                    'rect_zone',
                                    'circle_zone',
                                ].includes(node.type)
                            ) {
                                return (
                                    <SectionNode
                                        key={node.id}
                                        node={node}
                                        stageScale={stageScale}
                                        isSelected={selectedIds.includes(
                                            node.id,
                                        )}
                                        onDragStart={(e) => {
                                            if (e.target.id() !== node.id) return;
                                            if (e.evt && e.evt.button !== 0) {
                                                e.target.stopDrag();
                                                return;
                                            }
                                            const contained = nodesRef.current.filter((n) => {
                                                if (n.type !== 'seat') return false;
                                                if (n.section && n.section === node.name) return true;
                                                if (node.shape === 'rect' || node.type === 'rect_zone' || node.type === 'section_container') {
                                                    const width = node.width || 200;
                                                    const height = node.height || 200;
                                                    return isPointInRect(n.x, n.y, node.x, node.y, width, height);
                                                }
                                                if (node.shape === 'circle' || node.type === 'circle_zone') {
                                                    const radius = node.radius || 100;
                                                    return isPointInCircle(n.x, n.y, node.x, node.y, radius);
                                                }
                                                if (node.points && node.points.length >= 6) {
                                                    return isPointInPolygon(n.x, n.y, node.points, node.x, node.y);
                                                }
                                                return false;
                                            });
                                            const startMap: Record<
                                                string,
                                                { x: number; y: number }
                                            > = {};
                                            contained.forEach((n) => {
                                                startMap[n.id] = {
                                                    x: n.x,
                                                    y: n.y,
                                                };
                                            });
                                            dragStartRef.current = startMap;
                                            if (selectedIdsRef.current.includes(node.id)) {
                                                setBlockDragOffset({x: 0, y: 0});
                                            }
                                            (e.target as any).setAttr(
                                                'dragStartX',
                                                node.x,
                                            );
                                            (e.target as any).setAttr(
                                                'dragStartY',
                                                node.y,
                                            );
                                        }}
                                        onDragMove={(e) => {
                                            if (
                                                e.target.id() !== node.id ||
                                                !dragStartRef.current
                                            )
                                                return;
                                            const dx =
                                                e.target.x() -
                                                ((e.target as any).getAttr(
                                                    'dragStartX',
                                                ) || node.x);
                                            const dy =
                                                e.target.y() -
                                                ((e.target as any).getAttr(
                                                    'dragStartY',
                                                ) || node.y);
                                            const layer = e.target.getLayer();
                                            if (!layer) return;
                                            const seatLayer = layer
                                                .getStage()
                                                .findOne(
                                                    '.seats',
                                                ) as Konva.Layer;
                                            if (!seatLayer) return;
                                            Object.keys(
                                                dragStartRef.current,
                                            ).forEach((id) => {
                                                const seatNode =
                                                    seatLayer.findOne('#' + id);
                                                const startPos =
                                                    dragStartRef.current[id];
                                                if (seatNode && startPos) {
                                                    seatNode.x(startPos.x + dx);
                                                    seatNode.y(startPos.y + dy);
                                                }
                                            });
                                        }}
                                        onDragEnd={(e) => {
                                            if (e.target.id() !== node.id)
                                                return;
                                            if (Object.keys(dragStartRef.current).length === 0 && e.target.x() === node.x && e.target.y() === node.y)
                                                return;
                                            const dx =
                                                e.target.x() -
                                                ((e.target as any).getAttr(
                                                    'dragStartX',
                                                ) || node.x);
                                            const dy =
                                                e.target.y() -
                                                ((e.target as any).getAttr(
                                                    'dragStartY',
                                                ) || node.y);
                                            const updatedNodes =
                                                nodesRef.current.map((n) => {
                                                    if (n.id === node.id)
                                                        return {
                                                            ...n,
                                                            x: e.target.x(),
                                                            y: e.target.y(),
                                                        };
                                                    if (
                                                        dragStartRef.current[
                                                            n.id
                                                        ]
                                                    ) {
                                                        const start =
                                                            dragStartRef
                                                                .current[n.id];
                                                        return {
                                                            ...n,
                                                            x: start.x + dx,
                                                            y: start.y + dy,
                                                        };
                                                    }
                                                    return n;
                                                });
                                            setNodes(updatedNodes);
                                            pushToHistory(updatedNodes);
                                            onChange({
                                                ...layout,
                                                nodes: updatedNodes,
                                            });
                                            dragStartRef.current = {};
                                        }}
                                        onTransformEnd={(e) => {
                                            const n = e.target;
                                            const updatedNodes =
                                                nodesRef.current.map((item) =>
                                                    item.id === node.id
                                                        ? {
                                                              ...item,
                                                              x: n.x(),
                                                              y: n.y(),
                                                              scaleX: n.scaleX(),
                                                              scaleY: n.scaleY(),
                                                          }
                                                        : item,
                                                );
                                            setNodes(updatedNodes);
                                            pushToHistory(updatedNodes);
                                            onChange({
                                                ...layout,
                                                nodes: updatedNodes,
                                            });
                                        }}
                                    />
                                );
                            }
                            if (node.type === 'standing') {
                                return (
                                    <StandingNode
                                        key={node.id}
                                        node={node}
                                        stageScale={stageScale}
                                        isSelected={selectedIds.includes(
                                            node.id,
                                        )}
                                        onDragEnd={(e) => {
                                            const updatedNodes =
                                                nodesRef.current.map((n) =>
                                                    n.id === node.id
                                                        ? {
                                                              ...n,
                                                              x: e.target.x(),
                                                              y: e.target.y(),
                                                          }
                                                        : n,
                                                );
                                            setNodes(updatedNodes);
                                            pushToHistory(updatedNodes);
                                            onChange({
                                                ...layout,
                                                nodes: updatedNodes,
                                            });
                                        }}
                                    />
                                );
                            }
                            return null;
                        })}
                    </Layer>
                    <Layer name="seats" className="seats">
                        {stageScale > 0.5 &&
                            seats.map((node) => (
                                <SeatNode
                                    key={node.id}
                                    node={node}
                                    mode={mode}
                                    isSelected={selectedIds.includes(node.id)}
                                    isHovered={hoveredId === node.id}
                                    isInCart={cart.includes(node.id)}
                                    stageScale={stageScale}
                                    onMouseEnter={() =>
                                        mode === 'preview' &&
                                        setHoveredId(node.id)
                                    }
                                    onMouseLeave={() =>
                                        mode === 'preview' && setHoveredId(null)
                                    }
                                    onDragStart={(e) => {
                                        e.cancelBubble = true;
                                        const startMap: Record<
                                            string,
                                            {
                                                x: number;
                                                y: number;
                                                konvaNode: any;
                                            }
                                        > = {};
                                        const layer = e.target.getLayer();
                                        if (!layer) return;

                                        const konvaNodesMap: Record<
                                            string,
                                            any
                                        > = {};
                                        layer.getChildren().forEach((child) => {
                                            const cid = child.id();
                                            if (cid) konvaNodesMap[cid] = child;
                                        });

                                        if (
                                            selectedIdsRef.current.includes(
                                                node.id,
                                            )
                                        ) {
                                            selectedIdsRef.current.forEach(
                                                (id) => {
                                                    const n =
                                                        nodesRef.current.find(
                                                            (item) =>
                                                                item.id === id,
                                                        );
                                                    if (n) {
                                                        startMap[id] = {
                                                            x: n.x,
                                                            y: n.y,
                                                            konvaNode:
                                                                konvaNodesMap[
                                                                    id
                                                                ],
                                                        };

                                                        if (n.row_uuid) {
                                                            const leftLabel =
                                                                konvaNodesMap[
                                                                    `label-L-${n.row_uuid}`
                                                                ];
                                                            const rightLabel =
                                                                konvaNodesMap[
                                                                    `label-R-${n.row_uuid}`
                                                                ];
                                                            if (leftLabel)
                                                                startMap[
                                                                    `label-L-${n.row_uuid}`
                                                                ] = {
                                                                    x: leftLabel.x(),
                                                                    y: leftLabel.y(),
                                                                    konvaNode:
                                                                        leftLabel,
                                                                };
                                                            if (rightLabel)
                                                                startMap[
                                                                    `label-R-${n.row_uuid}`
                                                                ] = {
                                                                    x: rightLabel.x(),
                                                                    y: rightLabel.y(),
                                                                    konvaNode:
                                                                        rightLabel,
                                                                };
                                                        }
                                                    }
                                                },
                                            );
                                        } else {
                                            startMap[node.id] = {
                                                x: node.x,
                                                y: node.y,
                                                konvaNode: e.target,
                                            };
                                        }
                                        dragStartRef.current = startMap;
                                        (e.target as any).setAttr(
                                            'dragStartX',
                                            node.x,
                                        );
                                        (e.target as any).setAttr(
                                            'dragStartY',
                                            node.y,
                                        );
                                    }}
                                    onDragMove={(e) => {
                                        if (!dragStartRef.current) return;

                                        // Custom Row Curvature Dragging when 'C' key is pressed
                                        if (isCCurvePressedRef.current && node.row_uuid) {
                                            const rowNodes = nodesRef.current.filter((n) => n.row_uuid === node.row_uuid);
                                            if (rowNodes.length > 1) {
                                                const sortedRowNodes = [...rowNodes].sort((a, b) => (a.number || 0) - (b.number || 0));
                                                const anchor = sortedRowNodes[0];
                                                const last = sortedRowNodes[sortedRowNodes.length - 1];
                                                const dx = last.x - anchor.x;
                                                const dy = last.y - anchor.y;
                                                const angle = Math.atan2(dy, dx);

                                                const currentX = e.target.x();
                                                const currentY = e.target.y();

                                                // Project dragged seat position into row local coordinates
                                                const relX = currentX - anchor.x;
                                                const relY = currentY - anchor.y;

                                                // Perpendicular offset (perpendicular to row direction vector)
                                                const perpY = -relX * Math.sin(angle) + relY * Math.cos(angle);

                                                const count = rowNodes.length;
                                                const mid = (count - 1) / 2;
                                                const seatIdx = (node.number || 1) - 1;
                                                const cOffset = seatIdx - mid;
                                                const spacing = anchor.spacing || 35;

                                                let newCurve = 0;
                                                if (Math.abs(cOffset) > 0.001) {
                                                    newCurve = perpY / (Math.pow(cOffset, 2) * (spacing / 10));
                                                } else {
                                                    newCurve = perpY / (spacing / 10);
                                                }

                                                // Clamp curvature to avoid extreme distortion
                                                newCurve = Math.max(-15, Math.min(15, newCurve));

                                                const selectedRowUuids = Array.from(new Set(
                                                    nodesRef.current
                                                        .filter(n => selectedIdsRef.current.includes(n.id) && n.row_uuid)
                                                        .map(n => n.row_uuid)
                                                )).filter(Boolean) as string[];

                                                if (selectedRowUuids.includes(node.row_uuid)) {
                                                    updateMultipleRowsStructureFn(selectedRowUuids, { curve: newCurve });
                                                } else {
                                                    updateRowStructureFn(node.row_uuid, { curve: newCurve });
                                                }
                                                return;
                                            }
                                        }

                                        let rawX = e.target.x();
                                        let rawY = e.target.y();

                                        const selectionSize = Object.keys(
                                            dragStartRef.current,
                                        ).length;
                                        if (selectionSize < 20) {
                                            const activeGuides: any[] = [];
                                            nodesRef.current.forEach(
                                                (other, idx) => {
                                                    if (
                                                        other.id === node.id ||
                                                        selectedIdsRef.current.includes(
                                                            other.id,
                                                        )
                                                    )
                                                        return;
                                                    if (
                                                        other.type !== 'seat' ||
                                                        (nodesRef.current
                                                            .length > 200 &&
                                                            idx % 2 !== 0)
                                                    )
                                                        return;

                                                    if (
                                                        Math.abs(
                                                            rawX - other.x,
                                                        ) < 5
                                                    ) {
                                                        rawX = other.x;
                                                        activeGuides.push({
                                                            orientation: 'V',
                                                            pos: other.x,
                                                        });
                                                    }
                                                    if (
                                                        Math.abs(
                                                            rawY - other.y,
                                                        ) < 5
                                                    ) {
                                                        rawY = other.y;
                                                        activeGuides.push({
                                                            orientation: 'H',
                                                            pos: other.y,
                                                        });
                                                    }
                                                },
                                            );
                                            if (activeGuides.length > 0)
                                                setGuides(
                                                    activeGuides.slice(0, 2),
                                                );
                                        }

                                        e.target.x(rawX);
                                        e.target.y(rawY);

                                        const dx =
                                            rawX -
                                            ((e.target as any).getAttr(
                                                'dragStartX',
                                            ) ||
                                                dragStartRef.current[node.id]
                                                    .x);
                                        const dy =
                                            rawY -
                                            ((e.target as any).getAttr(
                                                'dragStartY',
                                            ) ||
                                                dragStartRef.current[node.id]
                                                    .y);
                                        if (selectedIdsRef.current.includes(node.id)) {
                                            setBlockDragOffset({x: dx, y: dy});
                                        }

                                        Object.keys(
                                            dragStartRef.current,
                                        ).forEach((id) => {
                                            if (id === node.id) return;
                                            const data =
                                                dragStartRef.current[id];
                                            if (data.konvaNode) {
                                                data.konvaNode.x(data.x + dx);
                                                data.konvaNode.y(data.y + dy);
                                            }
                                        });
                                    }}
                                    onDragEnd={(e) => {
                                        if (!dragStartRef.current || Object.keys(dragStartRef.current).length === 0) return;
                                        setGuides([]);
                                        e.cancelBubble = true;

                                        if (isCCurvePressedRef.current && node.row_uuid) {
                                            pushToHistory(nodesRef.current);
                                            onChange({ ...layout, nodes: nodesRef.current });
                                            dragStartRef.current = {};
                                            return;
                                        }

                                        const dx =
                                            e.target.x() -
                                            ((e.target as any).getAttr(
                                                'dragStartX',
                                            ) ||
                                                dragStartRef.current[node.id]
                                                    .x);
                                        const dy =
                                            e.target.y() -
                                            ((e.target as any).getAttr(
                                                'dragStartY',
                                            ) ||
                                                dragStartRef.current[node.id]
                                                    .y);

                                        const updatedNodes =
                                            nodesRef.current.map((n) => {
                                                if (
                                                    dragStartRef.current[n.id]
                                                ) {
                                                    // read exact position from konva internal state to avoid snapping/batching glitches
                                                    const konvaNode = dragStartRef.current[n.id].konvaNode;
                                                    return {
                                                        ...n,
                                                        x: konvaNode ? konvaNode.x() : n.x + dx,
                                                        y: konvaNode ? konvaNode.y() : n.y + dy,
                                                    };
                                                }
                                                return n;
                                            });

                                        setNodes(updatedNodes);
                                        pushToHistory(updatedNodes);
                                        onChange({
                                            ...layout,
                                            nodes: updatedNodes,
                                        });
                                        dragStartRef.current = {};
                                        setBlockDragOffset(null);
                                    }}
                                    onClick={handleClick}
                                    onTap={handleClick as any}
                                />
                            ))}
                        {/* Row Labels Layer (Duales: Inicio y Fin) */}
                        {(() => {
                            const rowGroups: Record<string, SeatingNode[]> = {};
                            nodes.forEach((n) => {
                                if (n.type === 'seat' && n.row_uuid) {
                                    if (!rowGroups[n.row_uuid])
                                        rowGroups[n.row_uuid] = [];
                                    rowGroups[n.row_uuid].push(n);
                                }
                            });

                            return Object.values(rowGroups).map(
                                (rowSeats, idx) => {
                                    if (rowSeats.length === 0) return null;

                                    const first = rowSeats[0];
                                    const isEnabled =
                                        first.row_label_enabled ?? true;
                                    if (!isEnabled) return null;

                                    const position =
                                        first.row_label_position || 'both';
                                    const displayLabel =
                                        first.row_label_override ||
                                        first.row ||
                                        '';

                                    const sorted = [...rowSeats].sort(
                                        (a, b) => (a.number || 0) - (b.number || 0),
                                    );
                                    const extremeLeft = sorted[0];
                                    const extremeRight =
                                        sorted[sorted.length - 1];
                                    const radius = extremeLeft.radius || 10;
                                     const offset = radius * 3;

                                    let dx = extremeRight.x - extremeLeft.x;
                                    let dy = extremeRight.y - extremeLeft.y;
                                    let angle = Math.atan2(dy, dx);
                                    
                                    // Calculate tangent vectors and angles at the endpoints for labels to match curvature
                                    let angleLeft = angle;
                                    let angleRight = angle;
                                    let posXLeft = extremeLeft.x - Math.cos(angle) * offset;
                                    let posYLeft = extremeLeft.y - Math.sin(angle) * offset;
                                    let posXRight = extremeRight.x + Math.cos(angle) * offset;
                                    let posYRight = extremeRight.y + Math.sin(angle) * offset;

                                    if (sorted.length > 1) {
                                        // Left endpoint (sorted[0]): vector from sorted[0] to sorted[1]
                                        const dxL = sorted[1].x - sorted[0].x;
                                        const dyL = sorted[1].y - sorted[0].y;
                                        const distL = Math.sqrt(dxL * dxL + dyL * dyL) || 1;
                                        angleLeft = Math.atan2(dyL, dxL);
                                        posXLeft = sorted[0].x - (dxL / distL) * offset;
                                        posYLeft = sorted[0].y - (dyL / distL) * offset;

                                        // Right endpoint (sorted[last]): vector from sorted[last-1] to sorted[last]
                                        const lastIdx = sorted.length - 1;
                                        const dxR = sorted[lastIdx].x - sorted[lastIdx - 1].x;
                                        const dyR = sorted[lastIdx].y - sorted[lastIdx - 1].y;
                                        const distR = Math.sqrt(dxR * dxR + dyR * dyR) || 1;
                                        angleRight = Math.atan2(dyR, dxR);
                                        posXRight = sorted[lastIdx].x + (dxR / distR) * offset;
                                        posYRight = sorted[lastIdx].y + (dyR / distR) * offset;
                                    }

                                    let rotLeft = (angleLeft * 180) / Math.PI;
                                    if (rotLeft > 90 || rotLeft < -90) {
                                        rotLeft += 180;
                                    }

                                    let rotRight = (angleRight * 180) / Math.PI;
                                    if (rotRight > 90 || rotRight < -90) {
                                        rotRight += 180;
                                    }

                                    const showLeft =
                                        position === 'both' ||
                                        position === 'left';
                                    const showRight =
                                        position === 'both' ||
                                        position === 'right';

                                    return (
                                        <React.Fragment
                                            key={`row-labels-${idx}`}
                                        >
                                            {showLeft && (
                                                <Text
                                                    id={`label-L-${first.row_uuid}`}
                                                    x={posXLeft}
                                                    y={posYLeft}
                                                    rotation={rotLeft}
                                                    offsetX={radius}
                                                    offsetY={radius / 2}
                                                    text={displayLabel}
                                                    fontSize={radius * 1.2}
                                                    fill="#64748b"
                                                    fontStyle="bold"
                                                    width={radius * 2}
                                                    align="center"
                                                />
                                            )}
                                            {showRight && (
                                                <Text
                                                    id={`label-R-${first.row_uuid}`}
                                                    x={posXRight}
                                                    y={posYRight}
                                                    rotation={rotRight}
                                                    offsetX={radius}
                                                    offsetY={radius / 2}
                                                    text={displayLabel}
                                                    fontSize={radius * 1.2}
                                                    fill="#64748b"
                                                    fontStyle="bold"
                                                    width={radius * 2}
                                                    align="center"
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                },
                            );
                        })()}

                        {/* Block/Row Highlight Overlay */}
                        {(() => {
                            const selectedSeats = nodes.filter(
                                (n) =>
                                    selectedIds.includes(n.id) &&
                                    n.type === 'seat',
                            );
                            if (selectedSeats.length === 0) return null;

                            const blockUuid = selectedSeats[0].block_uuid;
                            const isWholeBlock =
                                blockUuid &&
                                nodes
                                    .filter((n) => n.block_uuid === blockUuid)
                                    .every((n) => selectedIds.includes(n.id));

                            if (isWholeBlock) {
                                const xmin =
                                    Math.min(...selectedSeats.map((s) => s.x)) -
                                    30;
                                const xmax =
                                    Math.max(...selectedSeats.map((s) => s.x)) +
                                    30;
                                const ymin =
                                    Math.min(...selectedSeats.map((s) => s.y)) -
                                    30;
                                const ymax =
                                    Math.max(...selectedSeats.map((s) => s.y)) +
                                    30;

                                return (
                                    <Rect
                                        x={xmin}
                                        y={ymin}
                                        width={xmax - xmin}
                                        height={ymax - ymin}
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dash={[5, 5]}
                                        cornerRadius={8}
                                        opacity={0.3}
                                        listening={false}
                                    />
                                );
                            }
                            return null;
                        })()}
                    </Layer>

                    <Layer name="dynamic">
                    {/* Pink Infinite Guidelines for Advanced Block Drawing */}
                    {drawingStep > 0 && drawingStartPos && previewNodes.length > 0 && (() => {
                        const spacingX = layout?.config?.defaultSpacing || 35;
                        let angle = 0;
                        if (drawingStep === 1) {
                            if (currentMousePos) {
                                angle = Math.atan2(currentMousePos.y - drawingStartPos.y, currentMousePos.x - drawingStartPos.x);
                            }
                        } else if (drawingStep === 2 && drawingVectorEnd) {
                            angle = Math.atan2(drawingVectorEnd.y - drawingStartPos.y, drawingVectorEnd.x - drawingStartPos.x);
                        }
                        const dx = Math.cos(angle) * 9999;
                        const dy = Math.sin(angle) * 9999;

                        const midIndex = Math.floor(previewNodes.length / 2);
                        const midNode = drawingStep === 1 ? previewNodes[midIndex] : null;

                        return (
                            <Group listening={false}>
                                <Line
                                    points={[
                                        drawingStartPos.x - dx, drawingStartPos.y - dy,
                                        drawingStartPos.x + dx, drawingStartPos.y + dy
                                    ]}
                                    stroke="#ec4899"
                                    strokeWidth={1}
                                    dash={[5, 5]}
                                />
                                {drawingStep === 1 && midNode && (
                                    <Group x={midNode.x} y={midNode.y - spacingX}>
                                        <Rect
                                            x={-20} y={-10}
                                            width={40} height={20}
                                            fill="#1e293b"
                                            cornerRadius={4}
                                        />
                                        <Text
                                            text={previewNodes.length.toString()}
                                            x={-20} y={-5}
                                            width={40}
                                            align="center"
                                            fill="white"
                                            fontSize={12}
                                            fontStyle="bold"
                                        />
                                    </Group>
                                )}
                                {drawingStep === 2 && previewNodes.length > 0 && (() => {
                                    const minX = Math.min(...previewNodes.map(n => n.x));
                                    const maxX = Math.max(...previewNodes.map(n => n.x));
                                    const minY = Math.min(...previewNodes.map(n => n.y));
                                    const maxY = Math.max(...previewNodes.map(n => n.y));
                                    const centerX = (minX + maxX) / 2;
                                    const centerY = (minY + maxY) / 2;

                                    const rowIndices = Array.from(new Set(previewNodes.map(n => n.rowIndex ?? 0)));
                                    const colIndices = Array.from(new Set(previewNodes.map(n => n.colIndex ?? 0)));
                                    const totalRows = rowIndices.length;
                                    const totalCols = colIndices.length;

                                    const badgeText = `${totalRows} × ${totalCols}`;
                                    const badgeWidth = badgeText.length * 8 + 16;

                                    return (
                                        <Group x={centerX} y={centerY}>
                                            <Rect
                                                x={-badgeWidth / 2}
                                                y={-11}
                                                width={badgeWidth}
                                                height={22}
                                                fill="#000000"
                                                cornerRadius={4}
                                                shadowColor="black"
                                                shadowBlur={4}
                                                shadowOpacity={0.3}
                                            />
                                            <Text
                                                text={badgeText}
                                                x={-badgeWidth / 2}
                                                y={-6}
                                                width={badgeWidth}
                                                align="center"
                                                fill="#ffffff"
                                                fontSize={12}
                                                fontStyle="bold"
                                                fontFamily="monospace, sans-serif"
                                            />
                                        </Group>
                                    );
                                })()}
                            </Group>
                        );
                    })()}

                    {/* Render ghost nodes (preview for drawing) */}
                    {previewNodes.map((ghost) => (
                        <Circle
                            key={ghost.id}
                            x={ghost.x}
                            y={ghost.y}
                            radius={10}
                            fill="#3b82f6"
                            fillPriority="color"
                            opacity={0.15}
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            listening={false}
                            perfectDrawEnabled={false}
                        />
                    ))}

                        {/* Rotation Smart Guides & Angle Tooltip */}
                        {rotationGuide && (
                            <Group listening={false}>
                                {/* Crosshair axes through center */}
                                <Line
                                    points={[rotationGuide.x - 5000, rotationGuide.y, rotationGuide.x + 5000, rotationGuide.y]}
                                    stroke="#3b82f6"
                                    strokeWidth={1}
                                    dash={[4, 4]}
                                />
                                <Line
                                    points={[rotationGuide.x, rotationGuide.y - 5000, rotationGuide.x, rotationGuide.y + 5000]}
                                    stroke="#3b82f6"
                                    strokeWidth={1}
                                    dash={[4, 4]}
                                />
                                {/* Angle Badge */}
                                <Group x={rotationGuide.x} y={rotationGuide.y - 35}>
                                    <Rect
                                        x={-30}
                                        y={-12}
                                        width={60}
                                        height={24}
                                        fill="#1e293b"
                                        cornerRadius={4}
                                        shadowColor="#000000"
                                        shadowBlur={6}
                                        shadowOpacity={0.3}
                                    />
                                    <Text
                                        text={`${rotationGuide.angle}°`}
                                        x={-30}
                                        y={-6}
                                        width={60}
                                        align="center"
                                        fill="#ffffff"
                                        fontSize={12}
                                        fontStyle="bold"
                                    />
                                </Group>
                            </Group>
                        )}

                        
                        

{/* Smart Guides Rendering */}
                        {guides.map((guide, i) => (
                            <Line
                                key={`guide-${i}`}
                                points={
                                    guide.orientation === 'V'
                                        ? [guide.pos, -5000, guide.pos, 5000]
                                        : [-5000, guide.pos, 5000, guide.pos]
                                }
                                stroke="#d946ef"
                                strokeWidth={1}
                                dash={[4, 4]}
                                listening={false}
                                perfectDrawEnabled={false}
                            />
                        ))}

                        {/* Render Tables */}
                        {tables.map((node) => (
                            <TableNode
                                key={node.id}
                                node={node}
                                mode={mode}
                                isSelected={selectedIds.includes(node.id)}
                                onDragEnd={(e) => {
                                    const nx = e.target.x();
                                    const ny = e.target.y();
                                    const dx = nx - node.x;
                                    const dy = ny - node.y;

                                    const updatedNodes = nodesRef.current.map(
                                        (n) => {
                                            if (n.id === node.id)
                                                return { ...n, x: nx, y: ny };
                                            if (
                                                n.table_uuid ===
                                                    node.table_uuid &&
                                                n.type === 'seat'
                                            ) {
                                                return {
                                                    ...n,
                                                    x: n.x + dx,
                                                    y: n.y + dy,
                                                };
                                            }
                                            return n;
                                        },
                                    );
                                    setNodes(updatedNodes);
                                    pushToHistory(updatedNodes);
                                    onChange({
                                        ...layout,
                                        nodes: updatedNodes,
                                    });
                                }}
                            />
                        ))}

                        {/* Marquee Selection Rect */}
                        {selectionRect && (
                            <Rect
                                x={Math.min(selectionRect.x1, selectionRect.x2)}
                                y={Math.min(selectionRect.y1, selectionRect.y2)}
                                width={Math.abs(
                                    selectionRect.x2 - selectionRect.x1,
                                )}
                                height={Math.abs(
                                    selectionRect.y2 - selectionRect.y1,
                                )}
                                fill="rgba(59, 130, 246, 0.2)"
                                stroke="#3b82f6"
                                strokeWidth={1}
                                listening={false}
                                perfectDrawEnabled={false}
                            />
                        )}

                        {/* Current Drawing Polygon */}
                        {drawingPoints.length > 0 && (
                            <Group listening={false}>
                                <Line
                                    points={drawingPoints}
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dash={[5, 5]}
                                    closed={false}
                                    listening={false}
                                    perfectDrawEnabled={false}
                                />
                                {currentMousePos && (
                                    <Line
                                        points={[
                                            drawingPoints[
                                                drawingPoints.length - 2
                                            ],
                                            drawingPoints[
                                                drawingPoints.length - 1
                                            ],
                                            currentMousePos.x,
                                            currentMousePos.y,
                                        ]}
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dash={[5, 5]}
                                        opacity={0.5}
                                        listening={false}
                                        perfectDrawEnabled={false}
                                    />
                                )}
                                {drawingPoints.length >= 4 && (
                                    <Circle
                                        x={drawingPoints[0]}
                                        y={drawingPoints[1]}
                                        radius={8}
                                        fill="rgba(16, 185, 129, 0.4)"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        listening={false}
                                    />
                                )}
                            </Group>
                        )}

                        {/* Row Drawing Preview (Ghost Seats) */}
                        {isDrawingRow &&
                            previewNodes.map((ghost) => (
                                <Circle
                                    key={ghost.id}
                                    x={ghost.x}
                                    y={ghost.y}
                                    radius={10}
                                    fill="#94a3b8"
                                    opacity={0.4}
                                    stroke="#94a3b8"
                                    strokeWidth={1}
                                    dash={[2, 2]}
                                    listening={false}
                                    perfectDrawEnabled={false}
                                />
                            ))}

                        {mode === 'edit' &&
                            selectedIds.length > 0 &&
                            !isResizing &&
                            selectedIds.some(id => {
                                const n = nodes.find(node => node.id === id);
                                return n && n.type !== 'section_container';
                            }) && (
                                <Transformer
                                    ref={transformerRef}
                                    anchorSize={10}
                                    borderStroke="#3b82f6"
                                    borderStrokeWidth={1.5}
                                    anchorFill="#ffffff"
                                    anchorStroke="#3b82f6"
                                    anchorStrokeWidth={2}
                                    anchorCornerRadius={5}
                                    resizeEnabled={false}
                                    rotateEnabled={true}
                                    rotationSnaps={[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345]}
                                    onTransform={() => {
                                        if (transformerRef.current) {
                                            const tr = transformerRef.current;
                                            const box = tr.getClientRect();
                                            const cx = box.x + box.width / 2;
                                            const cy = box.y + box.height / 2;
                                            const firstNode = tr.nodes()[0];
                                            const rawAngle = firstNode ? Math.round(firstNode.rotation()) : 0;
                                            const angle = ((rawAngle % 360) + 360) % 360;
                                            setRotationGuide({ x: cx, y: cy, angle });
                                        }
                                    }}
                                    onTransformEnd={() => {
                                        setRotationGuide(null);
                                        if (transformerRef.current) {
                                            const activeKonvaNodes = transformerRef.current.nodes();
                                            if (activeKonvaNodes.length > 0) {
                                                const updatedNodes = nodesRef.current.map((n) => {
                                                    const kn = activeKonvaNodes.find(k => k.id() === n.id);
                                                    if (kn) {
                                                        return {
                                                            ...n,
                                                            x: kn.x(),
                                                            y: kn.y(),
                                                            rotation: kn.rotation(),
                                                            scaleX: kn.scaleX(),
                                                            scaleY: kn.scaleY(),
                                                        };
                                                    }
                                                    return n;
                                                });
                                                setNodes(updatedNodes);
                                                pushToHistory(updatedNodes);
                                                onChange({ ...layout, nodes: updatedNodes });
                                            }
                                        }
                                    }}
                                />
                            )}

                        {/* Polygon Edit Handles */}
                        {mode === 'edit' &&
                            editingPolygonId &&
                            (() => {
                                const node = nodes.find(
                                    (n) => n.id === editingPolygonId,
                                );
                                if (!node || !node.points) return null;

                                const points = node.points;
                                const handles = [];
                                for (let i = 0; i < points.length; i += 2) {
                                    handles.push(
                                        <Circle
                                            key={`${node.id}-handle-${i}`}
                                            x={node.x + points[i]}
                                            y={node.y + points[i + 1]}
                                            radius={6}
                                            fill="white"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            draggable
                                            onDragMove={(e) => {
                                                const nx =
                                                    e.target.x() - node.x;
                                                const ny =
                                                    e.target.y() - node.y;
                                                const stage =
                                                    e.target.getStage();
                                                if (stage) {
                                                    const shapeNode =
                                                        stage.findOne(
                                                            '.' +
                                                                node.id +
                                                                '-shape',
                                                        ) as Konva.Line;
                                                    if (shapeNode) {
                                                        const pts = [
                                                            ...shapeNode.points(),
                                                        ];
                                                        pts[i] = nx;
                                                        pts[i + 1] = ny;
                                                        shapeNode.points(pts);
                                                        shapeNode
                                                            .getLayer()
                                                            ?.batchDraw();
                                                    }
                                                }
                                            }}
                                            onDragEnd={(e) => {
                                                const nx =
                                                    e.target.x() - node.x;
                                                const ny =
                                                    e.target.y() - node.y;
                                                const updatedNodes =
                                                    nodesRef.current.map(
                                                        (n) => {
                                                            if (
                                                                n.id ===
                                                                    node.id &&
                                                                n.points
                                                            ) {
                                                                const newPoints =
                                                                    [
                                                                        ...n.points,
                                                                    ];
                                                                newPoints[i] =
                                                                    nx;
                                                                newPoints[
                                                                    i + 1
                                                                ] = ny;
                                                                return {
                                                                    ...n,
                                                                    points: newPoints,
                                                                };
                                                            }
                                                            return n;
                                                        },
                                                    );
                                                setNodes(updatedNodes);
                                                pushToHistory(updatedNodes);
                                                onChange({
                                                    ...layout,
                                                    nodes: updatedNodes,
                                                });
                                            }}
                                            onMouseEnter={(
                                                e: Konva.KonvaEventObject<MouseEvent>,
                                            ) => {
                                                const stage =
                                                    e.target.getStage();
                                                if (stage)
                                                    stage.container().style.cursor =
                                                        'crosshair';
                                                e.target.scale({
                                                    x: 1.5,
                                                    y: 1.5,
                                                });
                                            }}
                                            onMouseLeave={(
                                                e: Konva.KonvaEventObject<MouseEvent>,
                                            ) => {
                                                const stage =
                                                    e.target.getStage();
                                                if (stage)
                                                    stage.container().style.cursor =
                                                        'default';
                                                e.target.scale({ x: 1, y: 1 });
                                            }}
                                        />,
                                    );
                                }
                                return handles;
                            })()}

                        {/* Resize Handles (4 Centered Sides) */}
                        {mode === 'edit' &&
                            selectedIds.length > 0 &&
                            !selectionRect &&
                            (() => {
                                const selectedSeats = nodes.filter(
                                    (n) =>
                                        selectedIds.includes(n.id) &&
                                        n.type === 'seat',
                                );
                                if (selectedSeats.length < 1) return null;

                                const rowsMap: Record<
                                    string,
                                    {
                                        nodes: SeatingNode[];
                                        startNode: SeatingNode;
                                        lastNode: SeatingNode;
                                        rowLabel?: string;
                                    }
                                > = {};
                                const allX: number[] = [];
                                const allY: number[] = [];

                                selectedSeats.forEach((s) => {
                                    allX.push(s.x);
                                    allY.push(s.y);
                                    if (s.row_uuid && !rowsMap[s.row_uuid]) {
                                        const fullRow = nodes.filter(
                                            (n) =>
                                                n.row_uuid === s.row_uuid &&
                                                n.type === 'seat',
                                        );
                                        if (fullRow.length >= 1) {
                                            const sorted = [...fullRow].sort(
                                                 (a, b) => (a.number || 0) - (b.number || 0),
                                            );
                                            rowsMap[s.row_uuid] = {
                                                nodes: sorted,
                                                startNode: sorted[0],
                                                lastNode:
                                                    sorted[sorted.length - 1],
                                                rowLabel: sorted[0].row,
                                            };
                                        }
                                    }
                                });

                                const minX = Math.min(...allX);
                                const maxX = Math.max(...allX);
                                const minY = Math.min(...allY);
                                const maxY = Math.max(...allY);
                                const centerX = (minX + maxX) / 2;
                                const centerY = (minY + maxY) / 2;
                                const handleOffset = 30;

                                const rowUuids = Object.keys(rowsMap);
                                if (rowUuids.length === 0) return null;

                                 const createHandle = (
                                     type: string,
                                     x: number,
                                     y: number,
                                     angle: number,
                                 ) => {
                                     return (
                                         <Rect
                                             x={x - 6}
                                             y={y - 6}
                                             width={12}
                                             height={12}
                                             fill="#3b82f6"
                                             stroke="#fff"
                                             strokeWidth={2}
                                             cornerRadius={3}
                                             shadowBlur={4}
                                             shadowColor="rgba(0,0,0,0.2)"
                                             draggable
                                             dragBoundFunc={(pos) => {
                                                 return { x, y };
                                             }}
                                             onDragStart={(e) => {
                                                 e.cancelBubble = true;
                                                 setIsResizing(true);
                                                 setResizingData({
                                                     rowsMap,
                                                     type,
                                                     startX: x,
                                                     startY: y,
                                                     minX,
                                                     maxX,
                                                     minY,
                                                     maxY,
                                                 });
                                             }}
                                             onDragMove={(e) => {
                                                 const stage = e.target.getStage();
                                                 if (!stage) return;
                                                 const pos = getRelativePointerPosition(stage);
                                                 const spacing = layout?.config?.defaultSpacing || 35;
                                                 const ghosts: any[] = [];
                                                 const rowsToExpand = Object.values(rowsMap);
                                                 let rowSpacing = layout?.config?.rowSpacing || 40;
                                                 if (rowsToExpand.length > 1) {
                                                     let totalDist = 0;
                                                     for (let i = 1; i < rowsToExpand.length; i++) {
                                                         const dx = rowsToExpand[i].startNode.x - rowsToExpand[i-1].startNode.x;
                                                         const dy = rowsToExpand[i].startNode.y - rowsToExpand[i-1].startNode.y;
                                                         totalDist += Math.sqrt(dx*dx + dy*dy);
                                                     }
                                                     rowSpacing = totalDist / (rowsToExpand.length - 1);
                                                 }

                                                 if (type === 'R' || type === 'L') {
                                                     rowsToExpand.forEach((row) => {
                                                         const rowNodes = row.nodes;
                                                         const anchorNode = rowNodes[0];
                                                         const lastNode = rowNodes[rowNodes.length - 1];
                                                         const currentCount = rowNodes.length;

                                                         let rowAngle = 0;
                                                         if (currentCount > 1) {
                                                             const mid = (currentCount - 1) / 2;
                                                             const configSpacing = anchorNode.spacing || spacing;
                                                             const currentCurve = anchorNode.curvature || 0;
                                                             const lastIdx = (lastNode.number || currentCount) - 1;
                                                             const cOffset = lastIdx - mid;
                                                             const curveY = currentCurve * Math.pow(cOffset, 2) * (configSpacing / 10);
                                                             const dxRaw = lastNode.x - anchorNode.x;
                                                             const dyRaw = lastNode.y - anchorNode.y;
                                                             const distRaw = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);
                                                             if (distRaw > 0) {
                                                                 const localLx = lastIdx * configSpacing;
                                                                 rowAngle = Math.atan2(dyRaw, dxRaw);
                                                             } else {
                                                                 rowAngle = Math.atan2(dyRaw, dxRaw);
                                                             }
                                                         }

                                                         const refPoint = type === 'R' ? lastNode : anchorNode;
                                                         const projDist = (pos.x - refPoint.x) * Math.cos(rowAngle) + (pos.y - refPoint.y) * Math.sin(rowAngle);
                                                         
                                                         const signedDelta = type === 'R' ? projDist : -projDist;
                                                         const deltaSeats = Math.round(signedDelta / (anchorNode.spacing || spacing));
                                                         const newTotal = Math.max(1, currentCount + deltaSeats);

                                                         const effectiveCurve = anchorNode.curvature || 0;
                                                         const configSpacing = anchorNode.spacing || spacing;
                                                         const midIndex = (newTotal - 1) / 2;
                                                         
                                                         const shiftSeats = type === 'L' ? (newTotal - currentCount) : 0;

                                                         for (let i = 0; i < newTotal; i++) {
                                                             const cOffset = i - midIndex;
                                                             const lx = i * configSpacing;
                                                             const _mid = typeof midIndex !== 'undefined' ? midIndex : 0;
                                                             
                                                             const rawCurveY = effectiveCurve * Math.pow(cOffset, 2) * (configSpacing / 10);
                                                             const curveY = rawCurveY;
                                                             const rx = lx * Math.cos(rowAngle) - curveY * Math.sin(rowAngle);
                                                             const ry = lx * Math.sin(rowAngle) + curveY * Math.cos(rowAngle);
                                                             
                                                             let baseX = anchorNode.x;
                                                             let baseY = anchorNode.y;
                                                             if (shiftSeats !== 0) {
                                                                 baseX -= shiftSeats * configSpacing * Math.cos(rowAngle);
                                                                 baseY -= shiftSeats * configSpacing * Math.sin(rowAngle);
                                                             }
                                                             
                                                             ghosts.push({
                                                                 id: `ghost-${anchorNode.row_uuid}-${i}`,
                                                                 x: baseX + rx,
                                                                 y: baseY + ry,
                                                             });
                                                         }
                                                     });
                                                 } else {
                                                     // Sort rows along the row's normal perpendicular vector
                                                     const refRow = rowsToExpand[0];
                                                     let rowAngle = 0;
                                                     if (refRow.nodes.length > 1) {
                                                         const anchorNode = refRow.nodes[0];
                                                         const lastNode = refRow.nodes[refRow.nodes.length - 1];
                                                         const currentCount = refRow.nodes.length;
                                                         const mid = (currentCount - 1) / 2;
                                                         const configSpacing = anchorNode.spacing || spacing;
                                                         const currentCurve = anchorNode.curvature || 0;
                                                         const lastIdx = (lastNode.number || currentCount) - 1;
                                                         const cOffset = lastIdx - mid;
                                                         const curveY = currentCurve * Math.pow(cOffset, 2) * (configSpacing / 10);
                                                         const dxRaw = lastNode.x - anchorNode.x;
                                                         const dyRaw = lastNode.y - anchorNode.y;
                                                         const distRaw = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);
                                                         if (distRaw > 0) {
                                                             const localLx = lastIdx * configSpacing;
                                                             rowAngle = Math.atan2(dyRaw, dxRaw);
                                                         } else {
                                                             rowAngle = Math.atan2(dyRaw, dxRaw);
                                                         }
                                                     }

                                                     // Normal vector for row spacing (+90deg for B, -90deg for T)
                                                     const normalAngle = type === 'B' ? rowAngle + Math.PI / 2 : rowAngle - Math.PI / 2;
                                                     const sortedRows = [...rowsToExpand].sort((a, b) => {
                                                         const projA = a.startNode.x * Math.cos(normalAngle) + a.startNode.y * Math.sin(normalAngle);
                                                         const projB = b.startNode.x * Math.cos(normalAngle) + b.startNode.y * Math.sin(normalAngle);
                                                         return projB - projA;
                                                     });
                                                     const edgeRow = sortedRows[0];

                                                     const midX = (edgeRow.startNode.x + edgeRow.lastNode.x) / 2;
                                                     const midY = (edgeRow.startNode.y + edgeRow.lastNode.y) / 2;
                                                     const projDistPerp = (pos.x - midX) * Math.cos(normalAngle) + (pos.y - midY) * Math.sin(normalAngle);
                                                     const signedRowsCount = Math.floor((projDistPerp - handleOffset / 2) / rowSpacing);
                                                     const extraRowsCount = Math.max(-rowsToExpand.length + 1, signedRowsCount);

                                                     let rowsToKeep = [...sortedRows];
                                                     if (extraRowsCount < 0) {
                                                         rowsToKeep = rowsToKeep.slice(-extraRowsCount);
                                                     }

                                                     rowsToKeep.forEach((row) => {
                                                         row.nodes.forEach((n, i) => {
                                                             ghosts.push({
                                                                 id: `ghost-orig-${row.startNode.row_uuid}-${i}`,
                                                                 x: n.x,
                                                                 y: n.y,
                                                             });
                                                         });
                                                     });

                                                     if (extraRowsCount > 0) {
                                                         for (let r = 1; r <= extraRowsCount; r++) {
                                                             const shiftX = Math.cos(normalAngle) * r * rowSpacing;
                                                             const shiftY = Math.sin(normalAngle) * r * rowSpacing;
                                                             edgeRow.nodes.forEach((n, i) => {
                                                                 ghosts.push({
                                                                     id: `ghost-newrow-${r}-${i}`,
                                                                     x: n.x + shiftX,
                                                                     y: n.y + shiftY,
                                                                 });
                                                             });
                                                         }
                                                     }
                                                 }

                                                 setPreviewNodes(ghosts);
                                                 setIsDrawingRow(true);
                                             }}
                                             onDragEnd={(e) => {
                                                 const stage = e.target.getStage();
                                                 if (!stage) return;
                                                 const pos = getRelativePointerPosition(stage);
                                                 const spacing = layout?.config?.defaultSpacing || 35;
                                                 let updatedNodes = [...nodes];
                                                 const rowUuidsToReplace = Object.keys(rowsMap);
                                                 const rowsToExpand = Object.values(rowsMap);
                                                 let rowSpacing = layout?.config?.rowSpacing || 40;
                                                 if (rowsToExpand.length > 1) {
                                                     let totalDist = 0;
                                                     for (let i = 1; i < rowsToExpand.length; i++) {
                                                         const dx = rowsToExpand[i].startNode.x - rowsToExpand[i-1].startNode.x;
                                                         const dy = rowsToExpand[i].startNode.y - rowsToExpand[i-1].startNode.y;
                                                         totalDist += Math.sqrt(dx*dx + dy*dy);
                                                     }
                                                     rowSpacing = totalDist / (rowsToExpand.length - 1);
                                                 }
                                                 const newSelectionIds: string[] = [];

                                                 if (type === 'R' || type === 'L') {
                                                     rowsToExpand.forEach((row) => {
                                                         const rowNodes = row.nodes;
                                                         const anchorNode = rowNodes[0];
                                                         const lastNode = rowNodes[rowNodes.length - 1];
                                                         const currentCount = rowNodes.length;

                                                         let rowAngle = 0;
                                                         if (currentCount > 1) {
                                                             const mid = (currentCount - 1) / 2;
                                                             const configSpacing = anchorNode.spacing || spacing;
                                                             const currentCurve = anchorNode.curvature || 0;
                                                             const lastIdx = (lastNode.number || currentCount) - 1;
                                                             const cOffset = lastIdx - mid;
                                                             const curveY = currentCurve * Math.pow(cOffset, 2) * (configSpacing / 10);
                                                             const dxRaw = lastNode.x - anchorNode.x;
                                                             const dyRaw = lastNode.y - anchorNode.y;
                                                             const distRaw = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);
                                                             if (distRaw > 0) {
                                                                 const localLx = lastIdx * configSpacing;
                                                                 rowAngle = Math.atan2(dyRaw, dxRaw);
                                                             } else {
                                                                 rowAngle = Math.atan2(dyRaw, dxRaw);
                                                             }
                                                         }

                                                         const refPoint = type === 'R' ? lastNode : anchorNode;
                                                         const projDist = (pos.x - refPoint.x) * Math.cos(rowAngle) + (pos.y - refPoint.y) * Math.sin(rowAngle);
                                                         const signedDelta = type === 'R' ? projDist : -projDist;
                                                         const deltaSeats = Math.round(signedDelta / (anchorNode.spacing || spacing));
                                                         const newTotal = Math.max(1, currentCount + deltaSeats);
                                                         const effectiveCurve = anchorNode.curvature || 0;
                                                         const configSpacing = anchorNode.spacing || spacing;
                                                         const midIndex = (newTotal - 1) / 2;
                                                         const shiftSeats = type === 'L' ? (newTotal - currentCount) : 0;

                                                         let baseX = anchorNode.x;
                                                         let baseY = anchorNode.y;
                                                         if (shiftSeats !== 0) {
                                                             baseX -= shiftSeats * configSpacing * Math.cos(rowAngle);
                                                             baseY -= shiftSeats * configSpacing * Math.sin(rowAngle);
                                                         }

                                                         // Remove excess nodes if shrinking
                                                         if (newTotal < currentCount) {
                                                             let idsToRemove = [];
                                                             if (type === 'R') {
                                                                 idsToRemove = rowNodes.slice(newTotal).map(n => n.id);
                                                             } else {
                                                                 idsToRemove = rowNodes.slice(0, currentCount - newTotal).map(n => n.id);
                                                             }
                                                             updatedNodes = updatedNodes.filter(n => !idsToRemove.includes(n.id));
                                                         }

                                                         let remainingRowNodes = updatedNodes.filter(n => n.row_uuid === anchorNode.row_uuid && n.type === 'seat');
                                                         remainingRowNodes.sort((a, b) => (a.number || 0) - (b.number || 0));

                                                         for (let i = 0; i < newTotal; i++) {
                                                             const cOffset = i - midIndex;
                                                             const lx = i * configSpacing;
                                                             const _mid = typeof midIndex !== 'undefined' ? midIndex : 0;
                                                             
                                                             const rawCurveY = effectiveCurve * Math.pow(cOffset, 2) * (configSpacing / 10);
                                                             const curveY = rawCurveY;
                                                             const rx = lx * Math.cos(rowAngle) - curveY * Math.sin(rowAngle);
                                                             const ry = lx * Math.sin(rowAngle) + curveY * Math.cos(rowAngle);
                                                             
                                                             const newX = baseX + rx;
                                                             const newY = baseY + ry;
                                                             
                                                             let existingNode = remainingRowNodes.length > 0 ? remainingRowNodes.shift() : null;
                                                             
                                                             if (existingNode) {
                                                                 const nodeIndex = updatedNodes.findIndex(n => n.id === existingNode.id);
                                                                 if (nodeIndex > -1) {
                                                                     updatedNodes[nodeIndex] = { ...updatedNodes[nodeIndex], x: newX, y: newY, number: i + 1 };
                                                                     newSelectionIds.push(updatedNodes[nodeIndex].id);
                                                                 }
                                                             } else {
                                                                 const newId = 'seat-' + uuidv4();
                                                                 updatedNodes.push({
                                                                     ...anchorNode,
                                                                     id: newId,
                                                                     x: newX,
                                                                     y: newY,
                                                                     number: i + 1,
                                                                     permanent_uuid: uuidv4(),
                                                                 });
                                                                 newSelectionIds.push(newId);
                                                             }
                                                         }
                                                     });
                                                 } else {
                                                     const refRow = rowsToExpand[0];
                                                     let rowAngle = 0;
                                                     if (refRow.nodes.length > 1) {
                                                         const anchorNode = refRow.nodes[0];
                                                         const lastNode = refRow.nodes[refRow.nodes.length - 1];
                                                         const currentCount = refRow.nodes.length;
                                                         const mid = (currentCount - 1) / 2;
                                                         const configSpacing = anchorNode.spacing || spacing;
                                                         const currentCurve = anchorNode.curvature || 0;
                                                         const lastIdx = (lastNode.number || currentCount) - 1;
                                                         const cOffset = lastIdx - mid;
                                                         const curveY = currentCurve * Math.pow(cOffset, 2) * (configSpacing / 10);
                                                         const dxRaw = lastNode.x - anchorNode.x;
                                                         const dyRaw = lastNode.y - anchorNode.y;
                                                         const distRaw = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);
                                                         if (distRaw > 0) {
                                                             const localLx = lastIdx * configSpacing;
                                                             rowAngle = Math.atan2(dyRaw, dxRaw);
                                                         } else {
                                                             rowAngle = Math.atan2(dyRaw, dxRaw);
                                                         }
                                                     }

                                                     const normalAngle = type === 'B' ? rowAngle + Math.PI / 2 : rowAngle - Math.PI / 2;
                                                     const sortedRows = [...rowsToExpand].sort((a, b) => {
                                                         const projA = a.startNode.x * Math.cos(normalAngle) + a.startNode.y * Math.sin(normalAngle);
                                                         const projB = b.startNode.x * Math.cos(normalAngle) + b.startNode.y * Math.sin(normalAngle);
                                                         return projB - projA;
                                                     });
                                                     const edgeRow = sortedRows[0];

                                                     const midX = (edgeRow.startNode.x + edgeRow.lastNode.x) / 2;
                                                     const midY = (edgeRow.startNode.y + edgeRow.lastNode.y) / 2;
                                                     const projDistPerp = (pos.x - midX) * Math.cos(normalAngle) + (pos.y - midY) * Math.sin(normalAngle);
                                                     const extraRowsCount = Math.max(-rowsToExpand.length + 1, Math.floor((projDistPerp - handleOffset / 2) / rowSpacing));

                                                     if (extraRowsCount < 0) {
                                                         const rowsToRemove = sortedRows.slice(0, -extraRowsCount);
                                                         const uuidsToRemove = rowsToRemove.map(r => r.startNode.row_uuid);
                                                         updatedNodes = updatedNodes.filter(n => !uuidsToRemove.includes(n.row_uuid));
                                                         
                                                         const keptUuids = sortedRows.slice(-extraRowsCount).map(r => r.startNode.row_uuid);
                                                         keptUuids.forEach(uuid => {
                                                             const rowNodes = updatedNodes.filter(n => n.row_uuid === uuid);
                                                             rowNodes.forEach(n => newSelectionIds.push(n.id));
                                                         });
                                                     } else if (extraRowsCount > 0) {
                                                         for (let r = 1; r <= extraRowsCount; r++) {
                                                             const newRowUuid = uuidv4();
                                                             const nextLabel = getNextRowLabel(updatedNodes, edgeRow.startNode.section);
                                                             const shiftX = Math.cos(normalAngle) * r * rowSpacing;
                                                             const shiftY = Math.sin(normalAngle) * r * rowSpacing;
                                                             edgeRow.nodes.forEach((n, i) => {
                                                                 const newId = 'seat-' + uuidv4();
                                                                 updatedNodes.push({
                                                                     ...n,
                                                                     id: newId,
                                                                     row: nextLabel,
                                                                     row_uuid: newRowUuid,
                                                                     x: n.x + shiftX,
                                                                     y: n.y + shiftY,
                                                                     permanent_uuid: uuidv4(),
                                                                 });
                                                                 newSelectionIds.push(newId);
                                                             });
                                                         }
                                                         selectedIds.forEach((id) => newSelectionIds.push(id));
                                                     } else {
                                                         selectedIds.forEach((id) => newSelectionIds.push(id));
                                                     }
                                                 }

                                                 setNodes(updatedNodes);
                                                 pushToHistory(updatedNodes);
                                                 onChange({
                                                     ...layout,
                                                     nodes: updatedNodes,
                                                 });
                                                 setIsResizing(false);
                                                 setIsDrawingRow(false);
                                                 setPreviewNodes([]);
                                                 setSelectedIds(newSelectionIds);
                                             }}
                                         />
                                     );
                                 };
                                 const rowsToExpandList = Object.values(rowsMap);
                                 const isSingleRow = rowsToExpandList.length === 1;
                                 let handlePosR = { x: maxX + handleOffset, y: centerY };
                                 let handlePosL = { x: minX - handleOffset, y: centerY };
                                 let handlePosT = { x: centerX, y: minY - handleOffset };
                                 let handlePosB = { x: centerX, y: maxY + handleOffset };

                                 if (rowsToExpandList.length > 0) {
                                     // Use physical seats for block/row alignment to avoid floating handles
                                     const firstRow = rowsToExpandList[0];
                                     const lastRow = rowsToExpandList[rowsToExpandList.length - 1];
                                     
                                     // Calculate angle using the first row
                                     const anchorNode = firstRow.startNode;
                                     const lastNode = firstRow.lastNode;
                                     let rowAngle = 0;
                                     if (firstRow.nodes.length > 1) {
                                         const dxRaw = lastNode.x - anchorNode.x;
                                         const dyRaw = lastNode.y - anchorNode.y;
                                         rowAngle = Math.atan2(dyRaw, dxRaw);
                                     }
                                     
                                     // Physical centers
                                     const topMidX = (firstRow.startNode.x + firstRow.lastNode.x) / 2;
                                     const topMidY = (firstRow.startNode.y + firstRow.lastNode.y) / 2;
                                     const bottomMidX = (lastRow.startNode.x + lastRow.lastNode.x) / 2;
                                     const bottomMidY = (lastRow.startNode.y + lastRow.lastNode.y) / 2;
                                     
                                     // Collect all start nodes for L and last nodes for R
                                     const startNodes = rowsToExpandList.map(r => r.startNode);
                                     const lastNodes = rowsToExpandList.map(r => r.lastNode);
                                     
                                     const leftMidX = startNodes.reduce((sum, n) => sum + n.x, 0) / startNodes.length;
                                     const leftMidY = startNodes.reduce((sum, n) => sum + n.y, 0) / startNodes.length;
                                     const rightMidX = lastNodes.reduce((sum, n) => sum + n.x, 0) / lastNodes.length;
                                     const rightMidY = lastNodes.reduce((sum, n) => sum + n.y, 0) / lastNodes.length;

                                     const rowSp = layout?.config?.rowSpacing || 40;

                                     handlePosT = {
                                         x: topMidX + Math.sin(rowAngle) * rowSp,
                                         y: topMidY - Math.cos(rowAngle) * rowSp,
                                     };
                                     handlePosB = {
                                         x: bottomMidX - Math.sin(rowAngle) * rowSp,
                                         y: bottomMidY + Math.cos(rowAngle) * rowSp,
                                     };
                                     handlePosL = {
                                         x: leftMidX - Math.cos(rowAngle) * handleOffset,
                                         y: leftMidY - Math.sin(rowAngle) * handleOffset,
                                     };
                                     handlePosR = {
                                         x: rightMidX + Math.cos(rowAngle) * handleOffset,
                                         y: rightMidY + Math.sin(rowAngle) * handleOffset,
                                     };
                                 }

                                 if (false) { // Disable old isSingleRow block since we generalized it
                                     const row = rowsToExpandList[0];
                                     const anchorNode = row.startNode;
                                     const lastNode = row.lastNode;
                                     const rowNodes = row.nodes;
                                     const currentCount = rowNodes.length;
                                     const defaultSp = layout?.config?.defaultSpacing || 35;
                                     const rowSp = layout?.config?.rowSpacing || 40;
                                     const cfgSpacing = anchorNode.spacing || defaultSp;

                                     let rowAngle = 0;
                                     if (currentCount > 1) {
                                         const mid = (currentCount - 1) / 2;
                                         const currentCurve = anchorNode.curvature || 0;
                                         const lastIdx = (lastNode.number || currentCount) - 1;
                                         const cOffset = lastIdx - mid;
                                                             
                                                             const rawCurveY = currentCurve * Math.pow(cOffset, 2) * (cfgSpacing / 10);
                                                             const curveY = rawCurveY;
                                         const dxRaw = lastNode.x - anchorNode.x;
                                         const dyRaw = lastNode.y - anchorNode.y;
                                         const distRaw = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);
                                         if (distRaw > 0) {
                                             const localLx = lastIdx * cfgSpacing;
                                             rowAngle = Math.atan2(dyRaw, dxRaw);
                                         } else {
                                             rowAngle = Math.atan2(dyRaw, dxRaw);
                                         }
                                     }

                                     const midX = (anchorNode.x + lastNode.x) / 2;
                                     const midY = (anchorNode.y + lastNode.y) / 2;

                                     // Handle R: 30px past lastNode along rowAngle
                                     handlePosR = {
                                         x: lastNode.x + Math.cos(rowAngle) * handleOffset,
                                         y: lastNode.y + Math.sin(rowAngle) * handleOffset,
                                     };
                                     // Handle L: 30px before anchorNode along -rowAngle
                                     handlePosL = {
                                         x: anchorNode.x - Math.cos(rowAngle) * handleOffset,
                                         y: anchorNode.y - Math.sin(rowAngle) * handleOffset,
                                     };
                                     // Handle T: 30px perpendicular to row (-90 deg relative to row)
                                     handlePosT = {
                                         x: midX + Math.sin(rowAngle) * rowSp,
                                         y: midY - Math.cos(rowAngle) * rowSp,
                                     };
                                     // Handle B: 30px perpendicular to row (+90 deg relative to row)
                                     handlePosB = {
                                         x: midX - Math.sin(rowAngle) * rowSp,
                                         y: midY + Math.cos(rowAngle) * rowSp,
                                     };
                                 }

                                 const ox = blockDragOffset ? blockDragOffset.x : 0;
                                 const oy = blockDragOffset ? blockDragOffset.y : 0;
                                 
                                 return (
                                     <React.Fragment>
                                         {/* Right Handle */}
                                         {createHandle('R', handlePosR.x + ox, handlePosR.y + oy, 0)}
                                         {/* Left Handle */}
                                         {createHandle('L', handlePosL.x + ox, handlePosL.y + oy, Math.PI)}
                                         {/* Bottom Handle */}
                                         {createHandle('B', handlePosB.x + ox, handlePosB.y + oy, Math.PI / 2)}
                                         {/* Top Handle */}
                                         {createHandle('T', handlePosT.x + ox, handlePosT.y + oy, -Math.PI / 2)}
                                     </React.Fragment>
                                 );
                            })()}
                    </Layer>
                </Stage>
            </div>
        );
    },
);

SeatingCanvas.displayName = 'SeatingCanvas';

export default SeatingCanvas;

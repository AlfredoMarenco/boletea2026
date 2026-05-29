import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Group, Text, Transformer, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';
import { generateRow, generateGrid, getRowLabel, getNextRowLabel } from './RowGenerator';

// Helper to get coordinates relative to the zoom/pan of the stage
const getRelativePointerPosition = (stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    return transform.point(pos);
};

const isPointInRect = (px, py, rx, ry, rw, rh) => {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};

const SeatingCanvas = React.forwardRef(({ layout, onChange, mode = 'edit', onSelectionChange, tool = 'select', snapToGrid = true }, ref) => {
    const stageRef = useRef();
    const [nodes, setNodes] = useState(layout?.nodes || []);
    const [selectedIds, setSelectedIds] = useState([]);
    const [drawingPoints, setDrawingPoints] = useState([]); // For polygon drawing

    // Row Drawing State
    const [isDrawingRow, setIsDrawingRow] = useState(false);
    const [rowStartPos, setRowStartPos] = useState(null);
    const [previewNodes, setPreviewNodes] = useState([]);
    const [guides, setGuides] = useState([]);
    const [isResizing, setIsResizing] = useState(false);
    const [resizingData, setResizingData] = useState(null);
    // Alignment guides: { orientation: 'V'|'H', pos: number }

    // Refs for Konva interaction (prevents stale closures)
    const nodesRef = useRef(nodes);
    const selectedIdsRef = useRef([]);
    const mouseDownAlreadySelected = useRef(false);

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        selectedIdsRef.current = selectedIds;
    }, [selectedIds]);

    // Global drag start positions map: { id: { x, y } }
    const dragStartRef = useRef({});
    // History (Undo/Redo)
    const [history, setHistory] = useState([layout?.nodes || []]);
    const [historyStep, setHistoryStep] = useState(0);

    // Viewport (Zoom & Pan)
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);

    const [cart, setCart] = useState([]); // Selected seats for purchase
    const [hoveredId, setHoveredId] = useState(null);
    const [selectionRect, setSelectionRect] = useState(null); // { x1, y1, x2, y2 }
    const [stageSize, setStageSize] = useState({
        width: layout?.config?.width || 8000,
        height: layout?.config?.height || 8000,
    });

    const [bgImage] = useImage(layout?.config?.bgImageUrl || layout?.config?.bgImage);
    const transformerRef = useRef();

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
            const newSection = {
                id: 'section-' + uuidv4(),
                type: 'section_container',
                x: x,
                y: y,
                width: 400,
                height: 300,
                name: 'Nueva Sección',
                fill: 'rgba(59, 130, 246, 0.1)',
                stroke: '#3b82f6',
                strokeWidth: 2
            };
            const updatedNodes = [...nodes, newSection];
            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        },
        redistributeSelected: (params) => {
            if (selectedIds.length === 0) return;
            const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));

            // 1. Sort based on direction
            const flow = params.direction || 'LR';
            let sorted = [...selectedNodes].sort((a, b) => {
                return flow === 'LR' ? a.x - b.x : b.x - a.x;
            });

            // 2. Calculate anchor (center of selection)
            const sumX = sorted.reduce((acc, n) => acc + n.x, 0);
            const sumY = sorted.reduce((acc, n) => acc + n.y, 0);
            const anchor = { x: sumX / sorted.length, y: sumY / sorted.length };
            const midIndex = (sorted.length - 1) / 2;

            const spacing = params.spacing || layout?.config?.defaultSpacing || 35;
            const curvature = params.curvature || 0;
            const startNum = params.startNumber || 1;

            const updatedNodes = nodes.map(node => {
                const idx = sorted.findIndex(n => n.id === node.id);
                if (idx === -1) return node;

                const distFromMid = idx - midIndex;
                const newX = anchor.x + distFromMid * spacing;
                const newY = anchor.y + curvature * Math.pow(distFromMid, 2);

                return {
                    ...node,
                    x: newX,
                    y: newY,
                    number: startNum + idx,
                    row: params.row || node.row
                };
            });

            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        },
        deleteSelected: () => {
            if (selectedIds.length > 0) {
                const updatedNodes = nodes.filter(n => !selectedIds.includes(n.id));
                setNodes(updatedNodes);
                setSelectedIds([]);
                if (onSelectionChange) onSelectionChange([]);
                pushToHistory(updatedNodes);
                onChange({ ...layout, nodes: updatedNodes });
            }
        },
        align: (direction) => {
            if (selectedIds.length < 2) return;
            const selectedNodes = nodes.filter(n => selectedIds.includes(n.id));
            let updatedNodes = [...nodes];

            if (direction === 'left') {
                const minX = Math.min(...selectedNodes.map(n => n.x));
                updatedNodes = nodes.map(n => selectedIds.includes(n.id) ? { ...n, x: minX } : n);
            } else if (direction === 'right') {
                const maxX = Math.max(...selectedNodes.map(n => n.x));
                updatedNodes = nodes.map(n => selectedIds.includes(n.id) ? { ...n, x: maxX } : n);
            } else if (direction === 'top') {
                const minY = Math.min(...selectedNodes.map(n => n.y));
                updatedNodes = nodes.map(n => selectedIds.includes(n.id) ? { ...n, y: minY } : n);
            } else if (direction === 'bottom') {
                const maxY = Math.max(...selectedNodes.map(n => n.y));
                updatedNodes = nodes.map(n => selectedIds.includes(n.id) ? { ...n, y: maxY } : n);
            }

            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        },
        updateRowStructure: (rowUuid, newProps) => {
            const currentNodes = nodesRef.current;
            const rowNodes = currentNodes.filter(n => n.row_uuid === rowUuid);
            if (rowNodes.length === 0) return;

            const anchor = rowNodes[0];
            const last = rowNodes[rowNodes.length - 1];
            const dx = last.x - anchor.x;
            const dy = last.y - anchor.y;
            const angle = Math.atan2(dy, dx);

            const config = {
                count: newProps.numSeats || rowNodes.length,
                startX: anchor.x,
                startY: anchor.y,
                spacing: newProps.seatSpacing || anchor.spacing || 35,
                curvature: newProps.curve !== undefined ? newProps.curve : (anchor.curvature || 0),
                section: newProps.section || anchor.section,
                rowLabel: newProps.row || anchor.row,
                rowLabelEnabled: newProps.rowLabelEnabled !== undefined ? newProps.rowLabelEnabled : (anchor.row_label_enabled ?? true),
                rowLabelPosition: newProps.rowLabelPosition || anchor.row_label_position || 'both',
                rowLabelOverride: newProps.rowLabelOverride !== undefined ? newProps.rowLabelOverride : (anchor.row_label_override || ''),
                rowLabelDisplayType: newProps.rowLabelDisplayType || anchor.row_label_display_type || 'Row',
                seatLabelType: newProps.seatLabelType || '123',
                seatStartNumber: newProps.seatLabelStart || 1,
                seatLabelDirection: newProps.seatLabelDirection || anchor.seat_label_direction || 'LR',
                radius: newProps.radius || anchor.radius,
                color: newProps.fill || anchor.fill,
                rowUuid: rowUuid,
                blockUuid: anchor.block_uuid
            };

            const updatedNodes = [
                ...currentNodes.filter(n => n.row_uuid !== rowUuid),
                ...generateRow(config).map(seat => {
                    const i = seat.number - config.seatStartNumber;
                    const lx = i * config.spacing;
                    const mid = (config.count - 1) / 2;
                    const cOffset = i - mid;
                    const curveY = config.curvature * Math.pow(cOffset, 2) * (config.spacing / 10);

                    const rx = lx * Math.cos(angle) - curveY * Math.sin(angle);
                    const ry = lx * Math.sin(angle) + curveY * Math.cos(angle);

                    return {
                        ...seat,
                        x: anchor.x + rx,
                        y: anchor.y + ry,
                        curvature: config.curvature,
                        seat_label_direction: config.seatLabelDirection,
                        row_label_enabled: config.rowLabelEnabled,
                        row_label_position: config.rowLabelPosition,
                        row_label_override: config.rowLabelOverride,
                        row_label_display_type: config.rowLabelDisplayType
                    };
                })
            ];

            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        },
        updateBlockStructure: (blockUuid, newProps) => {
            const initialNodes = nodesRef.current;
            // Find all rows in block
            const blockNodes = initialNodes.filter(n => n.block_uuid === blockUuid);
            const rowUuids = Array.from(new Set(blockNodes.map(n => n.row_uuid).filter(Boolean)));

            // Sort rows by Y coordinate to apply sequence
            const rows = rowUuids.map(uuid => {
                const rowSeats = blockNodes.filter(n => n.row_uuid === uuid);
                return { uuid, y: Math.min(...rowSeats.map(s => s.y)), nodes: rowSeats };
            }).sort((a, b) => a.y - b.y);

            let currentNodes = [...initialNodes];

            rows.forEach((row, index) => {
                const rowProps = { ...newProps };
                // Sequence the row label
                rowProps.row = getRowLabel(
                    index,
                    newProps.rowLabelType || 'ABC',
                    newProps.rowLabelStart || 'A',
                    (newProps.rowLabelSkip || '').split(',').map(s => s.trim()).filter(Boolean)
                );

                // We need to simulate updateRowStructure logic but on the evolving currentNodes
                const rowNodes = currentNodes.filter(n => n.row_uuid === row.uuid);
                const anchor = rowNodes[0];
                const last = rowNodes[rowNodes.length - 1];
                const dx = last.x - anchor.x;
                const dy = last.y - anchor.y;
                const angle = Math.atan2(dy, dx);

                const config = {
                    count: rowProps.numSeats || rowNodes.length,
                    startX: anchor.x,
                    startY: anchor.y,
                    spacing: rowProps.seatSpacing || anchor.spacing || 35,
                    curvature: rowProps.curve !== undefined ? rowProps.curve : (anchor.curvature || 0),
                    section: rowProps.section || anchor.section,
                    rowLabel: rowProps.row,
                    rowLabelEnabled: newProps.rowLabelEnabled !== undefined ? newProps.rowLabelEnabled : (anchor.row_label_enabled ?? true),
                    rowLabelPosition: newProps.rowLabelPosition || anchor.row_label_position || 'both',
                    rowLabelOverride: newProps.rowLabelOverride !== undefined ? newProps.rowLabelOverride : (anchor.row_label_override || ''),
                    rowLabelDisplayType: newProps.rowLabelDisplayType || anchor.row_label_display_type || 'Row',
                    seatLabelType: rowProps.seatLabelType || '123',
                    seatStartNumber: rowProps.seatLabelStart || 1,
                    seatLabelDirection: rowProps.seatLabelDirection || anchor.seat_label_direction || 'LR',
                    radius: rowProps.radius || anchor.radius,
                    color: rowProps.fill || anchor.fill,
                    rowUuid: row.uuid,
                    blockUuid: blockUuid
                };

                currentNodes = [
                    ...currentNodes.filter(n => n.row_uuid !== row.uuid),
                    ...generateRow(config).map(seat => {
                        const i = seat.number - config.seatStartNumber;
                        const lx = i * config.spacing;
                        const mid = (config.count - 1) / 2;
                        const cOffset = i - mid;
                        const curveY = config.curvature * Math.pow(cOffset, 2) * (config.spacing / 10);
                        const rx = lx * Math.cos(angle) - curveY * Math.sin(angle);
                        const ry = lx * Math.sin(angle) + curveY * Math.cos(angle);
                        return {
                            ...seat,
                            x: anchor.x + rx,
                            y: anchor.y + ry,
                            curvature: config.curvature,
                            seat_label_direction: config.seatLabelDirection,
                            row_label_enabled: config.rowLabelEnabled,
                            row_label_position: config.rowLabelPosition,
                            row_label_override: config.rowLabelOverride,
                            row_label_display_type: config.rowLabelDisplayType
                        };
                    })
                ];
            });

            setNodes(currentNodes);
            pushToHistory(currentNodes);
            onChange({ ...layout, nodes: currentNodes });
        }
    }));

    // Sync with props
    useEffect(() => {
        if (layout?.nodes && layout.nodes !== nodes) {
            setNodes(layout.nodes);
        }
    }, [layout, nodes]);

    // Sync Transformer
    useEffect(() => {
        if (mode === 'edit' && transformerRef.current) {
            const stage = transformerRef.current.getStage();
            const selectedNodes = selectedIds.map(id => stage.findOne('#' + id)).filter(Boolean);
            transformerRef.current.nodes(selectedNodes);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [selectedIds, mode]);

    // Handle Undo/Redo
    const pushToHistory = (newNodes) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newNodes);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const undo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            const prevNodes = history[prevStep];
            setNodes(prevNodes);
            onChange({ ...layout, nodes: prevNodes });
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            const nextNodes = history[nextStep];
            setNodes(nextNodes);
            onChange({ ...layout, nodes: nextNodes });
        }
    };

    // Zoom Logic
    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        setStageScale(newScale);
        setStagePos({
            x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
        });
    };

    const performSelection = (e, clickedId) => {
        let newSelection = [];
        const clickedNode = nodesRef.current.find(n => n.id === clickedId);

        if (e.evt?.shiftKey) {
            newSelection = selectedIdsRef.current.includes(clickedId)
                ? selectedIdsRef.current.filter(id => id !== clickedId)
                : [...selectedIdsRef.current, clickedId];
        } else {
            // Find the node in the current set
            const clickedNode = nodesRef.current.find(n => n.id === clickedId || n.permanent_uuid === clickedId);

            if (clickedNode && clickedNode.type === 'seat') {
                const blockUuid = clickedNode.block_uuid;
                const rowUuid = clickedNode.row_uuid;
                const currentIds = selectedIdsRef.current;

                const blockIds = blockUuid ? nodesRef.current.filter(n => n.block_uuid === blockUuid).map(n => n.id) : [];
                const rowIds = rowUuid ? nodesRef.current.filter(n => n.row_uuid === rowUuid).map(n => n.id) : [];

                const isWholeBlock = blockIds.length > 0 && blockIds.length === currentIds.length && blockIds.every(id => currentIds.includes(id));
                const isWholeRow = rowIds.length > 0 && rowIds.length === currentIds.length && rowIds.every(id => currentIds.includes(id));
                const isSingleSeat = currentIds.length === 1 && currentIds[0] === clickedId;

                if (blockUuid) {
                    // Sequence: Block -> Row -> Seat
                    if (isWholeBlock) newSelection = rowIds;
                    else if (isWholeRow) newSelection = [clickedId];
                    else if (isSingleSeat) newSelection = blockIds;
                    else newSelection = blockIds;
                } else if (rowUuid) {
                    // Sequence: Row -> Seat
                    if (isWholeRow) newSelection = [clickedId];
                    else if (isSingleSeat) newSelection = rowIds;
                    else newSelection = rowIds;
                } else {
                    newSelection = [clickedId];
                }
            } else {
                newSelection = [clickedId];
            }
        }


        setSelectedIds(newSelection);
        selectedIdsRef.current = newSelection;
        if (onSelectionChange) onSelectionChange(newSelection);
    };

    const handleMouseDown = (e) => {
        const stage = e.target.getStage();
        const relativePos = getRelativePointerPosition(stage);

        // Support Panning with Middle Mouse Button (Button 1) or any drag in Pan tool
        if (e.evt?.button === 1) {
            return; // Just let Konva's draggable handle it
        }

        if (mode === 'preview') {
            const clickedId = e.target.id() || e.target.getParent()?.id();
            if (!clickedId) return;
            setCart(prev => prev.includes(clickedId) ? prev.filter(id => id !== clickedId) : [...prev, clickedId]);
            return;
        }

        if (mode !== 'edit') return;


        if (tool === 'zone') {
            const newPoints = [...drawingPoints, relativePos.x, relativePos.y];
            setDrawingPoints(newPoints);
            return;
        }

        if (tool === 'seat') {
            const sections = nodes.filter(n => n.type === 'section_container');
            const parentSection = sections.find(s => isPointInRect(relativePos.x, relativePos.y, s.x, s.y, s.width, s.height));

            const newSeat = {
                id: 'seat-' + uuidv4(),
                type: 'seat',
                x: relativePos.x,
                y: relativePos.y,
                radius: layout?.config?.defaultRadius || 10,
                fill: parentSection?.fill || '#e2e8f0',
                section: parentSection?.name || 'General',
                row: '?',
                number: nodes.filter(n => n.type === 'seat' && n.section === (parentSection?.name || 'General')).length + 1,
                permanent_uuid: uuidv4()
            };
            const updatedNodes = [...nodes, newSeat];
            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
            return;
        }

        if (['row', 'rect_block', 'honeycomb_block'].includes(tool)) {
            setIsDrawingRow(true);
            setRowStartPos(relativePos);
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

        if (tool === 'section_container') {
            const stage = e.target.getStage();
            const pos = getRelativePointerPosition(stage);
            // We use the imperative method internally
            const updatedNodes = [...nodes, {
                id: 'section-' + uuidv4(),
                type: 'section_container',
                x: pos.x,
                y: pos.y,
                width: 400,
                height: 300,
                name: 'Nueva Sección',
                fill: 'rgba(59, 130, 246, 0.1)',
                stroke: '#3b82f6',
                strokeWidth: 2
            }];
            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
            return;
        }

        const isStage = e.target === stage || e.target.name() === 'grid' || e.target.name() === 'background';
        if (isStage) {
            setSelectedIds([]);
            setDrawingPoints([]);
            if (onSelectionChange) onSelectionChange([]);
            if (tool === 'pan') return;
            setSelectionRect({ x1: relativePos.x, y1: relativePos.y, x2: relativePos.x, y2: relativePos.y });
            return;
        }

        const clickedId = e.target.id() || e.target.getParent()?.id();

        if (!clickedId) {
            mouseDownAlreadySelected.current = false;
            return;
        }

        mouseDownAlreadySelected.current = selectedIdsRef.current.includes(clickedId);

        // If not already selected, select it now so drag works properly
        if (!mouseDownAlreadySelected.current) {
            performSelection(e, clickedId);
        }
    };

    const handleClick = (e) => {
        if (e.target.isDragging && e.target.isDragging()) return;

        const clickedId = e.target.id() || e.target.getParent()?.id();
        if (!clickedId) return;

        // Hierarchical selection: ONLY advance if the item was already selected BEFORE this click started
        if (mouseDownAlreadySelected.current && !e.evt?.shiftKey) {
            performSelection(e, clickedId);
        }
    };

    const handleDblClick = (e) => {
        if (tool === 'zone' && drawingPoints.length >= 6) {
            const newZone = {
                id: 'zone-' + uuidv4(),
                type: 'zone',
                points: [...drawingPoints],
                x: 0,
                y: 0,
                name: 'Nueva Zona'
            };
            const updatedNodes = [...nodes, newZone];
            setNodes(updatedNodes);
            setDrawingPoints([]);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });
        }
    };

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const relativePos = getRelativePointerPosition(stage);

        if (isDrawingRow && rowStartPos) {
            const dx = relativePos.x - rowStartPos.x;
            const dy = relativePos.y - rowStartPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const spacingX = layout?.config?.defaultSpacing || 35;
            const spacingY = spacingX;

            // OPTIMIZATION: Only calculate guides if we are drawing or nodes < 500
            const activeGuides = [];
            if (nodesRef.current.length < 1000 || isDrawingRow) {
                nodesRef.current.forEach((node, idx) => {
                    if (node.type !== 'seat' || idx % 2 !== 0) return; // Sample nodes
                    if (Math.abs(relativePos.x - node.x) < 5) activeGuides.push({ orientation: 'V', pos: node.x });
                    if (Math.abs(relativePos.y - node.y) < 5) activeGuides.push({ orientation: 'H', pos: node.y });
                });
            }
            setGuides(activeGuides.slice(0, 2));

            if (tool === 'row') {
                const count = Math.max(1, Math.floor(distance / spacingX) + 1);
                const angle = Math.atan2(dy, dx);

                // Angle Snapping (5 degrees)
                const snapDegree = 5;
                const snapRad = (snapDegree * Math.PI) / 180;
                const snappedAngle = Math.round(angle / snapRad) * snapRad;

                const ghosts = [];
                for (let i = 0; i < count; i++) {
                    ghosts.push({
                        id: 'ghost-' + i,
                        x: rowStartPos.x + Math.cos(snappedAngle) * i * spacingX,
                        y: rowStartPos.y + Math.sin(snappedAngle) * i * spacingX,
                    });
                }
                setPreviewNodes(ghosts);
            } else {
                // Blocks (Rect or Honeycomb)
                const cols = Math.max(1, Math.floor(Math.abs(dx) / spacingX) + 1);
                const rows = Math.max(1, Math.floor(Math.abs(dy) / spacingY) + 1);
                const dirX = dx >= 0 ? 1 : -1;
                const dirY = dy >= 0 ? 1 : -1;

                const ghosts = [];
                for (let r = 0; r < rows; r++) {
                    const offset = (tool === 'honeycomb_block' && r % 2 !== 0) ? spacingX / 2 : 0;
                    for (let c = 0; c < cols; c++) {
                        ghosts.push({
                            id: `ghost-${r}-${c}`,
                            x: rowStartPos.x + (c * spacingX + offset) * dirX,
                            y: rowStartPos.y + (r * spacingY) * dirY,
                            rowIndex: r
                        });
                    }
                }
                setPreviewNodes(ghosts);
            }
            return;
        }

        if (!selectionRect || mode !== 'edit') return;
        setSelectionRect({ ...selectionRect, x2: relativePos.x, y2: relativePos.y });
    };

    const handleMouseUp = (e) => {
        if (isDrawingRow && rowStartPos && previewNodes.length > 0) {
            const blockUuid = uuidv4();
            const rowMap = {}; // rowIndex -> uuid

            // Auto-detect section based on start position
            const sections = nodesRef.current.filter(n => n.type === 'section_container');
            const parentSection = sections.find(s => isPointInRect(rowStartPos.x, rowStartPos.y, s.x, s.y, s.width, s.height));
            const section = parentSection?.name || 'General';

            const rowIndices = Array.from(new Set(previewNodes.map(p => p.rowIndex ?? 0))).sort((a, b) => a - b);
            const rowLabels = {};
            const startLabel = getNextRowLabel(nodesRef.current, section);
            rowIndices.forEach((rIdx, i) => {
                rowLabels[rIdx] = getRowLabel(i, 'ABC', startLabel);
            });

            const newSeats = previewNodes.map((ghost, i) => {
                const rIdx = ghost.rowIndex ?? 0;
                if (!rowMap[rIdx]) rowMap[rIdx] = uuidv4();

                const seatsInThisRowSoFar = previewNodes.slice(0, i).filter(p => (p.rowIndex ?? 0) === rIdx).length;

                return {
                    id: 'seat-' + uuidv4(),
                    type: 'seat',
                    x: ghost.x,
                    y: ghost.y,
                    radius: layout?.config?.defaultRadius || 10,
                    fill: parentSection?.fill || '#94a3b8',
                    section: section,
                    row: rowLabels[rIdx],
                    row_uuid: rowMap[rIdx],
                    block_uuid: tool === 'row' ? null : blockUuid,
                    number: seatsInThisRowSoFar + 1,
                    permanent_uuid: uuidv4()
                };
            });
            const updatedNodes = [...nodes, ...newSeats];
            setNodes(updatedNodes);
            pushToHistory(updatedNodes);
            onChange({ ...layout, nodes: updatedNodes });

            setIsDrawingRow(false);
            setRowStartPos(null);
            setPreviewNodes([]);
            setGuides([]);
            return;
        }

        if (!selectionRect || mode !== 'edit') return;

        // Finalize selection based on rectangle bounds
        const xmin = Math.min(selectionRect.x1, selectionRect.x2);
        const xmax = Math.max(selectionRect.x1, selectionRect.x2);
        const ymin = Math.min(selectionRect.y1, selectionRect.y2);
        const ymax = Math.max(selectionRect.y1, selectionRect.y2);

        const newlySelected = nodesRef.current.filter(node =>
            node.x >= xmin && node.x <= xmax && node.y >= ymin && node.y <= ymax
        ).map(node => node.id);

        if (newlySelected.length > 0) {
            setSelectedIds(newlySelected);
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
            curvature: 2, // Slight curve
            section: 'VIP',
            rowLabel: nextLabel
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
            section: 'General'
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
            radius: layout?.config?.defaultRadius || 10,
            spacingY: 35,
            section: 'General Panal'
        });
        const updatedNodes = [...nodes, ...newSeats];
        setNodes(updatedNodes);
        pushToHistory(updatedNodes);
        onChange({ ...layout, nodes: updatedNodes });
    };

    const addRectZone = (x = 100, y = 100) => {
        const newZone = {
            id: 'zone-' + uuidv4(),
            type: 'rect_zone',
            x: x,
            y: y,
            width: 200,
            height: 150,
            fill: 'rgba(52, 211, 153, 0.2)',
            name: 'Nueva Sección Rect'
        };
        const updatedNodes = [...nodes, newZone];
        setNodes(updatedNodes);
        pushToHistory(updatedNodes);
        onChange({ ...layout, nodes: updatedNodes });
    };

    const addCircleZone = (x = 100, y = 100) => {
        const newZone = {
            id: 'zone-' + uuidv4(),
            type: 'circle_zone',
            x: x,
            y: y,
            radius: 80,
            fill: 'rgba(59, 130, 246, 0.2)',
            name: 'Nueva Sección Circ'
        };
        const updatedNodes = [...nodes, newZone];
        setNodes(updatedNodes);
        pushToHistory(updatedNodes);
        onChange({ ...layout, nodes: updatedNodes });
    };

    return (
        <div className="relative w-full h-full bg-slate-200 overflow-hidden rounded-lg shadow-inner border border-slate-300">
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                onMouseDown={handleMouseDown}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
                draggable={mode === 'edit'} // Handle logic in onDragStart/onDragEnd to prevent unwanted moves
                onDragStart={(e) => {
                    if (e.target !== e.currentTarget) return;
                    // If not in pan tool and not using middle click, don't drag the stage
                    if (tool !== 'pan' && e.evt?.button !== 1) {
                        e.target.stopDrag();
                    }
                }}
                onDragEnd={(e) => {
                    setGuides([]);
                    e.cancelBubble = true;
                    if (e.target !== e.currentTarget) return; // Prevent bubbling from nodes
                    setStagePos({ x: e.target.x(), y: e.target.y() });
                }}
                ref={stageRef}
                className="bg-white"
                onContextMenu={(e) => e.evt.preventDefault()} // Allow right-click for upcoming features
            >
                <Layer name="canvas-bottom" listening={false}>
                    {/* Render Grid Lines */}
                    {mode === 'edit' && (() => {
                        const lines = [];
                        const width = stageSize.width;
                        const height = stageSize.height;
                        const grid = 20; // Correct grid size
                        for (let i = 0; i <= width / grid; i++) {
                            const isMajor = i % 5 === 0;
                            lines.push(
                                <Line
                                    key={`v-${i}`}
                                    points={[i * grid, 0, i * grid, height]}
                                    stroke={isMajor ? "#94a3b8" : "#cbd5e1"}
                                    strokeWidth={isMajor ? 1 : 0.5}
                                    dash={isMajor ? [] : [2, 4]}
                                    opacity={isMajor ? 0.5 : 0.3}
                                />
                            );
                        }
                        for (let j = 0; j <= height / grid; j++) {
                            const isMajor = j % 5 === 0;
                            lines.push(
                                <Line
                                    key={`h-${j}`}
                                    points={[0, j * grid, width, j * grid]}
                                    stroke={isMajor ? "#94a3b8" : "#cbd5e1"}
                                    strokeWidth={isMajor ? 1 : 0.5}
                                    dash={isMajor ? [] : [2, 4]}
                                    opacity={isMajor ? 0.5 : 0.3}
                                />
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
                    {nodes.filter(n => ['rect_zone', 'circle_zone', 'zone', 'section_container'].includes(n.type)).map(node => (
                        <Group
                            key={node.id}
                            id={node.id}
                            x={node.x || 0}
                            y={node.y || 0}
                            draggable={mode === 'edit'}
                            onClick={handleClick}
                            onTap={handleClick}
                            onDragStart={(e) => {
                                if (e.target.id() !== node.id) return;
                                const contained = nodesRef.current.filter(n =>
                                    n.type === 'seat' && isPointInRect(n.x, n.y, node.x, node.y, node.width || 400, node.height || 300)
                                );
                                const startMap = {};
                                contained.forEach(n => {
                                    startMap[n.id] = { x: n.x, y: n.y };
                                });
                                dragStartRef.current = startMap;
                                e.target.setAttr('dragStartX', node.x);
                                e.target.setAttr('dragStartY', node.y);
                            }}
                            onDragMove={(e) => {
                                if (e.target.id() !== node.id || !dragStartRef.current) return;
                                const dx = e.target.x() - (e.target.getAttr('dragStartX') || node.x);
                                const dy = e.target.y() - (e.target.getAttr('dragStartY') || node.y);

                                const layer = e.target.getLayer();
                                Object.keys(dragStartRef.current).forEach(id => {
                                    const seatNode = layer.findOne('#' + id);
                                    const startPos = dragStartRef.current[id];
                                    if (seatNode && startPos) {
                                        seatNode.x(startPos.x + dx);
                                        seatNode.y(startPos.y + dy);
                                    }
                                });
                            }}
                            onDragEnd={(e) => {
                                if (e.target.id() !== node.id) return;
                                const dx = e.target.x() - (e.target.getAttr('dragStartX') || node.x);
                                const dy = e.target.y() - (e.target.getAttr('dragStartY') || node.y);

                                const updatedNodes = nodesRef.current.map(n => {
                                    if (n.id === node.id) return { ...n, x: e.target.x(), y: e.target.y() };
                                    if (dragStartRef.current[n.id]) {
                                        const start = dragStartRef.current[n.id];
                                        return { ...n, x: start.x + dx, y: start.y + dy };
                                    }
                                    return n;
                                });
                                setNodes(updatedNodes);
                                pushToHistory(updatedNodes);
                                onChange({ ...layout, nodes: updatedNodes });
                                dragStartRef.current = {};
                            }}
                        >
                            {node.type === 'section_container' && (
                                <Rect
                                    width={node.width || 400}
                                    height={node.height || 300}
                                    fill={node.fill || 'rgba(59, 130, 246, 0.1)'}
                                    stroke={selectedIds.includes(node.id) ? '#3b82f6' : (node.stroke || '#cbd5e1')}
                                    strokeWidth={selectedIds.includes(node.id) ? 3 : 2}
                                    dash={selectedIds.includes(node.id) ? null : [10, 5]}
                                    cornerRadius={8}
                                />
                            )}

                            {node.type === 'rect_zone' && (
                                <Rect
                                    width={node.width || 200}
                                    height={node.height || 150}
                                    fill={selectedIds.includes(node.id) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.1)'}
                                    stroke={selectedIds.includes(node.id) ? '#3b82f6' : '#94a3b8'}
                                    strokeWidth={2}
                                    cornerRadius={4}
                                />
                            )}
                            {node.type === 'circle_zone' && (
                                <Circle
                                    radius={node.radius || 100}
                                    fill={selectedIds.includes(node.id) ? 'rgba(236, 72, 153, 0.2)' : 'rgba(148, 163, 184, 0.1)'}
                                    stroke={selectedIds.includes(node.id) ? '#ec4899' : '#94a3b8'}
                                    strokeWidth={2}
                                />
                            )}
                            {node.type === 'zone' && (
                                <Line
                                    points={node.points}
                                    fill={selectedIds.includes(node.id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)'}
                                    stroke={selectedIds.includes(node.id) ? '#10b981' : '#94a3b8'}
                                    strokeWidth={2}
                                    closed={true}
                                />
                            )}
                            <Text
                                text={node.type === 'section_container' ? (node.name?.toUpperCase() || 'SECCIÓN') : (node.name || 'Nueva Área')}
                                fontSize={node.type === 'section_container' ? 16 : 14}
                                y={-20}
                                fill={node.type === 'section_container' ? (node.stroke || '#3b82f6') : "#64748b"}
                                fontStyle="bold"
                                listening={false}
                            />
                        </Group>
                    ))}
                </Layer>
                <Layer name="seats">
                    {nodes.map((node) => {
                        if (node.type === 'seat') {
                            return (
                                <Group
                                    key={node.id}
                                    id={node.id}
                                    name="selectable"
                                    x={node.x}
                                    y={node.y}
                                    onMouseEnter={() => mode === 'preview' && setHoveredId(node.id)}
                                    onMouseLeave={() => mode === 'preview' && setHoveredId(null)}
                                    draggable={mode === 'edit'}
                                    transformsEnabled="position"
                                    perfectDrawEnabled={false}
                                    onDragStart={(e) => {
                                        e.cancelBubble = true;
                                        const startMap = {};
                                        const layer = e.target.getLayer();

                                        // PERFORMANCE: Pre-map all Konva nodes in this layer to avoid repeated findOne
                                        const konvaNodesMap = {};
                                        layer.getChildren().forEach(child => {
                                            const cid = child.id();
                                            if (cid) konvaNodesMap[cid] = child;
                                        });

                                        if (selectedIdsRef.current.includes(node.id)) {
                                            selectedIdsRef.current.forEach(id => {
                                                const n = nodesRef.current.find(item => item.id === id);
                                                if (n) {
                                                    startMap[id] = {
                                                        x: n.x,
                                                        y: n.y,
                                                        konvaNode: konvaNodesMap[id]
                                                    };

                                                    // Identify and cache row labels for real-time movement
                                                    if (n.row_uuid) {
                                                        const leftLabel = konvaNodesMap[`label-L-${n.row_uuid}`];
                                                        const rightLabel = konvaNodesMap[`label-R-${n.row_uuid}`];
                                                        if (leftLabel && !startMap[`label-L-${n.row_uuid}`]) {
                                                            startMap[`label-L-${n.row_uuid}`] = { x: leftLabel.x(), y: leftLabel.y(), konvaNode: leftLabel };
                                                        }
                                                        if (rightLabel && !startMap[`label-R-${n.row_uuid}`]) {
                                                            startMap[`label-R-${n.row_uuid}`] = { x: rightLabel.x(), y: rightLabel.y(), konvaNode: rightLabel };
                                                        }
                                                    }
                                                }
                                            });
                                        } else {
                                            startMap[node.id] = {
                                                x: node.x,
                                                y: node.y,
                                                konvaNode: e.target
                                            };
                                        }
                                        dragStartRef.current = startMap;
                                        e.target.setAttr('dragStartX', node.x);
                                        e.target.setAttr('dragStartY', node.y);
                                    }}
                                    onDragMove={(e) => {
                                        const isSelected = selectedIdsRef.current.includes(node.id);
                                        if (!isSelected) return;

                                        let rawX = e.target.x();
                                        let rawY = e.target.y();

                                        // PERFORMANCE: Only calculate guides for smaller selections
                                        const selectionSize = Object.keys(dragStartRef.current).length;
                                        if (selectionSize < 20) {
                                            const activeGuides = [];
                                            // Limit guide search to a small window or sample
                                            nodesRef.current.forEach((other, idx) => {
                                                if (other.id === node.id || selectedIdsRef.current.includes(other.id)) return;
                                                if (other.type !== 'seat' || (nodesRef.current.length > 200 && idx % 2 !== 0)) return;

                                                if (Math.abs(rawX - other.x) < 5) {
                                                    rawX = other.x;
                                                    activeGuides.push({ orientation: 'V', pos: other.x });
                                                }
                                                if (Math.abs(rawY - other.y) < 5) {
                                                    rawY = other.y;
                                                    activeGuides.push({ orientation: 'H', pos: other.y });
                                                }
                                            });
                                            if (activeGuides.length > 0) setGuides(activeGuides.slice(0, 2));
                                        }

                                        e.target.x(rawX);
                                        e.target.y(rawY);

                                        const dx = rawX - (e.target.getAttr('dragStartX') || node.x);
                                        const dy = rawY - (e.target.getAttr('dragStartY') || node.y);

                                        // Move other selected nodes using CACHED REFS
                                        Object.keys(dragStartRef.current).forEach(id => {
                                            if (id === node.id) return;
                                            const data = dragStartRef.current[id];
                                            if (data.konvaNode) {
                                                data.konvaNode.x(data.x + dx);
                                                data.konvaNode.y(data.y + dy);
                                            }
                                        });
                                    }}
                                    onDragEnd={(e) => {
                                        setGuides([]);
                                        e.cancelBubble = true;
                                        let finalX = e.target.x();
                                        let finalY = e.target.y();

                                        const dx = finalX - (e.target.getAttr('dragStartX') || node.x);
                                        const dy = finalY - (e.target.getAttr('dragStartY') || node.y);
                                        let updatedNodes = [...nodesRef.current];

                                        if (selectedIdsRef.current.includes(node.id)) {
                                            updatedNodes = nodesRef.current.map(n => {
                                                if (selectedIdsRef.current.includes(n.id)) {
                                                    const start = dragStartRef.current[n.id] || { x: n.x, y: n.y };
                                                    return { ...n, x: start.x + dx, y: start.y + dy };
                                                }
                                                return n;
                                            });
                                        } else {
                                            updatedNodes = nodesRef.current.map(n =>
                                                n.id === node.id ? { ...n, x: finalX, y: finalY } : n
                                            );
                                        }

                                        setNodes(updatedNodes);
                                        pushToHistory(updatedNodes);
                                        onChange({ ...layout, nodes: updatedNodes });
                                        dragStartRef.current = {};
                                    }}
                                >
                                    <Circle
                                        id={node.id}
                                        radius={mode === 'preview' && hoveredId === node.id ? node.radius * 1.2 : node.radius}
                                        fill={
                                            mode === 'edit'
                                                ? (selectedIds.includes(node.id) ? '#fbbf24' : '#e2e8f0')
                                                : (cart.includes(node.id) ? '#10b981' : (hoveredId === node.id ? '#60a5fa' : '#e2e8f0'))
                                        }
                                        stroke={selectedIds.includes(node.id) ? '#d97706' : '#94a3b8'}
                                        strokeWidth={1.5}
                                        name="selectable"
                                        perfectDrawEnabled={false}
                                        shadowForStrokeEnabled={false}
                                        listening={true}
                                    />
                                    <Text
                                        text={`${node.number}`}
                                        fontSize={node.radius * 0.8}
                                        x={-node.radius}
                                        y={-node.radius / 1.7}
                                        fill="#475569"
                                        align="center"
                                        verticalAlign="middle"
                                        width={node.radius * 2}
                                        fontStyle="bold"
                                        listening={false}
                                    />
                                </Group>
                            );
                        }
                        return null;
                    })}

                    {/* Row Labels Layer (Duales: Inicio y Fin) */}
                    {(() => {
                        const rowGroups = {};
                        nodes.forEach(n => {
                            if (n.type === 'seat' && n.row_uuid) {
                                if (!rowGroups[n.row_uuid]) rowGroups[n.row_uuid] = [];
                                rowGroups[n.row_uuid].push(n);
                            }
                        });

                        return Object.values(rowGroups).map((rowSeats, idx) => {
                            if (rowSeats.length === 0) return null;

                            const first = rowSeats[0]; // Anchor node for properties
                            const isEnabled = first.row_label_enabled ?? true;
                            if (!isEnabled) return null;

                            const position = first.row_label_position || 'both';
                            const displayLabel = first.row_label_override || first.row;

                            // Sort by horizontal position to find ends
                            const sorted = [...rowSeats].sort((a, b) => a.x - b.x);
                            const extremeLeft = sorted[0];
                            const extremeRight = sorted[sorted.length - 1];
                            const radius = extremeLeft.radius || 10;

                            // Calculate direction for offset
                            const dx = extremeRight.x - extremeLeft.x;
                            const dy = extremeRight.y - extremeLeft.y;
                            const angle = Math.atan2(dy, dx);

                            const offset = radius * 3;
                            const showLeft = position === 'both' || position === 'left';
                            const showRight = position === 'both' || position === 'right';

                            return (
                                <React.Fragment key={`row-labels-${idx}`}>
                                    {showLeft && (
                                        <Text
                                            id={`label-L-${first.row_uuid}`}
                                            x={extremeLeft.x - Math.cos(angle) * offset - radius}
                                            y={extremeLeft.y - Math.sin(angle) * offset - radius}
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
                                            x={extremeRight.x + Math.cos(angle) * offset - radius}
                                            y={extremeRight.y + Math.sin(angle) * offset - radius}
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
                        });
                    })()}

                    {/* Block/Row Highlight Overlay */}
                    {(() => {
                        const selectedSeats = nodes.filter(n => selectedIds.includes(n.id) && n.type === 'seat');
                        if (selectedSeats.length === 0) return null;

                        const blockUuid = selectedSeats[0].block_uuid;
                        const isWholeBlock = blockUuid && nodes.filter(n => n.block_uuid === blockUuid).every(n => selectedIds.includes(n.id));

                        if (isWholeBlock) {
                            // Draw a boundary box for the block
                            const xmin = Math.min(...selectedSeats.map(s => s.x)) - 30;
                            const xmax = Math.max(...selectedSeats.map(s => s.x)) + 30;
                            const ymin = Math.min(...selectedSeats.map(s => s.y)) - 30;
                            const ymax = Math.max(...selectedSeats.map(s => s.y)) + 30;

                            return (
                                <Rect
                                    x={xmin} y={ymin}
                                    width={xmax - xmin} height={ymax - ymin}
                                    stroke="#3b82f6" strokeWidth={2}
                                    dash={[5, 5]} cornerRadius={8}
                                    opacity={0.3} listening={false}
                                />
                            );
                        }
                        return null;
                    })()}

                </Layer>

                <Layer name="canvas-top">
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

                    {/* Marquee Selection Rect */}
                    {selectionRect && (
                        <Rect
                            x={Math.min(selectionRect.x1, selectionRect.x2)}
                            y={Math.min(selectionRect.y1, selectionRect.y2)}
                            width={Math.abs(selectionRect.x2 - selectionRect.x1)}
                            height={Math.abs(selectionRect.y2 - selectionRect.y1)}
                            fill="rgba(59, 130, 246, 0.2)"
                            stroke="#3b82f6"
                            strokeWidth={1}
                            listening={false}
                            perfectDrawEnabled={false}
                        />
                    )}

                    {/* Current Drawing Polygon */}
                    {drawingPoints.length > 0 && (
                        <Line
                            points={drawingPoints}
                            stroke="#10b981"
                            strokeWidth={2}
                            dash={[5, 5]}
                            closed={false}
                            listening={false}
                            perfectDrawEnabled={false}
                        />
                    )}

                    {/* Row Drawing Preview (Ghost Seats) */}
                    {isDrawingRow && previewNodes.map(ghost => (
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

                    {mode === 'edit' && selectedIds.length > 0 && !isResizing && (
                        <Transformer
                            ref={transformerRef}
                            anchorSize={6}
                            borderDash={[3, 3]}
                            boundBoxFunc={(oldBox, newBox) => {
                                if (newBox.width < 5 || newBox.height < 5) return oldBox;
                                return newBox;
                            }}
                        />
                    )}

                    {/* Resize Handles (4 Centered Sides) */}
                    {mode === 'edit' && selectedIds.length > 0 && !selectionRect && (
                        (() => {
                            const selectedSeats = nodes.filter(n => selectedIds.includes(n.id) && n.type === 'seat');
                            if (selectedSeats.length < 1) return null;

                            // 1. Group selection by row and calculate bounding box
                            const rowsMap = {};
                            const allX = [];
                            const allY = [];

                            selectedSeats.forEach(s => {
                                allX.push(s.x);
                                allY.push(s.y);
                                if (s.row_uuid && !rowsMap[s.row_uuid]) {
                                    const fullRow = nodes.filter(n => n.row_uuid === s.row_uuid && n.type === 'seat');
                                    if (fullRow.length >= 1) {
                                        const sorted = [...fullRow].sort((a, b) => a.x - b.x);
                                        rowsMap[s.row_uuid] = {
                                            nodes: sorted,
                                            startNode: sorted[0],
                                            lastNode: sorted[sorted.length - 1],
                                            rowLabel: sorted[0].row
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

                            const createHandle = (type, x, y, angle) => {
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
                                        onDragStart={(e) => {
                                            e.cancelBubble = true;
                                            setIsResizing(true);
                                            setResizingData({ rowsMap, type, startX: x, startY: y, minX, maxX, minY, maxY });
                                        }}
                                        onDragMove={(e) => {
                                            const stage = e.target.getStage();
                                            const pos = getRelativePointerPosition(stage);
                                            const spacing = layout?.config?.defaultSpacing || 35;
                                            const rowSpacing = layout?.config?.rowSpacing || 40;
                                            const ghosts = [];
                                            const rowsToExpand = Object.values(rowsMap);

                                            if (type === 'R' || type === 'L') {
                                                // HORIZONTAL EXPANSION (Seats in row)
                                                const dx = type === 'R' ? pos.x - minX : maxX - pos.x;
                                                const newCount = Math.max(1, Math.round((dx - handleOffset / 2) / spacing) + 1);

                                                rowsToExpand.forEach(row => {
                                                    const rowAnchor = type === 'R' ? row.startNode : row.lastNode;
                                                    const rowAngle = type === 'R' ? 0 : Math.PI; // Simplified for grid
                                                    // Actual angle calculation if shifted/rotated blocks exist:
                                                    // const angleAxis = type === 'R' ? 0 : Math.PI;

                                                    for (let i = 0; i < newCount; i++) {
                                                        ghosts.push({
                                                            id: `ghost-${row.startNode.row_uuid}-${i}`,
                                                            x: rowAnchor.x + Math.cos(rowAngle) * i * spacing,
                                                            y: rowAnchor.y + Math.sin(rowAngle) * i * spacing,
                                                        });
                                                    }
                                                });
                                            } else {
                                                // VERTICAL EXPANSION (New rows)
                                                const sortedRowsY = Object.values(rowsMap).sort((a, b) => a.startNode.y - b.startNode.y);
                                                const edgeRow = type === 'B' ? sortedRowsY[sortedRowsY.length - 1] : sortedRowsY[0];
                                                const prevRow = type === 'B' ? (sortedRowsY[sortedRowsY.length - 2] || edgeRow) : (sortedRowsY[1] || edgeRow);

                                                // Calculate measured metrics from the selection
                                                const dy = sortedRowsY.length > 1 ? (edgeRow.startNode.y - prevRow.startNode.y) : (type === 'B' ? rowSpacing : -rowSpacing);
                                                const honeyOffsetX = sortedRowsY.length > 1 ? (edgeRow.startNode.x - prevRow.startNode.x) : 0;
                                                const isHoneycomb = Math.abs(honeyOffsetX) > spacing / 4;

                                                const actualDy = Math.abs(pos.y - edgeRow.startNode.y);
                                                const extraRowsCount = Math.max(0, Math.floor((actualDy - handleOffset / 2) / Math.abs(dy)));

                                                // Current rows ghosts
                                                rowsToExpand.forEach(row => {
                                                    row.nodes.forEach((n, i) => {
                                                        ghosts.push({ id: `ghost-orig-${row.startNode.row_uuid}-${i}`, x: n.x, y: n.y });
                                                    });
                                                });

                                                if (extraRowsCount > 0) {
                                                    for (let r = 1; r <= extraRowsCount; r++) {
                                                        const isOdd = r % 2 !== 0;
                                                        // Toggling offset for honeycomb: new row 1 is like prevRow, row 2 is like edgeRow
                                                        const currentXShift = (isHoneycomb && isOdd) ? -honeyOffsetX : 0;

                                                        edgeRow.nodes.forEach((n, i) => {
                                                            ghosts.push({
                                                                id: `ghost-newrow-${r}-${i}`,
                                                                x: n.x + currentXShift,
                                                                y: edgeRow.startNode.y + (r * dy),
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
                                            const pos = getRelativePointerPosition(stage);
                                            const spacing = layout?.config?.defaultSpacing || 35;
                                            const rowSpacing = layout?.config?.rowSpacing || 40;

                                            let updatedNodes = [...nodes];
                                            const rowUuidsToReplace = Object.keys(rowsMap);
                                            const rowsToExpand = Object.values(rowsMap);
                                            const newSelectionIds = [];

                                            if (type === 'R' || type === 'L') {
                                                const dx = type === 'R' ? pos.x - minX : maxX - pos.x;
                                                const newCount = Math.max(1, Math.round((dx - handleOffset / 2) / spacing) + 1);

                                                updatedNodes = updatedNodes.filter(n => !rowUuidsToReplace.includes(n.row_uuid));
                                                rowsToExpand.forEach(row => {
                                                    const rowAnchor = type === 'R' ? row.startNode : row.lastNode;
                                                    const rowAngle = type === 'R' ? 0 : Math.PI;
                                                    for (let i = 0; i < newCount; i++) {
                                                        const newId = 'seat-' + uuidv4();
                                                        updatedNodes.push({
                                                            ...row.startNode,
                                                            id: newId,
                                                            x: rowAnchor.x + Math.cos(rowAngle) * i * spacing,
                                                            y: rowAnchor.y + Math.sin(rowAngle) * i * spacing,
                                                            number: i + 1,
                                                            permanent_uuid: uuidv4()
                                                        });
                                                        newSelectionIds.push(newId);
                                                    }
                                                });
                                            } else {
                                                const sortedRowsY = rowsToExpand.sort((a, b) => a.startNode.y - b.startNode.y);
                                                const edgeRow = type === 'B' ? sortedRowsY[sortedRowsY.length - 1] : sortedRowsY[0];
                                                const prevRow = type === 'B' ? (sortedRowsY[sortedRowsY.length - 2] || edgeRow) : (sortedRowsY[1] || edgeRow);

                                                const dy = sortedRowsY.length > 1 ? (edgeRow.startNode.y - prevRow.startNode.y) : (type === 'B' ? rowSpacing : -rowSpacing);
                                                const honeyOffsetX = sortedRowsY.length > 1 ? (edgeRow.startNode.x - prevRow.startNode.x) : 0;
                                                const isHoneycomb = Math.abs(honeyOffsetX) > spacing / 4;

                                                const actualDy = Math.abs(pos.y - edgeRow.startNode.y);
                                                const extraRowsCount = Math.max(0, Math.floor((actualDy - handleOffset / 2) / Math.abs(dy)));

                                                if (extraRowsCount > 0) {
                                                    for (let r = 1; r <= extraRowsCount; r++) {
                                                        const isOdd = r % 2 !== 0;
                                                        const currentXShift = (isHoneycomb && isOdd) ? -honeyOffsetX : 0;
                                                        const newRowUuid = uuidv4();
                                                        const nextLabel = getNextRowLabel(updatedNodes, edgeRow.startNode.section);

                                                        edgeRow.nodes.forEach((n, i) => {
                                                            const newId = 'seat-' + uuidv4();
                                                            updatedNodes.push({
                                                                ...n,
                                                                id: newId,
                                                                row: nextLabel,
                                                                row_uuid: newRowUuid,
                                                                x: n.x + currentXShift,
                                                                y: edgeRow.startNode.y + (r * dy),
                                                                permanent_uuid: uuidv4()
                                                            });
                                                            newSelectionIds.push(newId);
                                                        });
                                                    }
                                                    selectedIds.forEach(id => newSelectionIds.push(id));
                                                } else {
                                                    selectedIds.forEach(id => newSelectionIds.push(id));
                                                }
                                            }

                                            setNodes(updatedNodes);
                                            pushToHistory(updatedNodes);
                                            onChange({ ...layout, nodes: updatedNodes });
                                            setIsResizing(false);
                                            setIsDrawingRow(false);
                                            setPreviewNodes([]);
                                            setSelectedIds(newSelectionIds);
                                        }}
                                    />
                                );
                            };

                            return (
                                <React.Fragment>
                                    {/* Right Handle */}
                                    {createHandle('R', maxX + handleOffset, centerY, 0)}
                                    {/* Left Handle */}
                                    {createHandle('L', minX - handleOffset, centerY, Math.PI)}
                                    {/* Bottom Handle */}
                                    {createHandle('B', centerX, maxY + handleOffset, Math.PI / 2)}
                                    {/* Top Handle */}
                                    {createHandle('T', centerX, minY - handleOffset, -Math.PI / 2)}
                                </React.Fragment>
                            );
                        })()
                    )}
                </Layer>
            </Stage>

        </div>
    );
});

export default SeatingCanvas;

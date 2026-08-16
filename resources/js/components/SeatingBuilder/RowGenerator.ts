import { v4 as uuidv4 } from 'uuid';
import { SeatingNode } from './types';

/**
 * Generates a row label sequence (A, B... Z, AA, AB... or 1, 2, 3...)
 * handles skips like I, O, Q
 */
export const getRowLabel = (
    index: number,
    type: string = 'ABC',
    startAt: string = 'A',
    skipChars: string[] = [],
): string => {
    const list = skipChars.length > 0 ? skipChars : [];

    if (type === '123') {
        const start = parseInt(startAt) || 1;
        return (start + index).toString();
    }

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        .split('')
        .filter((c) => !list.includes(c));
    const base = alphabet.length;

    const getBaseIndex = (label: string): number => {
        let idx = 0;
        for (let i = 0; i < label.length; i++) {
            const char = label[i].toUpperCase();
            const charPos = alphabet.indexOf(char);
            if (charPos === -1) continue;
            idx = idx * base + (charPos + 1);
        }
        return idx - 1;
    };

    const startIdx = getBaseIndex(startAt || 'A');
    let n = startIdx + index;

    let label = '';
    if (n < 0) return alphabet[0];

    while (n >= 0) {
        label = alphabet[n % base] + label;
        n = Math.floor(n / base) - 1;
    }
    return label;
};

/**
 * Handles seat numbering logic (Sequential, Even, Odd)
 */
export const getSeatNumber = (
    index: number,
    type: string = '123',
    startAt: number = 1,
    count: number = 10,
    direction: string = 'LR',
): number => {
    let visualIndex = index;
    if (direction === 'RL') {
        visualIndex = count - 1 - index;
    }

    if (type === 'Pares') {
        return startAt + visualIndex * 2 + (startAt % 2 === 0 ? 0 : 1);
    }
    if (type === 'Impares') {
        return startAt + visualIndex * 2 + (startAt % 2 !== 0 ? 0 : -1);
    }
    return startAt + visualIndex;
};

interface GenerateRowParams {
    count?: number;
    startX?: number;
    startY?: number;
    spacing?: number;
    curvature?: number;
    section?: string;
    rowLabel?: string;
    rowLabelType?: string;
    seatLabelType?: string;
    seatStartNumber?: number;
    seatLabelDirection?: string;
    radius?: number;
    color?: string;
    rowUuid?: string | null;
    blockUuid?: string | null;
}

/**
 * Generates an array of seat nodes
 */
export const generateRow = ({
    count = 10,
    startX = 100,
    startY = 100,
    spacing = 35,
    curvature = 0,
    section = 'General',
    rowLabel = '',
    rowLabelType = 'ABC',
    seatLabelType = '123',
    seatStartNumber = 1,
    seatLabelDirection = 'LR',
    radius = 10,
    color = '#e2e8f0',
    rowUuid = null,
    blockUuid = null,
}: GenerateRowParams): SeatingNode[] => {
    const seats: SeatingNode[] = [];
    const rUuid = rowUuid || uuidv4();

    // Evitar que los asientos colisionen: Diámetro (radio * 2) + 1px de aire
    const minSpacing = radius * 2 + 1;
    const actualSpacing = Math.max(spacing, minSpacing);

    // Calculate the baseline curve for the first seat so the anchor (seat 0) stays at startY
    const mid = (count - 1) / 2;
    const baseCurveY = curvature * Math.pow(-mid, 2) * (actualSpacing / 10);

    for (let i = 0; i < count; i++) {
        const offset = i - mid;
        const rawCurveY = curvature * Math.pow(offset, 2) * (actualSpacing / 10);
        const curveY = rawCurveY;

        seats.push({
            id: 'seat-' + uuidv4(),
            type: 'seat',
            x: startX + i * actualSpacing,
            y: startY + curveY,
            spacing: actualSpacing,
            curvature: curvature,
            radius: radius,
            fill: color,
            section: section,
            row: rowLabel,
            row_uuid: rUuid,
            block_uuid: blockUuid,
            number: rowLabel ? getSeatNumber(
                i,
                seatLabelType,
                seatStartNumber,
                count,
                seatLabelDirection,
            ) : undefined,
            permanent_uuid: uuidv4(),
        });
    }

    return seats;
};

interface GenerateHoneycombParams {
    rows: number;
    cols: number;
    startX: number;
    startY: number;
    spacingX: number;
    spacingY: number;
    section: string;
    radius?: number;
    blockUuid?: string | null;
    rowLabelType?: string;
    rowLabelStart?: string;
    seatLabelDirection?: string;
}

export const generateHoneycomb = ({
    rows,
    cols,
    startX,
    startY,
    spacingX,
    spacingY,
    section,
    radius = 10,
    blockUuid = null,
    rowLabelType = 'ABC',
    rowLabelStart = '',
    seatLabelDirection = 'LR',
}: GenerateHoneycombParams): SeatingNode[] => {
    const seats: SeatingNode[] = [];
    const bUuid = blockUuid || uuidv4();

    const minSpacingX = radius * 2 + 1;
    const minSpacingY = radius * 2 + 1;
    const actualSpacingX = Math.max(spacingX, minSpacingX);
    const actualSpacingY = Math.max(spacingY, minSpacingY);

    for (let i = 0; i < rows; i++) {
        const rowUuid = uuidv4();
        const offset = i % 2 === 0 ? 0 : actualSpacingX / 2;
        const rowLabel = rowLabelStart ? getRowLabel(i, rowLabelType, rowLabelStart) : '';

        for (let j = 0; j < cols; j++) {
            seats.push({
                id: 'seat-' + uuidv4(),
                type: 'seat',
                x: startX + j * actualSpacingX + offset,
                y: startY + i * (actualSpacingY * 0.866),
                radius: radius,
                fill: '#e2e8f0',
                section: section,
                row: rowLabel,
                row_uuid: rowUuid,
                block_uuid: bUuid,
                number: rowLabel ? getSeatNumber(j, '123', 1, cols, seatLabelDirection) : undefined,
            });
        }
    }
    return seats;
};

interface GenerateGridParams {
    rows?: number;
    cols?: number;
    startX?: number;
    startY?: number;
    spacingX?: number;
    spacingY?: number;
    section?: string;
    radius?: number;
    color?: string;
    blockUuid?: string | null;
    rowLabelType?: string;
    rowLabelStart?: string;
    seatLabelDirection?: string;
}

export const generateGrid = ({
    rows = 5,
    cols = 10,
    startX = 100,
    startY = 100,
    spacingX = 35,
    spacingY = 40,
    section = 'General',
    radius = 10,
    color = '#e2e8f0',
    blockUuid = null,
    rowLabelType = 'ABC',
    rowLabelStart = '',
    seatLabelDirection = 'LR',
}: GenerateGridParams): SeatingNode[] => {
    let allSeats: SeatingNode[] = [];
    const bUuid = blockUuid || uuidv4();

    const minSpacingY = radius * 2 + 1;
    const actualSpacingY = Math.max(spacingY, minSpacingY);

    for (let r = 0; r < rows; r++) {
        const rowLabel = rowLabelStart ? getRowLabel(r, rowLabelType, rowLabelStart) : '';
        const rowSeats = generateRow({
            count: cols,
            startX: startX,
            startY: startY + r * actualSpacingY,
            spacing: spacingX,
            curvature: 0,
            section: section,
            rowLabel: rowLabel,
            seatStartNumber: 1,
            seatLabelDirection: seatLabelDirection,
            radius: radius,
            color: color,
            blockUuid: bUuid,
        });
        allSeats = [...allSeats, ...rowSeats];
    }

    return allSeats;
};

export const getNextRowLabel = (
    existingNodes: SeatingNode[],
    section: string = 'General',
): string => {
    const sectionNodes = existingNodes.filter(
        (n) => n.section === section && n.row_uuid,
    );
    if (sectionNodes.length === 0) return 'A';

    const uniqueLabels = Array.from(
        new Set(
            sectionNodes
                .map((n) => n.row)
                .filter((r): r is string => Boolean(r)),
        ),
    );
    // Sort labels to find "highest"
    const sorted = uniqueLabels.sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
    });

    const last = sorted[sorted.length - 1];

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (last.length === 1) {
        const idx = alphabet.indexOf(last.toUpperCase());
        if (idx !== -1 && idx < 25) return alphabet[idx + 1];
    }
    return 'A'; // Default fallback
};

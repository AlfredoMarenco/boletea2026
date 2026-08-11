export interface SeatingNode {
    id: string;
    type:
        | 'seat'
        | 'table_shape'
        | 'section_container'
        | 'rect_zone'
        | 'circle_zone'
        | 'standing'
        | 'text'
        | string;
    x: number;
    y: number;
    radius?: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    name?: string;
    section?: string;
    row?: string;
    row_uuid?: string | null;
    block_uuid?: string | null;
    table_uuid?: string | null;
    number?: number;
    permanent_uuid?: string;
    points?: number[];
    scaleX?: number;
    scaleY?: number;
    showTitle?: boolean;
    titlePosition?: 'center' | 'bottom' | 'top';
    capacity?: number;
    category_id?: number | string;
    row_label_enabled?: boolean;
    row_label_position?: 'both' | 'left' | 'right';
    row_label_override?: string;
    row_label_display_type?: string;
    numSeats?: number;
    curve?: number;
    seatSpacing?: number;
    rowSpacing?: number;
    rowLabelStart?: string;
    rowLabelType?: string;
    rowLabelSkip?: string;
    seatLabelType?: string;
    seatLabelStart?: number;
    seatLabelDirection?: string;
    shape?: string;
    sectionType?: 'numbered' | 'general';
    curvature?: number;
    seat_label_direction?: string;
    spacing?: number;
}

export interface SeatingConfig {
    bgImageUrl?: string;
    bgImage?: string;
    bgScale?: number;
    bgX?: number;
    bgY?: number;
    bgOpacity?: number;
    defaultRadius?: number;
    defaultSpacing?: number;
    rowSpacing?: number;
    categories?: any[];
    width?: number;
    height?: number;
    focus?: {
        x: number;
        y: number;
        zoom: number;
    };
}

export interface SeatingLayout {
    nodes: SeatingNode[];
    config?: SeatingConfig;
}

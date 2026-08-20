export interface Venue {
    id: number;
    name: string;
    seatingMaps?: SeatingMap[];
}

export interface SeatingMap {
    id: number;
    name: string;
    venue_id: number;
    layout_json: {
        nodes?: Array<{
            id?: string;
            type?: string;
            section?: string;
        }>;
        config?: {
            categories?: Array<{
                name: string;
                color?: string;
            }>;
        };
    };
}

export interface PriceType {
    id: number;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
}

export interface Price {
    id?: number;
    price_type_id: number;
    name: string;
    price: number;
    printed_price: number;
    service_charge: number;
    bank_commission: number;
    admin_fee: number;
    is_enabled: boolean;
    web_sales_enabled: boolean;
    box_office_sales_enabled: boolean;
    is_web_default: boolean;
    is_pos_default: boolean;
    color?: string;
    price_type?: PriceType;
}

export interface Promotion {
    id: number;
    code: string;
    name: string;
    type: string;
    value: number;
    is_active: boolean;
}

export interface SeatInventoryItem {
    id: number;
    seat_uuid: string;
    status: string;
    price: number;
    category: string;
    section: string;
    row?: string;
    number?: string;
}

export interface Showtime {
    id: number;
    name: string;
    venue_id: number;
    venue?: Venue;
    seating_map_id: number;
    seating_map?: SeatingMap;
    date_time: string;
    end_time: string;
    web_sales_start_at?: string;
    web_sales_end_at?: string;
    box_office_sales_start_at?: string;
    box_office_sales_end_at?: string;
    max_tickets_per_cart: number;
    status: string;
    ticket_notes?: string;
    ticket_terms?: string;
    layout_snapshot?: any;
    seat_overrides?: Record<string, string>;
    prices?: Price[];
    promotions?: Promotion[];
    seat_inventories?: SeatInventoryItem[];
}

export interface Event {
    id: number;
    name: string;
    showtimes?: Showtime[];
}

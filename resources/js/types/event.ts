
export interface Performance {
    PerformanceID: number;
    PerformanceName: string;
    PerformanceDateTime: string;
    VenueName: string;
    PerformancePrices: string;
}

export interface ExternalEvent {
    id: number;
    title: string;
    city: string | null;
    categories?: { id: number; name: string }[];
    category?: string | null; // Legacy single category
    description?: string | null;
    status: 'draft' | 'published';
    image_path: string | null;
    secondary_image_path?: string | null;
    start_date: string | null;
    end_date?: string | null;
    sales_start_date?: string | null;
    button_text?: string | null;
    distance_km?: number | null;
    venue?: {
        name: string;
        city?: string;
    };
    sales_centers?: string[] | null;
    raw_data?: Performance[] | Performance | null;
}

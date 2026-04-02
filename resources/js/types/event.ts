
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
    slug?: string | null;
    city: string | null;
    city_location?: { id: number; name: string } | null;
    state?: { id: number; name: string } | null;
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
    performance_url?: string | null;
    redirect_external?: boolean;
    show_calendar?: boolean;
    calendar_description?: string | null;
    performance_descriptions?: Record<string, { title?: string; subtitle?: string; order?: number } | string> | null;
    venue?: {
        name: string;
        city?: string;
    };
    sales_centers?: string[] | null;
    raw_data?: Performance[] | Performance | null;
    meta_pixel_id?: string | null;
}

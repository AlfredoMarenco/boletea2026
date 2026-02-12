import { Head } from '@inertiajs/react';
import PublicHeader from '@/components/public-header';
import { MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LocationPicker from '@/components/LocationPicker';

interface SalesCenter {
    id: number;
    name: string;
    address: string;
    logo_path: string | null;
    google_map_url: string | null;
    opening_hours: Record<string, { open: string; close: string; closed: boolean }>;
    latitude?: number;
    longitude?: number;
}

const DAYS_MAP: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
};

const ORDERED_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SalesCenters({ salesCenters }: { salesCenters: SalesCenter[] }) {

    // Function to group hours: e.g. Lun - Vie: 9:00 - 18:00
    const formatHours = (hours: SalesCenter['opening_hours']) => {
        if (!hours) return null;
        // This is a simple display, displaying all days.
        // A more complex grouper could be added later.
        return (
            <div className="text-sm space-y-1">
                {ORDERED_DAYS.map(day => {
                    const schedule = hours[day];
                    if (!schedule) return null;

                    return (
                        <div key={day} className="flex justify-between gap-4">
                            <span className="font-medium w-20 text-gray-500 dark:text-gray-400">{DAYS_MAP[day]}</span>
                            <span className="text-gray-900 dark:text-gray-200">
                                {schedule.closed ? 'Cerrado' : `${schedule.open} - ${schedule.close}`}
                            </span>
                        </div>
                    )
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] font-sans">
            <Head title="Puntos de Venta - Boletea" />
            <PublicHeader />

            <main className="pt-24 pb-16 px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                        Puntos de Venta Oficiales
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                        Encuentra el punto de venta más cercano para adquirir tus boletos.
                    </p>
                </div>

                {salesCenters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {salesCenters.map((center) => (
                            <div key={center.id} className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md hover:scale-105 transition-all duration-300">
                                <div className="p-6">
                                    <div className="mb-6">
                                        {center.logo_path ? (
                                            <div className="h-36 w-36 mx-auto flex items-center justify-center">
                                                <img src={center.logo_path} alt={center.name} className="max-h-full max-w-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="h-16 w-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <MapPin className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{center.name}</h3>
                                            <Badge variant="outline" className="mt-1 font-normal text-xs uppercase tracking-wider text-gray-500">Oficial</Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-5 w-5 text-[#c90000] shrink-0 mt-0.5" />
                                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                                {center.address}
                                            </p>
                                        </div>

                                        {center.opening_hours && (
                                            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                                                <div className="flex items-center gap-2 mb-3 text-[#c90000] font-semibold text-sm">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Horarios de Atención</span>
                                                </div>
                                                {formatHours(center.opening_hours)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {center.latitude && center.longitude ? (
                                    <div className="w-full">
                                        <LocationPicker
                                            initialLatitude={center.latitude}
                                            initialLongitude={center.longitude}
                                            readonly={true}
                                            clickToGoogleMaps={true}
                                            hideControls={true}
                                            zoom={16}
                                            useGoogleTiles={true}
                                        />
                                    </div>
                                ) : (
                                    center.google_map_url && (
                                        <a
                                            href={center.google_map_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full bg-gray-50 dark:bg-white/5 p-3 text-center text-sm font-medium text-[#c90000] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border-t border-gray-100 dark:border-gray-800"
                                        >
                                            Ver ubicación en Google Maps
                                        </a>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                        <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                        <p className="text-xl">No hay puntos de venta registrados actualmente.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

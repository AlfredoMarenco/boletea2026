import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Standard Blue Icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Red Icon
let RedIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    initialLatitude?: number | null;
    initialLongitude?: number | null;
    onLocationChange?: (lat: number, lng: number) => void;
    onAddressFound?: (address: string) => void;
    readonly?: boolean;
    clickToGoogleMaps?: boolean;
    hideControls?: boolean;
    zoom?: number;
    useGoogleTiles?: boolean;
    searchQuery?: string;
}

function LocationMarker({ position, setPosition, onLocationChange, onAddressFound, readonly, clickToGoogleMaps }: {
    position: { lat: number, lng: number } | null,
    setPosition: (pos: { lat: number, lng: number }) => void,
    onLocationChange?: (lat: number, lng: number) => void,
    onAddressFound?: (address: string) => void,
    readonly?: boolean,
    clickToGoogleMaps?: boolean
}) {
    const fetchAddress = async (lat: number, lng: number) => {
        if (!onAddressFound || readonly) return;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: {
                    'User-Agent': 'Boletea2026/1.0'
                }
            });
            const data = await response.json();
            if (data && data.display_name) {
                // Enhance address with place name if available
                let address = data.display_name;
                const placeName = data.address.amenity || data.address.shop || data.address.tourism || data.address.historic || data.address.leisure || data.address.office || data.address.building;

                if (placeName) {
                    // Sometimes display_name already includes it, but ensuring it's prominent or structured if needed
                    // For now, we'll just return the full display_name as it usually contains the place name at the start
                    // But we can verify/log it.
                    // address = `${placeName}, ${address}`; // Often redundant as display_name has it.
                }
                onAddressFound(data.display_name);
            }
        } catch (error) {
            console.error("Error fetching address:", error);
        }
    };

    const map = useMapEvents({
        click(e) {
            if (clickToGoogleMaps && position) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`, '_blank');
                return;
            }

            if (readonly) {
                // Modified behavior: if readonly but NOT clickToGoogleMaps (admin view fallback?), do nothing.
                // But specifically for public view we usually have clickToGoogleMaps=true.
                // If we want "click to get info" on public view, we might need a different prop or logic?
                // The user asked: "if I click on existing businesses give me info".
                // This implies an interaction even in "readonly" mode or a new mode.
                // However, "public view" usually redirects to Google Maps.
                // If the user wants info POPUP instead of redirect, we need to change architecture.
                // BUT, likely they refer to the Admin view or a new "interactive but not editing" mode.
                // For now, let's keep readonly as is (no edit), but allow fetching address if we want?
                // Actually, fetchAddress is guarded by `if (!onAddressFound || readonly) return;`.
                // So in readonly mode we DON'T fetch address.
                return;
            };

            setPosition(e.latlng);
            if (onLocationChange) onLocationChange(e.latlng.lat, e.latlng.lng);
            // Use panTo instead of flyTo to avoid zooming out/in animation
            map.panTo(e.latlng);
            fetchAddress(e.latlng.lat, e.latlng.lng);
        },
    });

    const markerRef = useRef<L.Marker>(null)

    const eventHandlers = useMemo(
        () => ({
            click() {
                if (clickToGoogleMaps && position) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${position.lat},${position.lng}`, '_blank');
                }
            },
            dragend() {
                if (readonly) return;
                const marker = markerRef.current
                if (marker != null) {
                    const latlng = marker.getLatLng();
                    setPosition(latlng);
                    if (onLocationChange) onLocationChange(latlng.lat, latlng.lng);
                    fetchAddress(latlng.lat, latlng.lng);
                }
            },
        }),
        [onLocationChange, setPosition, onAddressFound, readonly, clickToGoogleMaps, position],
    )

    return position === null ? null : (
        <Marker
            position={position}
            draggable={!readonly}
            eventHandlers={eventHandlers}
            ref={markerRef}
            icon={RedIcon}
        />
    );
}

// Separate component to handle map updates from props (like searchQuery)
function MapUpdater({ center, zoom, searchQuery, onLocationChange, onAddressFound, setPosition }: {
    center: { lat: number, lng: number },
    zoom: number,
    searchQuery?: string,
    onLocationChange?: (lat: number, lng: number) => void,
    onAddressFound?: (address: string) => void,
    setPosition: (pos: { lat: number, lng: number }) => void
}) {
    const map = useMapEvents({});

    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);

    useEffect(() => {
        if (searchQuery) {
            const searchAddress = async () => {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
                        headers: {
                            'User-Agent': 'Boletea2026/1.0'
                        }
                    });
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const result = data[0];
                        const lat = parseFloat(result.lat);
                        const lng = parseFloat(result.lon);
                        const newPos = { lat, lng };

                        setPosition(newPos);
                        if (onLocationChange) onLocationChange(lat, lng);
                        if (onAddressFound) onAddressFound(result.display_name);

                        map.flyTo(newPos, 16); // Zoom in on result
                    }
                } catch (error) {
                    console.error("Error searching address:", error);
                }
            };

            // Debounce or just run? The parent controls when searchQuery changes (e.g. via button click).
            // So we can run immediately.
            searchAddress();
        }
    }, [searchQuery, map, setPosition, onLocationChange, onAddressFound]);

    return null;
}

export default function LocationPicker({ initialLatitude, initialLongitude, onLocationChange, onAddressFound, readonly = false, clickToGoogleMaps = false, hideControls = false, zoom = 13, useGoogleTiles = false, searchQuery }: LocationPickerProps) {
    // Default center (e.g., Mexico City or user's location)
    // If no initial props, default to Mexico City
    const defaultCenter = { lat: 19.4326, lng: -99.1332 };

    const [position, setPosition] = useState<{ lat: number, lng: number } | null>(() => {
        const lat = initialLatitude ? Number(initialLatitude) : null;
        const lng = initialLongitude ? Number(initialLongitude) : null;

        return (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng))
            ? { lat, lng }
            : null;
    });

    const center = position || defaultCenter;

    return (
        <div className={`w-full rounded-md overflow-hidden border border-gray-300 z-0 relative ${readonly ? 'h-[200px]' : 'h-[400px]'} ${clickToGoogleMaps ? 'cursor-pointer' : ''}`}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={!readonly}
                dragging={!readonly}
                doubleClickZoom={!readonly}
                zoomControl={!hideControls}
                style={{ height: '100%', width: '100%', zIndex: 0, cursor: clickToGoogleMaps ? 'pointer' : 'grab' }}
            >
                {hideControls ? (
                    useGoogleTiles ? (
                        <TileLayer
                            attribution='&copy; Google Maps'
                            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            maxZoom={20}
                        />
                    ) : (
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                    )
                ) : (
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="Google Maps">
                            <TileLayer
                                attribution='&copy; Google Maps'
                                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                maxZoom={20}
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Voyager (CartoDB)">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Positron (Light)">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Dark Matter (Dark)">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satellite">
                            <TileLayer
                                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>
                )}

                <MapUpdater
                    center={center}
                    zoom={zoom}
                    searchQuery={searchQuery}
                    onLocationChange={onLocationChange}
                    onAddressFound={onAddressFound}
                    setPosition={setPosition}
                />

                <LocationMarker
                    position={position}
                    setPosition={setPosition}
                    onLocationChange={onLocationChange}
                    onAddressFound={onAddressFound}
                    readonly={readonly}
                    clickToGoogleMaps={clickToGoogleMaps}
                />
            </MapContainer>
            {!readonly && (
                <div className="absolute bottom-2 left-2 bg-white/80 p-2 rounded text-xs text-gray-700 pointer-events-none z-[1000]">
                    {position
                        ? `Lat: ${position.lat.toFixed(5)}, Lng: ${position.lng.toFixed(5)}`
                        : 'Haz click para seleccionar ubicación'}
                </div>
            )}
        </div>
    );
}

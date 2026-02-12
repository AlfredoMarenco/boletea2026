import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GeolocationData {
    city: string | null;
    state: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    isLoading: boolean;
    error: string | null;
    hasPermission: boolean | null;
}

interface GeolocationContextType extends GeolocationData {
    refreshLocation: () => void;
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

const STORAGE_KEY = 'user_geolocation';
const STORAGE_EXPIRY_HOURS = 24;

interface StoredLocation {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    timestamp: number;
}

export function GeolocationProvider({ children }: { children: ReactNode }) {
    const [locationData, setLocationData] = useState<GeolocationData>({
        city: null,
        state: null,
        country: null,
        latitude: null,
        longitude: null,
        isLoading: true,
        error: null,
        hasPermission: null,
    });

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'Boletea2026/1.0',
                    },
                }
            );
            const data = await response.json();

            if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.municipality || null;
                const state = data.address.state || null;
                const country = data.address.country || null;

                // Store in localStorage with timestamp
                const storedData: StoredLocation = {
                    city,
                    state,
                    country,
                    latitude: lat,
                    longitude: lng,
                    timestamp: Date.now(),
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

                setLocationData({
                    city,
                    state,
                    country,
                    latitude: lat,
                    longitude: lng,
                    isLoading: false,
                    error: null,
                    hasPermission: true,
                });
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            setLocationData(prev => ({
                ...prev,
                isLoading: false,
                error: 'No se pudo obtener la ciudad',
            }));
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationData(prev => ({
                ...prev,
                isLoading: false,
                error: 'Geolocalización no disponible',
                hasPermission: false,
            }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                reverseGeocode(latitude, longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'No se pudo obtener la ubicación';

                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'Permiso de ubicación denegado';
                }

                setLocationData(prev => ({
                    ...prev,
                    isLoading: false,
                    error: errorMessage,
                    hasPermission: false,
                }));
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const loadStoredLocation = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data: StoredLocation = JSON.parse(stored);
                const now = Date.now();
                const expiryTime = STORAGE_EXPIRY_HOURS * 60 * 60 * 1000;

                // Check if data is still valid
                if (now - data.timestamp < expiryTime) {
                    setLocationData({
                        city: data.city,
                        state: data.state,
                        country: data.country,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        isLoading: false,
                        error: null,
                        hasPermission: true,
                    });
                    return true;
                } else {
                    // Expired, remove from storage
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('Error loading stored location:', error);
        }
        return false;
    };

    const refreshLocation = () => {
        localStorage.removeItem(STORAGE_KEY);
        setLocationData(prev => ({ ...prev, isLoading: true }));
        requestLocation();
    };

    useEffect(() => {
        // Try to load from localStorage first
        const hasStored = loadStoredLocation();

        // If no stored data, request new location
        if (!hasStored) {
            requestLocation();
        }
    }, []);

    return (
        <GeolocationContext.Provider value={{ ...locationData, refreshLocation }}>
            {children}
        </GeolocationContext.Provider>
    );
}

export function useGeolocation() {
    const context = useContext(GeolocationContext);
    if (context === undefined) {
        throw new Error('useGeolocation must be used within a GeolocationProvider');
    }
    return context;
}

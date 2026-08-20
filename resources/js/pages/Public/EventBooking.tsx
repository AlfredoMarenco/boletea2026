import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    MapPin,
    Ticket,
    Shield,
    Clock,
    ShoppingCart,
    CheckCircle2,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import ShowtimeInteractiveMap from '@/pages/Admin/LocalEvents/Showtimes/components/ShowtimeInteractiveMap';

interface Venue {
    name: string;
    address: string;
}

interface SeatingMap {
    id: number;
    name: string;
    layout_json: any;
}

interface Price {
    id: number;
    name: string;
    price: number;
    web_price?: number;
    box_office_price?: number;
    service_charge: number;
    is_web_default?: boolean;
    web_sales_enabled?: boolean;
}

interface Showtime {
    id: number;
    name: string;
    start_time: string;
    seatingMap?: SeatingMap;
    seating_map?: SeatingMap;
    prices: Price[];
}

interface Event {
    id: number;
    name: string;
    slug: string;
    description: string;
    start_date: string;
    venue: Venue;
}

interface SeatInventoryDetail {
    seat_uuid: string;
    status: 'available' | 'reserved' | 'sold' | 'disabled' | 'hidden' | 'hold_courtesy' | 'box_office_only' | 'web_only';
    price?: number;
    category?: string;
    section?: string;
    row?: string;
    number?: string;
    reserved_expires_at?: string;
    session_id?: string;
}

interface Props {
    event: Event;
    showtime: Showtime;
    seatingMap: SeatingMap;
    inventories: Record<string, SeatInventoryDetail>;
}

export default function EventBooking({
    event,
    showtime,
    seatingMap,
    inventories: initialInventories,
}: Props) {
    const [inventories, setInventories] = useState<Record<string, SeatInventoryDetail>>(initialInventories);
    const [selectedSeatUuids, setSelectedSeatUuids] = useState<string[]>([]);
    const [isReserving, setIsReserving] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<number>(0); // en segundos

    // Sincronización de inventarios cuando el servidor envíe actualizaciones
    useEffect(() => {
        setInventories(initialInventories);
    }, [initialInventories]);

    // Construir la estructura completa de la función para el mapa interactivo
    const formattedShowtime = useMemo(() => {
        return {
            ...showtime,
            seating_map: seatingMap,
            seatingMap: seatingMap,
        };
    }, [showtime, seatingMap]);

    // Mapa rápido de precios Web por Nombre de Categoría
    const categoryPricesMap = useMemo(() => {
        const map: Record<string, { price: number; serviceCharge: number }> = {};
        (showtime.prices || []).forEach((p) => {
            if (p.web_sales_enabled !== false) {
                const webVal = p.web_price !== undefined && p.web_price !== null ? Number(p.web_price) : Number(p.price);
                map[p.name.trim().toLowerCase()] = {
                    price: webVal,
                    serviceCharge: Number(p.service_charge || 0),
                };
            }
        });
        return map;
    }, [showtime.prices]);

    // Obtener los detalles de los asientos seleccionados actualmente
    const selectedSeatDetails = useMemo(() => {
        return selectedSeatUuids
            .map((uuid) => inventories[uuid])
            .filter((item): item is SeatInventoryDetail => !!item);
    }, [selectedSeatUuids, inventories]);

    // Reloj regresivo de reserva de 10 minutos
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Expiró el tiempo de reserva: Liberar en servidor
                    if (selectedSeatUuids.length > 0) {
                        axios.post(route('seats.release'), {
                            event_showtime_id: showtime.id,
                            seat_uuids: selectedSeatUuids,
                        }).catch(() => {});
                    }
                    setSelectedSeatUuids([]);
                    toast.warning('Tu tiempo de reserva ha expirado. Los boletos han sido liberados.');
                    router.reload({ only: ['inventories'] });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, selectedSeatUuids, showtime.id]);

    // Formatear minutos y segundos (MM:SS)
    const formattedTime = useMemo(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    // Manejador de Selección de Asientos con Bloqueo Transaccional en Tiempo Real
    const handleSetSelectedSeats = async (newUuids: string[]) => {
        // Limitar máximo 6 asientos por transacción web
        if (newUuids.length > 6) {
            toast.error('Puedes seleccionar un máximo de 6 boletos por transacción.');
            return;
        }

        const addedUuids = newUuids.filter((uuid) => !selectedSeatUuids.includes(uuid));
        const removedUuids = selectedSeatUuids.filter((uuid) => !newUuids.includes(uuid));

        setIsReserving(true);

        try {
            // 1. Liberar asientos deseleccionados
            if (removedUuids.length > 0) {
                await axios.post(route('seats.release'), {
                    event_showtime_id: showtime.id,
                    seat_uuids: removedUuids,
                });

                setInventories((prev) => {
                    const next = { ...prev };
                    removedUuids.forEach((uuid) => {
                        if (next[uuid]) next[uuid] = { ...next[uuid], status: 'available' };
                    });
                    return next;
                });
            }

            // 2. Bloquear y reservar temporalmente nuevos asientos seleccionados
            if (addedUuids.length > 0) {
                const res = await axios.post(route('seats.reserve'), {
                    event_showtime_id: showtime.id,
                    seat_uuids: addedUuids,
                });

                if (res.status === 200) {
                    setInventories((prev) => {
                        const next = { ...prev };
                        addedUuids.forEach((uuid) => {
                            if (next[uuid]) next[uuid] = { ...next[uuid], status: 'reserved' };
                        });
                        return next;
                    });

                    // Iniciar/reiniciar temporizador de 10 minutos
                    setTimeLeft(600);
                    toast.success('Boletos reservados temporalmente por 10 minutos.');
                }
            }

            setSelectedSeatUuids(newUuids);

            if (newUuids.length === 0) {
                setTimeLeft(0);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Algunos boletos seleccionados ya no están disponibles.');
            router.reload({ only: ['inventories'] });
        } finally {
            setIsReserving(false);
        }
    };

    // Cálculos Financieros del Carrito
    const subtotal = useMemo(() => {
        return selectedSeatDetails.reduce((sum, item) => {
            const catKey = (item.category || '').trim().toLowerCase();
            const priceVal = item.price !== undefined && Number(item.price) > 0
                ? Number(item.price)
                : (categoryPricesMap[catKey]?.price || 0);
            return sum + priceVal;
        }, 0);
    }, [selectedSeatDetails, categoryPricesMap]);

    const serviceCharges = useMemo(() => {
        return selectedSeatDetails.reduce((sum, item) => {
            const catKey = (item.category || '').trim().toLowerCase();
            const charge = categoryPricesMap[catKey]?.serviceCharge || 0;
            return sum + charge;
        }, 0);
    }, [selectedSeatDetails, categoryPricesMap]);

    const total = subtotal + serviceCharges;

    const handleProceedToCheckout = () => {
        if (selectedSeatUuids.length === 0) return;
        toast.info('Iniciando proceso de checkout seguro...');
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 dark:bg-background dark:text-slate-100">
            <Head>
                <title>{`Selección de Boletos - ${event.name}`}</title>
                <meta
                    name="description"
                    content={`Selecciona tus asientos en el mapa interactivo para ${event.name} en Boletea 2026.`}
                />
            </Head>

            <PublicHeader />

            <main className="flex flex-1 flex-col pt-28 pb-12">
                {/* Header del Evento con detalles y reloj de reserva */}
                <div className="border-b border-slate-200 bg-card px-6 py-6 lg:px-12 shadow-xs">
                    <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-0.5 text-xs font-black tracking-widest text-[#c90000] uppercase">
                                    Venta Web Oficial
                                </span>
                                {showtime.name && (
                                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md border">
                                        {showtime.name}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-foreground">
                                {event.name}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground pt-1">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-[#c90000]" />
                                    {new Date(event.start_date).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-[#c90000]" />
                                    {event.venue.name} — {event.venue.address}
                                </span>
                            </div>
                        </div>

                        {/* Temporizador de Reserva */}
                        {timeLeft > 0 && (
                            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 shadow-md backdrop-blur-md shrink-0 animate-pulse">
                                <Clock className="h-6 w-6 text-[#c90000]" />
                                <div className="text-right">
                                    <p className="text-[10px] font-bold tracking-wider text-[#c90000] uppercase">
                                        Tiempo de Reserva
                                    </p>
                                    <p className="font-mono text-xl font-black text-[#c90000]">
                                        {formattedTime}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contenido Principal: Mapa Interactivo + Resumen de Carrito */}
                <div className="max-w-[1720px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 lg:px-8 py-6">
                    {/* Mapa Interactivo Oficial de Boletea (9 cols en XL, 8 en LG) */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-3">
                        <ShowtimeInteractiveMap
                            showtime={formattedShowtime as any}
                            inventories={inventories as any}
                            selectedSeatUuids={selectedSeatUuids}
                            mapMode="status"
                            isCustomerView={true}
                            onSetSelectedSeatUuids={handleSetSelectedSeats}
                        />
                    </div>

                    {/* Resumen del Carrito y Bloqueo de Compra (3 cols en XL, 4 en LG) */}
                    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
                        <Card className="border-border bg-card shadow-lg rounded-2xl overflow-hidden flex flex-col h-full">
                            <CardContent className="p-5 flex flex-col h-full space-y-4">
                                <div className="border-b border-border/50 pb-3">
                                    <h3 className="text-base font-black text-foreground flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5 text-[#c90000]" />
                                        Tu Selección ({selectedSeatUuids.length})
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Máximo 6 boletos por transacción.
                                    </p>
                                </div>

                                {/* Lista de Boletos Reservados */}
                                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
                                    {selectedSeatDetails.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
                                            <Ticket className="h-10 w-10 text-muted-foreground/40 stroke-1" />
                                            <p className="text-xs font-bold text-foreground">Ningún boleto seleccionado</p>
                                            <p className="text-[11px] text-muted-foreground max-w-[200px]">
                                                Haz clic en los asientos disponibles en el mapa para agregarlos al carrito.
                                            </p>
                                        </div>
                                    ) : (
                                        selectedSeatDetails.map((item) => {
                                            const catKey = (item.category || '').trim().toLowerCase();
                                            const priceVal = item.price !== undefined && Number(item.price) > 0
                                                ? Number(item.price)
                                                : (categoryPricesMap[catKey]?.price || 0);

                                            return (
                                                <div
                                                    key={item.seat_uuid}
                                                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-3 text-xs shadow-xs"
                                                >
                                                    <div className="space-y-0.5">
                                                        <span className="text-[10px] font-black text-[#c90000] uppercase tracking-wider block">
                                                            {item.category || 'Categoría Web'}
                                                        </span>
                                                        <p className="font-bold text-foreground">
                                                            {item.row ? `Fila ${item.row} — Asiento ${item.number}` : item.section || 'Zona General'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-foreground">
                                                            ${priceVal.toFixed(2)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetSelectedSeats(selectedSeatUuids.filter((id) => id !== item.seat_uuid))}
                                                            className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40"
                                                            title="Quitar boleto del carrito"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Desglose Financiero */}
                                {selectedSeatDetails.length > 0 && (
                                    <div className="border-t border-border/50 pt-3 space-y-2 text-xs">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal ({selectedSeatUuids.length} boletos)</span>
                                            <span className="font-bold text-foreground">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Cargos por Servicio</span>
                                            <span className="font-bold text-foreground">${serviceCharges.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-border/50 pt-2 text-sm font-black text-foreground">
                                            <span>Total a Pagar</span>
                                            <span className="text-[#c90000]">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Botón para Avanzar al Checkout */}
                                <Button
                                    onClick={handleProceedToCheckout}
                                    disabled={selectedSeatUuids.length === 0 || isReserving}
                                    className="w-full h-11 rounded-xl bg-[#c90000] hover:bg-[#a00000] text-[#ffffff] font-bold text-sm shadow-md transition-all gap-2 disabled:opacity-50"
                                >
                                    <Shield className="h-4 w-4 text-[#ffffff]" />
                                    <span>Continuar con la Compra</span>
                                </Button>

                                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Compra 100% segura y garantizada por Boletea</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}

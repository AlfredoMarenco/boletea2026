import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    Info,
    Plus,
    Minus,
    RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface Venue {
    name: string;
    address: string;
}

interface SeatingMap {
    id: number;
    name: string;
    layout_json: {
        nodes: any[];
        config: {
            width: number;
            height: number;
            categories?: any[];
        };
    };
}

interface EventPrice {
    id: number;
    name: string;
    price: number;
    service_charge: number;
}

interface Event {
    id: number;
    name: string;
    slug: string;
    description: string;
    start_date: string;
    venue: Venue;
    prices: EventPrice[];
}

interface SeatInventoryDetail {
    seat_uuid: string;
    status: 'available' | 'reserved' | 'sold' | 'blocked';
    price: number;
    category: string;
    section: string;
    row: string;
    number: string;
}

interface Props {
    event: Event;
    seatingMap: SeatingMap;
    inventories: Record<string, SeatInventoryDetail>;
}

export default function EventBooking({
    event,
    seatingMap,
    inventories: initialInventories,
}: Props) {
    const [inventories, setInventories] =
        useState<Record<string, SeatInventoryDetail>>(initialInventories);
    const [selectedSeats, setSelectedSeats] = useState<SeatInventoryDetail[]>(
        [],
    );
    const [loadingSeatId, setLoadingSeatId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
    const [zoom, setZoom] = useState<number>(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    // Sync initial inventories
    useEffect(() => {
        setInventories(initialInventories);
    }, [initialInventories]);

    const layout = useMemo(() => {
        if (!seatingMap.layout_json) {
            return { nodes: [], config: { categories: [] } };
        }
        if (typeof seatingMap.layout_json === 'string') {
            try {
                return JSON.parse(seatingMap.layout_json);
            } catch (e) {
                console.error('Failed to parse layout_json string', e);
                return { nodes: [], config: { categories: [] } };
            }
        }
        return seatingMap.layout_json;
    }, [seatingMap.layout_json]);

    // Categories from Seating Map config
    const categories = useMemo(() => {
        return layout.config?.categories || [];
    }, [layout]);

    // Build color map for categories
    const categoryColors = useMemo(() => {
        const colors: Record<string, string> = {};
        categories.forEach((cat) => {
            colors[cat.name] = cat.color;
        });
        return colors;
    }, [categories]);

    // Calculate countdown
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setSelectedSeats([]);
                    toast.warning(
                        'Tu tiempo de reserva ha expirado. Los asientos han sido liberados.',
                    );
                    // Refresh inventories
                    router.reload({ only: ['inventories'] });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    // Format time (MM:SS)
    const formattedTime = useMemo(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    // Pan & Zoom controls
    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
    const handleResetView = () => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Drag using left click or middle click
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - panOffset.x,
            y: e.clientY - panOffset.y,
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        setPanOffset({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y,
        });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    // Handle seat click
    const handleSeatClick = async (seatId: string, node: any) => {
        const seatDetail = inventories[seatId];
        if (!seatDetail) return;

        // If seat is sold or blocked, do nothing
        if (seatDetail.status === 'sold' || seatDetail.status === 'blocked')
            return;

        const isAlreadySelected = selectedSeats.some(
            (s) => s.seat_uuid === seatId,
        );

        setLoadingSeatId(seatId);

        if (isAlreadySelected) {
            // Release the seat
            try {
                const res = await axios.post(route('seats.release'), {
                    event_map_id: seatingMap.id,
                    seat_uuids: [seatId],
                });

                if (res.status === 200) {
                    setSelectedSeats((prev) =>
                        prev.filter((s) => s.seat_uuid !== seatId),
                    );
                    setInventories((prev) => ({
                        ...prev,
                        [seatId]: { ...prev[seatId], status: 'available' },
                    }));
                    toast.success('Asiento removido del carrito.');
                    if (selectedSeats.length <= 1) {
                        setTimeLeft(0);
                    }
                }
            } catch (err: any) {
                toast.error(
                    err.response?.data?.message ||
                        'Error al liberar el asiento.',
                );
            }
        } else {
            // Check max 6 limit
            if (selectedSeats.length >= 6) {
                toast.error('Puedes seleccionar un máximo de 6 asientos.');
                setLoadingSeatId(null);
                return;
            }

            // Reserve the seat
            try {
                const res = await axios.post(route('seats.reserve'), {
                    event_map_id: seatingMap.id,
                    seat_uuids: [seatId],
                });

                if (res.status === 200) {
                    const updatedSeat: SeatInventoryDetail = {
                        ...seatDetail,
                        status: 'reserved',
                    };
                    setSelectedSeats((prev) => [...prev, updatedSeat]);
                    setInventories((prev) => ({
                        ...prev,
                        [seatId]: updatedSeat,
                    }));
                    setTimeLeft(600); // 10 minutes
                    toast.success(
                        'Asiento reservado temporalmente por 10 minutos.',
                    );
                }
            } catch (err: any) {
                toast.error(
                    err.response?.data?.message ||
                        'El asiento ya no está disponible.',
                );
                // Refresh list
                router.reload({ only: ['inventories'] });
            }
        }
        setLoadingSeatId(null);
    };

    const totalPrice = useMemo(() => {
        return selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);
    }, [selectedSeats]);

    const totalCharges = useMemo(() => {
        return selectedSeats.reduce((sum, seat) => {
            const priceConfig = event.prices.find(
                (p) => p.name === seat.category,
            );
            return sum + (priceConfig ? Number(priceConfig.service_charge) : 0);
        }, 0);
    }, [selectedSeats, event.prices]);

    const handleCheckout = () => {
        if (selectedSeats.length === 0) return;
        toast.info('Redirigiendo a la pasarela de pago...');
    };

    const nodes = layout.nodes || [];

    // Calculate dynamic bounding box/viewBox of all seats to center them perfectly
    const seatNodes = useMemo(() => {
        return nodes.filter((n: any) => n.type === 'seat');
    }, [nodes]);

    const bounds = useMemo(() => {
        if (seatNodes.length === 0) {
            return { minX: 0, minY: 0, width: 1200, height: 800 };
        }

        // Filter out extreme outliers by finding the median X and Y
        const xs = seatNodes
            .map((n: any) => n.x)
            .sort((a: number, b: number) => a - b);
        const ys = seatNodes
            .map((n: any) => n.y)
            .sort((a: number, b: number) => a - b);
        const medianX = xs[Math.floor(xs.length / 2)] || 0;
        const medianY = ys[Math.floor(ys.length / 2)] || 0;

        // Keep seats within a reasonable distance from the median (e.g., 10,000 pixels)
        const validSeats = seatNodes.filter(
            (n: any) =>
                Math.abs(n.x - medianX) < 10000 &&
                Math.abs(n.y - medianY) < 10000,
        );

        if (validSeats.length === 0) {
            return { minX: 0, minY: 0, width: 1200, height: 800 };
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        validSeats.forEach((n: any) => {
            const r = n.radius || 24;
            if (n.x - r < minX) minX = n.x - r;
            if (n.x + r > maxX) maxX = n.x + r;
            if (n.y - r < minY) minY = n.y - r;
            if (n.y + r > maxY) maxY = n.y + r;
        });

        // Filter text labels by distance to keep relevant zone labels but ignore outlier ones
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const maxDistance = Math.max(maxX - minX, maxY - minY, 1000);

        nodes.forEach((n: any) => {
            if (n.type === 'text') {
                const dist = Math.sqrt(
                    Math.pow(n.x - centerX, 2) + Math.pow(n.y - centerY, 2),
                );
                if (dist <= maxDistance) {
                    if (n.x - 50 < minX) minX = n.x - 50;
                    if (n.x + 50 > maxX) maxX = n.x + 50;
                    if (n.y - 20 < minY) minY = n.y - 20;
                    if (n.y + 20 > maxY) maxY = n.y + 20;
                }
            }
        });

        const padding = 150;
        const w = maxX - minX + padding;
        const h = maxY - minY + padding;

        return {
            minX: minX - padding / 2,
            minY: minY - padding / 2,
            width: w > 100 ? w : 1200,
            height: h > 100 ? h : 800,
        };
    }, [nodes, seatNodes]);

    // Handle focal point centering
    useEffect(() => {
        if (!svgRef.current) return;
        const container = svgRef.current.parentElement;
        if (!container) return;

        const handleResize = () => {
            const rect = container.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;

            if (layout.config?.focus) {
                const f = layout.config.focus;
                const scale = f.zoom || 2.5;
                setZoom(scale);

                const viewBoxScale = Math.min(
                    w / bounds.width,
                    h / bounds.height,
                );
                const viewBoxCenterX = bounds.minX + bounds.width / 2;
                const viewBoxCenterY = bounds.minY + bounds.height / 2;

                const dx = (viewBoxCenterX - f.x) * viewBoxScale * scale;
                const dy = (viewBoxCenterY - f.y) * viewBoxScale * scale;

                setPanOffset({ x: dx, y: dy });
            } else {
                setZoom(1);
                setPanOffset({ x: 0, y: 0 });
            }
        };

        const timer = setTimeout(handleResize, 100);

        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [layout.config?.focus, bounds]);

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 dark:bg-background dark:text-slate-100">
            <Head>
                <title>{`Selección de Asientos - ${event.name}`}</title>
                <meta
                    name="description"
                    content={`Selecciona tus asientos para ${event.name} en Boletea 2026.`}
                />
            </Head>

            <PublicHeader />

            <main className="flex flex-1 flex-col pt-32">
                {/* Banner Section with blur background */}
                <div className="relative flex flex-col items-center gap-6 overflow-hidden border-b border-slate-200 bg-white px-6 py-8 md:flex-row lg:px-16 dark:border-white/5 dark:bg-card">
                    <div className="flex-1">
                        <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold tracking-widest text-[#c90000] uppercase">
                            Venta de Boletos
                        </span>
                        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 lg:text-3xl dark:text-white">
                            {event.name}
                        </h1>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-[#c90000]" />
                                {new Date(event.start_date).toLocaleDateString(
                                    'es-ES',
                                    {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    },
                                )}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-[#c90000]" />
                                {event.venue.name} —{' '}
                                <span className="text-slate-500 dark:text-slate-400">
                                    {event.venue.address}
                                </span>
                            </span>
                        </div>
                    </div>

                    {timeLeft > 0 && (
                        <div className="flex animate-pulse items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-3 shadow-sm backdrop-blur-md">
                            <div className="text-right">
                                <p className="text-[10px] font-bold tracking-wider text-red-500 uppercase">
                                    Tiempo de Reserva
                                </p>
                                <p className="font-mono text-xl font-bold text-red-600">
                                    {formattedTime}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Layout container */}
                <div className="grid flex-1 grid-cols-1 gap-6 p-4 lg:p-8 xl:grid-cols-4">
                    {/* Seat Selector (Col span 3) */}
                    <div className="relative flex min-h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-3 dark:border-white/5 dark:bg-card">
                        {/* Floating Controls */}
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-md dark:border-white/10 dark:bg-[#1a1c20]">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={handleZoomIn}
                                title="Acercar"
                            >
                                <Plus className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={handleZoomOut}
                                title="Alejar"
                            >
                                <Minus className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={handleResetView}
                                title="Reajustar"
                            >
                                <RotateCcw className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                            </Button>
                        </div>

                        {/* Stage Direction Banner */}
                        <div className="w-full border-b border-slate-200 bg-slate-50 py-2 text-center text-xs font-bold tracking-widest text-slate-400 uppercase dark:border-white/5 dark:bg-[#1a1c20]/50 dark:text-slate-500">
                            Escenario / Frente
                        </div>

                        {/* Interactive Canvas container */}
                        <div
                            className="relative flex-1 cursor-grab overflow-hidden bg-slate-50/50 select-none active:cursor-grabbing dark:bg-[#0a0a0a]/30"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <svg
                                ref={svgRef}
                                className="absolute inset-0 h-full w-full origin-center transition-transform duration-100 ease-out"
                                style={{
                                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                                    maxHeight: '70vh',
                                }}
                                viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
                            >
                                {/* Render general shapes/elements */}
                                {nodes.map((node: any) => {
                                    const isSeat = node.type === 'seat';
                                    const seatStatus = isSeat
                                        ? inventories[node.id]?.status ||
                                          'available'
                                        : null;
                                    const isSelected = selectedSeats.some(
                                        (s) => s.seat_uuid === node.id,
                                    );

                                    if (isSeat) {
                                        const baseColor =
                                            categoryColors[node.section] ||
                                            '#64748b';
                                        let fill = baseColor;
                                        let cursor = 'pointer';
                                        let stroke = 'none';
                                        let opacity = 1;

                                        if (seatStatus === 'sold') {
                                            fill = '#ef4444'; // Red
                                            opacity = 0.25;
                                            cursor = 'not-allowed';
                                        } else if (seatStatus === 'blocked') {
                                            fill = '#cbd5e1'; // Grey
                                            opacity = 0.3;
                                            cursor = 'not-allowed';
                                        } else if (isSelected) {
                                            fill = '#c90000'; // Boletea Red
                                            stroke = '#ffffff';
                                        }

                                        return (
                                            <g key={node.id}>
                                                <circle
                                                    cx={node.x}
                                                    cy={node.y}
                                                    r={node.radius || 24}
                                                    fill={fill}
                                                    stroke={stroke}
                                                    strokeWidth={2}
                                                    opacity={opacity}
                                                    style={{
                                                        cursor,
                                                        transition:
                                                            'all 0.15s ease',
                                                    }}
                                                    onClick={() =>
                                                        handleSeatClick(
                                                            node.id,
                                                            node,
                                                        )
                                                    }
                                                    className="transition-opacity duration-100 hover:opacity-80"
                                                />
                                            </g>
                                        );
                                    }

                                    if (node.type === 'text') {
                                        return (
                                            <text
                                                key={node.id}
                                                x={node.x}
                                                y={node.y}
                                                fontSize={node.fontSize || 14}
                                                fontWeight="700"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                opacity={0.9}
                                                className="fill-slate-500 font-bold dark:fill-slate-300"
                                            >
                                                {node.text}
                                            </text>
                                        );
                                    }

                                    if (node.type === 'rect') {
                                        return (
                                            <rect
                                                key={node.id}
                                                x={node.x}
                                                y={node.y}
                                                width={node.width || 50}
                                                height={node.height || 30}
                                                fill={node.fill || '#cbd5e1'}
                                                opacity={0.3}
                                                rx={4}
                                                className="fill-slate-200 dark:fill-slate-700"
                                            />
                                        );
                                    }

                                    return null;
                                })}
                            </svg>
                        </div>

                        {/* Zone legends */}
                        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-slate-200 bg-slate-50 p-4 text-xs dark:border-white/5 dark:bg-[#1a1c20]/50">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <span className="h-3 w-3 rounded-full bg-red-500/30" />{' '}
                                    Vendido
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <span className="h-3 w-3 rounded-full bg-[#c90000]" />{' '}
                                    Seleccionado
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {categories.map((cat: any) => {
                                    const priceConfig = event.prices.find(
                                        (p) => p.name === cat.name,
                                    );
                                    return (
                                        <span
                                            key={cat.id}
                                            className="flex items-center gap-1.5 font-semibold text-slate-700"
                                        >
                                            <span
                                                className="h-3 w-3 rounded-full"
                                                style={{
                                                    backgroundColor: cat.color,
                                                }}
                                            />
                                            {cat.name} (
                                            {priceConfig
                                                ? `$${Number(priceConfig.price).toFixed(2)}`
                                                : '$0.00'}
                                            )
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Summary (Col span 1) */}
                    <div className="flex flex-col gap-6">
                        <Card className="flex h-full flex-col border-slate-200 bg-white text-slate-900 shadow-sm dark:border-white/5 dark:bg-card dark:text-slate-100">
                            <CardContent className="flex flex-1 flex-col gap-6 p-6">
                                <div>
                                    <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
                                        Resumen de Compra
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Selecciona hasta 6 asientos por
                                        transacción.
                                    </p>
                                </div>

                                {/* Seat listing */}
                                <div className="flex max-h-[300px] flex-1 flex-col gap-3 overflow-y-auto">
                                    {selectedSeats.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-slate-400">
                                            <Ticket className="h-12 w-12 stroke-1 text-slate-300" />
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Ningún asiento seleccionado
                                                </p>
                                                <p className="mt-1 text-xs">
                                                    Haz clic en los asientos
                                                    disponibles para agregarlos
                                                    al carrito.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        selectedSeats.map((seat) => (
                                            <div
                                                key={seat.seat_uuid}
                                                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-white/5 dark:bg-[#0a0a0a]/50"
                                            >
                                                <div>
                                                    <p className="text-xs font-bold tracking-wide text-[#c90000] uppercase">
                                                        Zona: {seat.category}
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                        Fila: {seat.row} —
                                                        Asiento: {seat.number}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    $
                                                    {Number(seat.price).toFixed(
                                                        2,
                                                    )}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Summary Totals */}
                                {selectedSeats.length > 0 && (
                                    <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 text-sm">
                                        <div className="flex justify-between text-slate-500">
                                            <span>
                                                Boletos ({selectedSeats.length})
                                            </span>
                                            <span>
                                                ${totalPrice.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-slate-500">
                                            <span>Cargos de Servicio</span>
                                            <span>
                                                ${totalCharges.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                                            <span>Total</span>
                                            <span>
                                                $
                                                {(
                                                    totalPrice + totalCharges
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Purchase Button */}
                                <Button
                                    className="w-full rounded-xl bg-[#c90000] py-6 text-base font-semibold text-white shadow-md shadow-red-600/10 transition-colors hover:bg-[#a00000]"
                                    disabled={selectedSeats.length === 0}
                                    onClick={handleCheckout}
                                >
                                    <Shield className="mr-2 h-4 w-4" />
                                    Continuar con la Compra
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}

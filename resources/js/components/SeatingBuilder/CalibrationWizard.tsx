import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Stage,
    Layer,
    Image,
    Circle,
    Group,
    Line,
    Text as KonvaText,
} from 'react-konva';
import useImage from 'use-image';
import { Move, ZoomIn, Info, Check } from 'lucide-react';

interface CalibrationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onFinish: (data: {
        url: string;
        imgScale: number;
        imgX: number;
        imgY: number;
        seatRadius: number;
        seatSpacing: number;
        opacity: number;
    }) => void;
    initialImage?: string | null;
}

interface CalibrationConfig {
    imgScale: number;
    imgX: number;
    imgY: number;
    seatRadius: number;
    seatSpacing: number;
    opacity: number;
}

const CalibrationWizard: React.FC<CalibrationWizardProps> = ({
    isOpen,
    onClose,
    onFinish,
    initialImage = null,
}) => {
    const [imgUrl, setImgUrl] = useState<string>(initialImage || '');
    const [image] = useImage(imgUrl);
    const [config, setConfig] = useState<CalibrationConfig>({
        imgScale: 1,
        imgX: 100,
        imgY: 100,
        seatRadius: 10,
        seatSpacing: 35,
        opacity: 0.6,
    });

    const [containerSize, setContainerSize] = useState({
        width: 800,
        height: 600,
    });
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const containerRef = React.useCallback((node: HTMLDivElement | null) => {
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
            resizeObserverRef.current = null;
        }
        if (node !== null) {
            const observer = new ResizeObserver((entries) => {
                if (entries[0]) {
                    setContainerSize({
                        width: entries[0].contentRect.width,
                        height: entries[0].contentRect.height,
                    });
                }
            });
            observer.observe(node);
            resizeObserverRef.current = observer;
        }
    }, []);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImgUrl(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFinish = () => {
        onFinish({
            url: imgUrl,
            ...config,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex h-[90vh] w-full max-w-[92vw] flex-col gap-0 overflow-hidden border-none bg-background p-0 shadow-2xl sm:max-w-[92vw]">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <ZoomIn className="h-5 w-5 text-blue-500" />
                        Asistente de Calibración de Plano
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        Ajusta el fondo para que coincida con el tamaño real de
                        los asientos
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden border-y">
                    {/* Left: Preview Canvas */}
                    <div
                        className="relative flex-1 bg-slate-100 dark:bg-slate-900"
                        ref={containerRef}
                    >
                        <div className="pointer-events-none absolute top-2 left-2 z-50 rounded bg-black/80 px-2 py-1 font-mono text-[10px] text-white">
                            Canvas: {containerSize.width}x{containerSize.height}
                            px
                        </div>
                        {!imgUrl ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-12 text-center">
                                <div className="animate-pulse rounded-full border-2 border-dashed border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
                                    <Move className="h-12 w-12 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-foreground">
                                        Cargar Plano de Referencia
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Sube una imagen (PNG, JPG) del plano del
                                        recinto para comenzar
                                    </p>
                                </div>
                                <Button
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="grow-0 bg-blue-600 shadow-lg shadow-blue-500/20 hover:bg-blue-700"
                                >
                                    Seleccionar Archivo
                                </Button>
                            </div>
                        ) : (
                            <Stage
                                width={containerSize.width}
                                height={containerSize.height}
                                className="bg-slate-200 dark:bg-slate-950"
                            >
                                <Layer
                                    draggable
                                    x={config.imgX}
                                    y={config.imgY}
                                    onDragEnd={(e) =>
                                        setConfig({
                                            ...config,
                                            imgX: e.target.x(),
                                            imgY: e.target.y(),
                                        })
                                    }
                                >
                                    {image && (
                                        <Image
                                            image={image}
                                            scaleX={config.imgScale}
                                            scaleY={config.imgScale}
                                            opacity={config.opacity}
                                        />
                                    )}
                                </Layer>
                                {/* Fixed Reference Layer (Static in view) */}
                                <Layer
                                    x={
                                        containerSize.width / 2 -
                                        config.seatSpacing
                                    }
                                    y={containerSize.height / 2}
                                >
                                    <Group>
                                        <Circle
                                            radius={config.seatRadius}
                                            fill="#3b82f6"
                                            opacity={0.8}
                                            shadowBlur={10}
                                            shadowColor="#3b82f6"
                                        />
                                        <Circle
                                            radius={config.seatRadius}
                                            x={config.seatSpacing}
                                            fill="#3b82f6"
                                            opacity={0.8}
                                            shadowBlur={10}
                                            shadowColor="#3b82f6"
                                        />
                                        <Circle
                                            radius={config.seatRadius}
                                            x={config.seatSpacing * 2}
                                            fill="#3b82f6"
                                            opacity={0.8}
                                            shadowBlur={10}
                                            shadowColor="#3b82f6"
                                        />

                                        <Line
                                            points={[
                                                -config.seatRadius * 2,
                                                0,
                                                config.seatSpacing * 2 +
                                                    config.seatRadius * 2,
                                                0,
                                            ]}
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dash={[5, 5]}
                                        />

                                        <KonvaText
                                            text="REFERENCIA DE 3 ASIENTOS"
                                            fontSize={14}
                                            fontStyle="bold"
                                            fill="#3b82f6"
                                            y={config.seatRadius + 15}
                                            x={-30}
                                            width={config.seatSpacing * 3}
                                            align="center"
                                        />
                                    </Group>
                                </Layer>
                            </Stage>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Right: Controls */}
                    <div className="w-80 space-y-8 overflow-y-auto border-l bg-card p-6">
                        <section className="space-y-4">
                            <h3 className="flex items-center text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                <Info className="mr-2 h-3 w-3" />
                                Instrucciones
                            </h3>
                            <p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                                Arrastra la imagen y usa el zoom para que los
                                **círculos azules** coincidan con los dibujos de
                                los asientos en tu plano.
                            </p>
                        </section>

                        <section className="space-y-6 border-t pt-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold tracking-tighter uppercase">
                                        Zoom del Plano
                                    </Label>
                                    <span className="rounded bg-muted px-1.5 text-[10px]">
                                        {(config.imgScale * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="5"
                                    step="0.01"
                                    value={config.imgScale}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            imgScale: parseFloat(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-blue-600"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold tracking-tighter uppercase">
                                        Tamaño de Asiento RL
                                    </Label>
                                    <span className="rounded bg-muted px-1.5 text-[10px]">
                                        {config.seatRadius}px
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="2"
                                    max="50"
                                    step="1"
                                    value={config.seatRadius}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            seatRadius: parseInt(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-blue-600"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold tracking-tighter uppercase">
                                        Espacio entre Asientos
                                    </Label>
                                    <span className="rounded bg-muted px-1.5 text-[10px]">
                                        {config.seatSpacing}px
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={config.seatSpacing}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            seatSpacing: parseInt(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-blue-600"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-bold tracking-tighter uppercase">
                                    Opacidad del Plano
                                </Label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.01"
                                    value={config.opacity}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            opacity: parseFloat(e.target.value),
                                        })
                                    }
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-blue-600"
                                />
                            </div>
                        </section>

                        {imgUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Cambiar imagen...
                            </Button>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t bg-muted/10 p-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-xs font-bold tracking-widest uppercase"
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={!imgUrl}
                        onClick={handleFinish}
                        className="bg-blue-600 px-8 text-xs font-bold tracking-widest uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-700"
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Finalizar Calibración
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CalibrationWizard;

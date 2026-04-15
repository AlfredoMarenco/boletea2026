import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Stage, Layer, Image, Circle, Group, Line, Text as KonvaText } from 'react-konva';
import useImage from 'use-image';
import { Move, ZoomIn, Info, Check } from 'lucide-react';

const CalibrationWizard = ({ isOpen, onClose, onFinish, initialImage = null }) => {
    const [imgUrl, setImgUrl] = useState(initialImage || '');
    const [image] = useImage(imgUrl);
    const [config, setConfig] = useState({
        imgScale: 1,
        imgX: 100,
        imgY: 100,
        seatRadius: 10,
        seatSpacing: 35,
        opacity: 0.6
    });

    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current && isOpen) {
            const updateSize = () => {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            };
            updateSize();
            window.addEventListener('resize', updateSize);
            return () => window.removeEventListener('resize', updateSize);
        }
    }, [isOpen]);

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setImgUrl(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleFinish = () => {
        onFinish({
            url: imgUrl,
            ...config
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[92vw] sm:max-w-[92vw] w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-none shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <ZoomIn className="h-5 w-5 text-blue-500" />
                        Asistente de Calibración de Plano
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                        Ajusta el fondo para que coincida con el tamaño real de los asientos
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden border-y">
                    {/* Left: Preview Canvas */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900 relative" ref={containerRef}>
                        {!imgUrl ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-4">
                                <div className="p-6 rounded-full bg-blue-50 dark:bg-blue-950/30 border-2 border-dashed border-blue-200 dark:border-blue-800 animate-pulse">
                                    <Move className="h-12 w-12 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-foreground">Cargar Plano de Referencia</h4>
                                    <p className="text-sm text-muted-foreground">Sube una imagen (PNG, JPG) del plano del recinto para comenzar</p>
                                </div>
                                <Button onClick={() => fileInputRef.current?.click()} className="grow-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
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
                                    onDragEnd={(e) => setConfig({...config, imgX: e.target.x(), imgY: e.target.y()})}
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
                                <Layer x={containerSize.width / 2 - config.seatSpacing} y={containerSize.height / 2}>
                                    <Group>
                                        <Circle radius={config.seatRadius} fill="#3b82f6" opacity={0.8} shadowBlur={10} shadowColor="#3b82f6" />
                                        <Circle radius={config.seatRadius} x={config.seatSpacing} fill="#3b82f6" opacity={0.8} shadowBlur={10} shadowColor="#3b82f6" />
                                        <Circle radius={config.seatRadius} x={config.seatSpacing * 2} fill="#3b82f6" opacity={0.8} shadowBlur={10} shadowColor="#3b82f6" />
                                        
                                        <Line 
                                            points={[-config.seatRadius * 2, 0, config.seatSpacing * 2 + config.seatRadius * 2, 0]} 
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
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    {/* Right: Controls */}
                    <div className="w-80 bg-card border-l p-6 space-y-8 overflow-y-auto">
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                <Info className="h-3 w-3 mr-2" />
                                Instrucciones
                            </h3>
                            <p className="text-xs leading-relaxed text-muted-foreground bg-muted/30 p-3 rounded-lg border">
                                Arrastra la imagen y usa el zoom para que los **círculos azules** coincidan con los dibujos de los asientos en tu plano.
                            </p>
                        </section>

                        <section className="space-y-6 pt-4 border-t">
                             <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold uppercase tracking-tighter">Zoom del Plano</Label>
                                    <span className="text-[10px] bg-muted px-1.5 rounded">{(config.imgScale * 100).toFixed(0)}%</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0.1" 
                                    max="5" 
                                    step="0.01"
                                    value={config.imgScale} 
                                    onChange={(e) => setConfig({...config, imgScale: parseFloat(e.target.value)})} 
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold uppercase tracking-tighter">Tamaño de Asiento RL</Label>
                                    <span className="text-[10px] bg-muted px-1.5 rounded">{config.seatRadius}px</span>
                                </div>
                                <input 
                                    type="range"
                                    min="2" 
                                    max="50" 
                                    step="1"
                                    value={config.seatRadius} 
                                    onChange={(e) => setConfig({...config, seatRadius: parseInt(e.target.value)})} 
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold uppercase tracking-tighter">Espacio entre Asientos</Label>
                                    <span className="text-[10px] bg-muted px-1.5 rounded">{config.seatSpacing}px</span>
                                </div>
                                <input 
                                    type="range"
                                    min="0" 
                                    max="100" 
                                    step="1"
                                    value={config.seatSpacing} 
                                    onChange={(e) => setConfig({...config, seatSpacing: parseInt(e.target.value)})} 
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-tighter">Opacidad del Plano</Label>
                                <input 
                                    type="range"
                                    min="0.1" 
                                    max="1" 
                                    step="0.01"
                                    value={config.opacity} 
                                    onChange={(e) => setConfig({...config, opacity: parseFloat(e.target.value)})} 
                                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        </section>
                        
                        {imgUrl && (
                            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => fileInputRef.current?.click()}>
                                Cambiar imagen...
                            </Button>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/10 border-t">
                    <Button variant="ghost" onClick={onClose} className="text-xs uppercase tracking-widest font-bold">Cancelar</Button>
                    <Button 
                        disabled={!imgUrl} 
                        onClick={handleFinish}
                        className="bg-blue-600 hover:bg-blue-700 text-xs font-bold uppercase tracking-widest px-8 shadow-lg shadow-blue-500/20"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Finalizar Calibración
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CalibrationWizard;

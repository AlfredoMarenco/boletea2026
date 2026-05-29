import React from 'react';
import { Ticket } from 'lucide-react';

interface Props {
    progress: number;
    text?: string;
    show?: boolean;
}

export default function TicketProgressBar({ progress, text = "Procesando...", show = false }: Props) {
    if (!show) return null;
    
    // Aseguramos que el progreso esté entre 0 y 100
    const safeProgress = Math.max(0, Math.min(100, progress || 0));

    return (
        <div className="w-full py-2 animate-in fade-in duration-300">
            <div className="flex justify-between items-center text-sm font-medium mb-2 px-1">
                <span className="text-gray-600 dark:text-gray-300 animate-pulse flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-primary animate-bounce" />
                    {text}
                </span>
                <span className="text-primary tabular-nums font-bold">{safeProgress}%</span>
            </div>
            
            <div className="relative w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner overflow-visible mt-3">
                {/* Animated fill */}
                <div 
                    className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ 
                        width: `${safeProgress}%`,
                        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                        backgroundSize: '1rem 1rem',
                        animation: 'progress-stripes 1s linear infinite'
                    }}
                >
                    {/* The ticket icon riding the edge of the progress bar */}
                    {safeProgress > 0 && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white dark:bg-card border-2 border-primary rounded-full p-1 shadow-md transition-transform hover:scale-110">
                            <Ticket className="w-3 h-3 text-primary" style={{ transform: 'rotate(15deg)' }} />
                        </div>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes progress-stripes {
                    from { background-position: 1rem 0; }
                    to { background-position: 0 0; }
                }
            `}} />
        </div>
    );
}

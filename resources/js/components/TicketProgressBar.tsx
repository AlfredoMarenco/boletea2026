import React from 'react';
import { Ticket } from 'lucide-react';

interface Props {
    progress: number;
    text?: string;
    show?: boolean;
}

export default function TicketProgressBar({
    progress,
    text = 'Procesando...',
    show = false,
}: Props) {
    if (!show) return null;

    // Aseguramos que el progreso esté entre 0 y 100
    const safeProgress = Math.max(0, Math.min(100, progress || 0));

    return (
        <div className="w-full animate-in py-2 duration-300 fade-in">
            <div className="mb-2 flex items-center justify-between px-1 text-sm font-medium">
                <span className="flex animate-pulse items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Ticket className="h-4 w-4 animate-bounce text-primary" />
                    {text}
                </span>
                <span className="font-bold text-primary tabular-nums">
                    {safeProgress}%
                </span>
            </div>

            <div className="relative mt-3 h-3 w-full overflow-visible rounded-full bg-gray-100 shadow-inner dark:bg-gray-800">
                {/* Animated fill */}
                <div
                    className="absolute top-0 left-0 h-full rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{
                        width: `${safeProgress}%`,
                        backgroundImage:
                            'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                        backgroundSize: '1rem 1rem',
                        animation: 'progress-stripes 1s linear infinite',
                    }}
                >
                    {/* The ticket icon riding the edge of the progress bar */}
                    {safeProgress > 0 && (
                        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white p-1 shadow-md transition-transform hover:scale-110 dark:bg-card">
                            <Ticket
                                className="h-3 w-3 text-primary"
                                style={{ transform: 'rotate(15deg)' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes progress-stripes {
                    from { background-position: 1rem 0; }
                    to { background-position: 0 0; }
                }
            `,
                }}
            />
        </div>
    );
}

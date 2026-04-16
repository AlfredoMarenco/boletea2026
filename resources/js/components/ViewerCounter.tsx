import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface Props {
    eventId: number | string;
}

/**
 * ViewerCounter component that displays a simulated "live" viewer count
 * to provide social proof and urgency on event pages.
 */
export default function ViewerCounter({ eventId }: Props) {
    // Simple stable hash to generate a consistent initial viewer count for a specific event
    const getInitialViewers = (id: string | number) => {
        const s = String(id);
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash) + s.charCodeAt(i);
            hash |= 0;
        }
        // Base count between 42 and 130
        return Math.abs(hash % 88) + 42;
    };

    const [viewers, setViewers] = useState(() => getInitialViewers(eventId));
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Staggered appearance for premium feel
        const timeout = setTimeout(() => setIsVisible(true), 800);

        // Fluctuate the number slightly to simulate real-time activity
        const interval = setInterval(() => {
            setViewers((prev) => {
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                const newVal = prev + change;
                // Keep it within a reasonable "busy" range
                return newVal < 30 ? 30 : (newVal > 300 ? 300 : newVal);
            });
        }, 6000 + Math.random() * 4000); // Between 6 and 10 seconds

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, []);

    if (!isVisible) return <div className="h-10 mt-4" />; // Placeholder for layout stability

    return (
        <div 
            className="flex items-center gap-3 py-1.5 px-3 bg-red-50/50 dark:bg-red-500/5 rounded-xl border border-red-100/50 dark:border-red-500/10 transition-all duration-700 animate-in fade-in slide-in-from-bottom-2"
        >
            {/* Live Indicator */}
            <div className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </div>

            <div className="flex items-center gap-2">
                <Users className="size-4 text-red-600/70 dark:text-red-500/70 shrink-0" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="text-gray-900 dark:text-white tabular-nums font-black">
                        {viewers}
                    </span>
                    {' '}viendo ahora
                </p>
            </div>
        </div>
    );
}

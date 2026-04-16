import React, { useState, useEffect } from 'react';

interface TimeLeft {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
}

export default function Countdown({ targetDate, onComplete }: { targetDate: string; onComplete?: () => void }) {
    const calculateTimeLeft = (): TimeLeft => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: TimeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else if (onComplete) {
            // Ensure onComplete is called only once effectively by checking if it was already expired or handling correctly in parent
            // But since this runs every second, we should be careful. 
            // Better to handle "just finished" logic.
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
    const [hasFinished, setHasFinished] = useState(false);

    useEffect(() => {
        if (hasFinished) return;

        const timer = setTimeout(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (Object.keys(newTimeLeft).length === 0) {
                setHasFinished(true);
                if (onComplete) onComplete();
            }
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: React.ReactNode[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        const key = interval as keyof TimeLeft;
        if (!timeLeft[key] && timeLeft[key] !== 0) {
            return;
        }

        timerComponents.push(
            <div key={interval} className="flex flex-col items-center justify-center p-2 sm:p-3 bg-gray-50/80 rounded-xl border border-gray-100 dark:bg-white/[0.03] dark:border-white/5 min-w-[65px] sm:min-w-[75px] transition-all">
                <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tighter text-[#c90000]">
                    {(timeLeft[key] || 0).toString().padStart(2, '0')}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-0.5">
                    {interval === 'days' ? 'Días' : 
                     interval === 'hours' ? 'Hrs' : 
                     interval === 'minutes' ? 'Min' : 'Seg'}
                </span>
            </div>
        );
    });

    return (
        <div className="flex items-center gap-3 sm:gap-4">
            {timerComponents.length ? timerComponents : (
                <span className="px-6 py-2 bg-green-500/10 text-green-500 rounded-full text-xs font-black uppercase tracking-widest border border-green-500/20">
                    ¡Venta Disponible!
                </span>
            )}
        </div>
    );
}

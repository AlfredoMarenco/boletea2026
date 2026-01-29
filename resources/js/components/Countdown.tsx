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
            <div key={interval} className="flex flex-col items-center p-2 bg-gray-100 rounded-lg dark:bg-white/5">
                <span className="text-xl font-bold font-mono text-[#c90000]">
                    {(timeLeft[key] || 0).toString().padStart(2, '0')}
                </span>
                <span className="text-xs uppercase text-gray-500">{interval}</span>
            </div>
        );
    });

    return (
        <>
            {timerComponents.length ? timerComponents : <span>¡Ya disponible!</span>}
        </>
    );
}

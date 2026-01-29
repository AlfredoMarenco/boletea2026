import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export default function GlobalLoader() {
    const [isLoading, setIsLoading] = useState(true); // Default to true for initial load

    useEffect(() => {
        // Initial check - if we are already in admin, don't show loader
        if (window.location.pathname.startsWith('/admin')) {
            setIsLoading(false);
            return;
        }

        // Initial load timeout
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        // Inertia event listeners
        const startListener = router.on('start', (event) => {
            // Don't show loader if navigating to admin
            const url = new URL(event.detail.visit.url);
            if (!url.pathname.startsWith('/admin')) {
                setIsLoading(true);
            }
        });

        const finishListener = router.on('finish', () => {
            // Add a small delay for smoother transition
            setTimeout(() => setIsLoading(false), 500);
        });

        return () => {
            clearTimeout(timer);
            startListener();
            finishListener();
        };
    }, []);

    if (!isLoading || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-black transition-opacity duration-500 ease-in-out opacity-85">
            <div className="relative flex flex-col items-center">
                <img
                    src="https://boletea.com/img/logoBoletea.png"
                    alt="Boletea Logo"
                    className="h-24 w-auto animate-pulse"
                />
                <div className="mt-8 flex gap-2">
                    <span className="sr-only">Cargando...</span>
                    <div className="h-2 w-2 rounded-full bg-[#c90000] animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 rounded-full bg-[#c90000] animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 rounded-full bg-[#c90000] animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}

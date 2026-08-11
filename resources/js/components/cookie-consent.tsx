import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Al montar el componente, verifica si el usuario ya aceptó o rechazó las cookies
        const consent = localStorage.getItem('boletea_cookie_consent');
        if (!consent) {
            // Un pequeño retraso para que no aparezca inmediatamente
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('boletea_cookie_consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('boletea_cookie_consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed right-0 bottom-0 left-0 z-[100] animate-in duration-500 slide-in-from-bottom-5 fade-in sm:right-auto sm:bottom-6 sm:left-6">
            <div className="relative max-w-[450px] overflow-hidden border-t border-gray-200 bg-white p-6 shadow-2xl sm:rounded-2xl sm:border sm:p-8 dark:border-border dark:bg-card">
                {/* Background effect */}
                <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#c90000] opacity-[0.05] blur-2xl"></div>

                <div className="flex items-start gap-4">
                    <div className="shrink-0 rounded-full bg-red-50 p-3 text-[#c90000] dark:bg-red-950/30">
                        <Cookie className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                        <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                            Respetamos tu privacidad
                        </h3>
                        <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-muted-foreground">
                            Utilizamos cookies propias y de terceros para
                            mejorar tu experiencia en nuestro sitio web,
                            analizar el tráfico y personalizar el contenido.
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                onClick={handleAccept}
                                className="border-0 bg-[#c90000] text-white shadow-lg shadow-red-900/20 hover:bg-[#a00000] sm:flex-1"
                            >
                                Aceptar todas
                            </Button>
                            <Button
                                onClick={handleDecline}
                                variant="outline"
                                className="border-gray-200 hover:bg-gray-100 sm:flex-1 dark:border-border dark:hover:bg-white/5"
                            >
                                Solo esenciales
                            </Button>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

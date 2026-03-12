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
        <div className="fixed bottom-0 left-0 right-0 z-[100] sm:bottom-6 sm:left-6 sm:right-auto animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-white dark:bg-[#1a1a1a] border-t sm:border border-gray-200 dark:border-white/10 sm:rounded-2xl shadow-2xl p-6 sm:p-8 max-w-[450px] relative overflow-hidden">
                {/* Background effect */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#c90000] opacity-[0.05] rounded-full blur-2xl"></div>
                
                <div className="flex items-start gap-4">
                    <div className="shrink-0 p-3 bg-red-50 dark:bg-red-950/30 rounded-full text-[#c90000]">
                        <Cookie className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Respetamos tu privacidad
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Utilizamos cookies propias y de terceros para mejorar tu experiencia en nuestro sitio web, analizar el tráfico y personalizar el contenido.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                                onClick={handleAccept}
                                className="sm:flex-1 bg-[#c90000] hover:bg-[#a00000] text-white border-0 shadow-lg shadow-red-900/20"
                            >
                                Aceptar todas
                            </Button>
                            <Button 
                                onClick={handleDecline}
                                variant="outline" 
                                className="sm:flex-1 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                                Solo esenciales
                            </Button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

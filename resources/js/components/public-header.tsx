import { ModeToggle } from '@/components/mode-toggle';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useAppearance } from '@/hooks/use-appearance';
import { User } from 'lucide-react';

interface Props {
    canRegister?: boolean;
}

export default function PublicHeader({ canRegister = false }: Props) {
    const { resolvedAppearance } = useAppearance();

    return (
        <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md dark:bg-background/80 dark:border-border">
            <div className="container mx-auto flex h-20 items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    {/* Logo */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <Link href={route('home')} className="group flex items-center justify-center">
                            <img
                                src={resolvedAppearance === 'dark' ? '/images/logoBoleteaDarkTheme.png' : 'https://boletea.com/img/logoBoletea.png'}
                                alt="Boletea"
                                className="h-8 md:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => { e.currentTarget.src = 'https://boletea.com/img/logoBoletea.png'; }}
                            />
                        </Link>
                        <div className="h-6 w-px bg-gray-200 dark:bg-border/50 hidden md:block rounded-full"></div>
                        <Link href={route('static.bolepay')} className="group flex items-center justify-center">
                            <img
                                src={resolvedAppearance === 'dark' ? '/images/LOGOBOLEPAYNEGRO.png' : '/images/LOGOBOLEPAY.png'}
                                alt="Bolepay"
                                className="h-9 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => { e.currentTarget.src = '/images/LOGOBOLEPAY.png'; }}
                            />
                        </Link>
                    </div>
                </div>
                <nav className="hidden items-center gap-6 md:flex">
                    <a
                        href={route('home')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors"
                    >
                        Inicio
                    </a>
                    <a
                        href={route('static.quienessomos')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors"
                    >
                        Quiénes Somos
                    </a>
                    <a
                        href={route('static.terminosycondiciones')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors"
                    >
                        Términos y Condiciones
                    </a>
                    <a
                        href={route('static.avisodeprivacidad')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors"
                    >
                        Aviso de Privacidad
                    </a>
                    <a
                        href={route('static.ticketassist')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors"
                    >
                        Ticket Assist
                    </a>
                    {/* <a
                        href={route('static.bolepay')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors"
                    >
                        Bolepay
                    </a> */}
                    <a
                        href={route('sales-centers.public')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors"
                    >
                        Centros de Venta
                    </a>
                </nav>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <a
                        href="https://boletea.com.mx/login.asp?gifrompage=2&gitopage=2"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition-all hover:bg-[#c90000] hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-[#c90000]"
                        title="Iniciar Sesión"
                    >
                        <User className="h-5 w-5" />
                    </a>
                </div>
            </div>
        </header>
    );
}

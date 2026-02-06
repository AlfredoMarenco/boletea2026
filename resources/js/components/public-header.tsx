import { ModeToggle } from '@/components/mode-toggle';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { User } from 'lucide-react';

interface Props {
    canRegister?: boolean;
}

export default function PublicHeader({ canRegister = false }: Props) {
    return (
        <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md dark:bg-black/80 dark:border-white/5">
            <div className="container mx-auto flex h-20 items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    {/* Logo */}
                    <div className="flex items-center gap-2 hover:gap-4 transition-all duration-300">
                        <Link href={route('home')}>
                            <img
                                src="https://boletea.com/img/logoBoletea.png"
                                alt="Boletea"
                                className="h-10 w-auto hover:h-12 transition-all duration-300"
                            />
                        </Link>
                        <Link href={route('static.bolepay')}>
                            <img
                                src="./images/LOGOBOLEPAY.png"
                                alt="Bolepay"
                                className="h-14 w-auto hover:h-16 transition-all duration-300"
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
                    <Link
                        href="#"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition-all hover:bg-[#c90000] hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-[#c90000]"
                        title="Iniciar Sesión"
                    >
                        <User className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </header>
    );
}

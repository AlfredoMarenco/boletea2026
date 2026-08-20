import { ModeToggle } from '@/components/mode-toggle';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useAppearance } from '@/hooks/use-appearance';
import { User, Menu, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface Props {
    canRegister?: boolean;
}

export default function PublicHeader({ canRegister = false }: Props) {
    const { resolvedAppearance } = useAppearance();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setLoginDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md dark:border-border dark:bg-background/80">
                <div className="container mx-auto flex h-20 items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        {/* Logo */}
                        <div className="flex items-center gap-4 md:gap-6">
                            <Link
                                href={route('home')}
                                className="group flex items-center justify-center"
                            >
                                <img
                                    src={
                                        resolvedAppearance === 'dark'
                                            ? '/images/logoBoleteaDarkTheme.png'
                                            : 'https://boletea.com/img/logoBoletea.png'
                                    }
                                    alt="Boletea"
                                    className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105 md:h-10"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            'https://boletea.com/img/logoBoletea.png';
                                    }}
                                />
                            </Link>

                            <div className="hidden h-6 w-px rounded-full bg-gray-200 md:block dark:bg-border/50"></div>
                            <Link
                                href={route('static.bolepay')}
                                className="group flex items-center justify-center"
                            >
                                <img
                                    src={
                                        resolvedAppearance === 'dark'
                                            ? '/images/LOGOBOLEPAYNEGRO.png'
                                            : '/images/LOGOBOLEPAY.png'
                                    }
                                    alt="Bolepay"
                                    className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 md:h-12"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            '/images/LOGOBOLEPAY.png';
                                    }}
                                />
                            </Link>
                        </div>
                    </div>
                    <nav className="hidden items-center gap-6 md:flex">
                        <a
                            href={route('home')}
                            className="text-sm font-medium transition-colors hover:text-[#c90000]"
                        >
                            Inicio
                        </a>
                        <a
                            href={route('static.quienessomos')}
                            className="text-sm font-medium transition-colors hover:text-[#c90000]"
                        >
                            Quiénes Somos
                        </a>
                        <a
                            href={route('static.terminosycondiciones')}
                            className="text-sm font-medium transition-colors hover:text-[#c90000]"
                        >
                            Términos y Condiciones
                        </a>
                        <a
                            href={route('static.avisodeprivacidad')}
                            className="text-sm font-medium transition-colors hover:text-[#c90000]"
                        >
                            Aviso de Privacidad
                        </a>
                        <a
                            href={route('static.ticketassist')}
                            className="text-sm font-medium transition-colors hover:text-[#c90000]"
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
                            className="text-sm font-medium transition-colors hover:text-[#c90000]"
                        >
                            Centros de Venta
                        </a>
                        <a
                            href={route('refund.form')}
                            className="text-sm font-semibold text-[#c90000] transition-colors hover:text-[#a70000] dark:text-red-400 dark:hover:text-red-300"
                        >
                            Reembolsos
                        </a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() =>
                                    setLoginDropdownOpen(!loginDropdownOpen)
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition-all hover:bg-[#c90000] hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-[#c90000]"
                                title="Iniciar Sesión"
                            >
                                <User className="h-5 w-5" />
                            </button>

                            {loginDropdownOpen && (
                                <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-in rounded-xl border border-gray-100 bg-white p-2 shadow-xl shadow-gray-200/50 duration-200 fade-in slide-in-from-top-2 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
                                    <a
                                        href="https://boletea.com.mx/login.asp?gifrompage=2&gitopage=2"
                                        className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#c90000] dark:text-gray-200 dark:hover:bg-neutral-800 dark:hover:text-[#c90000]"
                                        onClick={() =>
                                            setLoginDropdownOpen(false)
                                        }
                                    >
                                        Iniciar como cliente
                                    </a>
                                    <a
                                        href="https://boletea.com.mx/reporting"
                                        className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#c90000] dark:text-gray-200 dark:hover:bg-neutral-800 dark:hover:text-[#c90000]"
                                        onClick={() =>
                                            setLoginDropdownOpen(false)
                                        }
                                    >
                                        Iniciar como promotor
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Hamburger Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition hover:bg-gray-200 md:hidden dark:bg-white/10 dark:text-white dark:hover:bg-neutral-800"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile menu dropdown */}
                {mobileMenuOpen && (
                    <div className="flex animate-in flex-col gap-4 border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-md duration-200 slide-in-from-top md:hidden dark:border-neutral-800 dark:bg-neutral-900/95">
                        <a
                            href={route('home')}
                            className="py-1 text-sm font-medium transition-colors hover:text-[#c90000]"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Inicio
                        </a>
                        <a
                            href={route('static.quienessomos')}
                            className="py-1 text-sm font-medium transition-colors hover:text-[#c90000]"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Quiénes Somos
                        </a>
                        <a
                            href={route('static.terminosycondiciones')}
                            className="py-1 text-sm font-medium transition-colors hover:text-[#c90000]"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Términos y Condiciones
                        </a>
                        <a
                            href={route('static.avisodeprivacidad')}
                            className="py-1 text-sm font-medium transition-colors hover:text-[#c90000]"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Aviso de Privacidad
                        </a>
                        <a
                            href={route('static.ticketassist')}
                            className="py-1 text-sm font-medium transition-colors hover:text-[#c90000]"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Ticket Assist
                        </a>
                        <a
                            href={route('sales-centers.public')}
                            className="py-1 text-sm font-medium transition-colors hover:text-[#c90000]"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Centros de Venta
                        </a>
                        <a
                            href={route('refund.form')}
                            className="py-1 text-sm font-semibold text-[#c90000] transition-colors hover:text-[#a70000] dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Reembolsos
                        </a>
                    </div>
                )}
            </header>
        </>
    );
}

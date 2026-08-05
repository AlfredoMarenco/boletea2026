import { ModeToggle } from '@/components/mode-toggle';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useAppearance } from '@/hooks/use-appearance';
import { User, Menu, X } from 'lucide-react';
import WorldCupTheme from '@/components/WorldCupTheme';
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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
            <WorldCupTheme />
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
                    <a
                        href={route('refund.form')}
                        className="text-sm font-semibold text-[#c90000] hover:text-[#a70000] dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                        Reembolsos
                    </a>
                </nav>
                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition-all hover:bg-[#c90000] hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-[#c90000]"
                            title="Iniciar Sesión"
                        >
                            <User className="h-5 w-5" />
                        </button>

                        {loginDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 shadow-xl shadow-gray-200/50 dark:shadow-none animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                <a
                                    href="https://boletea.com.mx/login.asp?gifrompage=2&gitopage=2"
                                    className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-[#c90000] dark:hover:text-[#c90000] transition-colors"
                                    onClick={() => setLoginDropdownOpen(false)}
                                >
                                    Iniciar como cliente
                                </a>
                                <a
                                    href="https://boletea.com.mx/reporting"
                                    className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:text-[#c90000] dark:hover:text-[#c90000] transition-colors"
                                    onClick={() => setLoginDropdownOpen(false)}
                                >
                                    Iniciar como promotor
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-neutral-800 transition"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
                    <a
                        href={route('home')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Inicio
                    </a>
                    <a
                        href={route('static.quienessomos')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Quiénes Somos
                    </a>
                    <a
                        href={route('static.terminosycondiciones')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Términos y Condiciones
                    </a>
                    <a
                        href={route('static.avisodeprivacidad')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Aviso de Privacidad
                    </a>
                    <a
                        href={route('static.ticketassist')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Ticket Assist
                    </a>
                    <a
                        href={route('sales-centers.public')}
                        className="text-sm font-medium hover:text-[#c90000] transition-colors py-1"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Centros de Venta
                    </a>
                    <a
                        href={route('refund.form')}
                        className="text-sm font-semibold text-[#c90000] hover:text-[#a70000] dark:text-red-400 dark:hover:text-red-300 transition-colors py-1"
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

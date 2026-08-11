import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useAppearance } from '@/hooks/use-appearance';
import {
    Facebook,
    Instagram,
    Twitter,
    Mail,
    MapPin,
    Phone,
    ArrowRight,
} from 'lucide-react';

export default function PublicFooter() {
    const { resolvedAppearance } = useAppearance();

    return (
        <footer className="border-t border-gray-100 bg-white pt-16 pb-8 font-sans dark:border-border dark:bg-[#050505]">
            <div className="container mx-auto px-6">
                <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="inline-block">
                            <img
                                src={
                                    resolvedAppearance === 'dark'
                                        ? '/images/logoBoleteaDarkTheme.png'
                                        : 'https://boletea.com/img/logoBoletea.png'
                                }
                                alt="Boletea"
                                className="h-10 transition-opacity hover:opacity-80"
                                onError={(e) => {
                                    e.currentTarget.src =
                                        'https://boletea.com/img/logoBoletea.png';
                                }}
                            />
                        </Link>
                        <p className="max-w-xs text-sm leading-relaxed text-gray-500 dark:text-muted-foreground">
                            Tu plataforma de confianza para los mejores eventos,
                            conciertos y experiencias en vivo en México. Compra
                            seguro, vive al máximo.
                        </p>
                        <div className="flex items-center gap-4">
                            <SocialLink
                                href="https://facebook.com/boleteaoficial"
                                icon={Facebook}
                            />
                            <SocialLink
                                href="https://instagram.com/boletea"
                                icon={Instagram}
                            />
                            <SocialLink
                                href="https://twitter.com/boleteamx"
                                icon={Twitter}
                            />
                            <SocialLink
                                href="https://tiktok.com/@boleteamx"
                                icon={TiktokIcon}
                            />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
                            Explorar
                        </h4>
                        <ul className="space-y-4 text-sm text-gray-500 dark:text-muted-foreground">
                            <li>
                                <Link
                                    href="/"
                                    className="group flex items-center gap-2 transition-colors hover:text-[#c90000]"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-hover:bg-[#c90000] dark:bg-muted-foreground"></span>
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="group flex items-center gap-2 transition-colors hover:text-[#c90000]"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-hover:bg-[#c90000] dark:bg-muted-foreground"></span>
                                    Eventos
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={route('static.bolepay')}
                                    className="group flex items-center gap-2 transition-colors hover:text-[#c90000]"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-hover:bg-[#c90000] dark:bg-muted-foreground"></span>
                                    Bolepay
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={route('sales-centers.public')}
                                    className="group flex items-center gap-2 transition-colors hover:text-[#c90000]"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-hover:bg-[#c90000] dark:bg-muted-foreground"></span>
                                    Puntos de Venta
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="https://boletea.com.mx/reporting"
                                    className="group flex items-center gap-2 transition-colors hover:text-[#c90000]"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 transition-colors group-hover:bg-[#c90000] dark:bg-muted-foreground"></span>
                                    Acceso a Promotores
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Help */}
                    <div>
                        <h4 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
                            Soporte
                        </h4>
                        <ul className="space-y-4 text-sm text-gray-500 dark:text-muted-foreground">
                            <li>
                                <Link
                                    href="#"
                                    className="transition-colors hover:text-[#c90000]"
                                >
                                    Contacto
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={route('static.terminosycondiciones')}
                                    className="transition-colors hover:text-[#c90000]"
                                >
                                    Términos y Condiciones
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={route('static.avisodeprivacidad')}
                                    className="transition-colors hover:text-[#c90000]"
                                >
                                    Aviso de Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="transition-colors hover:text-[#c90000]"
                                >
                                    Preguntas Frecuentes
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={route('refund.form')}
                                    className="font-medium text-[#c90000] transition-colors hover:text-[#c90000]"
                                >
                                    Trámites de Reembolso
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter / Contact Info */}
                    <div>
                        <h4 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
                            Mantente actualizado
                        </h4>
                        <p className="mb-4 text-sm text-gray-500 dark:text-muted-foreground">
                            Suscríbete para recibir las últimas novedades y
                            preventas exclusivas.
                        </p>
                        <form
                            className="mb-8 flex gap-2"
                            onSubmit={(e) => e.preventDefault()}
                        >
                            <input
                                type="email"
                                placeholder="Tu correo electrónico"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-[#c90000]/50 focus:outline-none dark:border-border dark:bg-card dark:text-white"
                            />
                            <button className="rounded-lg bg-gray-900 p-2.5 text-white transition-colors hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200">
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </form>

                        <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-muted-foreground">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-[#c90000]" />
                                <span>contacto@boletea.com</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 md:flex-row dark:border-border">
                    <p className="text-center text-sm text-gray-400 md:text-left">
                        &copy; {new Date().getFullYear()} Boletea. Todos los
                        derechos reservados.
                    </p>
                    <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                        <Link
                            href={route('static.avisodeprivacidad')}
                            className="transition-colors hover:text-gray-900 dark:hover:text-white"
                        >
                            Privacidad
                        </Link>
                        <Link
                            href={route('static.terminosycondiciones')}
                            className="transition-colors hover:text-gray-900 dark:hover:text-white"
                        >
                            Términos
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon: Icon }: { href: string; icon: any }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-600 transition-all duration-300 hover:bg-[#c90000] hover:text-white dark:bg-card dark:text-muted-foreground"
        >
            <Icon className="h-5 w-5" />
        </a>
    );
}

function TiktokIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    );
}

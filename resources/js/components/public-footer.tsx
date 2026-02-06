import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
    Facebook,
    Instagram,
    Twitter,
    Mail,
    MapPin,
    Phone,
    ArrowRight
} from 'lucide-react';

export default function PublicFooter() {
    return (
        <footer className="bg-white dark:bg-[#050505] border-t border-gray-100 dark:border-white/5 pt-16 pb-8 font-sans">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="inline-block">
                            <img
                                src="https://boletea.com/img/logoBoletea.png"
                                alt="Boletea"
                                className="h-10 opacity-90 dark:brightness-0 dark:invert transition-opacity hover:opacity-100"
                            />
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
                            Tu plataforma de confianza para los mejores eventos, conciertos y experiencias en vivo. Compra seguro, vive al máximo.
                        </p>
                        <div className="flex items-center gap-4">
                            <SocialLink href="https://facebook.com/boletea" icon={Facebook} />
                            <SocialLink href="https://instagram.com/boletea" icon={Instagram} />
                            <SocialLink href="https://twitter.com/boletea" icon={Twitter} />
                            <SocialLink href="https://tiktok.com/@boletea" icon={TiktokIcon} />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg">Explorar</h4>
                        <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                            <li>
                                <Link href="/" className="hover:text-[#c90000] transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-[#c90000] transition-colors"></span>
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-[#c90000] transition-colors"></span>
                                    Eventos
                                </Link>
                            </li>
                            <li>
                                <Link href={route('static.bolepay')} className="hover:text-[#c90000] transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-[#c90000] transition-colors"></span>
                                    Bolepay
                                </Link>
                            </li>
                            <li>
                                <Link href={route('sales-centers.public')} className="hover:text-[#c90000] transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-[#c90000] transition-colors"></span>
                                    Puntos de Venta
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Help */}
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg">Soporte</h4>
                        <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">
                                    Contacto
                                </Link>
                            </li>
                            <li>
                                <Link href={route('static.terminosycondiciones')} className="hover:text-[#c90000] transition-colors">
                                    Términos y Condiciones
                                </Link>
                            </li>
                            <li>
                                <Link href={route('static.avisodeprivacidad')} className="hover:text-[#c90000] transition-colors">
                                    Aviso de Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">
                                    Preguntas Frecuentes
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter / Contact Info */}
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg">Mantente actualizado</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                            Suscríbete para recibir las últimas novedades y preventas exclusivas.
                        </p>
                        <form className="flex gap-2 mb-8" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Tu correo electrónico"
                                className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#c90000]/50 transition-all dark:text-white"
                            />
                            <button className="bg-gray-900 dark:bg-white text-white dark:text-black p-2.5 rounded-lg hover:bg-black dark:hover:bg-gray-200 transition-colors">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>

                        <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-[#c90000]" />
                                <span>contacto@boletea.com</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-white/5 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-400 text-center md:text-left">
                        &copy; {new Date().getFullYear()} Boletea. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                        <Link href={route('static.avisodeprivacidad')} className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacidad</Link>
                        <Link href={route('static.terminosycondiciones')} className="hover:text-gray-900 dark:hover:text-white transition-colors">Términos</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon: Icon }: { href: string, icon: any }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 dark:bg-[#111] text-gray-600 dark:text-gray-400 hover:bg-[#c90000] hover:text-white transition-all duration-300"
        >
            <Icon className="w-5 h-5" />
        </a>
    )
}

function TiktokIcon(props: any) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    )
}

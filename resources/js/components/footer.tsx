import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0a0a0a]">
            {/* Main Content */}
            <div className="container mx-auto px-6 py-12 lg:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tighter text-[#c90000]">
                                BOLETEA
                            </span>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            La plataforma líder en venta de boletos para tus eventos favoritos. Seguridad, rapidez y confianza.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-400 hover:text-[#c90000] transition-colors">
                                <Facebook className="size-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-[#c90000] transition-colors">
                                <Twitter className="size-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-[#c90000] transition-colors">
                                <Instagram className="size-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-[#c90000] transition-colors">
                                <Youtube className="size-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links 1 */}
                    <div>
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                            Empresa
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">Acerca de nosotros</Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">Contacto</Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">Puntos de venta</Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">Blog</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Links 2 */}
                    <div>
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                            Soporte
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">Ayuda y FAQ</Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">Reenviar mis boletos</Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">Términos y condiciones</Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[#c90000] transition-colors">Política de privacidad</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                            Newsletter
                        </h3>
                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            Suscríbete para recibir noticias, promociones y preventas exclusivas.
                        </p>
                        <form className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Tu correo electrónico"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#c90000] focus:outline-none focus:ring-1 focus:ring-[#c90000] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                            <button
                                type="button"
                                className="rounded-md bg-[#c90000] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#a00000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c90000]"
                            >
                                Suscribir
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-100 bg-gray-50 py-6 dark:border-gray-800 dark:bg-[#111]">
                <div className="container mx-auto px-6 flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        &copy; {currentYear} Boletea. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-6">
                        <span className="text-xs text-gray-400">Desarrollado con ❤️</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

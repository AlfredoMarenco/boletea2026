import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

interface ExternalEvent {
    id: number;
    title: string;
    city: string | null;
    category: string | null;
    status: 'draft' | 'published';
    image_path: string | null;
    sales_centers: string[] | null;
    description: string | null;
}

interface Props {
    canRegister: boolean;
    events: ExternalEvent[];
}

export default function Welcome({ canRegister, events }: Props) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100 font-sans selection:bg-[#c90000] selection:text-white">
            <Head title="Inicio - Boletea" />

            {/* Navbar / Header */}
            <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md dark:bg-black/80 dark:border-white/5">
                <div className="container mx-auto flex h-20 items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        {/* Logo Placeholder */}
                        <div className="size-10 rounded-full bg-gradient-to-br from-[#c90000] to-orange-600 shadow-lg shadow-red-500/20"></div>
                        <span className="text-xl font-bold tracking-tight">Boletea</span>
                    </div>
                    <nav className="hidden items-center gap-8 md:flex">
                        <a href="#" className="text-sm font-medium hover:text-[#c90000] transition-colors">Eventos</a>
                        <a href="#" className="text-sm font-medium hover:text-[#c90000] transition-colors">Sedes</a>
                        <a href="#" className="text-sm font-medium hover:text-[#c90000] transition-colors">Contacto</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('login')}
                            className="rounded-full px-6 py-2 text-sm font-semibold transition-all hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            Log in
                        </Link>
                        {canRegister && (
                            <Link
                                href={route('register')}
                                className="hidden rounded-full bg-[#c90000] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:scale-105 hover:bg-[#a00000] md:block"
                            >
                                Registrarse
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#c90000] opacity-[0.08] blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="container mx-auto px-6 text-center">
                        <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl">
                            Vive la <span className="text-[#c90000]">experiencia</span>.
                        </h1>
                        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400 md:text-xl">
                            Descubre los mejores conciertos, festivales y obras de teatro en tu ciudad.
                            Tu entrada a momentos inolvidables.
                        </p>

                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <input
                                type="text"
                                placeholder="Buscar evento..."
                                className="w-full max-w-sm rounded-full border border-gray-200 bg-white/50 px-6 py-3 text-sm backdrop-blur-sm focus:border-[#c90000] focus:ring-2 focus:ring-[#c90000]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                            <button className="rounded-full bg-[#c90000] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition-transform hover:scale-105 active:scale-95">
                                Buscar
                            </button>
                        </div>
                    </div>
                </section>

                {/* Events Grid Section */}
                <section className="py-20 bg-gray-50 dark:bg-[#0a0a0a]">
                    <div className="container mx-auto px-6">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Próximos Eventos</h2>
                                <p className="mt-2 text-gray-500 dark:text-gray-400">Explora lo que está por suceder.</p>
                            </div>
                            <Link href="#" className="hidden text-sm font-medium text-[#c90000] hover:underline md:block">
                                Ver todos los eventos &rarr;
                            </Link>
                        </div>

                        {events.length > 0 ? (
                            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-[#111] border border-gray-100 dark:border-white/5"
                                    >
                                        {/* Image Container */}
                                        <div
                                            className="relative w-full overflow-hidden bg-gray-200 dark:bg-gray-800"
                                            style={{ aspectRatio: '500/400' }}
                                        >
                                            {event.image_path ? (
                                                <img
                                                    src={event.image_path}
                                                    alt={event.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-gray-400">
                                                    <span className="text-xs uppercase tracking-widest">Sin Imagen</span>
                                                </div>
                                            )}

                                            {/* Badges */}
                                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                {event.category && (
                                                    <span className="inline-flex px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-black shadow-sm">
                                                        {event.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#c90000]">
                                                <span>{event.city || 'Ubicación pendiente'}</span>
                                            </div>
                                            <h3 className="mb-2 text-xl font-bold leading-tight text-gray-900 group-hover:text-[#c90000] dark:text-white transition-colors">
                                                {event.title}
                                            </h3>

                                            <div className="mt-auto pt-4">
                                                <Link
                                                    href={route('event.show', event.id)}
                                                    className="block w-full rounded-xl bg-gray-900 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#c90000] dark:bg-white dark:text-black dark:hover:bg-[#c90000] dark:hover:text-white"
                                                >
                                                    Ver Detalles
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-20 text-center dark:border-gray-800 dark:bg-white/5">
                                <p className="text-lg font-medium text-gray-500">No hay eventos publicados por el momento.</p>
                            </div>
                        )}

                        <div className="mt-12 text-center md:hidden">
                            <Link href="#" className="text-sm font-medium text-[#c90000] hover:underline">
                                Ver todos los eventos &rarr;
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer simple */}
                <footer className="border-t border-gray-200 bg-white py-12 dark:border-white/5 dark:bg-black">
                    <div className="container mx-auto px-6 text-center text-sm text-gray-500">
                        &copy; 2026 Boletea. Todos los derechos reservados.
                    </div>
                </footer>
            </main>
        </div>
    );
}

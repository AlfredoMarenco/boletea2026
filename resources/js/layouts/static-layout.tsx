import PublicHeader from '@/components/public-header';
import { Head } from '@inertiajs/react';
import React from 'react';

interface Props {
    title: string;
    children: React.ReactNode;
}

export default function StaticLayout({ title, children }: Props) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0a0a0a] dark:text-gray-100 font-sans selection:bg-[#c90000] selection:text-white">
            <Head title={`${title} - Boletea`} />
            <PublicHeader />

            <main className="pt-24 pb-20">
                {/* Hero Title */}
                <div className="container mx-auto px-6 max-w-4xl mb-12 text-center">
                    <div className="inline-block p-2 px-4 rounded-full bg-[#c90000]/10 text-[#c90000] text-sm font-bold tracking-wide uppercase mb-4">
                        Información
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-6">
                        {title}
                    </h1>
                    <div className="h-1 w-24 bg-[#c90000] mx-auto rounded-full"></div>
                </div>

                <div className="container mx-auto px-6 max-w-4xl">
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none bg-white/80 dark:bg-[#111]/80 p-8 md:p-12 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-white/20 backdrop-blur-sm
                        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                        prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                        prose-a:text-[#c90000] prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-gray-900 dark:prose-strong:text-white
                        prose-ul:list-disc prose-ul:pl-6
                        prose-li:text-gray-600 dark:prose-li:text-gray-300"
                    >
                        {children}
                    </div>
                </div>
            </main>

            <footer className="border-t border-gray-200 bg-white py-12 dark:border-white/5 dark:bg-black mt-auto">
                <div className="container mx-auto px-6 text-center text-sm text-gray-500">
                    &copy; 2026 Boletea. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}

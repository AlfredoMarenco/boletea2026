import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { Head } from '@inertiajs/react';
import React from 'react';
import { GeolocationProvider } from '@/contexts/GeolocationProvider';

interface Props {
    title: string;
    children: React.ReactNode;
}

export default function StaticLayout({ title, children }: Props) {
    return (
        <GeolocationProvider>
            <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900 selection:bg-[#c90000] selection:text-white dark:bg-background dark:text-gray-100">
                <Head title={`${title} - Boletea`} />
                <PublicHeader />

                <main className="flex-grow pt-24 pb-20">
                    {/* Hero Title */}
                    <div className="container mx-auto mb-12 max-w-4xl px-6 text-center">
                        <div className="mb-4 inline-block rounded-full bg-[#c90000]/10 p-2 px-4 text-sm font-bold tracking-wide text-[#c90000] uppercase">
                            Información
                        </div>
                        <h1 className="mb-6 text-4xl font-black tracking-tight text-gray-900 md:text-5xl dark:text-white">
                            {title}
                        </h1>
                        <div className="mx-auto h-1 w-24 rounded-full bg-[#c90000]"></div>
                    </div>

                    <div className="container mx-auto max-w-4xl px-6">
                        <div className="prose prose-lg max-w-none rounded-3xl border border-white/20 bg-white/80 p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm md:p-12 dark:bg-card/80 dark:shadow-none dark:prose-invert prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-a:text-[#c90000] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-li:text-gray-600 dark:prose-li:text-gray-300">
                            {children}
                        </div>
                    </div>
                </main>

                <PublicFooter />
            </div>
        </GeolocationProvider>
    );
}

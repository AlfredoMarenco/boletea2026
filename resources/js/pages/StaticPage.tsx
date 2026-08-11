import PublicHeader from '@/components/public-header';
import { Head } from '@inertiajs/react';

interface Props {
    title: string;
    content: string; // HTML content
}

export default function StaticPage({ title, content }: Props) {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-[#c90000] selection:text-white dark:bg-background dark:text-gray-100">
            <Head title={`${title} - Boletea`} />
            <PublicHeader />

            <main className="pt-24 pb-20">
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
                    <div
                        className="prose prose-lg max-w-none rounded-3xl border border-white/20 bg-white/80 p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm md:p-12 dark:bg-card/80 dark:shadow-none dark:prose-invert prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-a:text-[#c90000] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-li:text-gray-600 dark:prose-li:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </main>

            <footer className="mt-auto border-t border-gray-200 bg-white py-12 dark:border-border dark:bg-background">
                <div className="container mx-auto px-6 text-center text-sm text-gray-500">
                    &copy; 2026 Boletea. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}

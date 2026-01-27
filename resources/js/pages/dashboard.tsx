import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="aspect-video rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-sidebar-accent shadow-sm flex items-center justify-center">
                        <span className="text-muted-foreground">Estadísticas (Próximamente)</span>
                    </div>
                    <div className="aspect-video rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-sidebar-accent shadow-sm flex items-center justify-center">
                        <span className="text-muted-foreground">Ventas (Próximamente)</span>
                    </div>
                    <div className="aspect-video rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-sidebar-accent shadow-sm flex items-center justify-center">
                        <span className="text-muted-foreground">Usuarios (Próximamente)</span>
                    </div>
                </div>
                <div className="min-h-[100vh] flex-1 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-sidebar-accent shadow-sm md:min-h-min flex items-center justify-center p-8 text-center text-muted-foreground">
                    <p>Bienvenido al Panel Administrativo de Boletea.</p>
                </div>
            </div>
        </AppLayout>
    );
}

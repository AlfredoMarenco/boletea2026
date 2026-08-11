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
                    <div className="flex aspect-video items-center justify-center rounded-xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-sidebar-accent">
                        <span className="text-muted-foreground">
                            Estadísticas (Próximamente)
                        </span>
                    </div>
                    <div className="flex aspect-video items-center justify-center rounded-xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-sidebar-accent">
                        <span className="text-muted-foreground">
                            Ventas (Próximamente)
                        </span>
                    </div>
                    <div className="flex aspect-video items-center justify-center rounded-xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-sidebar-accent">
                        <span className="text-muted-foreground">
                            Usuarios (Próximamente)
                        </span>
                    </div>
                </div>
                <div className="flex min-h-[100vh] flex-1 items-center justify-center rounded-xl border border-sidebar-border/70 bg-white p-8 text-center text-muted-foreground shadow-sm md:min-h-min dark:border-sidebar-border dark:bg-sidebar-accent">
                    <p>Bienvenido al Panel Administrativo de Boletea.</p>
                </div>
            </div>
        </AppLayout>
    );
}
